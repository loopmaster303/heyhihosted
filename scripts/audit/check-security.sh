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
if ! OUTPUT=$(npm audit --json); then
  CRITICAL=$(printf '%s' "$OUTPUT" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.metadata?.vulnerabilities?.critical||0)" 2>/dev/null || echo "?")
  HIGH=$(printf '%s' "$OUTPUT" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.metadata?.vulnerabilities?.high||0)" 2>/dev/null || echo "?")
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
# Check for hardcoded API keys / tokens in src/ (not node_modules, not .env).
# Das rohe "sk-" matching auf jedes deutsche Kompositum mit "Task-",
# "Mask-" usf. — der Alarm war damit Dauer-False-Positive und wurde
# ignoriert. Jetzt: Praefix plus Key-Form ([A-Za-z0-9_-]{10,}), damit echte
# Keys getroffen werden, "sk-abc"-Mocks in *.test.* aber nicht.
# Zusaetzlich braucht das Praefix ein Nicht-Word-Zeichen davor: ohne das
# matcht "sk-" jedes deutsche Kompositum ("Task-Richtlinie") und jede
# CSS-Klasse ("mask-fade") — exact die False-Positive-Klasse, die den
# Check entwertete. Echte Keys haben immer eine Grenze vor dem Praefix.
# Gelistet werden nur Datei:Zeile, nie der Match selbst — sonst stuende bei
# einem echten Fund das Secret im Telegram-Report.
LEAK_HITS=$(grep -rnE "(^|[^A-Za-z0-9_-])(sk-[A-Za-z0-9_-]{10,}|AIza[0-9A-Za-z_-]{10,}|AKIA[0-9A-Z]{8,}|ghp_[A-Za-z0-9]{10,}|xoxb-[0-9A-Za-z-]{8,})" src/ \
  --include="*.ts" --include="*.tsx" 2>/dev/null | grep -vE "\.test\.|\.e2e\.|node_modules" | head -20 || true)
if [ -n "$LEAK_HITS" ]; then
  LEAKS=$(printf '%s\n' "$LEAK_HITS" | wc -l | tr -d ' ')
  ENV_STATUS="🚨"
  ENV_DETAIL=" ($LEAKS potenzielle Leaks in src/)"
  LEAK_LOCATIONS=$(printf '%s\n' "$LEAK_HITS" | cut -d: -f1,2 | tr '\n' ';' | sed 's/;$//')
else
  LEAK_LOCATIONS=""
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
LEAK_LOCATIONS=$LEAK_LOCATIONS
EOF
