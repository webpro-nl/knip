#!/usr/bin/env bash
set -uo pipefail

NAME="${1:?snapshot name required}"
shift
[ "${1:-}" = "--" ] && shift

DIR="${GITHUB_WORKSPACE:-$PWD}/.github/workflows/snapshots"
OUT_DIR="${SNAPSHOT_OUT_DIR:-$DIR}"
SNAP="$DIR/$NAME.txt"
OUT="$(mktemp)"

EXTRA=(--reporter compact --no-exit-code)
if [ "${1:-}" = "npm" ] && [ "${2:-}" = "run" ] && ! printf '%s\n' "$@" | grep -qx -- '--'; then
  EXTRA=(-- "${EXTRA[@]}")
fi

NO_COLOR=1 "$@" "${EXTRA[@]}" >"$OUT" || { echo "::error::knip crashed for $NAME"; cat "$OUT"; exit 1; }

CLEAN="$(mktemp)"
grep -Ev '^(> |$)' "$OUT" >"$CLEAN" || true
OUT="$CLEAN"

if [ "${UPDATE_SNAPSHOTS:-}" = "1" ]; then
  mkdir -p "$OUT_DIR"
  cp "$OUT" "$OUT_DIR/$NAME.txt"
  echo "::notice::Updated $OUT_DIR/$NAME.txt"
  exit 0
fi

[ -f "$SNAP" ] || { echo "::error::No snapshot at $SNAP — run with update_snapshots=true"; cat "$OUT"; exit 1; }
diff -u "$SNAP" "$OUT" || { echo "::error::Snapshot mismatch for $NAME — re-run with update_snapshots=true if expected"; exit 1; }
