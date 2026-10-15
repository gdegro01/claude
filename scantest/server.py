#!/usr/bin/env python3
"""Scan Test: QR-tickets scannen, met Notion als spiegel.

De server is de bron van waarheid voor de scanner (SQLite, antwoord in
milliseconden). Elke wijziging gaat via een wachtrij naar Notion. Wijzigingen
die iemand in Notion zelf maakt (naam, geldig, status, nieuwe regels) haalt de
server elke 30 seconden op.

Alleen de standaardbibliotheek van Python 3.9+, geen installatie nodig.
"""

import base64
import hmac
import json
import mimetypes
import os
import secrets
import sqlite3
import sys
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
STATIC = os.path.join(ROOT, "static")
ENV_PATH = os.path.join(ROOT, ".env")
DB_PATH = os.path.join(ROOT, "tickets.db")

NOTION_VERSION = "2025-09-03"
NOTION_MIN_INTERVAL = 0.4  # Notion staat gemiddeld 3 verzoeken per seconde toe
PULL_INTERVAL = 30
PUSH_GRACE = 90  # zo lang na een push vertrouwen we een afwijkende Notion-waarde niet
CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # zonder 0/O, 1/I/L
CODE_LENGTH = 8

STATUS_BINNEN = "Binnen"
STATUS_NIET_BINNEN = "Niet binnen"


# ---------------------------------------------------------------------------
# Configuratie


def load_env(path=ENV_PATH):
    env = {}
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                env[key.strip()] = value.strip()
    return env


def write_env(values, path=ENV_PATH):
    lines = ["# Scan Test instellingen. Niet delen: bevat de Notion-sleutel."]
    for key, value in values.items():
        lines.append("%s=%s" % (key, value))
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    os.chmod(path, 0o600)


def setup():
    """Vraagt de ontbrekende instellingen en schrijft .env."""
    defaults = load_env(os.path.join(ROOT, ".env.example"))
    values = dict(defaults)
    values.update(load_env())
    print("Scan Test instellen. Druk op Enter om de voorgestelde waarde te houden.\n")
    token = values.get("NOTION_TOKEN", "")
    while not token:
        token = input("Plak je Notion-sleutel (begint met ntn_): ").strip()
    values["NOTION_TOKEN"] = token
    if not values.get("SCAN_PIN"):
        values["SCAN_PIN"] = "".join(secrets.choice("0123456789") for _ in range(6))
    if not values.get("ADMIN_PASSWORD"):
        values["ADMIN_PASSWORD"] = secrets.token_urlsafe(9)
    values.setdefault("PORT", "8787")
    for key, label in (("SCAN_PIN", "PIN voor de scanners"), ("ADMIN_PASSWORD", "Wachtwoord voor de adminpagina")):
        answer = input("%s [%s]: " % (label, values[key])).strip()
        if answer:
            values[key] = answer
    write_env(values)
    print("\nOpgeslagen in .env")
    print("  Scan-PIN:        %s" % values["SCAN_PIN"])
    print("  Admin-wachtwoord: %s" % values["ADMIN_PASSWORD"])


def log(msg):
    print("%s  %s" % (datetime.now().strftime("%H:%M:%S"), msg), flush=True)


def now_iso():
    return datetime.now().astimezone().isoformat(timespec="seconds")


def new_code():
    return "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))


def normalize_code(raw):
    code = (raw or "").strip().upper()
    if "/" in code:  # mocht de QR ooit een link bevatten: neem het laatste deel
        code = code.rstrip("/").rsplit("/", 1)[-1]
    return "".join(c for c in code if c.isalnum())


# ---------------------------------------------------------------------------
# Database

db_lock = threading.RLock()
db = None
sync_wake = threading.Event()


def init_db():
    global db
    db = sqlite3.connect(DB_PATH, check_same_thread=False)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode=WAL")
    db.execute(
        """CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            naam TEXT NOT NULL DEFAULT '',
            geldig INTEGER NOT NULL DEFAULT 1,
            binnen INTEGER NOT NULL DEFAULT 0,
            gescand_op TEXT,
            gescand_door TEXT NOT NULL DEFAULT '',
            pogingen INTEGER NOT NULL DEFAULT 0,
            aangemaakt TEXT NOT NULL,
            notion_id TEXT UNIQUE,
            verwijderd INTEGER NOT NULL DEFAULT 0,
            dirty INTEGER NOT NULL DEFAULT 1,
            versie INTEGER NOT NULL DEFAULT 1,
            gepusht_op REAL NOT NULL DEFAULT 0,
            opnieuw_na REAL NOT NULL DEFAULT 0
        )"""
    )
    db.commit()


def ticket_dict(row):
    return {
        "id": row["id"],
        "code": row["code"],
        "naam": row["naam"],
        "geldig": bool(row["geldig"]),
        "binnen": bool(row["binnen"]),
        "gescand_op": row["gescand_op"],
        "gescand_door": row["gescand_door"],
        "pogingen": row["pogingen"],
        "in_notion": bool(row["notion_id"]),
        "wacht_op_notion": bool(row["dirty"]),
    }


def touch(ticket_id, **fields):
    """Wijzigt een ticket en zet het in de wachtrij voor Notion."""
    sets = ", ".join("%s = ?" % k for k in fields)
    params = list(fields.values()) + [ticket_id]
    with db_lock:
        cur = db.execute(
            "UPDATE tickets SET %s, dirty = 1, versie = versie + 1, opnieuw_na = 0 WHERE id = ?" % sets,
            params,
        )
        db.commit()
    sync_wake.set()
    return cur.rowcount


def create_tickets(namen):
    created = []
    with db_lock:
        for naam in namen:
            for _ in range(5):
                code = new_code()
                try:
                    cur = db.execute(
                        "INSERT INTO tickets (code, naam, aangemaakt) VALUES (?, ?, ?)",
                        (code, naam, now_iso()),
                    )
                    created.append(cur.lastrowid)
                    break
                except sqlite3.IntegrityError:
                    continue
        db.commit()
    sync_wake.set()
    return created


def scan(raw_code, door):
    code = normalize_code(raw_code)
    with db_lock:
        row = db.execute(
            "SELECT * FROM tickets WHERE code = ? AND verwijderd = 0", (code,)
        ).fetchone()
        if row is None:
            return {"resultaat": "onbekend", "code": code}
        base = {"code": code, "naam": row["naam"]}
        if not row["geldig"]:
            touch(row["id"], pogingen=row["pogingen"] + 1)
            return dict(base, resultaat="ongeldig")
        if row["binnen"]:
            touch(row["id"], pogingen=row["pogingen"] + 1)
            return dict(
                base,
                resultaat="al_gescand",
                gescand_op=row["gescand_op"],
                gescand_door=row["gescand_door"],
            )
        moment = now_iso()
        touch(
            row["id"],
            binnen=1,
            gescand_op=moment,
            gescand_door=door,
            pogingen=row["pogingen"] + 1,
        )
        return dict(base, resultaat="geldig", gescand_op=moment, gescand_door=door)


# ---------------------------------------------------------------------------
# Notion


class NotionError(Exception):
    def __init__(self, status, message):
        Exception.__init__(self, "Notion %s: %s" % (status, message))
        self.status = status
        self.message = message


class Notion:
    def __init__(self, token, database_id):
        self.token = token
        self.database_id = database_id
        self.data_source_id = None
        self._last = 0.0

    def request(self, method, path, body=None):
        for attempt in range(6):
            wait = self._last + NOTION_MIN_INTERVAL - time.time()
            if wait > 0:
                time.sleep(wait)
            self._last = time.time()
            data = json.dumps(body).encode() if body is not None else None
            req = urllib.request.Request(
                "https://api.notion.com/v1" + path,
                data=data,
                method=method,
                headers={
                    "Authorization": "Bearer " + self.token,
                    "Notion-Version": NOTION_VERSION,
                    "Content-Type": "application/json",
                },
            )
            try:
                with urllib.request.urlopen(req, timeout=20) as resp:
                    return json.loads(resp.read() or b"{}")
            except urllib.error.HTTPError as e:
                try:
                    payload = json.loads(e.read() or b"{}")
                except ValueError:
                    payload = {}
                if e.code in (429, 500, 502, 503, 504, 529):
                    delay = float(e.headers.get("Retry-After") or 0) or min(2 ** attempt, 30)
                    log("Notion %s, opnieuw over %.0fs" % (e.code, delay))
                    time.sleep(delay)
                    continue
                raise NotionError(e.code, payload.get("message", str(e)))
            except (urllib.error.URLError, OSError) as e:
                delay = min(2 ** attempt, 30)
                log("Notion onbereikbaar (%s), opnieuw over %ss" % (e, delay))
                time.sleep(delay)
        raise NotionError(0, "geen antwoord na meerdere pogingen")

    PROPERTIES = {
        "Naam": {"title": {}},
        "Code": {"rich_text": {}},
        "Geldig": {"checkbox": {}},
        "Status": {
            "select": {
                "options": [
                    {"name": STATUS_NIET_BINNEN, "color": "gray"},
                    {"name": STATUS_BINNEN, "color": "green"},
                ]
            }
        },
        "Gescand op": {"date": {}},
        "Gescand door": {"rich_text": {}},
        "Scanpogingen": {"number": {"format": "number"}},
    }

    def connect(self):
        db_info = self.request("GET", "/databases/" + self.database_id)
        sources = db_info.get("data_sources") or []
        if not sources:
            raise NotionError(0, "database heeft geen data source")
        self.data_source_id = sources[0]["id"]
        ds = self.request("GET", "/data_sources/" + self.data_source_id)
        existing = ds.get("properties", {})
        missing = {k: v for k, v in self.PROPERTIES.items() if k not in existing and k != "Naam"}
        title_name = next((k for k, v in existing.items() if v.get("type") == "title"), None)
        update = dict(missing)
        if title_name and title_name != "Naam":
            update[title_name] = {"name": "Naam"}
        if update:
            self.request("PATCH", "/data_sources/" + self.data_source_id, {"properties": update})
            log("Notion-kolommen aangevuld: %s" % ", ".join(update))
        title = "".join(t.get("plain_text", "") for t in db_info.get("title", []))
        log("Verbonden met Notion-database '%s'" % (title or self.database_id))

    @staticmethod
    def create_database(token, parent_page_id, title="Tickets"):
        n = Notion(token, None)
        res = n.request(
            "POST",
            "/databases",
            {
                "parent": {"type": "page_id", "page_id": parent_page_id},
                "title": [{"type": "text", "text": {"content": title}}],
                "initial_data_source": {"properties": Notion.PROPERTIES},
            },
        )
        return res["id"]

    @staticmethod
    def properties(row):
        def text(value):
            return [{"type": "text", "text": {"content": value}}] if value else []

        return {
            "Naam": {"title": text(row["naam"])},
            "Code": {"rich_text": text(row["code"])},
            "Geldig": {"checkbox": bool(row["geldig"])},
            "Status": {"select": {"name": STATUS_BINNEN if row["binnen"] else STATUS_NIET_BINNEN}},
            "Gescand op": {"date": {"start": row["gescand_op"]} if row["gescand_op"] else None},
            "Gescand door": {"rich_text": text(row["gescand_door"])},
            "Scanpogingen": {"number": row["pogingen"]},
        }

    @staticmethod
    def parse(page):
        props = page.get("properties", {})

        def plain(key, kind):
            return "".join(t.get("plain_text", "") for t in (props.get(key, {}).get(kind) or []))

        title_key = next((k for k, v in props.items() if v.get("type") == "title"), "Naam")
        select = (props.get("Status") or {}).get("select") or {}
        date = (props.get("Gescand op") or {}).get("date") or {}
        return {
            "notion_id": page["id"],
            "naam": plain(title_key, "title").strip(),
            "code": normalize_code(plain("Code", "rich_text")),
            "geldig": bool((props.get("Geldig") or {}).get("checkbox")),
            "binnen": select.get("name") == STATUS_BINNEN,
            "gescand_op": date.get("start"),
            "gescand_door": plain("Gescand door", "rich_text").strip(),
        }

    def query_all(self):
        pages, cursor = [], None
        while True:
            body = {"page_size": 100}
            if cursor:
                body["start_cursor"] = cursor
            res = self.request("POST", "/data_sources/%s/query" % self.data_source_id, body)
            pages.extend(p for p in res.get("results", []) if p.get("object") == "page")
            if not res.get("has_more"):
                return pages
            cursor = res.get("next_cursor")


class SyncWorker(threading.Thread):
    """Eén draad die alle Notion-verkeer doet: pushen uit de wachtrij en periodiek ophalen."""

    def __init__(self, notion):
        threading.Thread.__init__(self, daemon=True)
        self.notion = notion
        self.last_error = None
        self.last_pull = None
        self.connected = False
        self.force_pull = threading.Event()

    def status(self):
        with db_lock:
            pending = db.execute("SELECT COUNT(*) FROM tickets WHERE dirty = 1").fetchone()[0]
        return {
            "actief": True,
            "verbonden": self.connected,
            "wachtrij": pending,
            "fout": self.last_error,
            "laatst_opgehaald": self.last_pull,
        }

    def run(self):
        while not self.connected:
            try:
                self.notion.connect()
                self.connected = True
            except NotionError as e:
                self.last_error = str(e)
                log("Kan niet verbinden met Notion: %s (opnieuw over 30s)" % e)
                time.sleep(30)
        next_pull = 0
        while True:
            try:
                pushed = self.push_one()
                if pushed:
                    continue
                if time.time() >= next_pull or self.force_pull.is_set():
                    self.force_pull.clear()
                    self.pull()
                    next_pull = time.time() + PULL_INTERVAL
                    continue
            except NotionError as e:
                self.last_error = str(e)
                log(str(e))
                time.sleep(5)
            except Exception as e:  # de draad mag nooit stoppen
                self.last_error = "interne fout: %s" % e
                log("Interne fout in sync: %r" % e)
                time.sleep(5)
            sync_wake.wait(timeout=max(1.0, min(5.0, next_pull - time.time())))
            sync_wake.clear()

    def push_one(self):
        with db_lock:
            row = db.execute(
                "SELECT * FROM tickets WHERE dirty = 1 AND opnieuw_na <= ? ORDER BY binnen DESC, id LIMIT 1",
                (time.time(),),
            ).fetchone()
        if row is None:
            return False
        try:
            if row["verwijderd"]:
                if row["notion_id"]:
                    try:
                        self.notion.request("PATCH", "/pages/" + row["notion_id"], {"in_trash": True})
                    except NotionError as e:
                        if e.status not in (400, 404):
                            raise
                with db_lock:
                    db.execute("DELETE FROM tickets WHERE id = ? AND versie = ?", (row["id"], row["versie"]))
                    db.commit()
                log("Notion: %s verwijderd" % row["code"])
            elif not row["notion_id"]:
                page = self.notion.request(
                    "POST",
                    "/pages",
                    {
                        "parent": {"type": "data_source_id", "data_source_id": self.notion.data_source_id},
                        "properties": Notion.properties(row),
                    },
                )
                with db_lock:
                    db.execute(
                        "UPDATE tickets SET notion_id = ?, gepusht_op = ? WHERE id = ?",
                        (page["id"], time.time(), row["id"]),
                    )
                    db.execute("UPDATE tickets SET dirty = 0 WHERE id = ? AND versie = ?", (row["id"], row["versie"]))
                    db.commit()
                log("Notion: %s aangemaakt" % row["code"])
            else:
                try:
                    self.notion.request(
                        "PATCH", "/pages/" + row["notion_id"], {"properties": Notion.properties(row)}
                    )
                except NotionError as e:
                    if e.status in (400, 404) and ("archived" in e.message or "trash" in e.message or e.status == 404):
                        # in Notion verwijderd: de volgende pull ruimt het lokaal op
                        log("Notion: %s staat niet meer in Notion" % row["code"])
                        with db_lock:
                            db.execute("UPDATE tickets SET dirty = 0, gepusht_op = 0 WHERE id = ?", (row["id"],))
                            db.commit()
                        self.force_pull.set()
                        return True
                    raise
                with db_lock:
                    db.execute("UPDATE tickets SET gepusht_op = ? WHERE id = ?", (time.time(), row["id"]))
                    db.execute("UPDATE tickets SET dirty = 0 WHERE id = ? AND versie = ?", (row["id"], row["versie"]))
                    db.commit()
                log("Notion: %s bijgewerkt (%s)" % (row["code"], STATUS_BINNEN if row["binnen"] else STATUS_NIET_BINNEN))
            self.last_error = None
            return True
        except NotionError:
            with db_lock:
                db.execute("UPDATE tickets SET opnieuw_na = ? WHERE id = ?", (time.time() + 30, row["id"]))
                db.commit()
            raise

    def pull(self):
        pages = self.notion.query_all()
        seen = set()
        changed = 0
        now = time.time()
        for page in pages:
            p = Notion.parse(page)
            seen.add(p["notion_id"])
            with db_lock:
                row = db.execute("SELECT * FROM tickets WHERE notion_id = ?", (p["notion_id"],)).fetchone()
                if row is None:
                    changed += self._import(p)
                    continue
                if row["dirty"] or row["verwijderd"] or now - row["gepusht_op"] < PUSH_GRACE:
                    continue
                updates = {}
                if p["naam"] != row["naam"]:
                    updates["naam"] = p["naam"]
                if p["geldig"] != bool(row["geldig"]):
                    updates["geldig"] = int(p["geldig"])
                if p["binnen"] != bool(row["binnen"]):
                    updates["binnen"] = int(p["binnen"])
                    updates["gescand_op"] = (p["gescand_op"] or now_iso()) if p["binnen"] else None
                    updates["gescand_door"] = (p["gescand_door"] or "Notion") if p["binnen"] else ""
                if updates:
                    sets = ", ".join("%s = ?" % k for k in updates)
                    db.execute("UPDATE tickets SET %s WHERE id = ?" % sets, list(updates.values()) + [row["id"]])
                    changed += 1
                    log("Uit Notion: %s %s" % (row["code"], ", ".join(updates)))
                if p["code"] != row["code"]:
                    # de code is van de server: zet hem in Notion terug
                    db.execute("UPDATE tickets SET dirty = 1, versie = versie + 1 WHERE id = ?", (row["id"],))
                db.commit()
        with db_lock:
            gone = db.execute(
                "SELECT id, code, notion_id FROM tickets WHERE notion_id IS NOT NULL AND dirty = 0 AND gepusht_op < ?",
                (now - PUSH_GRACE,),
            ).fetchall()
            for row in gone:
                if row["notion_id"] not in seen:
                    db.execute("DELETE FROM tickets WHERE id = ?", (row["id"],))
                    changed += 1
                    log("Uit Notion: %s verwijderd" % row["code"])
            db.commit()
        self.last_pull = now_iso()
        if changed:
            sync_wake.set()

    def _import(self, p):
        code = p["code"]
        needs_push = False
        if not code or len(code) < 4:
            code = new_code()
            needs_push = True
        try:
            db.execute(
                """INSERT INTO tickets (code, naam, geldig, binnen, gescand_op, gescand_door, aangemaakt,
                   notion_id, dirty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    code,
                    p["naam"],
                    int(p["geldig"]) if p["code"] else 1,  # nieuwe regel zonder code: standaard geldig
                    int(p["binnen"]),
                    p["gescand_op"] if p["binnen"] else None,
                    p["gescand_door"] if p["binnen"] else "",
                    now_iso(),
                    p["notion_id"],
                    int(needs_push),
                ),
            )
        except sqlite3.IntegrityError:
            log("Uit Notion overgeslagen: code %s bestaat al (dubbele regel?)" % code)
            return 0
        log("Uit Notion: %s '%s' toegevoegd" % (code, p["naam"]))
        return 1


# ---------------------------------------------------------------------------
# HTTP

CONFIG = {}
SYNC = None
pin_failures = {}
pin_lock = threading.Lock()

# Wat de iPad toont. Admin en iPad kunnen het allebei zetten; de iPad volgt elke nieuwe versie.
show_lock = threading.Lock()
SHOW = {"ticket_id": None, "versie": 0, "door": ""}
show_seen = {}  # client-id -> laatste poll
SHOW_ONLINE_SECONDS = 6


def tickets_payload():
    with db_lock:
        rows = db.execute("SELECT * FROM tickets WHERE verwijderd = 0 ORDER BY id").fetchall()
        versie = db.total_changes  # telt elke wijziging via deze verbinding: goedkope versie
    return versie, [ticket_dict(r) for r in rows]


def show_status():
    now = time.time()
    with show_lock:
        online = sum(1 for t in show_seen.values() if now - t < SHOW_ONLINE_SECONDS)
        return dict(SHOW, schermen=online)


class Handler(BaseHTTPRequestHandler):
    server_version = "ScanTest/1.0"

    def log_message(self, fmt, *args):  # alleen fouten loggen, scans loggen we zelf
        pass

    # --- helpers

    def client_ip(self):
        return self.headers.get("CF-Connecting-IP") or self.client_address[0]

    def send_json(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length > 100000:
            return None
        try:
            return json.loads(self.rfile.read(length) or b"{}")
        except ValueError:
            return None

    def admin_ok(self):
        auth = self.headers.get("Authorization", "")
        if auth.startswith("Basic "):
            try:
                _, _, password = base64.b64decode(auth[6:]).decode().partition(":")
            except Exception:
                password = ""
            if hmac.compare_digest(password.encode(), CONFIG["ADMIN_PASSWORD"].encode()):
                return True
        self.send_response(401)
        self.send_header("WWW-Authenticate", 'Basic realm="Scan Test admin", charset="UTF-8"')
        self.send_header("Content-Length", "0")
        self.end_headers()
        return False

    def pin_ok(self):
        ip = self.client_ip()
        with pin_lock:
            fails, until = pin_failures.get(ip, (0, 0))
            if until > time.time():
                self.send_json(429, {"fout": "Te vaak een verkeerde PIN. Wacht een minuut."})
                return False
            pin = self.headers.get("X-Scan-Pin", "")
            if hmac.compare_digest(pin.encode(), CONFIG["SCAN_PIN"].encode()):
                pin_failures.pop(ip, None)
                return True
            fails += 1
            pin_failures[ip] = (fails, time.time() + 60 if fails >= 5 else 0)
        self.send_json(401, {"fout": "Verkeerde PIN"})
        return False

    def serve_static(self, name):
        path = os.path.normpath(os.path.join(STATIC, name))
        if not path.startswith(STATIC + os.sep) or not os.path.isfile(path):
            self.send_error(404)
            return
        ctype = "application/javascript" if path.endswith(".js") else (
            mimetypes.guess_type(path)[0] or "application/octet-stream")
        with open(path, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", ctype + ("; charset=utf-8" if ctype.startswith(("text/", "application/javascript")) else ""))
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def redirect(self, location):
        self.send_response(302)
        self.send_header("Location", location)
        self.send_header("Content-Length", "0")
        self.end_headers()

    # --- routes

    def do_GET(self):
        path = urlparse(self.path).path
        if path in ("/", ""):
            return self.redirect("/scan")
        if path == "/scan":
            return self.serve_static("scan.html")
        if path == "/admin":
            if self.admin_ok():
                self.serve_static("admin.html")
            return
        if path.startswith("/static/"):
            return self.serve_static(path[len("/static/"):])
        if path == "/api/ping":
            if self.pin_ok():
                self.send_json(200, {"ok": True})
            return
        if path == "/show":
            if self.admin_ok():
                self.serve_static("show.html")
            return
        if path == "/api/admin/tickets":
            if not self.admin_ok():
                return
            _, tickets = tickets_payload()
            sync = SYNC.status() if SYNC else {"actief": False}
            return self.send_json(200, {"tickets": tickets, "notion": sync, "scherm": show_status()})
        if path == "/api/show/poll":
            if not self.admin_ok():
                return
            query = parse_qs(urlparse(self.path).query)
            client = (query.get("client") or [""])[0][:40]
            since = (query.get("since") or [""])[0]
            if client:
                with show_lock:
                    show_seen[client] = time.time()
            versie, tickets = tickets_payload()
            return self.send_json(200, {
                "versie": versie,
                "tickets": None if since == str(versie) else tickets,
                "toon": show_status(),
            })
        self.send_error(404)

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/scan":
            if not self.pin_ok():
                return
            data = self.read_json() or {}
            door = str(data.get("scanner") or "Scanner")[:40]
            result = scan(str(data.get("code") or ""), door)
            log("SCAN %-10s %-9s %s (%s)" % (result["resultaat"], result["code"], result.get("naam", ""), door))
            return self.send_json(200, result)
        if not path.startswith("/api/admin/"):
            return self.send_error(404)
        if not self.admin_ok():
            return
        data = self.read_json()
        if data is None:
            return self.send_json(400, {"fout": "ongeldige invoer"})
        if path == "/api/admin/tickets":
            namen = [str(n).strip()[:120] for n in data.get("namen", []) if str(n).strip()]
            if not namen or len(namen) > 500:
                return self.send_json(400, {"fout": "geef 1 tot 500 namen"})
            ids = create_tickets(namen)
            log("Admin: %d ticket(s) aangemaakt" % len(ids))
            return self.send_json(200, {"aangemaakt": len(ids)})
        if path == "/api/admin/toon":
            ticket_id = data.get("ticket_id")
            if not isinstance(ticket_id, int):
                return self.send_json(400, {"fout": "ticket_id ontbreekt"})
            door = str(data.get("door") or "admin")[:40]
            with show_lock:
                SHOW.update(ticket_id=ticket_id, versie=SHOW["versie"] + 1, door=door)
            if door == "admin":
                log("Admin: ticket %d naar het scherm gestuurd" % ticket_id)
            return self.send_json(200, show_status())
        if path == "/api/admin/sync":
            if SYNC:
                SYNC.force_pull.set()
                sync_wake.set()
            return self.send_json(200, {"ok": True})
        parts = path.split("/")  # ['', 'api', 'admin', 'tickets', '<id>', '<actie>']
        if len(parts) == 6 and parts[3] == "tickets" and parts[4].isdigit():
            ticket_id, action = int(parts[4]), parts[5]
            if action == "geldig":
                n = touch(ticket_id, geldig=int(bool(data.get("geldig"))))
            elif action == "reset":
                n = touch(ticket_id, binnen=0, gescand_op=None, gescand_door="", pogingen=0)
            elif action == "naam":
                n = touch(ticket_id, naam=str(data.get("naam") or "").strip()[:120])
            elif action == "verwijder":
                n = touch(ticket_id, verwijderd=1)
            else:
                return self.send_error(404)
            return self.send_json(200 if n else 404, {"ok": bool(n)})
        self.send_error(404)


def main():
    global SYNC
    if "--setup" in sys.argv:
        setup()
        return
    CONFIG.update(load_env(os.path.join(ROOT, ".env.example")))
    CONFIG.update(load_env())
    CONFIG.update({k: v for k, v in os.environ.items() if k in ("NOTION_TOKEN", "NOTION_DATABASE_ID", "PORT")})
    for key in ("SCAN_PIN", "ADMIN_PASSWORD"):
        if not CONFIG.get(key):
            sys.exit("%s ontbreekt in .env. Draai eerst: python3 server.py --setup" % key)
    init_db()
    if CONFIG.get("NOTION_TOKEN") and CONFIG.get("NOTION_DATABASE_ID"):
        SYNC = SyncWorker(Notion(CONFIG["NOTION_TOKEN"], CONFIG["NOTION_DATABASE_ID"]))
        SYNC.start()
    else:
        log("Geen Notion-instellingen: draait zonder Notion")
    port = int(CONFIG.get("PORT") or 8787)
    httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    log("Scan Test draait op http://localhost:%d  (scanner: /scan, admin: /admin)" % port)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
