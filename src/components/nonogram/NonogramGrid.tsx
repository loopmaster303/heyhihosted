"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CellState = "empty" | "filled" | "marked";

interface NonogramGridProps {
  rows: number;
  cols: number;
  initialState: CellState[][];
  onGridChange: (grid: CellState[][]) => void;
  onReset?: () => void;
  instructionsLabel: string;
  resetLabel: string;
  emptyHintPlaceholder: string;
  rowHints?: string[];
  columnHints?: string[];
}

const NonogramGrid: React.FC<NonogramGridProps> = ({
  rows,
  cols,
  initialState,
  onGridChange,
  onReset,
  instructionsLabel,
  resetLabel,
  emptyHintPlaceholder,
  rowHints,
  columnHints,
}) => {
  const [grid, setGrid] = useState<CellState[][]>(initialState);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [lastAction, setLastAction] = useState<CellState | null>(null);

  const handleCellClick = useCallback(
    (row: number, col: number, event: React.MouseEvent) => {
      event.preventDefault();
      
      const newGrid = [...grid];
      const currentCell = newGrid[row][col];
      
      let newState: CellState;
      if (event.button === 0) {
        // Left click: cycle through empty -> filled -> marked -> empty
        if (currentCell === "empty") newState = "filled";
        else if (currentCell === "filled") newState = "marked";
        else newState = "empty";
      } else if (event.button === 2) {
        // Right click: cycle through empty -> marked -> filled -> empty
        if (currentCell === "empty") newState = "marked";
        else if (currentCell === "marked") newState = "filled";
        else newState = "empty";
      } else {
        return;
      }
      
      newGrid[row][col] = newState;
      setGrid(newGrid);
      onGridChange(newGrid);
      setLastAction(newState);
    },
    [grid, onGridChange]
  );

  const handleCellMouseEnter = useCallback(
    (row: number, col: number) => {
      if (!isMouseDown || lastAction === null) return;
      
      const newGrid = [...grid];
      newGrid[row][col] = lastAction;
      setGrid(newGrid);
      onGridChange(newGrid);
    },
    [grid, isMouseDown, lastAction, onGridChange]
  );

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    setIsMouseDown(true);
    event.preventDefault();
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    setLastAction(null);
  }, []);

  const handleReset = useCallback(() => {
    const emptyGrid = Array(rows).fill(null).map(() => 
      Array(cols).fill("empty" as CellState)
    );
    setGrid(emptyGrid);
    onGridChange(emptyGrid);
    onReset?.();
  }, [rows, cols, onGridChange, onReset]);

  const cellSize = useMemo(() => {
    const maxSize = 25;
    const minSize = 15;
    
    // Safe fallback for SSR
    if (typeof window === 'undefined') {
      return Math.min(maxSize, Math.max(minSize, Math.floor(600 / Math.max(rows, cols))));
    }
    
    const availableWidth = Math.min(800, window.innerWidth - 200);
    const availableHeight = Math.min(600, window.innerHeight - 300);
    
    const widthBasedSize = Math.floor(availableWidth / (cols + (rowHints ? 1 : 0)));
    const heightBasedSize = Math.floor(availableHeight / (rows + (columnHints ? 1 : 0)));
    
    return Math.max(minSize, Math.min(maxSize, Math.min(widthBasedSize, heightBasedSize)));
  }, [rows, cols, rowHints, columnHints]);

  const gridStyle = useMemo(() => ({
    gridTemplateColumns: `${rowHints ? `${cellSize}px ` : ''}repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `${columnHints ? `${cellSize}px ` : ''}repeat(${rows}, ${cellSize}px)`,
  }), [rows, cols, cellSize, rowHints, columnHints]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{instructionsLabel}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            {resetLabel}
          </Button>
        </div>
      </div>
      
      <div className="flex justify-center">
        <div 
          className="grid gap-px bg-border rounded-lg p-2"
          style={gridStyle}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Column hints */}
          {columnHints && (
            <>
              {/* Empty corner cell */}
              <div className="bg-background" />
              {/* Column hint cells */}
              {columnHints.map((hint, colIndex) => (
                <div
                  key={`col-hint-${colIndex}`}
                  className="bg-muted/50 flex items-center justify-center text-xs font-mono text-muted-foreground border border-border rounded-sm"
                  style={{ width: cellSize, height: cellSize }}
                >
                  {hint}
                </div>
              ))}
            </>
          )}
          
          {/* Grid cells */}
          {grid.map((row, rowIndex) => (
            <React.Fragment key={`row-${rowIndex}`}>
              {/* Row hint */}
              {rowHints && (
                <div
                  className="bg-muted/50 flex items-center justify-center text-xs font-mono text-muted-foreground border border-border rounded-sm"
                  style={{ width: cellSize, height: cellSize }}
                >
                  {rowHints[rowIndex]}
                </div>
              )}
              
              {/* Row cells */}
              {row.map((cell, colIndex) => (
                <button
                  key={`cell-${rowIndex}-${colIndex}`}
                  className={cn(
                    "border border-border rounded-sm transition-colors hover:bg-muted/20",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                    cell === "filled" && "bg-primary text-primary-foreground",
                    cell === "marked" && "bg-muted text-muted-foreground",
                    cell === "empty" && "bg-background hover:bg-muted/10"
                  )}
                  style={{ width: cellSize, height: cellSize }}
                  onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleCellClick(rowIndex, colIndex, e);
                  }}
                  onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                >
                  {cell === "marked" && "✕"}
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export const createEmptyGrid = (rows: number, cols: number): CellState[][] =>
  Array(rows).fill(null).map(() => Array(cols).fill("empty" as CellState));

export default NonogramGrid;