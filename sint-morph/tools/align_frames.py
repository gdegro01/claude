#!/usr/bin/env python3
"""Align every end frame pixel-exactly onto the start frame (sint.jpg).

Per person the script picks one end frame, registers it on the shared background
(SIFT + RANSAC, similarity transform), falls back to eye/nose alignment when the
backgrounds differ, and as a last resort to a cover crop. All frames, start
included, are then cropped to one aspect ratio that both video models support.

Output (inside the kit):
  frames/start/sint.png          start frame, cropped, lossless
  frames/end/<persoon>.png       aligned end frames, same size as the start
  frames/upload/*.jpg            compact copies for fal.ai
  frames/check/<persoon>.jpg     start | end | 50% blend | difference
  frames/align_report.json       choice, method, quality per person
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import math
import re
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import FRAMES, IMAGE_EXTS, MODELS_DIR, load_config, rel, slugify, write_json  # noqa: E402

RATIOS = [("21:9", 21 / 9), ("2:1", 2.0), ("16:9", 16 / 9), ("4:3", 4 / 3),
          ("1:1", 1.0), ("3:4", 3 / 4), ("9:16", 9 / 16)]
YUNET = MODELS_DIR / "face_detection_yunet_2023mar.onnx"


# --- input ------------------------------------------------------------------

def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def resolve_start(cfg: dict, override: str | None) -> Path:
    if override:
        p = Path(override).expanduser()
        if not p.is_file():
            raise SystemExit(f"Startframe niet gevonden: {p}")
        return p
    found = [Path(p).expanduser() for p in (cfg.get("start_frame"), cfg.get("start_frame_alt")) if p]
    found = [p for p in found if p.is_file()]
    if not found:
        raise SystemExit("Geen startframe gevonden op de paden in config.json (start_frame, start_frame_alt).")
    if len(found) == 2 and sha256(found[0]) != sha256(found[1]):
        raise SystemExit(
            "Er staan twee verschillende sint.jpg's:\n"
            f"  {found[0]}\n  {found[1]}\n"
            "Kies er een met --start <pad>."
        )
    return found[0]


def load_image(path: Path) -> tuple[np.ndarray, np.ndarray | None, list[str]]:
    """Read as BGR plus a validity mask (None when fully opaque).

    Transparent pixels are flattened onto white for feature detection; the mask
    makes sure they are later filled like any other uncovered area.
    """
    notes = []
    img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError(f"Kan beeld niet lezen: {path}")
    if img.ndim == 2 or img.shape[2] == 3:
        # IMREAD_UNCHANGED ignores EXIF orientation; IMREAD_COLOR applies it (phone photos)
        img = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    if img.dtype != np.uint8:
        img = cv2.convertScaleAbs(img, alpha=255.0 / max(1, int(img.max())))
    valid = None
    if img.shape[2] == 4:
        alpha = img[:, :, 3:4].astype(np.float32) / 255.0
        if (alpha < 0.999).any():
            notes.append(f"transparantie in {round(float((alpha < 0.999).mean()) * 100, 1)}% van de pixels")
            valid = np.where(alpha[:, :, 0] > 0.5, 255, 0).astype(np.uint8)
        img = (img[:, :, :3].astype(np.float32) * alpha + 255.0 * (1 - alpha)).astype(np.uint8)
    return img, valid, notes


VERSION_RE = re.compile(r"(?:^|[-_ ])v(\d+)(?=[-_ .]|$)", re.IGNORECASE)
APPROVED_RE = re.compile(r"[-_]J$")


def pick_end_frame(person_dir: Path, subdir: str) -> tuple[Path | None, list[str]]:
    """Prefer files ending in -J, then the highest vN, then the newest file."""
    folder = person_dir / subdir if (person_dir / subdir).is_dir() else person_dir
    files = [p for p in folder.iterdir()
             if p.is_file() and p.suffix.lower() in IMAGE_EXTS and not p.name.startswith(".")]
    if not files:
        return None, []

    def key(p: Path):
        m = VERSION_RE.search(p.stem)
        return (bool(APPROVED_RE.search(p.stem)), int(m.group(1)) if m else -1, p.stat().st_mtime)

    files.sort(key=key, reverse=True)
    return files[0], [p.name for p in files[1:]]


# --- registration -----------------------------------------------------------

def _gray(img: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)


def _shrink(gray: np.ndarray, max_side: int = 1600) -> tuple[np.ndarray, float]:
    s = min(1.0, max_side / max(gray.shape[:2]))
    if s < 1.0:
        gray = cv2.resize(gray, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    return gray, s


def _params(M: np.ndarray) -> tuple[float, float]:
    scale = math.sqrt(abs(np.linalg.det(M[:, :2])))
    rot = math.degrees(math.atan2(M[1, 0], M[0, 0]))
    return scale, rot


def register_background(S: np.ndarray, E: np.ndarray) -> dict | None:
    """Similarity transform E -> S from features on the shared background."""
    gs, ss = _shrink(_gray(S))
    ge, se = _shrink(_gray(E))
    sift = cv2.SIFT_create(nfeatures=10000, contrastThreshold=0.02)
    ks, ds = sift.detectAndCompute(gs, None)
    ke, de = sift.detectAndCompute(ge, None)
    if ds is None or de is None or len(ks) < 12 or len(ke) < 12:
        return None
    pairs = cv2.BFMatcher(cv2.NORM_L2).knnMatch(de, ds, k=2)
    good = [p[0] for p in pairs if len(p) == 2 and p[0].distance < 0.75 * p[1].distance]
    if len(good) < 12:
        return None
    pe = np.float32([ke[m.queryIdx].pt for m in good]) / se
    ps = np.float32([ks[m.trainIdx].pt for m in good]) / ss
    M, inl = cv2.estimateAffinePartial2D(
        pe, ps, method=cv2.RANSAC, ransacReprojThreshold=3.0 / ss,
        maxIters=20000, confidence=0.999, refineIters=50,
    )
    if M is None or inl is None:
        return None
    inl = inl.ravel().astype(bool)
    n_inl = int(inl.sum())
    if n_inl < 8:
        return None
    proj = pe[inl] @ M[:, :2].T + M[:, 2]
    rms = float(np.sqrt(np.mean(np.sum((proj - ps[inl]) ** 2, axis=1))))
    hull = cv2.convexHull(ps[inl].reshape(-1, 1, 2))
    spread = float(cv2.contourArea(hull)) / float(S.shape[0] * S.shape[1])
    scale, rot = _params(M)
    return {"M": M, "matches": len(good), "inliers": n_inl,
            "inlier_ratio": round(n_inl / len(good), 3), "rms_px": round(rms, 2),
            "spread": round(spread, 3), "scale": round(scale, 4), "rotation_deg": round(rot, 3)}


_detector = None


def detect_face(img: np.ndarray) -> np.ndarray | None:
    """Right eye, left eye, nose tip of the largest face (full-res coordinates)."""
    global _detector
    if not YUNET.is_file():
        return None
    g, s = _shrink(img, 1280) if max(img.shape[:2]) > 1280 else (img, 1.0)
    h, w = g.shape[:2]
    if _detector is None:
        _detector = cv2.FaceDetectorYN.create(str(YUNET), "", (w, h), 0.6, 0.3, 50)
    _detector.setInputSize((w, h))
    _, faces = _detector.detect(g)
    if faces is None or len(faces) == 0:
        return None
    face = max(faces, key=lambda f: f[2] * f[3] * f[14])
    return np.float32(face[4:10]).reshape(3, 2) / s


def scale_translate_from_points(src: np.ndarray, dst: np.ndarray) -> np.ndarray:
    """Least-squares uniform scale + translation (no rotation: keeps the horizon level)."""
    mu_s, mu_d = src.mean(0), dst.mean(0)
    a, b = src - mu_s, dst - mu_d
    scale = float((a * b).sum() / (a * a).sum())
    t = mu_d - scale * mu_s
    return np.float64([[scale, 0, t[0]], [0, scale, t[1]]])


def register_face(S: np.ndarray, E: np.ndarray) -> dict | None:
    fs, fe = detect_face(S), detect_face(E)
    if fs is None or fe is None:
        return None
    M = scale_translate_from_points(fe, fs)
    proj = fe @ M[:, :2].T + M[:, 2]
    rms = float(np.sqrt(np.mean(np.sum((proj - fs) ** 2, axis=1))))
    scale, rot = _params(M)
    return {"M": M, "rms_px": round(rms, 2), "scale": round(scale, 4), "rotation_deg": round(rot, 3)}


def cover_transform(S: np.ndarray, E: np.ndarray, ax: float, ay: float) -> np.ndarray:
    H, W = S.shape[:2]
    h, w = E.shape[:2]
    s = max(W / w, H / h)
    return np.float64([[s, 0, (W - w * s) * ax], [0, s, (H - h * s) * ay]])


def warp(S: np.ndarray, E: np.ndarray, valid: np.ndarray | None, M: np.ndarray,
         fill_from_start: bool) -> tuple[np.ndarray, float]:
    """Warp E into S's frame. Uncovered pixels come from S (same background) or the stretched edge."""
    H, W = S.shape[:2]
    scale, rot = _params(M)
    identity = abs(scale - 1) < 1e-3 and abs(rot) < 0.05 and np.abs(M[:, 2]).max() < 0.5
    if E.shape == S.shape and identity and valid is None:
        return E.copy(), 1.0
    border = cv2.BORDER_CONSTANT if fill_from_start else cv2.BORDER_REPLICATE
    out = cv2.warpAffine(E, M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=border, borderValue=(0, 0, 0))
    src_mask = valid if valid is not None else np.full(E.shape[:2], 255, np.uint8)
    mask = cv2.warpAffine(src_mask, M, (W, H), flags=cv2.INTER_NEAREST,
                          borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    coverage = float((mask > 0).mean())
    if coverage < 1.0 and (fill_from_start or valid is not None):
        inner = cv2.erode(mask, np.ones((3, 3), np.uint8), iterations=2) > 0
        if fill_from_start:
            out[~inner] = S[~inner]
        else:
            # different background: fill transparent holes from their surroundings
            out = cv2.inpaint(out, (~inner).astype(np.uint8) * 255, 5, cv2.INPAINT_TELEA)
    return out, coverage


# --- aspect -----------------------------------------------------------------

def crop_rect(W: int, H: int, aspect: str, ax: float, ay: float) -> tuple[tuple[int, int, int, int], str, str]:
    r = W / H
    if aspect == "keep":
        return (0, 0, W - W % 2, H - H % 2), "eigen", "beeldverhouding behouden"
    if aspect == "auto":
        name, target = min(RATIOS, key=lambda x: abs(math.log(r / x[1])))
    else:
        a, b = (float(x) for x in aspect.split(":"))
        name, target = aspect, a / b
    if abs(math.log(r / target)) <= math.log(1.01):
        return (0, 0, W - W % 2, H - H % 2), name, f"past al bij {name}"
    if r > target:
        w = int(round(H * target)) // 2 * 2
        x0 = int(round((W - w) * ax))
        return (x0, 0, w, H - H % 2), name, f"breedte bijgesneden naar {name} ({round((1 - w / W) * 100, 1)}% eraf)"
    h = int(round(W / target)) // 2 * 2
    y0 = int(round((H - h) * ay))
    return (0, y0, W - W % 2, h), name, f"hoogte bijgesneden naar {name} ({round((1 - h / H) * 100, 1)}% eraf)"


def crop(img: np.ndarray, rect: tuple[int, int, int, int]) -> np.ndarray:
    x, y, w, h = rect
    return img[y:y + h, x:x + w]


# --- output -----------------------------------------------------------------

def save_upload(img: np.ndarray, path: Path, max_side: int) -> None:
    s = min(1.0, max_side / max(img.shape[:2]))
    if s < 1.0:
        img = cv2.resize(img, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    params = [cv2.IMWRITE_JPEG_QUALITY, 95]
    if hasattr(cv2, "IMWRITE_JPEG_SAMPLING_FACTOR"):
        params += [cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444]
    path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(path), img, params)


def check_strip(S: np.ndarray, E: np.ndarray, path: Path, height: int = 420) -> None:
    s = height / S.shape[0]
    a = cv2.resize(S, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    b = cv2.resize(E, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    blend = cv2.addWeighted(a, 0.5, b, 0.5, 0)
    diff = cv2.convertScaleAbs(cv2.absdiff(a, b), alpha=2.0)
    tiles = []
    for img, label in ((a, "start"), (b, "eind"), (blend, "50/50"), (diff, "verschil x2")):
        img = img.copy()
        cv2.putText(img, label, (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 4, cv2.LINE_AA)
        cv2.putText(img, label, (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)
        tiles.append(img)
    path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(path), np.hstack(tiles), [cv2.IMWRITE_JPEG_QUALITY, 88])


def judge(method: str, reg: dict, coverage: float, diag: float) -> tuple[str, list[str]]:
    notes = []
    if method == "achtergrond":
        ok = True
        if reg["inliers"] < 40 or reg["inlier_ratio"] < 0.2:
            ok = False
            notes.append(f"weinig overeenkomende punten ({reg['inliers']})")
        if reg["spread"] < 0.15:
            ok = False
            notes.append("punten liggen geclusterd, controleer de randen")
        if reg["rms_px"] > 0.002 * diag:
            ok = False
            notes.append(f"restfout {reg['rms_px']} px")
        if abs(reg["rotation_deg"]) > 3:
            ok = False
            notes.append(f"gedraaid ({reg['rotation_deg']} graden)")
        if not 0.25 <= reg["scale"] <= 4:
            ok = False
            notes.append(f"schaal {reg['scale']}")
        if coverage < 0.995:
            ok = False
            notes.append(f"rand aangevuld met startframe ({round((1 - coverage) * 100, 1)}%)")
        return ("ok" if ok else "controleren"), notes
    if method == "gezicht":
        notes.append("achtergrond komt niet overeen, uitgelijnd op ogen en neus")
        if coverage < 0.995:
            notes.append(f"rand uitgerekt ({round((1 - coverage) * 100, 1)}%)")
        return "controleren", notes
    notes.append("geen uitlijning gevonden, alleen passend bijgesneden")
    return "handmatig", notes


def main() -> None:
    cfg = load_config()
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--start", help="pad naar het startframe (standaard uit config.json)")
    ap.add_argument("--personen", default=cfg["personen_dir"], help="map met een submap per persoon")
    ap.add_argument("--aspect", default=cfg.get("aspect", "auto"), help="auto, keep of bv. 9:16")
    ap.add_argument("--anchor-x", type=float, default=cfg.get("anchor_x", 0.5))
    ap.add_argument("--anchor-y", type=float, default=cfg.get("anchor_y", 0.5))
    ap.add_argument("--method", default="auto", choices=["auto", "achtergrond", "gezicht", "bijsnijden"])
    ap.add_argument("--only", help="komma-gescheiden namen van personen")
    ap.add_argument("--out", default=str(FRAMES))
    args = ap.parse_args()

    out = Path(args.out)
    start_path = resolve_start(cfg, args.start)
    S_full, _, start_notes = load_image(start_path)
    H0, W0 = S_full.shape[:2]
    rect, ratio_name, ratio_note = crop_rect(W0, H0, args.aspect, args.anchor_x, args.anchor_y)
    S = crop(S_full, rect)
    (out / "start").mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out / "start" / "sint.png"), S)
    save_upload(S, out / "upload" / "sint.jpg", cfg.get("upload_max_side", 2048))
    diag = math.hypot(W0, H0)

    personen = Path(args.personen).expanduser()
    if not personen.is_dir():
        raise SystemExit(f"Map met personen niet gevonden: {personen}")
    only = {x.strip().lower() for x in args.only.split(",")} if args.only else None
    dirs = sorted(p for p in personen.iterdir() if p.is_dir() and not p.name.startswith((".", "_")))
    slugs: dict[str, str] = {}
    for d in dirs:
        base = slug = slugify(d.name)
        n = 2
        while slug in slugs.values():
            slug = f"{base}-{n}"
            n += 1
        slugs[d.name] = slug

    report = {
        "created": dt.datetime.now().isoformat(timespec="seconds"),
        "start": {"source": str(start_path), "sha256": sha256(start_path), "size": [W0, H0],
                  "notes": start_notes, "file": rel(out / "start" / "sint.png"),
                  "upload": rel(out / "upload" / "sint.jpg")},
        "aspect": {"name": ratio_name, "crop": list(rect), "note": ratio_note,
                   "size": [int(S.shape[1]), int(S.shape[0])]},
        "persons": [],
    }

    for d in dirs:
        if only and d.name.lower() not in only:
            continue
        slug = slugs[d.name]
        entry = {"name": d.name, "slug": slug}
        src, alternatives = pick_end_frame(d, cfg.get("eindframe_subdir", "eindframes"))
        if src is None:
            entry.update(status="geen eindframe", notes=["geen beeldbestand gevonden"])
            report["persons"].append(entry)
            print(f"  {d.name:<20} geen eindframe")
            continue
        entry.update(source=str(src), alternatives=alternatives)
        try:
            E, valid, notes = load_image(src)
            reg, method = None, None
            if args.method in ("auto", "achtergrond"):
                reg = register_background(S_full, E)
                method = "achtergrond" if reg else None
                if reg and args.method == "auto" and (reg["inliers"] < 15 or reg["spread"] < 0.05):
                    reg, method = None, None
            if reg is None and args.method in ("auto", "gezicht"):
                reg = register_face(S_full, E)
                method = "gezicht" if reg else None
            if reg is None:
                reg = {"M": cover_transform(S_full, E, args.anchor_x, args.anchor_y)}
                method = "bijsnijden"
            aligned, coverage = warp(S_full, E, valid, reg["M"], fill_from_start=(method == "achtergrond"))
            status, judged = judge(method, reg, coverage, diag)
            aligned = crop(aligned, rect)
            (out / "end").mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(out / "end" / f"{slug}.png"), aligned)
            save_upload(aligned, out / "upload" / f"{slug}.jpg", cfg.get("upload_max_side", 2048))
            check_strip(S, aligned, out / "check" / f"{slug}.jpg")
            metrics = {k: v for k, v in reg.items() if k != "M"}
            metrics["coverage"] = round(coverage, 4)
            metrics["matrix"] = [[round(float(v), 6) for v in row] for row in reg["M"]]
            entry.update(method=method, status=status, notes=notes + judged, metrics=metrics,
                         source_size=[int(E.shape[1]), int(E.shape[0])],
                         file=rel(out / "end" / f"{slug}.png"),
                         upload=rel(out / "upload" / f"{slug}.jpg"),
                         check=rel(out / "check" / f"{slug}.jpg"))
        except Exception as exc:  # keep going for the other persons
            entry.update(status="fout", notes=[str(exc)])
        report["persons"].append(entry)
        print(f"  {d.name:<20} {entry.get('status', ''):<14} {entry.get('method', ''):<12} "
              f"{Path(entry.get('source', '')).name:<28} {'; '.join(entry.get('notes', []))}")

    write_json(out / "align_report.json", report)
    counts = {}
    for p in report["persons"]:
        counts[p["status"]] = counts.get(p["status"], 0) + 1
    print(f"\nStartframe: {start_path} ({W0}x{H0}), {ratio_note}, uitvoer {S.shape[1]}x{S.shape[0]}")
    print("Resultaat: " + ", ".join(f"{v} {k}" for k, v in sorted(counts.items())))
    print(f"Rapport: {out / 'align_report.json'}")


if __name__ == "__main__":
    main()
