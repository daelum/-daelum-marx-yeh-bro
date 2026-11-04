#!/usr/bin/env python3
"""Sync a local Instagram tweet-queue day folder → Cloudflare R2 + KV.

Reads Project-store (or any) day folder with manifest.md + PNGs, writes:
  R2 (binding IG_MEDIA):  {date}/{filename}
  KV  (binding IG_QUEUE): day:{date} JSON + index:days

Usage:
  python3 scripts/sync-ig-queue-to-cf.py \\
    --day-dir /path/to/instagram-tweet-queue/2026-11-05 \\
    [--dry-run] [--wrangler]

Requires either:
  - `wrangler` CLI authenticated to the Yeh Bro Pages/account, or
  - env CF_ACCOUNT_ID + CF_API_TOKEN + CF_KV_NAMESPACE_ID + CF_R2_BUCKET
    (prefer wrangler path; do not paste tokens into chat/docs)

Never prints secret values.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

SINGLE_RE = re.compile(
    r"^\|\s*(?P<num>\d+)\s*\|\s*`(?P<file>[^`]+)`\s*\|\s*(?P<status>\w+)\s*\|\s*(?P<angle>[^|]+)\|\s*(?P<caption>.+?)\s*\|\s*$"
)
CAROUSEL_HEADER_RE = re.compile(
    r"^###\s+(?P<id>C\d+)\s+[—\-].*?·\s*\*\*(?P<status>\w+)\*\*",
    re.IGNORECASE,
)
CAROUSEL_FILES_RE = re.compile(r"^\-\s+\*\*Files:\*\*\s*(.+)$")
CAROUSEL_CAPTION_RE = re.compile(r"^\-\s+\*\*Caption:\*\*\s*(.+)$")
CAROUSEL_SLIDE_RE = re.compile(r"^\s+\d+\.\s+(.+)$")
FILE_TICK_RE = re.compile(r"`([^`]+)`")


def parse_manifest(text: str, date: str) -> dict:
    items: list[dict] = []
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        m = SINGLE_RE.match(line)
        if m:
            num = m.group("num").zfill(2)
            items.append(
                {
                    "id": num,
                    "kind": "single",
                    "status": m.group("status").lower(),
                    "angle": m.group("angle").strip(),
                    "caption": m.group("caption").strip(),
                    "files": [m.group("file").strip()],
                }
            )
            i += 1
            continue
        cm = CAROUSEL_HEADER_RE.match(line)
        if cm:
            cid = cm.group("id").upper()
            status = cm.group("status").lower()
            files: list[str] = []
            caption = ""
            slides: list[str] = []
            i += 1
            while i < len(lines) and not lines[i].startswith("### "):
                fm = CAROUSEL_FILES_RE.match(lines[i])
                if fm:
                    files = FILE_TICK_RE.findall(fm.group(1))
                cap = CAROUSEL_CAPTION_RE.match(lines[i])
                if cap:
                    caption = cap.group(1).strip()
                sm = CAROUSEL_SLIDE_RE.match(lines[i])
                if sm:
                    slides.append(sm.group(1).strip())
                i += 1
            items.append(
                {
                    "id": cid,
                    "kind": "carousel",
                    "status": status,
                    "caption": caption,
                    "files": files,
                    "slides": slides,
                }
            )
            continue
        i += 1

    return {
        "date": date,
        "account": "@theyehbro",
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "items": items,
        "publishLog": [],
    }


def run(cmd: list[str], dry_run: bool) -> None:
    print("+", " ".join(cmd))
    if dry_run:
        return
    subprocess.run(cmd, check=True)


def sync_with_wrangler(day_dir: Path, date: str, manifest: dict, dry_run: bool) -> None:
    """Upload via `wrangler r2 object put` + `wrangler kv key put`."""
    bucket = os.environ.get("CF_R2_BUCKET", "yehbro-ig-queue")
    kv_binding_hint = os.environ.get("CF_KV_NAMESPACE_ID", "")

    for item in manifest["items"]:
        for file in item["files"]:
            src = day_dir / file
            if not src.is_file():
                raise SystemExit(f"Missing media file: {src}")
            key = f"{date}/{file}"
            run(
                [
                    "wrangler",
                    "r2",
                    "object",
                    "put",
                    f"{bucket}/{key}",
                    "--file",
                    str(src),
                    "--content-type",
                    "image/png",
                ],
                dry_run,
            )

    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as tmp:
        json.dump(manifest, tmp, indent=2)
        tmp_path = tmp.name
    try:
        kv_cmd = [
            "wrangler",
            "kv",
            "key",
            "put",
            f"day:{date}",
            "--path",
            tmp_path,
        ]
        if kv_binding_hint:
            kv_cmd.extend(["--namespace-id", kv_binding_hint])
        else:
            kv_cmd.extend(["--binding", "IG_QUEUE"])
        run(kv_cmd, dry_run)

        # Merge index
        index_cmd_get = [
            "wrangler",
            "kv",
            "key",
            "get",
            "index:days",
        ]
        if kv_binding_hint:
            index_cmd_get.extend(["--namespace-id", kv_binding_hint])
        else:
            index_cmd_get.extend(["--binding", "IG_QUEUE"])

        index: list[str] = []
        if not dry_run:
            try:
                out = subprocess.check_output(index_cmd_get, text=True, stderr=subprocess.DEVNULL)
                index = json.loads(out) if out.strip() else []
                if not isinstance(index, list):
                    index = []
            except (subprocess.CalledProcessError, json.JSONDecodeError):
                index = []
        if date not in index:
            index.append(date)
        index = sorted(set(index))
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as idx:
            json.dump(index, idx)
            idx_path = idx.name
        try:
            put_idx = [
                "wrangler",
                "kv",
                "key",
                "put",
                "index:days",
                "--path",
                idx_path,
            ]
            if kv_binding_hint:
                put_idx.extend(["--namespace-id", kv_binding_hint])
            else:
                put_idx.extend(["--binding", "IG_QUEUE"])
            run(put_idx, dry_run)
        finally:
            os.unlink(idx_path)
    finally:
        os.unlink(tmp_path)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--day-dir",
        required=True,
        type=Path,
        help="Path to YYYY-MM-DD folder with manifest.md + PNGs",
    )
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument(
        "--wrangler",
        action="store_true",
        default=True,
        help="Use wrangler CLI (default)",
    )
    ap.add_argument(
        "--json-out",
        type=Path,
        help="Also write parsed day JSON to this path (safe; no secrets)",
    )
    args = ap.parse_args()

    day_dir = args.day_dir.expanduser().resolve()
    if not day_dir.is_dir():
        print(f"Not a directory: {day_dir}", file=sys.stderr)
        return 1
    manifest_path = day_dir / "manifest.md"
    if not manifest_path.is_file():
        print(f"Missing manifest.md in {day_dir}", file=sys.stderr)
        return 1

    date = day_dir.name
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        print("day-dir folder name must be YYYY-MM-DD", file=sys.stderr)
        return 1

    manifest = parse_manifest(manifest_path.read_text(encoding="utf-8"), date)
    print(f"Parsed {len(manifest['items'])} items for {date}")

    if args.json_out:
        args.json_out.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {args.json_out}")

    if args.wrangler:
        sync_with_wrangler(day_dir, date, manifest, args.dry_run)
    print("Done." if not args.dry_run else "Dry-run complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
