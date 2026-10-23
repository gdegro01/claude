"""Shared paths, config, model registry and ffmpeg helpers for sint-morph."""
from __future__ import annotations

import datetime as dt
import json
import os
import re
import shutil
import subprocess
import tempfile
import unicodedata
from pathlib import Path

KIT = Path(__file__).resolve().parents[1]
FRAMES = KIT / "frames"
RUNS = KIT / "runs"
PROMPTS = KIT / "prompts"
SITE = KIT / "site"
MODELS_DIR = KIT / "tools" / "models"

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def load_config() -> dict:
    with open(KIT / "config.json", encoding="utf-8") as f:
        return json.load(f)


def read_json(path: Path, default=None):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return default


def write_json(path: Path, data) -> None:
    """Atomic write so a crash never leaves half a manifest behind."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=path.name, suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp, path)


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = s.strip().lower().replace(" ", "-")
    s = re.sub(r"[^a-z0-9_-]", "", s)
    return s or "persoon"


def rel(path: Path) -> str:
    """Path relative to the kit root, with forward slashes (used by the site)."""
    return Path(path).resolve().relative_to(KIT).as_posix()


# --- models -----------------------------------------------------------------
#
# Every model gets the same inputs: prompt, negative prompt, start and end image
# URLs, the requested duration in seconds and the aspect ratio of the frames
# ("3:4", "9:16", ...). Field names follow each endpoint's llms.txt on fal.ai.

FLUX_PROMO_UNTIL = dt.date(2026, 11, 7)
MINIMAX_PROMO_UNTIL = dt.date(2026, 10, 31)


def _promo(price: float, regular: float, until: dt.date):
    return lambda: price if dt.date.today() <= until else regular


def _kling_v3(prompt, negative, start, end, seconds, aspect):
    return {"prompt": prompt, "start_image_url": start, "end_image_url": end,
            "duration": str(seconds), "generate_audio": False,
            "negative_prompt": negative, "cfg_scale": 0.5}


def _kling_o3(prompt, negative, start, end, seconds, aspect):
    return {"prompt": prompt, "image_url": start, "end_image_url": end,
            "duration": str(seconds), "generate_audio": False}


def _flux(prompt, negative, start, end, seconds, aspect):
    return {"prompt": prompt, "image_url": start, "end_image_url": end, "duration": seconds,
            "resolution": "720p", "reasoning_level": "high", "aspect_ratio": "auto",
            "generate_audio": False}


def _seedance(prompt, negative, start, end, seconds, aspect):
    return {"prompt": prompt, "image_url": start, "end_image_url": end, "duration": str(seconds),
            "resolution": "720p", "aspect_ratio": "auto", "generate_audio": False}


def _minimax(prompt, negative, start, end, seconds, aspect):
    return {"prompt": prompt, "image_url": start, "end_image_url": end, "duration": float(seconds),
            "resolution": "768P", "prompt_expansion_mode": "balanced"}


def _wan3(prompt, negative, start, end, seconds, aspect):
    return {"prompt": prompt, "start_image_url": start, "end_image_url": end, "duration": seconds,
            "resolution": "720p", "aspect_ratio": "adaptive", "audio": False}


def _wan27(prompt, negative, start, end, seconds, aspect):
    return {"prompt": prompt, "image_url": start, "end_image_url": end, "duration": seconds,
            "resolution": "720p", "negative_prompt": negative}


def _pixverse(prompt, negative, start, end, seconds, aspect):
    return {"prompt": prompt, "first_image_url": start, "end_image_url": end, "duration": seconds,
            "resolution": "720p", "aspect_ratio": aspect, "negative_prompt": negative,
            "generate_audio_switch": False}


def _veo_fast(prompt, negative, start, end, seconds, aspect):
    return {"prompt": prompt, "first_frame_url": start, "last_frame_url": end,
            "duration": f"{seconds}s", "resolution": "720p", "aspect_ratio": "auto",
            "negative_prompt": negative, "generate_audio": False}


def _ltx_fast(prompt, negative, start, end, seconds, aspect):
    return {"prompt": prompt, "image_url": start, "end_image_url": end, "duration": seconds,
            "resolution": "720p", "aspect_ratio": "auto", "fps": 48, "generate_audio": False}


def _pick(options):
    """Smallest allowed duration that is at least the requested one."""
    def choose(requested: int) -> int:
        fitting = [o for o in options if o >= requested]
        return min(fitting) if fitting else max(options)
    return choose


ANY = None  # model follows the input image, any aspect ratio works
MODELS = {
    "kling3-std": {
        "label": "Kling 3.0 Standard", "endpoint": "fal-ai/kling-video/v3/standard/image-to-video",
        "args": _kling_v3, "price_per_s": lambda: 0.084, "duration": _pick(range(3, 16)),
        "native_fps": 24, "aspects": ANY, "price_note": "720p, audio uit",
    },
    "kling3-pro": {
        "label": "Kling 3.0 Pro", "endpoint": "fal-ai/kling-video/v3/pro/image-to-video",
        "args": _kling_v3, "price_per_s": lambda: 0.112, "duration": _pick(range(3, 16)),
        "native_fps": 24, "aspects": ANY, "price_note": "1080p, audio uit",
    },
    "kling-o3-std": {
        "label": "Kling O3 Standard", "endpoint": "fal-ai/kling-video/o3/standard/image-to-video",
        "args": _kling_o3, "price_per_s": lambda: 0.084, "duration": _pick(range(3, 16)),
        "native_fps": 24, "aspects": ANY, "price_note": "audio uit",
    },
    "flux3-max": {
        "label": "FLUX 3 Max", "endpoint": "blackforestlabs/flux-3-max/image-to-video",
        "args": _flux, "price_per_s": _promo(0.0425, 0.17, FLUX_PROMO_UNTIL), "duration": _pick(range(5, 21)),
        "native_fps": 24, "aspects": ["21:9", "2:1", "16:9", "4:3", "1:1", "3:4", "9:16"],
        "price_note": "720p, actieprijs t/m 7 nov 2026, daarna $0,17/s",
    },
    "seedance2-fast": {
        "label": "Seedance 2.0 Fast", "endpoint": "bytedance/seedance-2.0/fast/image-to-video",
        "args": _seedance, "price_per_s": lambda: 0.2419, "duration": _pick(range(4, 16)),
        "native_fps": 24, "aspects": ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"], "price_note": "720p",
    },
    "seedance2": {
        "label": "Seedance 2.0", "endpoint": "bytedance/seedance-2.0/image-to-video",
        "args": _seedance, "price_per_s": lambda: 0.3034, "duration": _pick(range(4, 16)),
        "native_fps": 24, "aspects": ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"], "price_note": "720p",
    },
    "minimax-h3max": {
        "label": "MiniMax H3 Max", "endpoint": "minimax/h3-max/image-to-video",
        "args": _minimax, "price_per_s": _promo(0.052, 0.08, MINIMAX_PROMO_UNTIL), "duration": _pick(range(1, 16)),
        "native_fps": 24, "aspects": ANY, "price_note": "768p, actieprijs t/m 31 okt 2026, daarna $0,08/s",
    },
    "wan3": {
        "label": "Wan 3.0", "endpoint": "alibaba/wan-3.0/image-to-video",
        "args": _wan3, "price_per_s": lambda: 0.10, "duration": _pick(range(2, 31)),
        "native_fps": 30, "aspects": ANY, "price_note": "720p, native 30 fps",
    },
    "wan27": {
        "label": "Wan 2.7", "endpoint": "fal-ai/wan/v2.7/image-to-video",
        "args": _wan27, "price_per_s": lambda: 0.10, "duration": _pick(range(2, 16)),
        "native_fps": 30, "aspects": ANY, "price_note": "720p, native 30 fps",
    },
    "pixverse6": {
        "label": "PixVerse V6 Transition", "endpoint": "fal-ai/pixverse/v6/transition",
        "args": _pixverse, "price_per_s": lambda: 0.045, "duration": _pick(range(1, 16)),
        "native_fps": 24, "aspects": ["16:9", "4:3", "1:1", "3:4", "9:16", "2:3", "3:2", "21:9"],
        "price_note": "720p, audio uit",
    },
    "veo31-fast": {
        "label": "Veo 3.1 Fast", "endpoint": "fal-ai/veo3.1/fast/first-last-frame-to-video",
        "args": _veo_fast, "price_per_s": lambda: 0.10, "duration": _pick([4, 6, 8]),
        "native_fps": 24, "aspects": ["16:9", "9:16"], "price_note": "720p, alleen 4/6/8 s, stopt 17 nov 2026",
    },
    "ltx25-fast": {
        "label": "LTX-2.5 Fast (48 fps)", "endpoint": "lightricks/ltx-2.5/image-to-video/fast",
        "args": _ltx_fast, "price_per_s": lambda: 0.09, "duration": _pick(range(6, 21, 2)),
        "native_fps": 48, "aspects": ["16:9", "9:16"], "price_note": "720p, native 48 fps, minimaal 6 s",
    },
}

FILM_ENDPOINT = "fal-ai/film/video"
FILM_PRICE_PER_COMPUTE_S = 0.0013
FILM_BUDGET_PER_CLIP = 0.10  # conservative reservation; actual = compute seconds x price


def model_seconds(model_key: str, duration: int) -> int:
    return MODELS[model_key]["duration"](int(duration))


def clip_cost(model_key: str, duration: int) -> float:
    m = MODELS[model_key]
    return round(m["price_per_s"]() * model_seconds(model_key, duration), 4)


def supports_aspect(model_key: str, aspect: str) -> bool:
    allowed = MODELS[model_key]["aspects"]
    return allowed is None or aspect in allowed


# --- ffmpeg -----------------------------------------------------------------

def require_tools() -> None:
    missing = [t for t in ("ffmpeg", "ffprobe") if shutil.which(t) is None]
    if missing:
        raise SystemExit(
            "Niet gevonden: " + ", ".join(missing) + ". Installeer met: brew install ffmpeg"
        )


def run(cmd: list[str]) -> None:
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        tail = "\n".join(res.stderr.strip().splitlines()[-15:])
        raise RuntimeError(f"Commando faalde: {' '.join(cmd[:4])} ...\n{tail}")


def _rate(value: str) -> float:
    if not value or value == "0/0":
        return 0.0
    if "/" in value:
        a, b = value.split("/")
        return float(a) / float(b) if float(b) else 0.0
    return float(value)


def probe(path: Path) -> dict:
    """Width, height, fps and an exact frame count (decodes the stream)."""
    res = subprocess.run(
        [
            "ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
            "-show_entries", "stream=width,height,avg_frame_rate,r_frame_rate,nb_read_frames",
            "-show_entries", "format=duration", "-of", "json", str(path),
        ],
        capture_output=True, text=True, check=True,
    )
    info = json.loads(res.stdout)
    st = info["streams"][0]
    fps = _rate(st.get("avg_frame_rate")) or _rate(st.get("r_frame_rate"))
    return {
        "width": int(st["width"]),
        "height": int(st["height"]),
        "fps": round(fps, 3),
        "frames": int(st.get("nb_read_frames") or 0),
        "duration": round(float(info.get("format", {}).get("duration") or 0), 3),
    }


H264 = ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an"]
EVEN = "scale=trunc(iw/2)*2:trunc(ih/2)*2"


def retime(src: Path, dst: Path, fps: float, crf: int = 12) -> None:
    """Re-stamp every frame at exactly `fps` without dropping or adding frames."""
    run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
        "-vf", f"setpts=N/({fps}*TB),{EVEN}", "-r", f"{fps}",
        *H264, "-crf", str(crf), "-preset", "slow", str(dst),
    ])


def to_fps(src: Path, dst: Path, fps: int = 30, src_fps: float = 0, crf: int = 16) -> None:
    """Constant `fps` version. When src_fps is a whole multiple, keep exactly every n-th
    frame starting at frame 0, so the first and last frame stay the model's own frames."""
    step = src_fps / fps if src_fps else 0
    if step >= 1 and abs(step - round(step)) < 1e-6:
        vf = f"select='not(mod(n\\,{int(round(step))}))',setpts=N/({fps}*TB),{EVEN}"
    else:
        vf = f"fps={fps},{EVEN}"
    run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
        "-vf", vf, "-r", str(fps), *H264, "-crf", str(crf), "-preset", "slow", str(dst),
    ])


def local_interpolate(src: Path, dst: Path, fps: int = 120) -> None:
    """Motion-compensated interpolation with ffmpeg (fallback when FILM is unavailable)."""
    run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
        "-vf", f"minterpolate=fps={fps}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,{EVEN}",
        *H264, "-crf", "12", "-preset", "slow", str(dst),
    ])


def extract_frame(src: Path, dst: Path, last: bool = False) -> None:
    if last:
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-sseof", "-0.5", "-i", str(src),
               "-update", "1", "-q:v", "1", str(dst)]
    else:
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
               "-frames:v", "1", "-q:v", "1", str(dst)]
    run(cmd)
