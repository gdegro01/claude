#!/usr/bin/env python3
"""Generate start->end morph clips on fal.ai and prepare them for review.

  plan   pick persons (random by default), assign prompt variants, estimate cost
  go     upload frames, run every model, download, interpolate to a 120 fps master
         and an exact 30 fps version, extract posters, measure how well the first
         and last frame match. Safe to run again: finished clips are skipped.
  post   redo only the post-processing (e.g. --interp local)
  list   show all runs
  budget show what has been spent so far against budget_usd in config.json

Spending money always needs `go <run> --yes`, and `go` refuses anything that
would take the total over budget_usd.
"""
from __future__ import annotations

import argparse
import datetime as dt
import os
import random
import shutil
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (  # noqa: E402
    FILM_BUDGET_PER_CLIP, FILM_ENDPOINT, FILM_PRICE_PER_COMPUTE_S, FRAMES, KIT, MODELS,
    PROMPTS, RUNS, clip_cost, extract_frame, load_config, local_interpolate, model_seconds,
    probe, read_json, rel, require_tools, retime, supports_aspect, to_fps, write_json,
)

NUMBERS = {1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven",
           8: "eight", 9: "nine", 10: "ten"}
DEFAULT_VARIANTS = ["v1", "v2", "v3", "v4", "v5"]
LOCK = threading.Lock()


def log(msg: str) -> None:
    print(f"[{dt.datetime.now():%H:%M:%S}] {msg}", flush=True)


def load_env_key() -> bool:
    """FAL_KEY from the environment, or from .env / .env.local in the kit or in arena/
    (also accepts FAL_API_KEY). The value is never printed."""
    if os.environ.get("FAL_KEY"):
        return True
    if os.environ.get("FAL_API_KEY"):
        os.environ["FAL_KEY"] = os.environ["FAL_API_KEY"]
        return True
    for folder in (KIT, KIT.parent):
        for name in (".env", ".env.local"):
            env = folder / name
            if not env.is_file():
                continue
            for line in env.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line.startswith("export "):
                    line = line[len("export "):].strip()
                key, _, value = line.partition("=")
                if key.strip() in ("FAL_KEY", "FAL_API_KEY") and value.strip():
                    os.environ["FAL_KEY"] = value.strip().strip('"').strip("'")
                    return True
    return False


# --- plan -------------------------------------------------------------------

def used_persons() -> set[str]:
    used = set()
    for plan_file in RUNS.glob("*/plan.json"):
        for p in read_json(plan_file, {}).get("persons", []):
            used.add(p["slug"])
    return used


def cmd_plan(args, cfg) -> None:
    report = read_json(FRAMES / "align_report.json")
    if not report:
        raise SystemExit("Eerst uitlijnen: python tools/align_frames.py")
    allowed = {"ok", "controleren"} if args.allow_check else {"ok"}
    eligible = [p for p in report["persons"] if p.get("status") in allowed]
    by_slug = {p["slug"]: p for p in report["persons"]}

    if args.persons:
        wanted = [s.strip().lower() for s in args.persons.split(",") if s.strip()]
        missing = [s for s in wanted if s not in by_slug]
        if missing:
            raise SystemExit("Onbekend in align_report: " + ", ".join(missing))
        chosen = [by_slug[s] for s in wanted]
    else:
        pool = eligible
        if args.exclude_used:
            used = used_persons()
            pool = [p for p in pool if p["slug"] not in used]
        if len(pool) < args.count:
            raise SystemExit(f"Maar {len(pool)} geschikte personen beschikbaar (status {sorted(allowed)}).")
        seed = args.seed if args.seed is not None else random.SystemRandom().randrange(10**6)
        args.seed = seed
        chosen = random.Random(seed).sample(pool, args.count)

    variants = read_json(PROMPTS / "varianten.json")
    known = {v["id"]: v for v in variants["varianten"]}
    order = [v.strip() for v in args.variants.split(",")] if args.variants else DEFAULT_VARIANTS
    for v in order:
        if v not in known:
            raise SystemExit(f"Onbekende variant: {v}")
    models = [m.strip() for m in args.models.split(",")] if args.models else cfg["models"]
    aspect = report["aspect"]["name"]
    for m in models:
        if m not in MODELS:
            raise SystemExit(f"Onbekend model: {m} (kies uit {', '.join(MODELS)})")
        if not supports_aspect(m, aspect):
            raise SystemExit(f"{MODELS[m]['label']} ondersteunt beeldverhouding {aspect} niet "
                             f"(wel: {', '.join(MODELS[m]['aspects'])}).")

    run_id = args.run_id or dt.datetime.now().strftime("%Y-%m-%d_%H%M")
    run_dir = RUNS / run_id
    if (run_dir / "plan.json").exists():
        raise SystemExit(f"Run {run_id} bestaat al.")
    plan = {
        "run_id": run_id,
        "created": dt.datetime.now().isoformat(timespec="seconds"),
        "seed": args.seed,
        "duration": args.duration,
        "models": models,
        "aspect": aspect,
        "note": args.note or "",
        "start": {"file": report["start"]["file"], "upload": report["start"]["upload"]},
        "persons": [
            {"name": p["name"], "slug": p["slug"], "variant": order[i % len(order)],
             "end_file": p["file"], "end_upload": p["upload"], "align_status": p["status"]}
            for i, p in enumerate(chosen)
        ],
    }
    write_json(run_dir / "plan.json", plan)
    print_plan(plan)


def print_plan(plan: dict) -> None:
    variants = {v["id"]: v for v in read_json(PROMPTS / "varianten.json")["varianten"]}
    personen = read_json(PROMPTS / "personen.json", {}).get("personen", {})
    total = 0.0
    print(f"\nRun {plan['run_id']}  (seed {plan['seed']}, {plan['duration']} s per clip)")
    for p in plan["persons"]:
        info = personen.get(p["slug"], {})
        v = p["variant"]
        flags = []
        if not info.get("beschrijving"):
            flags.append("beschrijving ontbreekt")
        if not info.get("kostuum"):
            flags.append("kostuum ontbreekt")
        if p["align_status"] != "ok":
            flags.append(f"uitlijning: {p['align_status']}")
        print(f"  {p['name']:<18} {v} {variants[v]['naam']:<28} {'; '.join(flags)}")
    for m in plan["models"]:
        c = clip_cost(m, plan["duration"]) * len(plan["persons"])
        total += c
        secs = model_seconds(m, plan["duration"])
        print(f"  {MODELS[m]['label']:<24} {len(plan['persons'])} x {secs} s  ${c:.2f}  ({MODELS[m]['price_note']})")
    n = len(plan["persons"]) * len(plan["models"])
    total += FILM_BUDGET_PER_CLIP * n
    print(f"  FILM-interpolatie        {n} clips  max ${FILM_BUDGET_PER_CLIP * n:.2f} gereserveerd")
    spent, budget = spent_usd(), float(load_config().get("budget_usd", 22))
    print(f"  Deze run: ${total:.2f}   al uitgegeven: ${spent:.2f}   budget: ${budget:.2f}   "
          f"daarna over: ${budget - spent - total:.2f}")
    print(f"\nVul ontbrekende velden in prompts/personen.json in en start met:\n"
          f"  python tools/run_test.py go {plan['run_id']} --yes")


# --- prompts ----------------------------------------------------------------

def build_prompt(variant_id: str, slug: str, duration: int) -> tuple[str, str, dict]:
    cfg = read_json(PROMPTS / "varianten.json")
    personen = read_json(PROMPTS / "personen.json", {}).get("personen", {})
    info = personen.get(slug, {})
    variant = next(v for v in cfg["varianten"] if v["id"] == variant_id)
    t1 = int(cfg.get("hide_seconds", 3))
    t2 = max(1, duration - t1)
    kostuum = info.get("kostuum", "")
    costume = cfg["kostuum"].get(kostuum, kostuum)
    person = info.get("beschrijving") or cfg["person_default"]
    fill = {"t1": NUMBERS.get(t1, str(t1)), "t2": NUMBERS.get(t2, str(t2)),
            "person": person, "costume": costume}
    parts = [cfg["prefix"], variant["prompt"].format(**fill), info.get("extra", ""),
             cfg["suffix"].format(**fill)]
    text = " ".join(p for p in parts if p)
    text = " ".join(text.split())
    meta = {"variant": variant_id, "variant_naam": variant["naam"], "beschrijving": person,
            "kostuum": kostuum}
    return text, cfg["negative_prompt"], meta


# --- run --------------------------------------------------------------------

def save(manifest: dict) -> None:
    with LOCK:
        write_json(RUNS / manifest["run_id"] / "manifest.json", manifest)


def commit(manifest: dict, clip: dict, **changes) -> None:
    """Apply changes to a clip and persist, atomically with respect to other threads."""
    with LOCK:
        clip.update(changes)
        write_json(RUNS / manifest["run_id"] / "manifest.json", manifest)


def new_manifest(plan: dict) -> dict:
    clips = []
    persons = []
    for p in plan["persons"]:
        prompt, negative, meta = build_prompt(p["variant"], p["slug"], plan["duration"])
        persons.append({**p, **meta, "prompt": prompt})
        for m in plan["models"]:
            seconds = model_seconds(m, plan["duration"])
            clip_prompt = prompt if seconds == plan["duration"] else \
                build_prompt(p["variant"], p["slug"], seconds)[0]
            clips.append({
                "id": f"{p['slug']}__{m}", "person": p["slug"], "model": m,
                "model_label": MODELS[m]["label"], "endpoint": MODELS[m]["endpoint"],
                "seconds": seconds, "prompt": clip_prompt, "negative_prompt": negative,
                "status": "gepland", "cost_estimate": clip_cost(m, plan["duration"]),
                "files": {}, "probe": {}, "interp": {}, "aansluiting": {}, "error": None,
            })
    return {**plan, "persons": persons, "clips": clips, "uploads": {},
            "interpolation": None, "started": dt.datetime.now().isoformat(timespec="seconds")}


def download(url: str, dst: Path) -> None:
    import httpx
    dst.parent.mkdir(parents=True, exist_ok=True)
    tmp = dst.with_suffix(dst.suffix + ".part")
    with httpx.stream("GET", url, follow_redirects=True, timeout=600) as r:
        r.raise_for_status()
        with open(tmp, "wb") as f:
            for chunk in r.iter_bytes(1 << 16):
                f.write(chunk)
    os.replace(tmp, dst)


def wait_result(endpoint: str, request_id: str, poll: float = 3.0) -> dict:
    import fal_client
    while True:
        status = fal_client.status(endpoint, request_id)
        if isinstance(status, fal_client.Completed):
            return fal_client.result(endpoint, request_id)
        time.sleep(poll)


def video_url(result: dict) -> str:
    video = result.get("video") if isinstance(result, dict) else None
    if isinstance(video, dict) and video.get("url"):
        return video["url"]
    raise RuntimeError(f"Geen video in antwoord: {str(result)[:300]}")


def generate(manifest: dict, clip: dict, persons: dict) -> None:
    import fal_client
    run_dir = RUNS / manifest["run_id"]
    raw = run_dir / "raw" / f"{clip['id']}.mp4"
    if clip["status"] in ("klaar", "nabewerken") and raw.exists():
        return
    try:
        if not clip.get("request_id"):
            p = persons[clip["person"]]
            args = MODELS[clip["model"]]["args"](
                clip["prompt"], clip["negative_prompt"], manifest["uploads"]["start"],
                manifest["uploads"][clip["person"]], clip.get("seconds", manifest["duration"]),
                manifest.get("aspect", ""))
            arguments = {k: v for k, v in args.items() if not k.endswith("_url")}
            for attempt in (1, 2):
                try:
                    handle = fal_client.submit(clip["endpoint"], arguments=args)
                    break
                except Exception:
                    if attempt == 2:
                        raise
                    time.sleep(5)
            commit(manifest, clip, request_id=handle.request_id, status="ingediend", arguments=arguments,
                   submitted=dt.datetime.now().isoformat(timespec="seconds"))
            log(f"ingediend  {clip['id']}  ({p['variant']})")
        t0 = time.time()
        result = wait_result(clip["endpoint"], clip["request_id"])
        url = video_url(result)
        download(url, raw)
        commit(manifest, clip, video_url=url, files={**clip["files"], "raw": rel(raw)},
               seed=result.get("seed") if isinstance(result, dict) else None, status="nabewerken",
               error=None, finished=dt.datetime.now().isoformat(timespec="seconds"),
               wait_seconds=round(time.time() - t0, 1))
        log(f"binnen     {clip['id']}")
    except Exception as exc:
        commit(manifest, clip, status="fout", error=str(exc)[:1000])
        log(f"FOUT       {clip['id']}: {str(exc)[:200]}")


# --- post-processing --------------------------------------------------------

def interpolate(manifest: dict, clip: dict, method: str) -> tuple[Path, dict, dict]:
    """Build the high-fps master. Returns (master path, interp info, raw probe)."""
    run_dir = RUNS / manifest["run_id"]
    raw = KIT / clip["files"]["raw"]
    master = run_dir / "master" / f"{clip['id']}.mp4"
    master.parent.mkdir(parents=True, exist_ok=True)
    p_raw = probe(raw)
    info = {"method": method}
    if method == "film":
        import fal_client

        def film(source: str) -> dict:
            args = {"video_url": source, "num_frames": 4, "use_calculated_fps": True,
                    "use_scene_detection": False, "video_quality": "high", "video_write_mode": "balanced"}
            handle = fal_client.submit(FILM_ENDPOINT, arguments=args)
            info["request_id"] = handle.request_id
            return wait_result(FILM_ENDPOINT, handle.request_id)

        t0 = time.time()
        try:
            result = film(clip.get("video_url") or fal_client.upload_file(raw))
        except Exception:
            # the model's video URL may have expired: upload our own copy and try once more
            result = film(fal_client.upload_file(raw))
        info["seconds"] = round(time.time() - t0, 1)
        film = run_dir / "tmp" / f"{clip['id']}_film.mp4"
        download(video_url(result), film)
        p_film = probe(film)
        # FILM's own fps metadata is not reliable: derive the true rate from the frame count
        factor = (p_film["frames"] - 1) / max(1, p_raw["frames"] - 1)
        if abs(factor - round(factor)) < 0.02:
            factor = float(round(factor))
        true_fps = round(p_raw["fps"] * factor, 4)
        info.update(factor=factor, film_reported_fps=p_film["fps"], master_fps=true_fps)
        retime(film, master, true_fps)
        film.unlink(missing_ok=True)
    elif method == "local":
        local_interpolate(raw, master, 120)
        info["master_fps"] = 120
    else:
        shutil.copy(raw, master)
        info["master_fps"] = p_raw["fps"]
        info["note"] = "geen interpolatie: 30 fps-versie herhaalt frames"
    return master, info, p_raw


def match_score(frame_path: Path, ref_path: Path) -> float:
    """Mean absolute difference (0-255) after fitting the reference to the frame size."""
    import cv2
    import numpy as np
    a = cv2.imread(str(frame_path))
    b = cv2.imread(str(ref_path))
    h, w = a.shape[:2]
    s = max(w / b.shape[1], h / b.shape[0])
    b = cv2.resize(b, (max(w, round(b.shape[1] * s)), max(h, round(b.shape[0] * s))),
                   interpolation=cv2.INTER_AREA)
    y0, x0 = (b.shape[0] - h) // 2, (b.shape[1] - w) // 2
    b = b[y0:y0 + h, x0:x0 + w]
    return round(float(np.abs(a.astype(np.int16) - b.astype(np.int16)).mean()), 2)


def postprocess(manifest: dict, clip: dict, method: str, force: bool = False) -> None:
    if clip["status"] not in ("nabewerken", "klaar") or "raw" not in clip["files"]:
        return
    if clip["status"] == "klaar" and not force:
        return
    run_dir = RUNS / manifest["run_id"]
    try:
        master, info, p_raw = interpolate(manifest, clip, method)
        fps30 = run_dir / "fps30" / f"{clip['id']}.mp4"
        fps30.parent.mkdir(parents=True, exist_ok=True)
        to_fps(master, fps30, 30, src_fps=float(info.get("master_fps") or 0))
        posters = run_dir / "posters"
        posters.mkdir(parents=True, exist_ok=True)
        first, last = posters / f"{clip['id']}_eerste.png", posters / f"{clip['id']}_laatste.png"
        extract_frame(fps30, first)
        extract_frame(fps30, last, last=True)
        person = next(p for p in manifest["persons"] if p["slug"] == clip["person"])
        match = {"begin_mae": match_score(first, KIT / manifest["start"]["file"]),
                 "eind_mae": match_score(last, KIT / person["end_file"])}
        files = {**clip["files"], "master": rel(master), "fps30": rel(fps30),
                 "poster_first": rel(first), "poster_last": rel(last)}
        probes = {"raw": p_raw, "master": probe(master), "fps30": probe(fps30)}
        film_cost = round(info.get("seconds", 0) * FILM_PRICE_PER_COMPUTE_S, 4) if method == "film" else 0
        commit(manifest, clip, files=files, probe=probes, interp=info, aansluiting=match,
               status="klaar", error=None,
               film_cost_total=round(clip.get("film_cost_total", 0) + film_cost, 4))
        log(f"klaar      {clip['id']}  master {info.get('master_fps')} fps, "
            f"aansluiting begin {match['begin_mae']} / eind {match['eind_mae']}")
    except Exception as exc:
        commit(manifest, clip, status="nabewerken", error=f"nabewerking: {str(exc)[:900]}")
        log(f"FOUT       nabewerking {clip['id']}: {str(exc)[:200]}")


def spent_usd(per_run: dict | None = None) -> float:
    """Conservative spend across all runs: every submitted clip (also failed and retried
    ones) at its estimated price, plus FILM wall-clock time at the compute price."""
    total = 0.0
    for man_file in RUNS.glob("*/manifest.json"):
        man = read_json(man_file, {})
        run_total = 0.0
        for c in man.get("clips", []):
            if c.get("request_id"):
                run_total += c.get("cost_estimate", 0)
            run_total += sum(a.get("cost", 0) for a in c.get("attempts", []))
            run_total += c.get("film_cost_total", 0)
        if per_run is not None:
            per_run[man.get("run_id", man_file.parent.name)] = round(run_total, 2)
        total += run_total
    return round(total, 2)


def check_budget(new_cost: float, cfg: dict) -> None:
    budget = float(cfg.get("budget_usd", 22))
    spent = spent_usd()
    if spent + new_cost > budget + 1e-9:
        raise SystemExit(
            f"BUDGET: dit kost ~${new_cost:.2f}, al uitgegeven ${spent:.2f}, grens ${budget:.2f} "
            f"(nog ${max(0, budget - spent):.2f}). Kies minder clips of goedkopere modellen.")


def cmd_budget(args, cfg) -> None:
    per_run = {}
    spent = spent_usd(per_run)
    budget = float(cfg.get("budget_usd", 22))
    for run_id, amount in sorted(per_run.items()):
        print(f"  {run_id:<22} ${amount:.2f}")
    print(f"Uitgegeven (schatting): ${spent:.2f} van ${budget:.2f}; over: ${budget - spent:.2f}")


def cmd_go(args, cfg) -> None:
    require_tools()
    run_dir = RUNS / args.run_id
    plan = read_json(run_dir / "plan.json")
    if not plan:
        raise SystemExit(f"Geen plan voor run {args.run_id}")
    manifest = read_json(run_dir / "manifest.json") or new_manifest(plan)
    method = args.interp or manifest.get("interpolation") or cfg.get("interpolation", "film")
    manifest["interpolation"] = method
    if args.retry_failed:
        for c in manifest["clips"]:
            if c["status"] == "fout":
                if c.get("request_id"):
                    c["attempts"] = c.get("attempts", []) + [
                        {"request_id": c["request_id"], "cost": c["cost_estimate"], "error": c.get("error")}]
                c.update(request_id=None, status="gepland", error=None)
    to_submit = [c for c in manifest["clips"] if not c.get("request_id") and c["status"] != "klaar"]
    if to_submit and not args.yes:
        import textwrap
        cost = sum(c["cost_estimate"] for c in to_submit)
        for p in manifest["persons"]:
            clips = [c["model_label"] for c in to_submit if c["person"] == p["slug"]]
            if not clips:
                continue
            print(f"\n{p['name']}  ({p['variant']} {p['variant_naam']}; {', '.join(clips)})")
            print(textwrap.indent(textwrap.fill(p["prompt"], 100), "  "))
        print(f"\n{len(to_submit)} clips worden aangemaakt, geschat ${cost:.2f}. Herhaal met --yes om te starten.")
        cmd_budget(args, cfg)
        return
    if to_submit:
        film = FILM_BUDGET_PER_CLIP * len(to_submit) if method == "film" else 0
        check_budget(sum(c["cost_estimate"] for c in to_submit) + film, cfg)
    if (to_submit or method == "film") and not load_env_key():
        raise SystemExit("FAL_KEY niet gevonden in de omgeving of in .env/.env.local van arena/ of arena/sint-morph/.")

    import fal_client
    save(manifest)
    ups = manifest["uploads"]
    if to_submit:
        if "start" not in ups:
            ups["start"] = fal_client.upload_file(KIT / manifest["start"]["upload"])
        for p in manifest["persons"]:
            if p["slug"] not in ups:
                ups[p["slug"]] = fal_client.upload_file(KIT / p["end_upload"])
        save(manifest)
        log(f"{len(ups)} beelden geüpload")

    persons = {p["slug"]: p for p in manifest["persons"]}
    with ThreadPoolExecutor(max_workers=min(10, len(manifest["clips"]))) as pool:
        list(pool.map(lambda c: generate(manifest, c, persons), manifest["clips"]))
    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(lambda c: postprocess(manifest, c, method), manifest["clips"]))
    summary(manifest)


def cmd_post(args, cfg) -> None:
    require_tools()
    manifest = read_json(RUNS / args.run_id / "manifest.json")
    if not manifest:
        raise SystemExit(f"Geen manifest voor run {args.run_id}")
    method = args.interp or manifest.get("interpolation") or "film"
    if method == "film" and not load_env_key():
        raise SystemExit("FAL_KEY ontbreekt (nodig voor FILM). Of gebruik --interp local.")
    if method == "film":
        n = sum(1 for c in manifest["clips"] if "raw" in c.get("files", {}))
        check_budget(FILM_BUDGET_PER_CLIP * n, cfg)
    manifest["interpolation"] = method
    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(lambda c: postprocess(manifest, c, method, force=True), manifest["clips"]))
    summary(manifest)


def summary(manifest: dict) -> None:
    counts = {}
    for c in manifest["clips"]:
        counts[c["status"]] = counts.get(c["status"], 0) + 1
    log("Run " + manifest["run_id"] + ": " + ", ".join(f"{v} {k}" for k, v in counts.items()))
    for c in manifest["clips"]:
        if c.get("error"):
            print(f"  {c['id']}: {c['error'][:200]}")
    print(f"Bekijk: python tools/serve.py  (http://localhost:{load_config().get('server_port', 8765)})")


def cmd_list(args, cfg) -> None:
    for run_dir in sorted(RUNS.glob("*"), reverse=True):
        man = read_json(run_dir / "manifest.json")
        plan = read_json(run_dir / "plan.json")
        if not (man or plan):
            continue
        src = man or plan
        names = ", ".join(p["name"] for p in src["persons"])
        if man:
            states = {}
            for c in man["clips"]:
                states[c["status"]] = states.get(c["status"], 0) + 1
            state = ", ".join(f"{v} {k}" for k, v in states.items())
        else:
            state = "alleen plan"
        print(f"{run_dir.name:<18} {state:<30} {names}")


def main() -> None:
    cfg = load_config()
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("plan")
    p.add_argument("--count", type=int, default=5)
    p.add_argument("--persons", help="vaste keuze, komma-gescheiden mapnamen")
    p.add_argument("--seed", type=int)
    p.add_argument("--exclude-used", action="store_true", help="sla personen uit eerdere runs over")
    p.add_argument("--allow-check", action="store_true", help="ook personen met status 'controleren'")
    p.add_argument("--variants", help="bv. v1,v3,v4 (wordt herhaald)")
    p.add_argument("--models", help=f"komma-gescheiden uit {', '.join(MODELS)}")
    p.add_argument("--duration", type=int, default=cfg.get("duration_s", 5))
    p.add_argument("--run-id")
    p.add_argument("--note", help="waarom deze run (komt in de site en het rapport)")
    g = sub.add_parser("go")
    g.add_argument("run_id")
    g.add_argument("--yes", action="store_true", help="akkoord met de kosten")
    g.add_argument("--interp", choices=["film", "local", "none"])
    g.add_argument("--retry-failed", action="store_true", help="mislukte clips opnieuw aanmaken (kost opnieuw)")
    q = sub.add_parser("post")
    q.add_argument("run_id")
    q.add_argument("--interp", choices=["film", "local", "none"])
    sub.add_parser("list")
    sub.add_parser("budget")
    args = ap.parse_args()
    {"plan": cmd_plan, "go": cmd_go, "post": cmd_post, "list": cmd_list,
     "budget": cmd_budget}[args.cmd](args, cfg)


if __name__ == "__main__":
    main()
