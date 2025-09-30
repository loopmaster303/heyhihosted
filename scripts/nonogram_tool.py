"""Nonogram helper tool.

This script lets you:
  1. Convert ASCII grids into row/column hints (so you can store puzzles compactly).
  2. Validate puzzles by solving them via a backtracking solver.
  3. Export puzzles to JSON for use inside the web app.

Usage examples:
  python scripts/nonogram_tool.py from-ascii --name heart --grid "...##" "..###"
  python scripts/nonogram_tool.py solve --rows "3 1" "2" --cols "1" "2"
  python scripts/nonogram_tool.py export --output presets.json puzzles/*.txt

The solver is intentionally lightweight and runs entirely offline.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable, List, Sequence, Tuple

CellValue = int  # 1 = filled, 0 = empty
Hints = List[List[int]]
Grid = List[List[CellValue]]


@dataclass
class Puzzle:
    name: str
    rows: Hints
    cols: Hints
    solution: Grid | None = None

    def to_json(self) -> dict:
        return {
            "name": self.name,
            "rows": self.rows,
            "cols": self.cols,
            "solution": self.solution,
        }


def parse_ascii_grid(lines: Sequence[str]) -> Grid:
    grid: Grid = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        row: List[CellValue] = []
        for ch in stripped:
            if ch in ("#", "1", "X"):
                row.append(1)
            elif ch in (".", "0", "_"):
                row.append(0)
            else:
                raise ValueError(f"Unsupported character '{ch}' in grid")
        grid.append(row)
    if not grid:
        raise ValueError("Grid is empty")
    width = len(grid[0])
    if any(len(row) != width for row in grid):
        raise ValueError("All rows must have equal length")
    return grid


def hints_from_grid(grid: Grid) -> Tuple[Hints, Hints]:
    row_hints: Hints = []
    for row in grid:
        hints: List[int] = []
        run = 0
        for cell in row:
            if cell:
                run += 1
            elif run:
                hints.append(run)
                run = 0
        if run:
            hints.append(run)
        row_hints.append(hints or [0])

    width = len(grid[0])
    col_hints: Hints = []
    for c in range(width):
        hints: List[int] = []
        run = 0
        for row in grid:
            if row[c]:
                run += 1
            elif run:
                hints.append(run)
                run = 0
        if run:
            hints.append(run)
        col_hints.append(hints or [0])
    return row_hints, col_hints


def parse_hint_line(line: str) -> List[int]:
    line = line.strip()
    if not line:
        return [0]
    if line in {"0", "-"}:
        return [0]
    return [int(token) for token in line.replace(",", " ").split()]


def generate_line_options(length: int, hints: Sequence[int]) -> List[List[CellValue]]:
    if hints == [0]:
        return [[0] * length]

    options: List[List[CellValue]] = []

    def backtrack(index: int, hint_idx: int, current: List[CellValue]):
        if hint_idx == len(hints):
            remaining = length - len(current)
            if remaining >= 0:
                options.append(current + [0] * remaining)
            return

        block = hints[hint_idx]
        min_required = block + (1 if hint_idx < len(hints) - 1 else 0)
        max_start = length - (sum(hints[hint_idx:]) + (len(hints) - hint_idx - 1))
        pos = len(current)
        while pos <= max_start:
            prefix = current + [0] * (pos - len(current))
            block_cells = [1] * block
            postfix = []
            if len(prefix) + block < length:
                postfix = [0]
            backtrack(
                pos + block + 1,
                hint_idx + 1,
                prefix + block_cells + postfix,
            )
            pos += 1

    backtrack(0, 0, [])
    return options


def solve_nonogram(rows: Hints, cols: Hints) -> Grid | None:
    height = len(rows)
    width = len(cols)
    row_options = [generate_line_options(width, hints) for hints in rows]

    col_hints = cols
    partial_cols: List[List[CellValue]] = [[0] * height for _ in range(width)]

    def fits(row_idx: int, candidate_row: List[CellValue]) -> bool:
        for c, value in enumerate(candidate_row):
            partial_cols[c][row_idx] = value
            if not column_prefix_valid(partial_cols[c][: row_idx + 1], col_hints[c]):
                partial_cols[c][row_idx] = 0
                return False
        return True

    def column_prefix_valid(prefix: Sequence[CellValue], hints: Sequence[int]) -> bool:
        hint_idx = 0
        run = 0
        for cell in prefix:
            if cell:
                if hint_idx >= len(hints):
                    return False
                run += 1
                if run > hints[hint_idx]:
                    return False
            else:
                if run:
                    if run != hints[hint_idx]:
                        return False
                    hint_idx += 1
                    run = 0
        return True

    solution: Grid = [[0] * width for _ in range(height)]

    def backtrack(row_idx: int) -> bool:
        if row_idx == height:
            return all(column_prefix_valid(col, col_hints[c]) for c, col in enumerate(partial_cols))

        for option in row_options[row_idx]:
            if fits(row_idx, option):
                solution[row_idx] = option[:]
                if backtrack(row_idx + 1):
                    return True
            for c in range(width):
                partial_cols[c][row_idx] = 0
        return False

    if backtrack(0):
        return solution
    return None


def puzzle_from_ascii(name: str, lines: Sequence[str]) -> Puzzle:
    grid = parse_ascii_grid(lines)
    rows, cols = hints_from_grid(grid)
    return Puzzle(name=name, rows=rows, cols=cols, solution=grid)


def export_puzzles(puzzles: Iterable[Puzzle], output: Path) -> None:
    payload = [puzzle.to_json() for puzzle in puzzles]
    output.write_text(json.dumps(payload, indent=2))
    print(f"Wrote {len(payload)} puzzles to {output}")


def load_hint_file(path: Path) -> Puzzle:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return Puzzle(name=data["name"], rows=data["rows"], cols=data["cols"], solution=data.get("solution"))


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Offline helper for nonogram puzzles")
    subparsers = parser.add_subparsers(dest="command", required=True)

    ascii_parser = subparsers.add_parser("from-ascii", help="Generate hints from ASCII grid")
    ascii_parser.add_argument("--name", required=True, help="Puzzle identifier")
    ascii_parser.add_argument("grid", nargs="+", help="Lines of the ASCII grid (# = filled, . = empty)")

    solve_parser = subparsers.add_parser("solve", help="Solve a puzzle from hints")
    solve_parser.add_argument("--name", default="cli", help="Puzzle name")
    solve_parser.add_argument("--rows", nargs="+", required=True, help="Row hints (space or comma separated numbers)")
    solve_parser.add_argument("--cols", nargs="+", required=True, help="Column hints (space or comma separated numbers)")

    export_parser = subparsers.add_parser("export", help="Export puzzles from files to JSON")
    export_parser.add_argument("--output", type=Path, required=True, help="Where to write the JSON file")
    export_parser.add_argument("inputs", nargs="+", help="Input files (JSON with name/rows/cols or plain ASCII .txt)")

    args = parser.parse_args(argv)

    if args.command == "from-ascii":
        puzzle = puzzle_from_ascii(args.name, args.grid)
        print(json.dumps(puzzle.to_json(), indent=2))
        return 0

    if args.command == "solve":
        row_hints = [parse_hint_line(line) for line in args.rows]
        col_hints = [parse_hint_line(line) for line in args.cols]
        puzzle = Puzzle(name=args.name, rows=row_hints, cols=col_hints)
        solution = solve_nonogram(row_hints, col_hints)
        if solution is None:
            print("No solution found", file=sys.stderr)
            return 1
        puzzle.solution = solution
        print(json.dumps(puzzle.to_json(), indent=2))
        return 0

    if args.command == "export":
        puzzles: List[Puzzle] = []
        for raw_path in args.inputs:
            path = Path(raw_path)
            if not path.exists():
                raise FileNotFoundError(path)
            if path.suffix.lower() == ".json":
                puzzles.append(load_hint_file(path))
            else:
                puzzles.append(puzzle_from_ascii(path.stem, path.read_text().splitlines()))
        export_puzzles(puzzles, args.output)
        return 0

    raise ValueError("Unknown command")


if __name__ == "__main__":
    raise SystemExit(main())
