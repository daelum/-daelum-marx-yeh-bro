#!/usr/bin/env bash
# Thin wrapper — see scripts/sync-ig-queue-to-cf.py
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec python3 "$ROOT/scripts/sync-ig-queue-to-cf.py" "$@"
