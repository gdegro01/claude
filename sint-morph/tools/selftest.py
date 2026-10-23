#!/usr/bin/env python3
"""Check this machine before spending money: packages, ffmpeg, paths, FAL_KEY,
plus a quick alignment and frame-rate test on synthetic data. Costs nothing."""
from __future__ import annotations

import math
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

results = []


def check(name, fn):
    try:
        detail = fn()
        results.append((True, name, detail or ""))
    except Exception as exc:  # report every failure, keep going
        results.append((False, name, str(exc)))


def packages():
    import cv2
    import fal_client  # noqa: F401
    import httpx  # noqa: F401
    import numpy
    if not hasattr(cv2, "FaceDetectorYN"):
        raise RuntimeError("OpenCV zonder FaceDetectorYN; installeer opencv-python-headless 4.9 of nieuwer")
    return f"python {sys.version.split()[0]}, opencv {cv2.__version__}, numpy {numpy.__version__}"


def ffmpeg():
    from common import require_tools
    require_tools()
    out = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True).stdout.splitlines()[0]
    filters = subprocess.run(["ffmpeg", "-hide_banner", "-filters"], capture_output=True, text=True).stdout
    missing = [f for f in ("minterpolate", "select", "setpts") if f" {f} " not in filters]
    if missing:
        raise RuntimeError("ffmpeg mist filters: " + ", ".join(missing))
    if "libx264" not in subprocess.run(["ffmpeg", "-hide_banner", "-encoders"], capture_output=True, text=True).stdout:
        raise RuntimeError("ffmpeg zonder libx264")
    return out


def paths():
    from common import load_config
    cfg = load_config()
    notes = []
    starts = [p for p in (cfg.get("start_frame"), cfg.get("start_frame_alt")) if p and Path(p).expanduser().is_file()]
    if not starts:
        raise RuntimeError("geen startframe op de paden uit config.json")
    notes.append("startframe: " + ", ".join(starts))
    personen = Path(cfg["personen_dir"]).expanduser()
    if not personen.is_dir():
        raise RuntimeError(f"map met personen ontbreekt: {personen}")
    n = len([p for p in personen.iterdir() if p.is_dir() and not p.name.startswith(".")])
    notes.append(f"{n} persoonsmappen")
    return "; ".join(notes)


def fal_key():
    from run_test import load_env_key
    if not load_env_key():
        raise RuntimeError("FAL_KEY niet gevonden (omgeving, of .env/.env.local in arena/ of arena/sint-morph/)")
    return "aanwezig (waarde niet getoond)"


def alignment():
    import cv2
    import numpy as np
    from align_frames import register_background
    rng = np.random.default_rng(1)
    base = cv2.GaussianBlur(rng.integers(0, 255, (900, 700, 3), dtype=np.uint8), (0, 0), 2)
    for _ in range(60):
        x, y = int(rng.integers(0, 650)), int(rng.integers(0, 850))
        cv2.rectangle(base, (x, y), (x + int(rng.integers(10, 60)), y + int(rng.integers(10, 60))),
                      tuple(int(c) for c in rng.integers(0, 255, 3)), -1)
    a = math.radians(0.6)
    M = np.float64([[1.07 * math.cos(a), -1.07 * math.sin(a), -25], [1.07 * math.sin(a), 1.07 * math.cos(a), -30]])
    end = cv2.warpAffine(base, M, (640, 960), flags=cv2.INTER_LANCZOS4)
    reg = register_background(base, end)
    if not reg:
        raise RuntimeError("registratie vond niets")
    truth = cv2.invertAffineTransform(M)
    pts = np.float64([[0, 0], [639, 0], [0, 959], [639, 959]])
    err = np.abs(pts @ reg["M"][:, :2].T + reg["M"][:, 2] - (pts @ truth[:, :2].T + truth[:, 2])).max()
    if err > 0.5:
        raise RuntimeError(f"uitlijnfout {err:.2f} px")
    return f"fout {err:.3f} px, {reg['inliers']} punten"


def framerate():
    from common import local_interpolate, probe, to_fps
    tmp = Path(tempfile.mkdtemp())
    try:
        src = tmp / "src.mp4"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i",
                        "testsrc2=size=320x240:rate=24:duration=1", "-pix_fmt", "yuv420p", str(src)], check=True)
        master = tmp / "master.mp4"
        local_interpolate(src, master, 120)
        out = tmp / "out30.mp4"
        to_fps(master, out, 30, src_fps=120)
        p = probe(out)
        if abs(p["fps"] - 30) > 0.01:
            raise RuntimeError(f"verwacht 30 fps, kreeg {p['fps']}")
        return f"24 -> 120 -> {p['fps']:g} fps, {p['frames']} frames"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


check("Python-pakketten", packages)
check("ffmpeg", ffmpeg)
check("Paden uit config.json", paths)
check("FAL_KEY", fal_key)
check("Uitlijning (synthetisch)", alignment)
check("Framerate-keten (synthetisch)", framerate)

for ok, name, detail in results:
    print(f"{'OK  ' if ok else 'FOUT'}  {name:<30} {detail}")
sys.exit(0 if all(r[0] for r in results) else 1)
