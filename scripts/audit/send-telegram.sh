#!/usr/bin/env bash
# send-telegram.sh — Sendet Audit-Report an Telegram Bot
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Lade .env
if [ -f "$SCRIPT_DIR/.env" ]; then
  source "$SCRIPT_DIR/.env"
fi

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
  echo "[telegram] ERROR: TELEGRAM_BOT_TOKEN oder TELEGRAM_CHAT_ID nicht gesetzt."
  echo "[telegram] Erstelle $SCRIPT_DIR/.env basierend auf .env.example"
  exit 1
fi

MESSAGE="$1"

curl -s -X POST \
  "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"${TELEGRAM_CHAT_ID}\",
    \"text\": $(echo "$MESSAGE" | node -e "process.stdout.write(JSON.stringify(require('fs').readFileSync('/dev/stdin','utf8')))"),
    \"parse_mode\": \"HTML\"
  }" > /dev/null

echo "[telegram] Nachricht gesendet."
