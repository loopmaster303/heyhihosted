import type { CellState } from "./NonogramGrid";

const FILLED_CHAR = "#";
const FILLED_SERIALIZED = "F";
const MARKED_SERIALIZED = "M";
const EMPTY_SERIALIZED = ".";
const ROW_SEPARATOR = "|";

export const solutionToBooleanGrid = (solution: string[]): boolean[][] =>
  solution.map(row =>
    row.split("").map(char => char === FILLED_CHAR)
  );

export const cellStateGridToBoolean = (grid: CellState[][]): boolean[][] =>
  grid.map(row => row.map(cell => cell === "filled"));

export const computeRowHintsFromBoolean = (grid: boolean[][], placeholder: string): string[] =>
  grid.map(row => {
    let currentRun = 0;
    const runs: number[] = [];

    row.forEach(cell => {
      if (cell) {
        currentRun += 1;
      } else if (currentRun > 0) {
        runs.push(currentRun);
        currentRun = 0;
      }
    });

    if (currentRun > 0) {
      runs.push(currentRun);
    }

    return runs.length > 0 ? runs.join(" ") : placeholder;
  });

export const computeColumnHintsFromBoolean = (grid: boolean[][], placeholder: string): string[] => {
  if (grid.length === 0) {
    return [];
  }

  const rows = grid.length;
  const cols = grid[0].length;

  return Array.from({ length: cols }, (_, colIndex) => {
    let currentRun = 0;
    const runs: number[] = [];

    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      if (grid[rowIndex][colIndex]) {
        currentRun += 1;
      } else if (currentRun > 0) {
        runs.push(currentRun);
        currentRun = 0;
      }
    }

    if (currentRun > 0) {
      runs.push(currentRun);
    }

    return runs.length > 0 ? runs.join(" ") : placeholder;
  });
};

export const computeHintsFromBooleanGrid = (grid: boolean[][], placeholder: string) => ({
  rowHints: computeRowHintsFromBoolean(grid, placeholder),
  columnHints: computeColumnHintsFromBoolean(grid, placeholder),
});

export const computeHintsFromCellStateGrid = (grid: CellState[][], placeholder: string) =>
  computeHintsFromBooleanGrid(cellStateGridToBoolean(grid), placeholder);

export const serializeGrid = (grid: CellState[][]): string =>
  grid
    .map(row =>
      row
        .map(cell => {
          if (cell === "filled") return FILLED_SERIALIZED;
          if (cell === "marked") return MARKED_SERIALIZED;
          return EMPTY_SERIALIZED;
        })
        .join("")
    )
    .join(ROW_SEPARATOR);

export const deserializeGrid = (serialized: string | undefined | null, rows: number, cols: number): CellState[][] | null => {
  if (!serialized) {
    return null;
  }

  const rowStrings = serialized.split(ROW_SEPARATOR);
  if (rowStrings.length !== rows) {
    return null;
  }

  const grid: CellState[][] = [];

  for (const rowString of rowStrings) {
    if (rowString.length !== cols) {
      return null;
    }
    const row: CellState[] = rowString.split("").map(char => {
      if (char === FILLED_SERIALIZED) return "filled" as CellState;
      if (char === MARKED_SERIALIZED) return "marked" as CellState;
      return "empty" as CellState;
    });
    grid.push(row);
  }

  return grid;
};

export const isPuzzleSolved = (grid: CellState[][], solution: boolean[][]): boolean => {
  if (grid.length !== solution.length || grid[0]?.length !== solution[0]?.length) {
    return false;
  }

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const solutionFilled = solution[row][col];
      const cell = grid[row][col];
      if (solutionFilled && cell !== "filled") {
        return false;
      }
      if (!solutionFilled && cell === "filled") {
        return false;
      }
    }
  }

  return true;
};

export const hasAnyFilledCell = (grid: CellState[][]): boolean =>
  grid.some(row => row.some(cell => cell === "filled"));
