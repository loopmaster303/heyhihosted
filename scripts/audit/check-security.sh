#!/usr/bin/env bash
# check-security.sh — npm audit + env leak check
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

SECURITY_STATUS="✅"
SECURITY_DETAIL=""
ENV_STATUS="✅"
ENV_DETAIL=""

echo "[security] Running npm audit..."
if ! OUTPUT=$(npm audit --json 2>&1); then
  AUDIT_JSON=$(echo "$OUTPUT" | tail -n 1)
  CRITICAL=$(echo "$AUDIT_JSON" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.metadata?.vulnerabilities?.critical||0)" 2>/dev/null || echo "?")
  HIGH=$(echo "$AUDIT_JSON" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.metadata?.vulnerabilities?.high||0)" 2>/dev/null || echo "?")
  if [ "$CRITICAL" != "0" ] && [ "$CRITICAL" != "?" ]; then
    SECURITY_STATUS="🚨"
    SECURITY_DETAIL=" ($CRITICAL Critical, $HIGH High)"
  elif [ "$HIGH" != "0" ] && [ "$HIGH" != "?" ]; then
    SECURITY_STATUS="⚠️"
    SECURITY_DETAIL=" ($HIGH High)"
  fi
else
  SECURITY_DETAIL=" (0 Vulnerabilities)"
fi

echo "[security] Checking for exposed secrets in source..."
# Check for hardcoded API keys / tokens in src/ (not node_modules, not .env)
LEAKS=""
if grep -rn "sk-\|AIza\|AKIA\|ghp_\|xoxb-" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v "placeholder\|example\|your_" | head -5 > /tmp/leak_check.txt 2>/dev/null; then
  LEAKS=$(wc -l < /tmp/leak_check.txt | tr -d ' ')
  if [ "$LEAKS" -gt 0 ]; then
    ENV_STATUS="🚨"
    ENV_DETAIL=" ($LEAKS potenzielle Leaks in src/)"
  fi
fi

# Check .env.local is in .gitignore
if [ -f ".env.local" ] && ! grep -q ".env.local" .gitignore 2>/dev/null; then
  ENV_STATUS="⚠️"
  ENV_DETAIL="$ENV_DETAIL (.env.local nicht in .gitignore!)"
fi

cat <<EOF
SECURITY_STATUS=$SECURITY_STATUS
SECURITY_DETAIL=$SECURITY_DETAIL
ENV_STATUS=$ENV_STATUS
ENV_DETAIL=$ENV_DETAIL
EOF
