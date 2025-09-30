# Offline Nonogram Tool

`python3 scripts/nonogram_tool.py` bietet eine kleine Sammlung von Helfern, um neue Rätsel außerhalb der Web-App vorzubereiten.

## 1. Hinweise aus ASCII-Raster erzeugen

```bash
python3 scripts/nonogram_tool.py from-ascii \
  --name heart \
  "...###...###..." \
  "..#####.#####.." \
  "..." # usw.
```

Ausgabe ist ein JSON-Block mit Zeilen/Spalten-Hinweisen und der Lösungsmatrix. Perfekt, um neue Motive schnell in `puzzles.ts` zu übernehmen oder in eine Datei zu schreiben.

## 2. Puzzle-Validierung / Solver

```bash
python3 scripts/nonogram_tool.py solve \
  --rows "3 3" "5 5" ... \
  --cols "2" "4" ...
```

Der Solver versucht, aus den Hinweisen die Lösung zu rekonstruieren. Falls das Rätsel eindeutig lösbar ist, bekommst du die Matrix zurück; ansonsten endet das Tool mit Exit-Code 1.

## 3. Stapel-Export nach JSON

```bash
python3 scripts/nonogram_tool.py export \
  --output presets.json \
  puzzles/heart.txt puzzles/bear.txt
```

Jedes `.txt` enthält ein ASCII-Raster (`#` = gefüllt, `.` = leer). Optional können auch JSON-Dateien mit `name/rows/cols` gemischt werden. Die Ausgabe lässt sich z. B. in `public/` legen und via Fetch in der App konsumieren.

Weitere Optionen findest du über `python3 scripts/nonogram_tool.py --help`.
