#!/usr/bin/env bash
# audit.sh — hey.hi Daily Audit Orchestrator
# Ruft alle Checks auf und sendet das Ergebnis an Telegram
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DATE=$(date "+%d.%m.%Y %H:%M")
LOG_FILE="$HOME/.heyhihosted-audit.log"

echo "========================================" | tee -a "$LOG_FILE"
echo "hey.hi Audit — $DATE" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Lade Variablen aus allen Checks
run_check() {
  local name="$1"
  local script="$SCRIPT_DIR/$2"
  echo "" | tee -a "$LOG_FILE"
  echo "--- $name ---" | tee -a "$LOG_FILE"
  bash "$script" 2>&1 | tee -a "$LOG_FILE"
}

# Alle Checks ausführen und Ergebnisse einlesen
eval $(bash "$SCRIPT_DIR/check-build.sh" 2>>"$LOG_FILE")
eval $(bash "$SCRIPT_DIR/check-security.sh" 2>>"$LOG_FILE")
eval $(bash "$SCRIPT_DIR/check-deps.sh" 2>>"$LOG_FILE")
eval $(bash "$SCRIPT_DIR/check-pollinations.sh" 2>>"$LOG_FILE")
eval $(bash "$SCRIPT_DIR/check-ux.sh" 2>>"$LOG_FILE")
eval $(bash "$SCRIPT_DIR/check-doc-drift.sh" 2>>"$LOG_FILE")

echo "" | tee -a "$LOG_FILE"
echo "Alle Checks abgeschlossen. Erstelle Report..." | tee -a "$LOG_FILE"

# UX-Zeile bauen
if [ -n "${UX_PERF:-}" ]; then
  UX_LINE="🎨 <b>UX Lighthouse</b>
  Perf: ${UX_PERF}/100 | A11y: ${UX_A11Y}/100 | Best: ${UX_BEST}/100"
  # Warnung bei schlechter Accessibility
  if [ "${UX_A11Y:-100}" -lt 80 ] 2>/dev/null; then
    UX_LINE="$UX_LINE
  ⚠️ Accessibility unter 80 — WCAG prüfen!"
  fi
else
  UX_LINE="🎨 <b>UX</b> ${UX_STATUS}${UX_DETAIL}"
fi

# Doc-Drift-Zeile bauen
if [ -n "${DOC_DRIFT_FINDINGS:-}" ]; then
  DOC_LINE="🧾 <b>Docs Drift</b> ${DOC_DRIFT_STATUS}${DOC_DRIFT_DETAIL}
  Treffer: <code>${DOC_DRIFT_FINDINGS}</code>"
else
  DOC_LINE="🧾 <b>Docs Drift</b> ${DOC_DRIFT_STATUS}${DOC_DRIFT_DETAIL}"
fi

# Pollinations-Zeile bauen
if [ -n "${POLL_NEW_MODELS:-}" ]; then
  POLL_LINE="🔌 <b>Pollinations</b> ${POLL_STATUS}${POLL_DETAIL}
  Neue Modelle: <code>${POLL_NEW_MODELS}</code>
  → In unified-image-models.ts noch nicht erfasst"
else
  POLL_LINE="🔌 <b>Pollinations API</b> ${POLL_API_STATUS} | Modelle: ${POLL_STATUS}"
fi

# Gesamtstatus ermitteln
ALL_OK=true
for STATUS in "${BUILD_TYPECHECK_STATUS:-✅}" "${BUILD_LINT_STATUS:-✅}" "${SECURITY_STATUS:-✅}" "${ENV_STATUS:-✅}" "${DOC_DRIFT_STATUS:-✅}"; do
  if [[ "$STATUS" == "❌" ]] || [[ "$STATUS" == "🚨" ]]; then
    ALL_OK=false
    break
  fi
done

if $ALL_OK; then
  HEADER="✅ <b>hey.hi Audit — ${DATE}</b>"
else
  HEADER="⚠️ <b>hey.hi Audit — ${DATE}</b> — Handlungsbedarf!"
fi

# Nachricht zusammenbauen
MESSAGE="${HEADER}

🔨 <b>Code</b>
  TypeCheck: ${BUILD_TYPECHECK_STATUS}${BUILD_TYPECHECK_DETAIL}
  Lint: ${BUILD_LINT_STATUS}${BUILD_LINT_DETAIL}

🔐 <b>Security</b>
  npm audit: ${SECURITY_STATUS}${SECURITY_DETAIL}
  Env/Leaks: ${ENV_STATUS}${ENV_DETAIL}

📦 <b>Dependencies</b> ${DEPS_STATUS}${DEPS_DETAIL}

${POLL_LINE}

${UX_LINE}

${DOC_LINE}

<i>Log: ~/.heyhihosted-audit.log</i>"

echo "" | tee -a "$LOG_FILE"
echo "$MESSAGE" | tee -a "$LOG_FILE"

# An Telegram senden
bash "$SCRIPT_DIR/send-telegram.sh" "$MESSAGE"

echo "" | tee -a "$LOG_FILE"
echo "Audit abgeschlossen." | tee -a "$LOG_FILE"
