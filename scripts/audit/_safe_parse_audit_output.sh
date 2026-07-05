#!/usr/bin/env bash
# _safe_parse_audit_output.sh — safely ingest KEY=value lines from stdin
# Usage: set _SAFE_ALLOWED_KEYS="KEY1 KEY2 ..." then source this file
# Only plain KEY=value, KEY='value' (single-quoted), and KEY="value"
# (simple double-quoted) assignments are accepted.
# Shell metacharacters are not executed because values are assigned via printf -v.

: "${_SAFE_ALLOWED_KEYS:?allowed keys must be set}"

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" ]] && continue
  [[ "$line" =~ ^[[:space:]]*# ]] && continue

  if [[ "$line" =~ ^([A-Z_][A-Z0-9_]*)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"

    [[ " $_SAFE_ALLOWED_KEYS " == *" $key "* ]] || continue

    if [[ "$value" == \'*\' ]]; then
      value="${value#\'}"
      value="${value%\'}"
      [[ "$value" == *\'* ]] && continue
    elif [[ "$value" == \"*\" ]]; then
      value="${value#\"}"
      value="${value%\"}"
      # Conservative: reject any embedded double quote (no escape handling).
      [[ "$value" == *\"* ]] && continue
    fi

    printf -v "$key" '%s' "$value"
  fi
done

unset key value
unset _SAFE_ALLOWED_KEYS 2>/dev/null || true
