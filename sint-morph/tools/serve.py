#!/usr/bin/env python3
"""Local review site for the sint-morph runs.

  python3 tools/serve.py                      serve this kit
  python3 tools/serve.py --kit <map> --open   serve the runs of another kit folder and
                                              open the browser (handy for a separate viewer)

Only /site, /runs and /frames are served (never .env or other files), with HTTP Range
support so Safari can play and scrub the videos. Ratings go to runs/<run>/ratings.json.
Needs nothing beyond the Python standard library.
"""
from __future__ import annotations

import argparse
import datetime as dt
import http.server
import json
import posixpath
import re
import socket
import sys
import threading
import urllib.parse
import webbrowser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import KIT, read_json, write_json  # noqa: E402

SITE = KIT / "site"
DATA = KIT                # replaced by --kit
RATINGS_LOCK = threading.Lock()
RUN_ID = re.compile(r"^[\w.-]+$")
RATINGS = {"goed", "twijfel", "onvoldoende", ""}
SERVED = ("runs", "frames")


def runs_dir() -> Path:
    return DATA / "runs"


def run_dirs(newest_first: bool = True) -> list[Path]:
    return sorted((p for p in runs_dir().glob("*") if p.is_dir()), reverse=newest_first)


def run_bundle(d: Path) -> dict:
    return {"manifest": read_json(d / "manifest.json"), "plan": read_json(d / "plan.json"),
            "ratings": read_json(d / "ratings.json", {}), "evals": read_json(d / "claude_eval.json", {}),
            "metrics": read_json(d / "eval" / "metrics.json", {})}


def clip_spend(c: dict) -> float:
    total = c.get("cost_estimate", 0) if c.get("request_id") else 0
    total += sum(a.get("cost", 0) for a in c.get("attempts", []))
    return total + c.get("film_cost_total", 0)


def overview() -> dict:
    """Every run with a summary, every clip flattened for the gallery, and the spend."""
    runs, clips, spent = [], [], 0.0
    for d in run_dirs():
        b = run_bundle(d)
        man, plan = b["manifest"], b["plan"]
        src = man or plan
        if not src:
            continue
        persons = {p["slug"]: p for p in src.get("persons", [])}
        states, verdicts, ratings, run_spent = {}, {}, {}, 0.0
        for c in (man or {}).get("clips", []):
            states[c["status"]] = states.get(c["status"], 0) + 1
            run_spent += clip_spend(c)
            ev = b["evals"].get(c["id"], {})
            rt = b["ratings"].get(c["id"], {})
            if ev.get("verdict"):
                verdicts[ev["verdict"]] = verdicts.get(ev["verdict"], 0) + 1
            if rt.get("rating"):
                ratings[rt["rating"]] = ratings.get(rt["rating"], 0) + 1
            p = persons.get(c["person"], {})
            me = b["metrics"].get(c["id"], {})
            clips.append({
                "run_id": d.name, "clip_id": c["id"], "status": c["status"], "error": c.get("error"),
                "person": p.get("name", c["person"]), "model": c["model"], "model_label": c["model_label"],
                "variant": p.get("variant", ""), "variant_naam": p.get("variant_naam", ""),
                "prompt": c.get("prompt", ""), "files": c.get("files", {}), "cost": c.get("cost_estimate", 0),
                "end_file": p.get("end_file"), "start_file": (man or {}).get("start", {}).get("file"),
                "eval": ev, "rating": rt, "created": src.get("created"),
                "metrics": {k: me.get(k) for k in ("reveal_s", "hidden_s", "fade_score", "jump_ratio",
                                                   "flags", "sheet", "detail") if k in me},
            })
        spent += run_spent
        runs.append({"run_id": d.name, "created": src.get("created"), "note": src.get("note", ""),
                     "persons": [p["name"] for p in src.get("persons", [])], "models": src.get("models", []),
                     "states": states, "verdicts": verdicts, "ratings": ratings, "spent": round(run_spent, 2),
                     "clips": len((man or {}).get("clips", [])), "has_manifest": bool(man)})
    budget = float(read_json(DATA / "config.json", {}).get("budget_usd", 0) or 0)
    return {"runs": runs, "clips": clips, "spent": round(spent, 2), "budget": budget,
            "kit": str(DATA), "now": dt.datetime.now().isoformat(timespec="seconds")}


def best_clips() -> dict:
    """All clips marked --best by evaluate.py, across runs, in the shape of one manifest."""
    persons, clips, ratings, evals, metrics = {}, [], {}, {}, {}
    start = None
    for d in run_dirs():
        b = run_bundle(d)
        man = b["manifest"] or {}
        start = start or man.get("start")
        by_slug = {p["slug"]: p for p in man.get("persons", [])}
        for c in man.get("clips", []):
            if not b["evals"].get(c["id"], {}).get("best"):
                continue
            key = f"{d.name}::{c['id']}"
            person = dict(by_slug.get(c["person"], {}))
            person.update(slug=key, name=f"{person.get('name', c['person'])} · {c['model_label']}", run_id=d.name)
            persons[key] = person
            clips.append({**c, "id": key, "person": key, "run_id": d.name, "clip_id": c["id"]})
            if c["id"] in b["ratings"]:
                ratings[key] = b["ratings"][c["id"]]
            evals[key] = b["evals"][c["id"]]
            if c["id"] in b["metrics"]:
                metrics[key] = b["metrics"][c["id"]]
    manifest = {"run_id": "__best__", "persons": list(persons.values()), "clips": clips,
                "start": start or {}, "best_view": True}
    return {"manifest": manifest if clips else None, "plan": None, "ratings": ratings,
            "evals": evals, "metrics": metrics}


def runs_list() -> list[dict]:
    return [{k: r[k] for k in ("run_id", "created", "persons", "models", "states", "has_manifest")}
            for r in overview()["runs"]]


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        if len(args) > 1 and str(args[1]).startswith(("4", "5")):
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def translate_path(self, path: str) -> str:
        """/site/... from the code folder, /runs/... and /frames/... from the data folder.
        Everything else maps to a path that does not exist (404)."""
        p = posixpath.normpath(urllib.parse.unquote(urllib.parse.urlparse(path).path))
        parts = [x for x in p.split("/") if x and x not in (".", "..")]
        if not parts:
            return str(SITE / "__none__")
        if parts[0] == "site":
            base, rest = SITE, parts[1:]
        elif parts[0] in SERVED:
            base, rest = DATA / parts[0], parts[1:]
        else:
            return str(SITE / "__none__")
        target = base.joinpath(*rest)
        return str(target)

    def send_json(self, data, status: int = 200) -> None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def run_dir(self, run_id: str) -> Path | None:
        if not run_id or not RUN_ID.match(run_id):
            return None
        d = (runs_dir() / run_id).resolve()
        return d if d.parent == runs_dir().resolve() and d.is_dir() else None

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path in ("/", "/index.html"):
            self.send_response(302)
            self.send_header("Location", "/site/")
            self.end_headers()
            return
        if path == "/api/overview":
            return self.send_json(overview())
        if path == "/api/runs":
            return self.send_json(runs_list())
        if path == "/api/align":
            return self.send_json(read_json(DATA / "frames" / "align_report.json", {}))
        if path == "/api/run/__best__":
            return self.send_json(best_clips())
        if path.startswith("/api/run/"):
            d = self.run_dir(urllib.parse.unquote(path[len("/api/run/"):]))
            if not d:
                return self.send_json({"error": "onbekende run"}, 404)
            return self.send_json(run_bundle(d))
        if path.startswith("/api/"):
            return self.send_json({"error": "niet gevonden"}, 404)
        if "Range" in self.headers:
            return self.send_range()
        return super().do_GET()

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        if path != "/api/rating":
            return self.send_json({"error": "niet gevonden"}, 404)
        try:
            length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(min(length, 100_000)) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self.send_json({"error": "ongeldige json"}, 400)
        run_id, clip_id = str(data.get("run_id", "")), str(data.get("clip_id", ""))
        if run_id == "__best__" and "::" in clip_id:
            run_id, clip_id = clip_id.split("::", 1)
        d = self.run_dir(run_id)
        rating = str(data.get("rating", ""))
        if not d or rating not in RATINGS:
            return self.send_json({"error": "ongeldige beoordeling"}, 400)
        manifest = read_json(d / "manifest.json", {})
        if clip_id not in {c["id"] for c in manifest.get("clips", [])}:
            return self.send_json({"error": "onbekende clip"}, 400)
        with RATINGS_LOCK:
            ratings = read_json(d / "ratings.json", {})
            ratings[clip_id] = {"rating": rating, "note": str(data.get("note", ""))[:2000],
                                "updated": dt.datetime.now().isoformat(timespec="seconds")}
            write_json(d / "ratings.json", ratings)
        if str(data.get("run_id")) == "__best__":
            return self.send_json({"ok": True, "ratings": best_clips()["ratings"]})
        return self.send_json({"ok": True, "ratings": ratings})

    def send_range(self):
        fs_path = Path(self.translate_path(self.path))
        if not fs_path.is_file():
            return super().do_GET()
        size = fs_path.stat().st_size
        m = re.match(r"bytes=(\d*)-(\d*)$", self.headers.get("Range", "").strip())
        if not m or (not m.group(1) and not m.group(2)):
            return super().do_GET()
        if m.group(1):
            start = int(m.group(1))
            end = int(m.group(2)) if m.group(2) else size - 1
        else:
            start, end = max(0, size - int(m.group(2))), size - 1
        end = min(end, size - 1)
        if start > end or start >= size:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(str(fs_path)))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        with open(fs_path, "rb") as f:
            f.seek(start)
            remaining = end - start + 1
            try:
                while remaining > 0:
                    chunk = f.read(min(1 << 16, remaining))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    remaining -= len(chunk)
            except (BrokenPipeError, ConnectionResetError):
                pass

    def end_headers(self):
        if self.command in ("GET", "HEAD") and not self.path.startswith("/api/"):
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def port_taken(port: int) -> bool:
    """True if anything answers on this port via IPv4 or IPv6. A browser may resolve
    'localhost' to ::1, so a server there would hide ours behind the same address."""
    for family, host in ((socket.AF_INET, "127.0.0.1"), (socket.AF_INET6, "::1")):
        try:
            with socket.socket(family, socket.SOCK_STREAM) as s:
                s.settimeout(0.3)
                if s.connect_ex((host, port)) == 0:
                    return True
        except OSError:
            continue
    return False


def main() -> None:
    global DATA
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--kit", help="kitmap met runs/ en frames/ (standaard deze kit)")
    ap.add_argument("--port", type=int)
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--open", action="store_true", help="open de browser")
    args = ap.parse_args()
    DATA = Path(args.kit).expanduser().resolve() if args.kit else KIT
    port = args.port or int(read_json(DATA / "config.json", {}).get("server_port", 8765))
    server = None
    for p in range(port, port + 20):
        if port_taken(p):
            print(f"Poort {p} is al in gebruik door een ander programma, ik neem een andere.", flush=True)
            continue
        try:
            server = http.server.ThreadingHTTPServer((args.host, p), Handler)
            port = p
            break
        except OSError:
            continue
    if server is None:
        raise SystemExit(f"Geen vrije poort gevonden vanaf {port}")
    url = f"http://127.0.0.1:{port}"
    print(f"Sint-morph: open {url}  (data uit {DATA}; stoppen met Ctrl+C)", flush=True)
    if args.open:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
