#!/bin/bash
# Warnt, wenn der uncommittete Arbeitsbaum wieder anwaechst.
#
# Warum es diesen Wächter gibt: Im August 2026 lagen 99 Dateien aus mehreren
# unabgeschlossenen Sitzungen uncommitted im Baum. Niemand wusste mehr, welche
# Änderung zu welcher Absicht gehörte; das Aufräumen kostete eine ganze Sitzung.
#
# Zwei Signale, unabhängig voneinander:
#   ANZAHL — viele offene Dateien auf einmal
#   ALTER  — eine offene Änderung, die aelter ist als die heutige Sitzung.
#            Das ist das eigentliche Warnzeichen: sie stammt aus einer
#            Sitzung, die nie zu Ende gefuehrt wurde.
#
# Warnt nur. Blockiert nie. Bricht nie eine Sitzung ab.
set -uo pipefail

MAX_FILES=${WORKTREE_GUARD_MAX_FILES:-25}
MAX_AGE_DAYS=${WORKTREE_GUARD_MAX_AGE_DAYS:-2}

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

FILES=$(git status --porcelain -uall 2>/dev/null | sed 's/^...//' | sed 's/.* -> //')
COUNT=$(printf '%s' "$FILES" | grep -c . || true)
[ "$COUNT" -eq 0 ] && exit 0

# Aeltestes offenes File finden (mtime, plattformneutral genug fuer macOS/Linux)
OLDEST_DAYS=0; OLDEST_FILE=""
NOW=$(date +%s)
while IFS= read -r f; do
  [ -z "$f" ] || [ ! -f "$f" ] && continue
  MT=$(stat -f %m "$f" 2>/dev/null || stat -c %Y "$f" 2>/dev/null) || continue
  D=$(( (NOW - MT) / 86400 ))
  if [ "$D" -gt "$OLDEST_DAYS" ]; then OLDEST_DAYS=$D; OLDEST_FILE=$f; fi
done <<< "$FILES"

WARN=""
if [ "$COUNT" -gt "$MAX_FILES" ]; then
  WARN="${COUNT} Dateien liegen uncommitted im Arbeitsbaum (Schwelle ${MAX_FILES})."
fi
if [ "$OLDEST_DAYS" -gt "$MAX_AGE_DAYS" ]; then
  AGE_MSG="Die aelteste offene Aenderung ist ${OLDEST_DAYS} Tage alt: ${OLDEST_FILE} — sie stammt aus einer frueheren Sitzung."
  WARN="${WARN:+$WARN }$AGE_MSG"
fi
[ -z "$WARN" ] && exit 0

printf '{"systemMessage":"⚠ Arbeitsbaum: %s Vor neuer Arbeit sortieren und in thematische Commits ueberfuehren — nicht als Block committen. Vorbild: docs/HANDOFF-2026-08-28-phase-0.md"}\n' "$WARN"
