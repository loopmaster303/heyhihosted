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

  // Calculate responsive cell size based on viewport
  const getCellSize = useCallback(() => {
    if (typeof window === 'undefined') return 40;
    const viewportWidth = window.innerWidth;
    const maxGridWidth = Math.min(viewportWidth - 120, 600); // Account for hints + padding
    const cellSize = Math.floor(maxGridWidth / cols);
    // Min 28px on mobile, max 48px
    return Math.max(28, Math.min(48, cellSize));
  }, [cols]);

  const [cellSize, setCellSize] = useState(getCellSize);

  useEffect(() => {
    const handleResize = () => setCellSize(getCellSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getCellSize]);

  return (
    <div className="flex flex-col gap-6 items-center w-full">
      <div className="flex flex-col gap-4 w-full">
        <div className="flex justify-between items-center px-2">
          {instructionsLabel ? (
            <div className="font-code text-xs sm:text-sm text-muted-foreground">
              {instructionsLabel}
            </div>
          ) : null}
          <Button variant="outline" size="sm" onClick={handleReset}>
            {resetLabel || "reset"}
          </Button>
        </div>
        
        {/* Scrollable container for large grids */}
        <div className="overflow-x-auto overflow-y-hidden w-full">
          <div className="flex flex-row items-start gap-2 mx-auto w-fit">
            {/* Row hints */}
            <div className="flex flex-col flex-shrink-0">
              <div style={{ height: `${cellSize}px` }} />
              <div className="grid gap-1">
                {derivedRowHints.map((hint, index) => (
                  <div
                    key={`row-hint-${index}`}
                    style={{ height: `${cellSize}px` }}
                    className="flex items-center justify-end pr-2 text-[10px] sm:text-xs font-mono text-muted-foreground min-w-[40px]"
                  >
                    {hint}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Grid + Column hints */}
            <div className="flex flex-col flex-shrink-0">
              {/* Column hints */}
              <div className="grid grid-flow-col auto-cols-max gap-1 mb-1">
                {derivedColumnHints.map((hint, index) => (
                  <div
                    key={`col-hint-${index}`}
                    style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                    className="flex items-end justify-center pb-1 text-[10px] sm:text-xs font-mono text-muted-foreground"
                  >
                    {hint}
                  </div>
                ))}
              </div>
              
              {/* Main grid */}
              <div 
                className="grid gap-1" 
                style={{ 
                  gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                }}
              >
                {grid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    // Thicker borders every 5 cells for better readability (complete lines)
                    const thickTop = rowIndex % 5 === 0;
                    const thickLeft = colIndex % 5 === 0;
                    const thickBottom = (rowIndex + 1) % 5 === 0 || rowIndex === rows - 1;
                    const thickRight = (colIndex + 1) % 5 === 0 || colIndex === cols - 1;
                    
                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        type="button"
                        aria-label={`toggle cell ${rowIndex + 1}, ${colIndex + 1}`}
                        onClick={() => handleToggleCell(rowIndex, colIndex)}
                        style={{ 
                          width: `${cellSize}px`, 
                          height: `${cellSize}px`,
                        }}
                        className={cn(
                          "border border-border flex items-center justify-center transition-colors select-none touch-manipulation active:scale-95",
                          cell === "empty" && "bg-background hover:bg-muted/40 active:bg-muted/60",
                          cell === "filled" && "bg-foreground text-background",
                          cell === "marked" && "bg-muted text-muted-foreground",
                          thickTop && "border-t-2 border-t-foreground/40",
                          thickLeft && "border-l-2 border-l-foreground/40",
                          thickBottom && "border-b-2 border-b-foreground/40",
                          thickRight && "border-r-2 border-r-foreground/40"
                        )}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NonogramGrid;
