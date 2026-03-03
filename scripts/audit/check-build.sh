#!/usr/bin/env bash
# check-build.sh — TypeCheck + Lint + Build
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

TYPECHECK_STATUS="✅"
TYPECHECK_DETAIL=""
LINT_STATUS="✅"
LINT_DETAIL=""
BUILD_STATUS="✅"
BUILD_DETAIL=""

echo "[build] Running typecheck..."
if ! OUTPUT=$(npm run typecheck 2>&1); then
  TYPECHECK_STATUS="❌"
  ERRORS=$(echo "$OUTPUT" | grep -c "error TS" || true)
  TYPECHECK_DETAIL=" ($ERRORS Fehler)"
fi

echo "[build] Running lint..."
if ! OUTPUT=$(npm run lint 2>&1); then
  LINT_STATUS="⚠️"
  WARNINGS=$(echo "$OUTPUT" | grep -c "warning" || true)
  ERRORS=$(echo "$OUTPUT" | grep -c "error" || true)
  LINT_DETAIL=" ($ERRORS Errors, $WARNINGS Warnings)"
fi

cat <<EOF
BUILD_TYPECHECK_STATUS=$TYPECHECK_STATUS
BUILD_TYPECHECK_DETAIL=$TYPECHECK_DETAIL
BUILD_LINT_STATUS=$LINT_STATUS
BUILD_LINT_DETAIL=$LINT_DETAIL
EOF
