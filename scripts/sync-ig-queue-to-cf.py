#!/usr/bin/env python3
"""Sync a local Instagram tweet-queue day folder → Cloudflare R2 + KV.

Reads Project-store (or any) day folder with manifest.md + PNGs, writes:
  R2 (binding IG_MEDIA):  {date}/{filename}
  KV  (binding IG_QUEUE): day:{date} JSON + index:days

Refill pool (constant supply on Reject):
  python3 scripts/sync-ig-queue-to-cf.py \\
    --day-dir /path/to/pool-batch \\
    --pool [--append] [--dry-run]

  R2: pool/{file}   KV: pool:refill  (+ clears refill:needed when non-empty)

Usage:
  python3 scripts/sync-ig-queue-to-cf.py \\
    --day-dir /path/to/instagram-tweet-queue/2026-11-05 \\
    [--day-key intro-yeh-bro] [--dry-run] [--wrangler]

Day key defaults to the folder name. Calendar folders use `YYYY-MM-DD`;
intro/packs may use a slug like `intro-yeh-bro` via folder name or `--day-key`.

Requires either:
  - `wrangler` CLI authenticated to the Yeh Bro Pages/account, or
  - env CF_ACCOUNT_ID + CF_API_TOKEN + CF_KV_NAMESPACE_ID + CF_R2_BUCKET
    (prefer wrangler path; do not paste tokens into chat/docs)

Bindings: KV `IG_QUEUE` (namespace often named yehbro-ig-queue),
R2 `IG_MEDIA` (bucket often named yehbro-ig-media).

Never prints secret values.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
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
# Match functions/admin/social/_lib/types.ts DAY_KEY_RE
DAY_KEY_RE = re.compile(r"^(?:\d{4}-\d{2}-\d{2}|[a-z][a-z0-9-]{1,62})$")


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


def wrangler_cmd(*args: str) -> list[str]:
    """Prefer a local `wrangler` binary; fall back to `npx wrangler`."""
    binary = shutil.which("wrangler")
    if binary:
        return [binary, *args]
    return ["npx", "--yes", "wrangler", *args]


def run(cmd: list[str], dry_run: bool) -> None:
    print("+", " ".join(cmd))
    if dry_run:
        return
    subprocess.run(cmd, check=True)


def kv_namespace_args() -> list[str]:
    hint = os.environ.get("CF_KV_NAMESPACE_ID", "")
    if hint:
        return ["--namespace-id", hint]
    return ["--binding", "IG_QUEUE"]


def upload_files(
    day_dir: Path,
    items: list[dict],
    *,
    key_for_file,
    dry_run: bool,
) -> None:
    bucket = os.environ.get("CF_R2_BUCKET", "yehbro-ig-media")
    for item in items:
        for file in item["files"]:
            # Pool items may already rewrite files to pool/{name}; source is basename.
            src_name = Path(file).name
            src = day_dir / src_name
            if not src.is_file():
                # Fall back to relative path as written in manifest.
                src = day_dir / file
            if not src.is_file():
                raise SystemExit(f"Missing media file: {src}")
            key = key_for_file(file, src_name)
            run(
                wrangler_cmd(
                    "r2",
                    "object",
                    "put",
                    f"{bucket}/{key}",
                    "--file",
                    str(src),
                    "--content-type",
                    "image/png",
                    "--remote",
                ),
                dry_run,
            )


def kv_put_json(key: str, payload: object, dry_run: bool) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as tmp:
        json.dump(payload, tmp, indent=2)
        tmp_path = tmp.name
    try:
        cmd = wrangler_cmd("kv", "key", "put", key, "--path", tmp_path, "--remote")
        cmd.extend(kv_namespace_args())
        run(cmd, dry_run)
    finally:
        os.unlink(tmp_path)


def kv_get_json(key: str) -> object | None:
    cmd = wrangler_cmd("kv", "key", "get", key, "--remote")
    cmd.extend(kv_namespace_args())
    try:
        out = subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL)
        if not out.strip():
            return None
        return json.loads(out)
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        return None


def kv_delete(key: str, dry_run: bool) -> None:
    cmd = wrangler_cmd("kv", "key", "delete", key, "--remote")
    cmd.extend(kv_namespace_args())
    print("+", " ".join(cmd))
    if dry_run:
        return
    # Non-interactive: older wrangler may prompt; empty stdin skips confirm soft-fail.
    try:
        subprocess.run(cmd, check=True, input="y\n", text=True)
    except subprocess.CalledProcessError:
        # Missing key is fine — pool top-up still succeeded.
        print(f"(note) could not delete {key} — may already be absent", file=sys.stderr)


def sync_with_wrangler(day_dir: Path, date: str, manifest: dict, dry_run: bool) -> None:
    """Upload via `wrangler r2 object put` + `wrangler kv key put`."""
    upload_files(
        day_dir,
        manifest["items"],
        key_for_file=lambda file, _src: f"{date}/{Path(file).name}",
        dry_run=dry_run,
    )
    # Normalize files to basename relative to day prefix.
    for item in manifest["items"]:
        item["files"] = [Path(f).name for f in item["files"]]

    kv_put_json(f"day:{date}", manifest, dry_run)

    index: list[str] = []
    if not dry_run:
        raw = kv_get_json("index:days")
        if isinstance(raw, list):
            index = [str(x) for x in raw]
    if date not in index:
        index.append(date)
    index = sorted(set(index))
    kv_put_json("index:days", index, dry_run)


def sync_pool_with_wrangler(
    day_dir: Path,
    manifest: dict,
    *,
    append: bool,
    dry_run: bool,
) -> None:
    """Push items into KV `pool:refill` + R2 `pool/{file}` for Reject replacements."""
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    prepared: list[dict] = []
    for i, item in enumerate(manifest["items"], start=1):
        new_files: list[str] = []
        for file in item["files"]:
            base = Path(file).name
            # Unique within bucket so day syncs never collide with pool media.
            pool_name = f"{stamp}-{i:02d}-{base}"
            new_files.append(f"pool/{pool_name}")
        clone = dict(item)
        clone["files"] = new_files
        clone["status"] = "pending"
        clone.pop("failReason", None)
        clone.pop("postedAt", None)
        clone.pop("zernioPostId", None)
        clone.pop("igUrl", None)
        # Pool ids are temporary; desk assigns R## / RC## on consume.
        clone["id"] = f"pool-{stamp}-{i:02d}"
        prepared.append(clone)

    bucket = os.environ.get("CF_R2_BUCKET", "yehbro-ig-media")
    for src_item, prep in zip(manifest["items"], prepared):
        for local_name, r2_key in zip(
            [Path(f).name for f in src_item["files"]], prep["files"]
        ):
            src = day_dir / local_name
            if not src.is_file():
                raise SystemExit(f"Missing media file: {src}")
            run(
                wrangler_cmd(
                    "r2",
                    "object",
                    "put",
                    f"{bucket}/{r2_key}",
                    "--file",
                    str(src),
                    "--content-type",
                    "image/png",
                    "--remote",
                ),
                dry_run,
            )

    existing: list[dict] = []
    if append and not dry_run:
        raw = kv_get_json("pool:refill")
        if isinstance(raw, dict) and isinstance(raw.get("items"), list):
            existing = list(raw["items"])
        elif isinstance(raw, list):
            existing = list(raw)

    pool_doc = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "items": (existing + prepared) if append else prepared,
    }
    print(
        f"Pool {'append' if append else 'replace'}: "
        f"{len(prepared)} new → {len(pool_doc['items'])} total"
    )
    kv_put_json("pool:refill", pool_doc, dry_run)
    if pool_doc["items"]:
        # Clear the empty-pool flag so the desk banner resets.
        kv_delete("refill:needed", dry_run)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--day-dir",
        required=True,
        type=Path,
        help="Path to day folder with manifest.md + PNGs (YYYY-MM-DD or slug)",
    )
    ap.add_argument(
        "--day-key",
        type=str,
        default="",
        help="KV/R2 day key override (default: folder name). Slugs like intro-yeh-bro OK.",
    )
    ap.add_argument(
        "--pool",
        action="store_true",
        help="Sync into refill pool (KV pool:refill + R2 pool/) instead of a day queue",
    )
    ap.add_argument(
        "--append",
        action="store_true",
        help="With --pool, append to existing pool items (default: replace pool)",
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

    date = (args.day_key or day_dir.name).strip()
    if not args.pool and not DAY_KEY_RE.fullmatch(date):
        print(
            "day key must be YYYY-MM-DD or a slug like intro-yeh-bro "
            f"(got {date!r})",
            file=sys.stderr,
        )
        return 1

    # For --pool the date field is informational only.
    manifest = parse_manifest(
        manifest_path.read_text(encoding="utf-8"),
        date if DAY_KEY_RE.fullmatch(date) else "pool",
    )
    print(f"Parsed {len(manifest['items'])} items for {'pool' if args.pool else date}")

    if args.json_out:
        args.json_out.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {args.json_out}")

    if args.wrangler:
        if args.pool:
            sync_pool_with_wrangler(
                day_dir, manifest, append=args.append, dry_run=args.dry_run
            )
        else:
            sync_with_wrangler(day_dir, date, manifest, args.dry_run)
    print("Done." if not args.dry_run else "Dry-run complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
