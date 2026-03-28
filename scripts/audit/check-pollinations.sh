#!/usr/bin/env bash
# check-pollinations.sh — Vergleicht Pollinations Text-/Bildmodelle mit lokaler Config
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

POLL_STATUS="✅"
POLL_DETAIL=""
POLL_NEW_MODELS=""
POLL_NEW_TEXT_MODELS=""
POLL_STALE_TEXT_MODELS=""
POLL_STALE_IMAGE_MODELS=""
POLL_MISSING_ENHANCEMENT_MODELS=""
POLL_COMMIT_READY_MODELS=""
POLL_HIDDEN_LOCAL_VISUAL_MODELS=""
POLL_UPSTREAM_TEXT_MODELS=""
POLL_UPSTREAM_VISUAL_MODELS=""
POLL_API_STATUS="✅"

echo "[pollinations] Checking Pollinations text/image model drift..."

ERROR_FILE="$(mktemp)"
if REPORT_OUTPUT=$(node scripts/audit/pollinations-drift-report.js src/config/chat-options.ts src/config/unified-image-models.ts src/config/unified-model-configs.ts src/config/enhancement-prompts.ts 2>"$ERROR_FILE"); then
  eval "$REPORT_OUTPUT"
else
  POLL_API_STATUS="❌"
  POLL_STATUS="⚠️"
  ERROR_MESSAGE="$(tr '\n' ' ' <"$ERROR_FILE" | sed 's/[[:space:]]\\+/ /g' | sed 's/^ //;s/ $//')"
  if [ -n "$ERROR_MESSAGE" ]; then
    POLL_DETAIL=" (Drift-Check fehlgeschlagen: $ERROR_MESSAGE)"
  else
    POLL_DETAIL=" (Drift-Check fehlgeschlagen)"
  fi
fi
rm -f "$ERROR_FILE"

cat <<EOF
POLL_API_STATUS='$POLL_API_STATUS'
POLL_STATUS='$POLL_STATUS'
POLL_DETAIL='$POLL_DETAIL'
POLL_NEW_MODELS='$POLL_NEW_MODELS'
POLL_NEW_TEXT_MODELS='$POLL_NEW_TEXT_MODELS'
POLL_STALE_TEXT_MODELS='$POLL_STALE_TEXT_MODELS'
POLL_STALE_IMAGE_MODELS='$POLL_STALE_IMAGE_MODELS'
POLL_MISSING_ENHANCEMENT_MODELS='$POLL_MISSING_ENHANCEMENT_MODELS'
POLL_COMMIT_READY_MODELS='$POLL_COMMIT_READY_MODELS'
POLL_HIDDEN_LOCAL_VISUAL_MODELS='$POLL_HIDDEN_LOCAL_VISUAL_MODELS'
POLL_UPSTREAM_TEXT_MODELS='$POLL_UPSTREAM_TEXT_MODELS'
POLL_UPSTREAM_VISUAL_MODELS='$POLL_UPSTREAM_VISUAL_MODELS'
EOF
