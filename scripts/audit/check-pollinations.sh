#!/usr/bin/env bash
# check-pollinations.sh — Vergleicht Pollinations API-Modelle mit lokaler Config
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

POLL_STATUS="✅"
POLL_DETAIL=""
POLL_NEW_MODELS=""
POLL_API_STATUS="✅"

echo "[pollinations] Checking Pollinations models API..."

# Holt verfügbare Modelle von Pollinations (aktuelle API)
IMAGE_API_RESPONSE=$(curl -s --max-time 10 "https://gen.pollinations.ai/image/models" 2>/dev/null || echo "")
TEXT_API_RESPONSE=$(curl -s --max-time 10 "https://gen.pollinations.ai/v1/models" 2>/dev/null || echo "")

if [ -z "$IMAGE_API_RESPONSE" ]; then
  POLL_API_STATUS="❌"
  POLL_DETAIL=" (API nicht erreichbar)"
else
  # Extrahiere Modell-IDs aus der Pollinations API
  API_MODELS=$(echo "$IMAGE_API_RESPONSE" | node -e "
    const raw = require('fs').readFileSync('/dev/stdin','utf8');
    try {
      const data = JSON.parse(raw);
      const models = Array.isArray(data) ? data : (data.models || data.data || []);
      const ids = models.map(m => (typeof m === 'string' ? m : m.name || m.id || '')).filter(Boolean);
      console.log(ids.join('\n'));
    } catch(e) { console.log(''); }
  " 2>/dev/null || echo "")

  # Extrahiere lokale Modell-IDs aus unified-image-models.ts
  LOCAL_MODELS=$(grep -o "id: '[^']*'" src/config/unified-image-models.ts | sed "s/id: '//;s/'//" 2>/dev/null || echo "")

  # Finde neue Modelle (in API aber nicht lokal)
  NEW_MODELS=""
  while IFS= read -r model; do
    [ -z "$model" ] && continue
    if ! echo "$LOCAL_MODELS" | grep -qx "$model"; then
      NEW_MODELS="$NEW_MODELS $model"
    fi
  done <<< "$API_MODELS"

  NEW_MODELS=$(echo "$NEW_MODELS" | xargs) # trim
  if [ -n "$NEW_MODELS" ]; then
    POLL_STATUS="⚠️"
    POLL_NEW_MODELS="$NEW_MODELS"
    COUNT=$(echo "$NEW_MODELS" | wc -w | tr -d ' ')
    POLL_DETAIL=" ($COUNT neue Modelle in API nicht in Config)"
  fi
fi

# Prüfe Text-API-Verfügbarkeit
if [ -z "$TEXT_API_RESPONSE" ]; then
  POLL_API_STATUS="⚠️"
  POLL_DETAIL="$POLL_DETAIL (gen/v1-models nicht erreichbar)"
fi

cat <<EOF
POLL_API_STATUS=$POLL_API_STATUS
POLL_STATUS=$POLL_STATUS
POLL_DETAIL=$POLL_DETAIL
POLL_NEW_MODELS=$POLL_NEW_MODELS
EOF
