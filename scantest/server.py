#!/usr/bin/env python3
"""Scan Test: QR-tickets tonen, scannen en bijhouden, met Notion als spiegel.

De server is de bron van waarheid voor scanner, iPad en admin (SQLite, antwoord
in milliseconden). Elke wijziging gaat via een wachtrij naar Notion. Wijzigingen
die iemand in Notion zelf maakt (naam, type, geldig, status, nieuwe regels)
haalt de server elke 30 seconden op.

Notion-kolommen worden herkend aan hun vaste ID, zodat hernoemen in Notion de
koppeling niet breekt.

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
COLUMNS_PATH = os.path.join(ROOT, "notion_kolommen.json")

NOTION_VERSION = "2025-09-03"
NOTION_MIN_INTERVAL = 0.4  # Notion staat gemiddeld 3 verzoeken per seconde toe
PULL_INTERVAL = float(os.environ.get("SCANTEST_PULL_INTERVAL", 30))
# zo lang na een push vertrouwen we een afwijkende Notion-waarde niet
PUSH_GRACE = float(os.environ.get("SCANTEST_PUSH_GRACE", 90))
CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # zonder 0/O, 1/I/L
CODE_LENGTH = 8

# Waarden in de Notion-kolom Binnen. Oude waarden blijven herkend en worden omgezet.
STATUS_BINNEN = "✓"
STATUS_NIET_BINNEN = "✗"
OLD_STATUS = {"Binnen": True, "Niet binnen": False}
STATUS_OPTIONS = [{"name": STATUS_BINNEN, "color": "green"}, {"name": STATUS_NIET_BINNEN, "color": "gray"}]

# Kolommen in Notion: sleutel, standaardnaam, andere namen die we herkennen, type, schema.
COLUMNS = [
    ("naam", "Naam", (), "title", {"title": {}}),
    ("code", "Code", ("Ticketcode",), "rich_text", {"rich_text": {}}),
    ("type", "Type", ("Soort", "Categorie"), "select", {"select": {}}),
    ("geldig", "Geldig", (), "checkbox", {"checkbox": {}}),
    ("status", "Binnen", ("Status", "Aanwezig"), "select", {"select": {"options": STATUS_OPTIONS}}),
    ("gescand_op", "Gescand op", (), "date", {"date": {}}),
    ("gescand_door", "Gescand door", ("Scanner",), "rich_text", {"rich_text": {}}),
    ("pogingen", "Scanpogingen", ("Pogingen", "Aantal scans"), "number", {"number": {"format": "number"}}),
]


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


def clean_type(raw):
    # Notion staat geen komma's toe in de naam van een keuze
    return " ".join(str(raw or "").replace(",", " ").split())[:50]


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
    columns = [r["name"] for r in db.execute("PRAGMA table_info(tickets)")]
    if "type" not in columns:
        db.execute("ALTER TABLE tickets ADD COLUMN type TEXT NOT NULL DEFAULT ''")
    db.execute(
        """CREATE TABLE IF NOT EXISTS types (
            naam TEXT PRIMARY KEY COLLATE NOCASE,
            volgorde INTEGER NOT NULL DEFAULT 0
        )"""
    )
    db.commit()


def ticket_dict(row):
    return {
        "id": row["id"],
        "code": row["code"],
        "naam": row["naam"],
        "type": row["type"],
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


def ensure_type(naam):
    """Zorgt dat een type in de lijst staat. Roep aan binnen db_lock."""
    if naam and not db.execute("SELECT 1 FROM types WHERE naam = ?", (naam,)).fetchone():
        volgorde = db.execute("SELECT COALESCE(MAX(volgorde), 0) + 1 FROM types").fetchone()[0]
        db.execute("INSERT INTO types (naam, volgorde) VALUES (?, ?)", (naam, volgorde))


def types_list():
    with db_lock:
        types = [r["naam"] for r in db.execute("SELECT naam FROM types ORDER BY volgorde, naam")]
        counts = {
            r["type"]: (r["totaal"], r["binnen"])
            for r in db.execute(
                "SELECT type, COUNT(*) AS totaal, SUM(binnen) AS binnen FROM tickets WHERE verwijderd = 0 GROUP BY type"
            )
        }
    return [{"naam": t, "totaal": counts.get(t, (0, 0))[0], "binnen": counts.get(t, (0, 0))[1] or 0} for t in types]


def delete_type(naam):
    with db_lock:
        ids = [r["id"] for r in db.execute("SELECT id FROM tickets WHERE type = ? AND verwijderd = 0", (naam,))]
        db.execute("DELETE FROM types WHERE naam = ?", (naam,))
        db.commit()
    for ticket_id in ids:
        touch(ticket_id, type="")
    return len(ids)


def create_tickets(namen, ticket_type=""):
    created = []
    with db_lock:
        ensure_type(ticket_type)
        for naam in namen:
            for _ in range(5):
                code = new_code()
                try:
                    cur = db.execute(
                        "INSERT INTO tickets (code, naam, type, aangemaakt) VALUES (?, ?, ?, ?)",
                        (code, naam, ticket_type, now_iso()),
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
        base = {"code": code, "naam": row["naam"], "type": row["type"]}
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
    def __init__(self, status, message, code=""):
        Exception.__init__(self, "Notion %s: %s" % (status, message))
        self.status = status
        self.message = message
        self.code = code


class Notion:
    def __init__(self, token, database_id):
        self.token = token
        self.database_id = database_id
        self.data_source_id = None
        self.cols = {}  # sleutel -> (property-id, huidige naam)
        self.old_status_options = []
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
                raise NotionError(e.code, payload.get("message", str(e)), payload.get("code", ""))
            except (urllib.error.URLError, OSError) as e:
                delay = min(2 ** attempt, 30)
                log("Notion onbereikbaar (%s), opnieuw over %ss" % (e, delay))
                time.sleep(delay)
        raise NotionError(0, "geen antwoord na meerdere pogingen")

    # --- kolommen

    def _load_saved_columns(self):
        try:
            with open(COLUMNS_PATH, encoding="utf-8") as f:
                saved = json.load(f)
            if saved.get("data_source_id") == self.data_source_id:
                return saved.get("kolommen", {})
        except (OSError, ValueError):
            pass
        return {}

    def _save_columns(self):
        with open(COLUMNS_PATH, "w", encoding="utf-8") as f:
            json.dump({"data_source_id": self.data_source_id,
                       "kolommen": {k: v[0] for k, v in self.cols.items()}}, f, indent=2)

    def _match_columns(self, props, saved):
        by_id = {v["id"]: name for name, v in props.items()}
        cols, missing = {}, []
        for key, default, aliases, kind, _ in COLUMNS:
            found = None
            if kind == "title":
                found = next((n for n, v in props.items() if v["type"] == "title"), None)
            elif saved.get(key) in by_id and props[by_id[saved[key]]]["type"] == kind:
                found = by_id[saved[key]]
            else:
                wanted = [n.lower() for n in (default,) + aliases]
                for want in wanted:
                    found = next((n for n, v in props.items()
                                  if n.lower() == want and v["type"] == kind
                                  and v["id"] not in [c[0] for c in cols.values()]), None)
                    if found:
                        break
            if found:
                cols[key] = (props[found]["id"], found)
            else:
                missing.append(key)
        return cols, missing

    def connect(self):
        db_info = self.request("GET", "/databases/" + self.database_id)
        sources = db_info.get("data_sources") or []
        if not sources:
            raise NotionError(0, "database heeft geen data source")
        self.data_source_id = sources[0]["id"]
        saved = self._load_saved_columns()
        props = self.request("GET", "/data_sources/" + self.data_source_id).get("properties", {})
        cols, missing = self._match_columns(props, saved)
        if missing:
            create = {}
            for key, default, _, kind, schema in COLUMNS:
                if key in missing:
                    name = default
                    if name in props:  # naam bezet door een kolom van een ander type
                        name = "%s (scan)" % default
                    create[name] = schema
            self.request("PATCH", "/data_sources/" + self.data_source_id, {"properties": create})
            log("Notion-kolommen aangemaakt: %s" % ", ".join(create))
            props = self.request("GET", "/data_sources/" + self.data_source_id).get("properties", {})
            cols, missing = self._match_columns(props, saved)
            if missing:
                raise NotionError(0, "kolommen ontbreken in Notion: %s" % ", ".join(missing))
        renamed = [
            "%s heet nu '%s'" % (key, cols[key][1])
            for key, default, _, _, _ in COLUMNS if key != "naam" and cols[key][1] != default
        ]
        self.cols = cols
        self._save_columns()
        self._migrate_status(props)
        title = "".join(t.get("plain_text", "") for t in db_info.get("title", []))
        log("Verbonden met Notion-database '%s'%s" % (
            title or self.database_id, " (%s)" % "; ".join(renamed) if renamed else ""))

    def _migrate_status(self, props):
        """Zet ✓ en ✗ als keuzes in de statuskolom. Regels met een oude waarde schrijft pull() opnieuw;
        de oude keuzes verdwijnen zodra geen regel ze meer gebruikt."""
        prop = props[self.cols["status"][1]]
        options = [o["name"] for o in prop["select"].get("options", [])]
        self.old_status_options = [o for o in options if o in OLD_STATUS]
        if all(o["name"] in options for o in STATUS_OPTIONS):
            return
        keep = [{"name": o} for o in options if o not in (STATUS_BINNEN, STATUS_NIET_BINNEN)]
        self.request("PATCH", "/data_sources/" + self.data_source_id, {"properties": {
            self.cols["status"][0]: {"select": {"options": STATUS_OPTIONS + keep}}}})
        log("Notion: keuzes ✓ en ✗ toegevoegd aan de statuskolom")

    def drop_old_status_options(self, pages):
        if not self.old_status_options:
            return
        pid = self.cols["status"][0]
        for page in pages:
            for v in page.get("properties", {}).values():
                if v.get("id") == pid and (v.get("select") or {}).get("name") in OLD_STATUS:
                    return  # nog in gebruik
        self.request("PATCH", "/data_sources/" + self.data_source_id, {"properties": {
            pid: {"select": {"options": STATUS_OPTIONS}}}})
        self.old_status_options = []
        log("Notion: oude statuskeuzes Binnen en Niet binnen opgeruimd")

    @staticmethod
    def create_database(token, parent_page_id, title="Tickets"):
        n = Notion(token, None)
        res = n.request(
            "POST",
            "/databases",
            {
                "parent": {"type": "page_id", "page_id": parent_page_id},
                "title": [{"type": "text", "text": {"content": title}}],
                "initial_data_source": {"properties": {c[1]: c[4] for c in COLUMNS}},
            },
        )
        return res["id"]

    # --- pagina's

    def properties(self, row):
        def text(value):
            return [{"type": "text", "text": {"content": value}}] if value else []

        c = {k: v[0] for k, v in self.cols.items()}
        return {
            c["naam"]: {"title": text(row["naam"])},
            c["code"]: {"rich_text": text(row["code"])},
            c["type"]: {"select": {"name": row["type"]} if row["type"] else None},
            c["geldig"]: {"checkbox": bool(row["geldig"])},
            c["status"]: {"select": {"name": STATUS_BINNEN if row["binnen"] else STATUS_NIET_BINNEN}},
            c["gescand_op"]: {"date": {"start": row["gescand_op"]} if row["gescand_op"] else None},
            c["gescand_door"]: {"rich_text": text(row["gescand_door"])},
            c["pogingen"]: {"number": row["pogingen"]},
        }

    def parse(self, page):
        by_id = {v.get("id"): v for v in page.get("properties", {}).values()}

        def prop(key):
            return by_id.get(self.cols[key][0]) or {}

        def plain(key, kind):
            return "".join(t.get("plain_text", "") for t in (prop(key).get(kind) or []))

        status = prop("status").get("select") or {}
        ticket_type = prop("type").get("select") or {}
        date = prop("gescand_op").get("date") or {}
        return {
            "notion_id": page["id"],
            "naam": plain("naam", "title").strip(),
            "code": normalize_code(plain("code", "rich_text")),
            "type": clean_type(ticket_type.get("name")),
            "geldig": bool(prop("geldig").get("checkbox")),
            "binnen": status.get("name") == STATUS_BINNEN or OLD_STATUS.get(status.get("name")) is True,
            "status_oud": status.get("name") in OLD_STATUS,
            "gescand_op": date.get("start"),
            "gescand_door": plain("gescand_door", "rich_text").strip(),
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
        self.reconnect = False
        self.wipe = False
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
        next_pull = 0
        while True:
            try:
                if not self.connected or self.reconnect:
                    self.notion.connect()
                    self.connected, self.reconnect = True, False
                    with db_lock:  # na een herstel alles direct opnieuw proberen
                        db.execute("UPDATE tickets SET opnieuw_na = 0 WHERE dirty = 1")
                        db.commit()
                if self.wipe:
                    self.wipe_notion()
                    continue
                if self.push_one():
                    continue
                if time.time() >= next_pull or self.force_pull.is_set():
                    self.force_pull.clear()
                    self.pull()
                    next_pull = time.time() + PULL_INTERVAL
                    continue
            except NotionError as e:
                self.last_error = str(e)
                log(str(e))
                time.sleep(5 if self.connected else 30)
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
                        "properties": self.notion.properties(row),
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
                        "PATCH", "/pages/" + row["notion_id"], {"properties": self.notion.properties(row)}
                    )
                except NotionError as e:
                    if e.status == 404 or (e.status == 400 and ("archived" in e.message or "trash" in e.message)):
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
                log("Notion: %s bijgewerkt (%s)" % (row["code"], "binnen" if row["binnen"] else "niet binnen"))
            self.last_error = None
            return True
        except NotionError as e:
            if e.status == 400 and e.code == "validation_error":
                # waarschijnlijk is er in Notion een kolom veranderd: opnieuw koppelen en dan opnieuw proberen
                self.reconnect = True
                e = NotionError(e.status, "Notion weigerde een wijziging (%s). De server koppelt de kolommen opnieuw." % e.message)
            with db_lock:
                db.execute("UPDATE tickets SET opnieuw_na = ? WHERE id = ?", (time.time() + 30, row["id"]))
                db.commit()
            raise e

    def wipe_notion(self):
        """Gooit alle Notion-regels weg die niet bij een levend ticket horen."""
        with db_lock:
            live = {r["notion_id"] for r in db.execute(
                "SELECT notion_id FROM tickets WHERE verwijderd = 0 AND notion_id IS NOT NULL")}
        pages = [p for p in self.notion.query_all() if p["id"] not in live]
        for page in pages:
            try:
                self.notion.request("PATCH", "/pages/" + page["id"], {"in_trash": True})
            except NotionError as e:
                if e.status not in (400, 404):
                    raise
            with db_lock:
                db.execute("DELETE FROM tickets WHERE notion_id = ? AND verwijderd = 1", (page["id"],))
                db.commit()
        log("Notion: %d regel(s) naar de prullenbak (alles wissen)" % len(pages))
        self.wipe = False

    def pull(self):
        pages = self.notion.query_all()
        self.notion.drop_old_status_options(pages)
        seen = set()
        changed = 0
        now = time.time()
        for page in pages:
            p = self.notion.parse(page)
            seen.add(p["notion_id"])
            with db_lock:
                ensure_type(p["type"])
                row = db.execute("SELECT * FROM tickets WHERE notion_id = ?", (p["notion_id"],)).fetchone()
                if row is None:
                    changed += self._import(p)
                    db.commit()
                    continue
                if row["dirty"] or row["verwijderd"] or now - row["gepusht_op"] < PUSH_GRACE:
                    db.commit()
                    continue
                updates = {}
                for key in ("naam", "type"):
                    if p[key] != row[key]:
                        updates[key] = p[key]
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
                if p["code"] != row["code"] or p["status_oud"]:
                    # de code is van de server, en een oude statuswaarde wordt ✓ of ✗: opnieuw schrijven
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
        with db_lock:
            stuck = db.execute("SELECT COUNT(*) FROM tickets WHERE dirty = 1 AND opnieuw_na > ?", (time.time(),)).fetchone()[0]
        if not stuck:
            self.last_error = None
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
                """INSERT INTO tickets (code, naam, type, geldig, binnen, gescand_op, gescand_door, aangemaakt,
                   notion_id, dirty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    code,
                    p["naam"],
                    p["type"],
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
        if path in ("/admin", "/show"):
            if self.admin_ok():
                self.serve_static(path[1:] + ".html")
            return
        if path.startswith("/static/"):
            return self.serve_static(path[len("/static/"):])
        if path == "/api/ping":
            if self.pin_ok():
                self.send_json(200, {"ok": True})
            return
        if path == "/api/admin/tickets":
            if not self.admin_ok():
                return
            _, tickets = tickets_payload()
            sync = SYNC.status() if SYNC else {"actief": False}
            return self.send_json(200, {
                "tickets": tickets, "types": types_list(), "notion": sync, "scherm": show_status(),
            })
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
            changed = since != str(versie)
            return self.send_json(200, {
                "versie": versie,
                "tickets": tickets if changed else None,
                "types": types_list() if changed else None,
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
            ids = create_tickets(namen, clean_type(data.get("type")))
            log("Admin: %d ticket(s) aangemaakt" % len(ids))
            return self.send_json(200, {"aangemaakt": len(ids)})
        if path == "/api/admin/types":
            naam = clean_type(data.get("naam"))
            if not naam:
                return self.send_json(400, {"fout": "geef een naam voor het type"})
            with db_lock:
                ensure_type(naam)
                db.commit()
            return self.send_json(200, {"types": types_list()})
        if path == "/api/admin/types/verwijder":
            n = delete_type(clean_type(data.get("naam")))
            return self.send_json(200, {"losgekoppeld": n, "types": types_list()})
        if path == "/api/admin/wissen":
            if data.get("bevestig") != "WISSEN":
                return self.send_json(400, {"fout": "typ WISSEN om te bevestigen"})
            with db_lock:
                n = db.execute("UPDATE tickets SET verwijderd = 1, dirty = 1, versie = versie + 1, opnieuw_na = 0 "
                               "WHERE verwijderd = 0").rowcount
                db.execute("DELETE FROM tickets WHERE verwijderd = 1 AND notion_id IS NULL")
                if data.get("typen"):
                    db.execute("DELETE FROM types")
                db.commit()
            with show_lock:
                SHOW.update(ticket_id=None, versie=SHOW["versie"] + 1, door="admin")
            if SYNC:
                SYNC.wipe = True
                sync_wake.set()
            log("Admin: alles gewist (%d tickets)%s" % (n, ", ook de typen" if data.get("typen") else ""))
            return self.send_json(200, {"gewist": n})
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
                SYNC.reconnect = True
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
            elif action == "type":
                ticket_type = clean_type(data.get("type"))
                with db_lock:
                    ensure_type(ticket_type)
                    db.commit()
                n = touch(ticket_id, type=ticket_type)
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
    log("Scan Test draait op http://localhost:%d  (admin: /admin, scherm: /show, scanner: /scan)" % port)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
