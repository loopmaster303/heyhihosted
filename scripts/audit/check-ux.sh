#!/usr/bin/env bash
# check-ux.sh — Lighthouse gegen localhost:3000 (nur wenn Dev-Server läuft)
set -euo pipefail

UX_STATUS="⏭️"
UX_DETAIL=" (Dev-Server nicht aktiv)"
UX_PERF=""
UX_A11Y=""
UX_BEST=""

echo "[ux] Checking if localhost:3000 is reachable..."

if curl -s --max-time 3 "http://localhost:3000" > /dev/null 2>&1; then
  echo "[ux] Dev-Server gefunden. Running Lighthouse..."

  if ! command -v npx &> /dev/null; then
    UX_STATUS="⚠️"
    UX_DETAIL=" (npx nicht gefunden)"
  else
    REPORT_FILE="/tmp/heyhihosted-lighthouse-$(date +%s).json"

    if npx lighthouse \
      "http://localhost:3000/unified" \
      --output=json \
      --output-path="$REPORT_FILE" \
      --chrome-flags="--headless --no-sandbox --disable-gpu" \
      --only-categories=performance,accessibility,best-practices \
      --quiet 2>/dev/null; then

      PERF=$(node -e "const r=JSON.parse(require('fs').readFileSync('$REPORT_FILE')); console.log(Math.round(r.categories.performance.score*100))" 2>/dev/null || echo "?")
      A11Y=$(node -e "const r=JSON.parse(require('fs').readFileSync('$REPORT_FILE')); console.log(Math.round(r.categories.accessibility.score*100))" 2>/dev/null || echo "?")
      BEST=$(node -e "const r=JSON.parse(require('fs').readFileSync('$REPORT_FILE')); console.log(Math.round(r.categories['best-practices'].score*100))" 2>/dev/null || echo "?")

      # Bewertung
      MIN_SCORE=${PERF:-100}
      [ "${A11Y:-100}" -lt "$MIN_SCORE" ] && MIN_SCORE=${A11Y:-100}

      if [ "$MIN_SCORE" -ge 90 ] 2>/dev/null; then
        UX_STATUS="✅"
      elif [ "$MIN_SCORE" -ge 70 ] 2>/dev/null; then
        UX_STATUS="⚠️"
      else
        UX_STATUS="❌"
      fi

      UX_PERF=$PERF
      UX_A11Y=$A11Y
      UX_BEST=$BEST
      UX_DETAIL=""

      rm -f "$REPORT_FILE"
    else
      UX_STATUS="⚠️"
      UX_DETAIL=" (Lighthouse fehlgeschlagen)"
    fi
  fi
fi

cat <<EOF
UX_STATUS=$UX_STATUS
UX_DETAIL=$UX_DETAIL
UX_PERF=$UX_PERF
UX_A11Y=$UX_A11Y
UX_BEST=$UX_BEST
EOF
