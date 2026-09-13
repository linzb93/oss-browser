#!/usr/bin/env python3
"""
检查 public/logo.png 是否带有 5% 单边 padding;
若不符合,或缺少 public/logo.icns,则基于原图生成带 5% padding 的 logo.png、
public/icons.iconset/icon_*.png 全档,以及 public/logo.icns。

由 scripts/electron-builder.mjs 在 macOS 上按需调用。
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
LOGO_PNG = REPO_ROOT / "public" / "logo.png"
ICONSET_DIR = REPO_ROOT / "public" / "icons.iconset"
ICNS_FILE = REPO_ROOT / "public" / "logo.icns"

PADDING_RATIO = 0.05          # 单边 padding 占画布比例
CONTENT_RATIO = 1 - 2 * PADDING_RATIO  # 0.90
TOLERANCE = 0.005             # 容忍 ±0.5% 的偏差

ICONSET_SIZES = [
    ("icon_16x16.png",        16),
    ("icon_16x16@2x.png",     32),
    ("icon_32x32.png",        32),
    ("icon_32x32@2x.png",     64),
    ("icon_64x64.png",        64),
    ("icon_64x64@2x.png",    128),
    ("icon_128x128.png",     128),
    ("icon_128x128@2x.png",  256),
    ("icon_256x256.png",     256),
    ("icon_256x256@2x.png",  512),
    ("icon_512x512.png",     512),
    ("icon_512x512@2x.png", 1024),
    ("icon_1024x1024.png",  1024),
    ("icon_1024x1024@2x.png",2048),
]


def measure_padding_ratio(img: Image.Image, sample_step: int = 1) -> float:
    """测量单边 padding 占画布的比例。

    用四条边的最小 padding 作为判定标准,避免 logo 主体本身不对称造成误判
    (例如 logo 偏左时,左边只有 5% padding、右边却有 14%,但实际左边已经达到要求)。
    """
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    w, h = img.size
    data = img.split()[-1].load()

    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(0, h, sample_step):
        for x in range(0, w, sample_step):
            if data[x, y] > 10:
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
    if max_x < 0:
        # 全透明,认为 padding 是 50%
        return 0.5

    paddings = [min_x, min_y, w - 1 - max_x, h - 1 - max_y]
    min_padding = min(paddings)
    return min_padding / w


def has_five_percent_padding(path: Path) -> bool:
    try:
        with Image.open(path) as img:
            return abs(measure_padding_ratio(img) - PADDING_RATIO) <= TOLERANCE
    except Exception:
        return False


def write_with_padding(src: Image.Image, size: int) -> Image.Image:
    """把 src 按 90% 缩放,放到 size×size 透明画布正中。"""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inner_size = round(size * CONTENT_RATIO)
    inner = src.resize((inner_size, inner_size), Image.LANCZOS)
    offset = (size - inner_size) // 2
    canvas.paste(inner, (offset, offset), inner)
    return canvas


def regenerate(src_path: Path, iconset_dir: Path, icns_path: Path) -> None:
    with Image.open(src_path) as raw:
        base = raw.convert("RGBA")
        w, h = base.size

        # 1) 重写 logo.png(若原图不是 1024×1024,统一缩放到 1024)
        if (w, h) != (1024, 1024):
            base = base.resize((1024, 1024), Image.LANCZOS)
        logo = write_with_padding(base, 1024)
        logo.save(src_path, "PNG")

        # 2) 生成 iconset 全档
        iconset_dir.mkdir(parents=True, exist_ok=True)
        for name, size in ICONSET_SIZES:
            iconset_dir.joinpath(name).parent.mkdir(parents=True, exist_ok=True)
            write_with_padding(logo, size).save(iconset_dir / name, "PNG")

        # 3) 用 iconutil 打 icns(仅 macOS 自带;其他平台这里跳过,不会被打包)
        if sys.platform == "darwin":
            import subprocess
            subprocess.run(
                ["iconutil", "-c", "icns", str(iconset_dir), "-o", str(icns_path)],
                check=True,
            )


def main() -> int:
    check_only = "--check" in sys.argv[1:]

    if not LOGO_PNG.exists():
        print(f"[ensureMacOSIcon] 缺少 {LOGO_PNG}", file=sys.stderr)
        return 2

    ok_padding = has_five_percent_padding(LOGO_PNG)
    ok_icns = ICNS_FILE.exists()

    if ok_padding and ok_icns:
        print(f"[ensureMacOSIcon] logo.png 已是 5% padding,icns 已存在,跳过")
        return 0

    if check_only:
        print(
            f"[ensureMacOSIcon] 需要调整:"
            f" padding_ok={ok_padding}, icns_ok={ok_icns}"
        )
        return 1

    print(f"[ensureMacOSIcon] 调整 logo.png padding → 5%,并重建 logo.icns")
    regenerate(LOGO_PNG, ICONSET_DIR, ICNS_FILE)
    return 0


if __name__ == "__main__":
    sys.exit(main())