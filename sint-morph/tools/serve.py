#!/usr/bin/env python3
"""Local review site: python tools/serve.py, then open http://localhost:8765

Serves the kit folder (site, runs, frames) with HTTP Range support, so Safari can
play and scrub the videos, and stores ratings in runs/<run>/ratings.json.
"""
from __future__ import annotations

import argparse
import datetime as dt
import http.server
import json
import os
import re
import sys
import threading
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import FRAMES, KIT, RUNS, load_config, read_json, write_json  # noqa: E402

RATINGS_LOCK = threading.Lock()
RUN_ID = re.compile(r"^[\w.-]+$")
RATINGS = {"goed", "twijfel", "onvoldoende", ""}


def best_clips() -> dict:
    """All clips marked --best by evaluate.py, across runs, in the shape of one manifest."""
    persons, clips, ratings, evals, metrics = {}, [], {}, {}, {}
    for run_dir in sorted((p for p in RUNS.glob("*") if p.is_dir()), reverse=True):
        marks = read_json(run_dir / "claude_eval.json", {})
        if not any(v.get("best") for v in marks.values()):
            continue
        man = read_json(run_dir / "manifest.json", {})
        run_ratings = read_json(run_dir / "ratings.json", {})
        run_metrics = read_json(run_dir / "eval" / "metrics.json", {})
        by_slug = {p["slug"]: p for p in man.get("persons", [])}
        for c in man.get("clips", []):
            if not marks.get(c["id"], {}).get("best"):
                continue
            key = f"{run_dir.name}::{c['id']}"
            person = dict(by_slug.get(c["person"], {}))
            person.update(slug=key, name=f"{person.get('name', c['person'])} · {c['model_label']}",
                          run_id=run_dir.name)
            persons[key] = person
            clips.append({**c, "id": key, "person": key, "run_id": run_dir.name, "clip_id": c["id"]})
            if c["id"] in run_ratings:
                ratings[key] = run_ratings[c["id"]]
            evals[key] = marks[c["id"]]
            if c["id"] in run_metrics:
                metrics[key] = run_metrics[c["id"]]
    start = None
    for run_dir in RUNS.glob("*"):
        start = start or read_json(run_dir / "manifest.json", {}).get("start")
    manifest = {"run_id": "__best__", "persons": list(persons.values()), "clips": clips,
                "start": start or {}, "best_view": True}
    return {"manifest": manifest if clips else None, "plan": None, "ratings": ratings,
            "evals": evals, "metrics": metrics}


def runs_overview() -> list[dict]:
    out = []
    for run_dir in sorted((p for p in RUNS.glob("*") if p.is_dir()), reverse=True):
        man = read_json(run_dir / "manifest.json")
        plan = read_json(run_dir / "plan.json")
        src = man or plan
        if not src:
            continue
        states = {}
        for c in (man or {}).get("clips", []):
            states[c["status"]] = states.get(c["status"], 0) + 1
        out.append({"run_id": run_dir.name, "created": src.get("created"),
                    "persons": [p["name"] for p in src.get("persons", [])],
                    "models": src.get("models", []), "states": states, "has_manifest": bool(man)})
    return out


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(KIT), **kwargs)

    def log_message(self, fmt, *args):
        if args and str(args[1] if len(args) > 1 else "").startswith(("4", "5")):
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    # --- json helpers
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
        d = (RUNS / run_id).resolve()
        return d if d.parent == RUNS.resolve() and d.is_dir() else None

    # --- routes
    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path in ("/", "/index.html"):
            self.send_response(302)
            self.send_header("Location", "/site/")
            self.end_headers()
            return
        if path == "/api/runs":
            return self.send_json(runs_overview())
        if path == "/api/align":
            return self.send_json(read_json(FRAMES / "align_report.json", {}))
        if path == "/api/run/__best__":
            return self.send_json(best_clips())
        if path.startswith("/api/run/"):
            d = self.run_dir(urllib.parse.unquote(path[len("/api/run/"):]))
            if not d:
                return self.send_json({"error": "onbekende run"}, 404)
            return self.send_json({"manifest": read_json(d / "manifest.json"),
                                   "plan": read_json(d / "plan.json"),
                                   "ratings": read_json(d / "ratings.json", {}),
                                   "evals": read_json(d / "claude_eval.json", {}),
                                   "metrics": read_json(d / "eval" / "metrics.json", {})})
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

    # --- byte ranges for video
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


def main() -> None:
    cfg = load_config()
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--port", type=int, default=cfg.get("server_port", 8765))
    ap.add_argument("--host", default="127.0.0.1")
    args = ap.parse_args()
    os.chdir(KIT)
    server = http.server.ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"Sint-morph review: http://localhost:{args.port}  (stoppen met Ctrl+C)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
