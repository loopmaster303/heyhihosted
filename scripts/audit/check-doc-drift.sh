#!/usr/bin/env bash
# check-doc-drift.sh — Detect stale endpoint references in active docs
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

DOC_DRIFT_STATUS="✅"
DOC_DRIFT_DETAIL=""
DOC_DRIFT_FINDINGS=""

TARGET_FILES=(
  "README.md"
  "AGENTS.md"
  "CLAUDE.md"
  "GEMINI.md"
  "conductor/product.md"
  "docs/COMPONENT_STATE_BEHAVIOR.md"
  "docs/PRODUCT_IDENTITY.md"
  "docs/architecture-view.md"
  "docs/asset-fallback-service.md"
  "docs/codexgallery.md"
  "docs/streaming-status.md"
)

PATTERN='\/api\/upload\/sign-read|\/api\/upload\/sign|\/api\/upload\/ingest|\/api\/replicate|Replicate|Deepgram|AWS S3|signed S3|model=suno|Suno v5|ai-sdk-pollinations|Vercel AI SDK'

MATCH_FILE="/tmp/heyhi_doc_drift_matches.txt"
: > "$MATCH_FILE"

for file in "${TARGET_FILES[@]}"; do
  if [ -f "$file" ]; then
    grep -nE "$PATTERN" "$file" >> "$MATCH_FILE" || true
  fi
done

MATCH_COUNT=$(wc -l < "$MATCH_FILE" | tr -d ' ')

if [ "$MATCH_COUNT" -gt 0 ]; then
  DOC_DRIFT_STATUS="❌"
  DOC_DRIFT_DETAIL="(stale_endpoint_refs:${MATCH_COUNT})"
  DOC_DRIFT_FINDINGS=$(head -n 5 "$MATCH_FILE" | tr '\n' ';' | sed 's/;*$//')
fi

cat <<EOF
DOC_DRIFT_STATUS=$DOC_DRIFT_STATUS
DOC_DRIFT_DETAIL=$DOC_DRIFT_DETAIL
DOC_DRIFT_FINDINGS=$DOC_DRIFT_FINDINGS
EOF
