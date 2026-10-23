#!/usr/bin/env python3
"""Measure every finished clip of a run and record verdicts.

  measure <run>                 contact sheet + metrics for each clip (free, local)
  verdict <run> <clip> <oordeel> [--note ...] [--best]
                                store Claude's verdict (goed / twijfel / onvoldoende)
  best                          list clips marked --best across all runs

Metrics per clip, all on the region where start and end frame differ (the person):
  end_sim / start_sim  0..1, how much a frame looks like the end / start frame
  reveal_s             first moment end_sim >= 0.6 (the person is recognisable)
  hidden_s             time during which the frame looks like neither (occluded by action)
  fade_score           0..1, how well mid frames are explained as a mix of start and end;
                       high means crossfade / double exposure
  jump_ratio           biggest frame-to-frame change divided by the 90th percentile; together
                       with jump_size (0-255) it flags cuts and sudden pops
"""
from __future__ import annotations

import argparse
import datetime as dt
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import KIT, RUNS, read_json, rel, write_json  # noqa: E402

WORK_W = 270  # metrics are computed on frames this wide
VERDICTS = ("goed", "twijfel", "onvoldoende")


def fit(img: np.ndarray, w: int, h: int) -> np.ndarray:
    s = max(w / img.shape[1], h / img.shape[0])
    r = cv2.resize(img, (max(w, round(img.shape[1] * s)), max(h, round(img.shape[0] * s))),
                   interpolation=cv2.INTER_AREA)
    y, x = (r.shape[0] - h) // 2, (r.shape[1] - w) // 2
    return r[y:y + h, x:x + w]


def read_frames(path: Path, sheet_step: float = 0.25) -> tuple[list[np.ndarray], dict, float]:
    """Small float frames for the metrics; full frames only at the contact-sheet moments
    (every `sheet_step` s, plus the last frame) to keep memory low."""
    cap = cv2.VideoCapture(str(path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    small, keep, last, i = [], {}, None, 0
    while True:
        ok, f = cap.read()
        if not ok:
            break
        h = round(f.shape[0] * WORK_W / f.shape[1])
        small.append(cv2.resize(f, (WORK_W, h), interpolation=cv2.INTER_AREA).astype(np.float32))
        k = round(i / (sheet_step * fps))
        if round(k * sheet_step * fps) == i:
            keep[i] = f
        last, i = f, i + 1
    cap.release()
    if last is not None:
        keep[i - 1] = last
    return small, keep, fps


def measure_clip(video: Path, start_png: Path, end_png: Path) -> tuple[dict, dict, dict]:
    small, full, fps = read_frames(video)
    if len(small) < 3:
        raise RuntimeError("te weinig frames")
    h, w = small[0].shape[:2]
    S = fit(cv2.imread(str(start_png)), w, h).astype(np.float32)
    E = fit(cv2.imread(str(end_png)), w, h).astype(np.float32)

    diff = cv2.GaussianBlur(np.abs(S - E).mean(axis=2), (0, 0), 2)
    mask = diff > max(18.0, float(np.percentile(diff, 60)))
    mask = cv2.dilate(mask.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    if mask.mean() < 0.01:
        mask[:] = True
    m3 = mask[:, :, None]
    n = float(mask.sum()) * 3
    d_se = float(np.abs(S - E)[mask].mean()) or 1.0

    se_vec = (S - E) * m3
    se_norm = float((se_vec ** 2).sum()) or 1.0
    start_sim, end_sim, fade, motion = [], [], [], []
    prev = None
    for F in small:
        d_s = float((np.abs(F - S) * m3).sum() / n)
        d_e = float((np.abs(F - E) * m3).sum() / n)
        start_sim.append(max(0.0, 1 - d_s / d_se))
        end_sim.append(max(0.0, 1 - d_e / d_se))
        alpha = float((((F - E) * m3) * se_vec).sum() / se_norm)
        alpha = min(1.0, max(0.0, alpha))
        mix = alpha * S + (1 - alpha) * E
        resid = float((np.abs(F - mix) * m3).sum() / n)
        nearest = min(d_s, d_e)
        if 0.25 <= alpha <= 0.75 and nearest > 6:
            fade.append(max(0.0, 1 - resid / nearest))
        if prev is not None:
            motion.append(float(np.abs(F - prev).mean()))
        prev = F

    t = np.arange(len(small)) / fps
    end_arr = np.array(end_sim)
    start_arr = np.array(start_sim)
    reveal_idx = next((i for i, v in enumerate(end_arr) if v >= 0.6), None)
    hidden = float(((end_arr < 0.3) & (start_arr < 0.3)).sum() / fps)
    motion_arr = np.array(motion)
    typical = max(1.0, float(np.percentile(motion_arr, 90)))
    jump_i = int(np.argmax(motion_arr))
    duration = len(small) / fps

    metrics = {
        "duration_s": round(duration, 2),
        "reveal_s": round(float(t[reveal_idx]), 2) if reveal_idx is not None else None,
        "end_sim_at_2_5s": round(float(np.interp(2.5, t, end_arr)), 2),
        "end_sim_at_3s": round(float(np.interp(3.0, t, end_arr)), 2),
        "end_sim_last": round(float(end_arr[-1]), 2),
        "start_sim_first": round(float(start_arr[0]), 2),
        "hidden_s": round(hidden, 2),
        "fade_score": round(max(fade), 2) if fade else 0.0,
        "jump_ratio": round(float(motion_arr[jump_i] / typical), 1),
        "jump_size": round(float(motion_arr[jump_i]), 1),
        "jump_at_s": round(float(t[jump_i + 1]), 2),
    }
    flags = []
    if metrics["reveal_s"] is not None and metrics["reveal_s"] < 0.5 * duration:
        flags.append("onthulling te vroeg")
    if metrics["reveal_s"] is None or metrics["end_sim_last"] < 0.7:
        flags.append("haalt eindframe niet")
    if metrics["fade_score"] >= 0.8:
        flags.append("lijkt op fade/dubbelbeeld")
    if metrics["jump_ratio"] >= 4 and metrics["jump_size"] >= 8:
        flags.append(f"sprong bij {metrics['jump_at_s']} s")
    metrics["flags"] = flags
    curves = {"t": t.tolist(), "end": end_sim, "start": start_sim}
    return metrics, full, {"fps": fps, **curves}


def contact_sheet(full: dict, fps: float, curves: dict, metrics: dict,
                  title: str, out: Path, step: float = 0.25, cols: int = 7, tile_w: int = 230) -> None:
    n = len(curves["t"])
    times = np.arange(0, n / fps + 1e-6, step)
    tiles = []
    for ts in times:
        i = min(n - 1, int(round(ts * fps)))
        f = full[i] if i in full else full[min(full, key=lambda k: abs(k - i))]
        tile = cv2.resize(f, (tile_w, round(f.shape[0] * tile_w / f.shape[1])), interpolation=cv2.INTER_AREA)
        e = curves["end"][i]
        label = f"{ts:.2f}s  e={e:.2f}"
        cv2.rectangle(tile, (0, 0), (tile_w, 22), (0, 0, 0), -1)
        cv2.putText(tile, label, (6, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
        if abs(ts - 3.0) < 1e-6:
            cv2.rectangle(tile, (0, 0), (tile_w - 1, tile.shape[0] - 1), (60, 60, 230), 3)
        tiles.append(tile)
    th = tiles[0].shape[0]
    while len(tiles) % cols:
        tiles.append(np.zeros((th, tile_w, 3), np.uint8))
    rows = [np.hstack(tiles[r:r + cols]) for r in range(0, len(tiles), cols)]
    grid = np.vstack(rows)

    W = grid.shape[1]
    chart = np.full((150, W, 3), 245, np.uint8)
    dur = n / fps
    x = lambda s: int(10 + (W - 20) * s / dur)  # noqa: E731
    y = lambda v: int(130 - 110 * v)  # noqa: E731
    for v in (0, 0.5, 1):
        cv2.line(chart, (10, y(v)), (W - 10, y(v)), (215, 215, 215), 1)
    cv2.line(chart, (x(3.0), 15), (x(3.0), 135), (60, 60, 230), 1)
    for key, color in (("start", (200, 120, 40)), ("end", (40, 150, 40))):
        pts = np.array([[x(tt), y(v)] for tt, v in zip(curves["t"], curves[key])], np.int32)
        cv2.polylines(chart, [pts], False, color, 2, cv2.LINE_AA)
    cv2.putText(chart, "blauw: lijkt op start   groen: lijkt op eind   rood: 3 s", (12, 146),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (60, 60, 60), 1, cv2.LINE_AA)

    head = np.full((44, W, 3), 255, np.uint8)
    summary = (f"{title}   onthulling {metrics['reveal_s']} s   verborgen {metrics['hidden_s']} s   "
               f"fade {metrics['fade_score']}   sprong x{metrics['jump_ratio']}   "
               f"{'; '.join(metrics['flags']) or 'geen signalen'}")
    cv2.putText(head, summary, (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (20, 20, 20), 1, cv2.LINE_AA)
    out.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out), np.vstack([head, grid, chart]), [cv2.IMWRITE_JPEG_QUALITY, 85])


def cmd_measure(args) -> None:
    run_dir = RUNS / args.run_id
    man = read_json(run_dir / "manifest.json")
    if not man:
        raise SystemExit(f"Geen manifest voor run {args.run_id}")
    persons = {p["slug"]: p for p in man["persons"]}
    out_file = run_dir / "eval" / "metrics.json"
    results = read_json(out_file, {})
    only = set(args.clips.split(",")) if args.clips else None
    for c in man["clips"]:
        if c["status"] != "klaar" or (only and c["id"] not in only):
            continue
        video = KIT / c["files"]["fps30"]
        person = persons[c["person"]]
        try:
            metrics, full, curves = measure_clip(video, KIT / man["start"]["file"], KIT / person["end_file"])
            sheet = run_dir / "eval" / f"{c['id']}_sheet.jpg"
            title = f"{person['name']} | {c['model_label']} | {person['variant']}"
            contact_sheet(full, curves["fps"], curves, metrics, title, sheet)
            metrics["sheet"] = rel(sheet)
            results[c["id"]] = metrics
            print(f"  {c['id']:<30} onthulling {str(metrics['reveal_s']):>5} s  verborgen {metrics['hidden_s']:>4} s  "
                  f"fade {metrics['fade_score']:<4}  sprong x{metrics['jump_ratio']:<5} {'; '.join(metrics['flags'])}")
        except Exception as exc:
            results[c["id"]] = {"error": str(exc)}
            print(f"  {c['id']:<30} FOUT: {exc}")
    write_json(out_file, results)
    print(f"Contactbladen en metingen: {rel(run_dir / 'eval')}")


def cmd_verdict(args) -> None:
    run_dir = RUNS / args.run_id
    man = read_json(run_dir / "manifest.json")
    if not man or args.clip not in {c["id"] for c in man["clips"]}:
        raise SystemExit("Onbekende run of clip")
    path = run_dir / "claude_eval.json"
    data = read_json(path, {})
    data[args.clip] = {"verdict": args.verdict, "note": args.note or "", "best": bool(args.best),
                       "updated": dt.datetime.now().isoformat(timespec="seconds")}
    write_json(path, data)
    print(f"{args.clip}: {args.verdict}{' (beste)' if args.best else ''}")


def cmd_best(args) -> None:
    for run_dir in sorted(p for p in RUNS.glob("*") if p.is_dir()):
        for clip, v in read_json(run_dir / "claude_eval.json", {}).items():
            if v.get("best"):
                print(f"  {run_dir.name:<20} {clip:<30} {v['verdict']:<12} {v.get('note', '')[:80]}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    m = sub.add_parser("measure")
    m.add_argument("run_id")
    m.add_argument("--clips", help="komma-gescheiden clip-id's (standaard alles wat klaar is)")
    v = sub.add_parser("verdict")
    v.add_argument("run_id")
    v.add_argument("clip")
    v.add_argument("verdict", choices=VERDICTS)
    v.add_argument("--note")
    v.add_argument("--best", action="store_true", help="hoort bij de beste voorbeelden")
    sub.add_parser("best")
    args = ap.parse_args()
    {"measure": cmd_measure, "verdict": cmd_verdict, "best": cmd_best}[args.cmd](args)


if __name__ == "__main__":
    main()
