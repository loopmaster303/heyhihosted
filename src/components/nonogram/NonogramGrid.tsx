"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CellState = "empty" | "filled" | "marked";

export interface NonogramGridProps {
  rows?: number;
  cols?: number;
  instructionsLabel?: string;
  resetLabel?: string;
  emptyHintPlaceholder?: string;
  initialState?: CellState[][];
  onGridChange?: (grid: CellState[][]) => void;
  onReset?: () => void;
  rowHints?: string[];
  columnHints?: string[];
}

const toggleState = (state: CellState): CellState => {
  switch (state) {
    case "empty":
      return "filled";
    case "filled":
      return "marked";
    case "marked":
    default:
      return "empty";
  }
};

const cloneGrid = (grid: CellState[][]): CellState[][] =>
  grid.map(row => [...row]);

export const createEmptyGrid = (rows: number, cols: number): CellState[][] =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => "empty" as CellState));

const deriveRowHints = (grid: CellState[][], placeholder: string): string[] => {
  return grid.map(row => {
    let currentRun = 0;
    const runs: number[] = [];

    row.forEach(cell => {
      if (cell === "filled") {
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
};

const deriveColumnHints = (grid: CellState[][], placeholder: string): string[] => {
  if (grid.length === 0) {
    return [];
  }

  const columnCount = grid[0].length;

  return Array.from({ length: columnCount }, (_, colIndex) => {
    let currentRun = 0;
    const runs: number[] = [];

    for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
      const cell = grid[rowIndex][colIndex];
      if (cell === "filled") {
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

const NonogramGrid: React.FC<NonogramGridProps> = ({
  rows = 10,
  cols = 10,
  instructionsLabel,
  resetLabel,
  emptyHintPlaceholder = "0",
  initialState,
  onGridChange,
  onReset,
  rowHints,
  columnHints,
}) => {
  const [grid, setGrid] = useState<CellState[][]>(() => {
    if (initialState && initialState.length === rows && initialState[0]?.length === cols) {
      return cloneGrid(initialState);
    }
    return createEmptyGrid(rows, cols);
  });

  useEffect(() => {
    if (initialState && initialState.length === rows && initialState[0]?.length === cols) {
      setGrid(cloneGrid(initialState));
    } else {
      setGrid(createEmptyGrid(rows, cols));
    }
  }, [initialState, rows, cols]);

  const handleToggleCell = useCallback((rowIndex: number, colIndex: number) => {
    setGrid(prevGrid => {
      const nextGrid = prevGrid.map((row, r) =>
        row.map((cell, c) => {
          if (r === rowIndex && c === colIndex) {
            return toggleState(cell);
          }
          return cell;
        })
      );
      onGridChange?.(nextGrid);
      return nextGrid;
    });
  }, [onGridChange]);

  const handleReset = useCallback(() => {
    const emptyGrid = createEmptyGrid(rows, cols);
    setGrid(emptyGrid);
    onGridChange?.(emptyGrid);
    onReset?.();
  }, [rows, cols, onGridChange, onReset]);

  const derivedRowHints = useMemo(() => {
    if (rowHints) {
      return rowHints;
    }
    return deriveRowHints(grid, emptyHintPlaceholder);
  }, [rowHints, grid, emptyHintPlaceholder]);

  const derivedColumnHints = useMemo(() => {
    if (columnHints) {
      return columnHints;
    }
    return deriveColumnHints(grid, emptyHintPlaceholder);
  }, [columnHints, grid, emptyHintPlaceholder]);

  return (
    <div className="flex flex-col gap-6 items-center">
      <div className="flex flex-col gap-4 w-full max-w-4xl">
        <div className="flex justify-between items-center">
          {instructionsLabel ? (
            <div className="font-code text-xs sm:text-sm text-muted-foreground">
              {instructionsLabel}
            </div>
          ) : null}
          <Button variant="outline" size="sm" onClick={handleReset}>
            {resetLabel || "reset"}
          </Button>
        </div>
        <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4 mx-auto">
          <div className="flex flex-col">
            <div className="h-10" />
            <div className="grid gap-1">
              {derivedRowHints.map((hint, index) => (
                <div
                  key={`row-hint-${index}`}
                  className="h-8 md:h-10 flex items-center justify-end pr-2 text-xs font-mono text-muted-foreground"
                >
                  {hint}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="grid grid-flow-col auto-cols-max gap-1 mb-1">
              {derivedColumnHints.map((hint, index) => (
                <div
                  key={`col-hint-${index}`}
                  className="w-8 md:w-10 h-10 flex items-end justify-center pb-1 text-xs font-mono text-muted-foreground"
                >
                  {hint}
                </div>
              ))}
            </div>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    aria-label={`toggle cell ${rowIndex + 1}, ${colIndex + 1}`}
                    onClick={() => handleToggleCell(rowIndex, colIndex)}
                    className={cn(
                      "w-8 h-8 md:w-10 md:h-10 border border-border flex items-center justify-center transition-colors select-none",
                      cell === "empty" && "bg-background hover:bg-muted/40",
                      cell === "filled" && "bg-foreground text-background",
                      cell === "marked" && "bg-muted text-muted-foreground"
                    )}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NonogramGrid;
