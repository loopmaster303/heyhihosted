#!/usr/bin/env bash
# check-deps.sh — npm outdated
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

DEPS_STATUS="✅"
DEPS_DETAIL=""

echo "[deps] Checking for outdated packages..."
if OUTPUT=$(npm outdated --json 2>/dev/null); then
  COUNT=$(echo "$OUTPUT" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')||'{}'); console.log(Object.keys(d).length)" 2>/dev/null || echo "0")
  if [ "$COUNT" -gt 10 ]; then
    DEPS_STATUS="⚠️"
    DEPS_DETAIL=" ($COUNT Pakete veraltet)"
  elif [ "$COUNT" -gt 0 ]; then
    DEPS_STATUS="ℹ️"
    DEPS_DETAIL=" ($COUNT Updates verfügbar)"
  fi
else
  # npm outdated exits with code 1 if there are outdated packages
  COUNT=$(npm outdated 2>/dev/null | tail -n +2 | wc -l | tr -d ' ')
  if [ "$COUNT" -gt 10 ]; then
    DEPS_STATUS="⚠️"
    DEPS_DETAIL=" ($COUNT Pakete veraltet)"
  elif [ "$COUNT" -gt 0 ]; then
    DEPS_STATUS="ℹ️"
    DEPS_DETAIL=" ($COUNT Updates verfügbar)"
  fi
fi

cat <<EOF
DEPS_STATUS=$DEPS_STATUS
DEPS_DETAIL=$DEPS_DETAIL
EOF
