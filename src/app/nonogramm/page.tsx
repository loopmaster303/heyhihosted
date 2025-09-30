"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import NonogramGrid, { createEmptyGrid, type CellState } from "@/components/nonogram/NonogramGrid";
import { PRESET_PUZZLES, getPuzzleById } from "@/components/nonogram/puzzles";
import {
  computeHintsFromBooleanGrid,
  deserializeGrid,
  hasAnyFilledCell,
  isPuzzleSolved,
  serializeGrid,
  solutionToBooleanGrid,
  cellStateGridToBoolean,
} from "@/components/nonogram/utils";
import NewAppHeader from "@/components/page/NewAppHeader";
import type { TileItem } from "@/types";
import useLocalStorageState from "@/hooks/useLocalStorageState";
import { useLanguage } from "@/components/LanguageProvider";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const toolTileItems: TileItem[] = [
  { id: "long language loops", title: "</chat.talk.discuss>", href: "/chat" },
  { id: "nocost imagination", title: "</generate.visuals.lite>", href: "/image-gen/no-cost" },
  { id: "premium imagination", title: "</generate.visuals.raw>", href: "/image-gen/raw" },
  { id: "personalization", title: "</settings.user.preferences>", href: "/settings" },
  { id: "about", title: "</about.system.readme>", href: "/about" },
];

const MODE_OPTIONS = ["levels", "freestyle", "builder"] as const;
type Mode = (typeof MODE_OPTIONS)[number];

const FREESTYLE_SIZE = 15;
const BUILDER_SIZE = 15;

export default function NonogrammPage() {
  const { t } = useLanguage();
  const [userDisplayName] = useLocalStorageState<string>("userDisplayName", "john");
  const [mode, setMode] = useState<Mode>("levels");
  const placeholder = t("nonogram.hintEmpty");

  // ----- Preset levels -----
  const defaultPuzzleId = PRESET_PUZZLES[0]?.id ?? "heart";
  const [selectedPuzzleId, setSelectedPuzzleId] = useLocalStorageState<string>(
    "nonogram-selected",
    defaultPuzzleId
  );
  const [puzzleProgress, setPuzzleProgress] = useLocalStorageState<Record<string, string>>(
    "nonogram-progress",
    {}
  );
  const activePuzzle = useMemo(
    () => getPuzzleById(selectedPuzzleId) ?? PRESET_PUZZLES[0],
    [selectedPuzzleId]
  );
  const solutionGrid = useMemo(
    () => solutionToBooleanGrid(activePuzzle.solution),
    [activePuzzle]
  );
  const puzzleHints = useMemo(
    () => computeHintsFromBooleanGrid(solutionGrid, placeholder),
    [solutionGrid, placeholder]
  );
  const puzzleInitialGrid = useMemo(() => {
    const stored = puzzleProgress[activePuzzle.id];
    return (
      deserializeGrid(stored, activePuzzle.size, activePuzzle.size) ??
      createEmptyGrid(activePuzzle.size, activePuzzle.size)
    );
  }, [activePuzzle, puzzleProgress]);
  const [puzzleSolved, setPuzzleSolved] = useState(() =>
    isPuzzleSolved(puzzleInitialGrid, solutionGrid)
  );
  const handlePuzzleGridChange = useCallback(
    (grid: CellState[][]) => {
      setPuzzleProgress(prev => ({ ...prev, [activePuzzle.id]: serializeGrid(grid) }));
      setPuzzleSolved(isPuzzleSolved(grid, solutionGrid));
    },
    [activePuzzle.id, setPuzzleProgress, solutionGrid]
  );

  // Keep solved badge in sync when switching puzzles or languages
  useEffect(() => {
    setPuzzleSolved(isPuzzleSolved(puzzleInitialGrid, solutionGrid));
  }, [puzzleInitialGrid, solutionGrid]);

  // ----- Freestyle -----
  const [freestyleStored, setFreestyleStored] = useLocalStorageState<string>(
    "nonogram-freestyle",
    ""
  );
  const freestyleInitialGrid = useMemo(
    () =>
      deserializeGrid(freestyleStored, FREESTYLE_SIZE, FREESTYLE_SIZE) ??
      createEmptyGrid(FREESTYLE_SIZE, FREESTYLE_SIZE),
    [freestyleStored]
  );
  const handleFreestyleChange = useCallback(
    (grid: CellState[][]) => {
      setFreestyleStored(serializeGrid(grid));
    },
    [setFreestyleStored]
  );

  // ----- Builder -----
  const [builderStored, setBuilderStored] = useLocalStorageState<string>(
    "nonogram-builder",
    ""
  );
  const builderGrid = useMemo(
    () =>
      deserializeGrid(builderStored, BUILDER_SIZE, BUILDER_SIZE) ??
      createEmptyGrid(BUILDER_SIZE, BUILDER_SIZE),
    [builderStored]
  );
  const handleBuilderGridChange = useCallback(
    (grid: CellState[][]) => {
      setBuilderStored(serializeGrid(grid));
    },
    [setBuilderStored]
  );

  const [customSolution, setCustomSolution] = useState<boolean[][] | null>(null);
  const [customSolveGrid, setCustomSolveGrid] = useState<CellState[][]>(() =>
    createEmptyGrid(BUILDER_SIZE, BUILDER_SIZE)
  );
  const [customSolved, setCustomSolved] = useState(false);

  const handleBuilderReset = useCallback(() => {
    setBuilderStored("");
    setCustomSolution(null);
    setCustomSolveGrid(createEmptyGrid(BUILDER_SIZE, BUILDER_SIZE));
    setCustomSolved(false);
  }, [setBuilderStored]);

  const builderHasContent = useMemo(() => hasAnyFilledCell(builderGrid), [builderGrid]);

  const handleUseBuilderAsPuzzle = useCallback(() => {
    if (!builderHasContent) return;
    const nextSolution = cellStateGridToBoolean(builderGrid);
    setCustomSolution(nextSolution);
    setCustomSolveGrid(createEmptyGrid(BUILDER_SIZE, BUILDER_SIZE));
    setCustomSolved(false);
  }, [builderHasContent, builderGrid]);

  const customHints = useMemo(
    () => (customSolution ? computeHintsFromBooleanGrid(customSolution, placeholder) : null),
    [customSolution, placeholder]
  );

  const handleCustomSolveChange = useCallback(
    (grid: CellState[][]) => {
      setCustomSolveGrid(grid);
      if (customSolution) {
        setCustomSolved(isPuzzleSolved(grid, customSolution));
      }
    },
    [customSolution]
  );

  const handleModeChange = useCallback((nextMode: Mode) => {
    setMode(nextMode);
  }, []);

  const handleSelectPuzzle = useCallback(
    (nextId: string) => {
      setSelectedPuzzleId(nextId);
    },
    [setSelectedPuzzleId]
  );

  const modeOptions = useMemo(
    () => [
      { id: "levels" as Mode, label: t("nonogram.mode.levels") },
      { id: "freestyle" as Mode, label: t("nonogram.mode.freestyle") },
      { id: "builder" as Mode, label: t("nonogram.mode.builder") },
    ],
    [t]
  );

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <NewAppHeader toolTileItems={toolTileItems} userDisplayName={userDisplayName || "john"} />
      <main className="flex flex-col flex-grow items-center pt-20 pb-16 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-5xl flex flex-col gap-10"
        >
          <header className="flex flex-col gap-3 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-code text-white text-glow">
              {t("nonogram.title")}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              {t("nonogram.description")}
            </p>
          </header>

          <section className="bg-black/20 backdrop-blur-md border border-white/5 rounded-xl p-4 sm:p-6 flex flex-col gap-4">
            <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
              {t("nonogram.mode.title")}
            </span>
            <div className="flex flex-wrap gap-2">
              {modeOptions.map(option => (
                <Button
                  key={option.id}
                  variant={mode === option.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleModeChange(option.id)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </section>

          {mode === "levels" && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  {t("nonogram.levels.description")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_PUZZLES.map(puzzle => {
                    const label = t(puzzle.titleKey);
                    const isActive = puzzle.id === activePuzzle.id;
                    return (
                      <Button
                        key={puzzle.id}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSelectPuzzle(puzzle.id)}
                        className="flex items-center gap-2"
                      >
                        {puzzle.emoji ? <span aria-hidden>{puzzle.emoji}</span> : null}
                        <span>{label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <NonogramGrid
                  rows={activePuzzle.size}
                  cols={activePuzzle.size}
                  initialState={puzzleInitialGrid}
                  onGridChange={handlePuzzleGridChange}
                  instructionsLabel={t("nonogram.instructions")}
                  resetLabel={t("nonogram.reset")}
                  emptyHintPlaceholder={placeholder}
                  rowHints={puzzleHints.rowHints}
                  columnHints={puzzleHints.columnHints}
                />
                <div className="flex items-center justify-center md:justify-start">
                  <Badge variant={puzzleSolved ? "default" : "secondary"}>
                    {puzzleSolved
                      ? t("nonogram.status.solved")
                      : t("nonogram.status.keepGoing")}
                  </Badge>
                </div>
              </div>
            </section>
          )}

          {mode === "freestyle" && (
            <section className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground max-w-2xl">
                {t("nonogram.freestyle.description")}
              </p>
              <NonogramGrid
                rows={FREESTYLE_SIZE}
                cols={FREESTYLE_SIZE}
                initialState={freestyleInitialGrid}
                onGridChange={handleFreestyleChange}
                instructionsLabel={t("nonogram.freestyle.instructions")}
                resetLabel={t("nonogram.freestyle.reset")}
                emptyHintPlaceholder={placeholder}
              />
            </section>
          )}

          {mode === "builder" && (
            <section className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground max-w-2xl">
                  {t("nonogram.builder.description")}
                </p>
                <NonogramGrid
                  rows={BUILDER_SIZE}
                  cols={BUILDER_SIZE}
                  initialState={builderGrid}
                  onGridChange={handleBuilderGridChange}
                  onReset={handleBuilderReset}
                  instructionsLabel={t("nonogram.builder.instructions")}
                  resetLabel={t("nonogram.builder.reset")}
                  emptyHintPlaceholder={placeholder}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleUseBuilderAsPuzzle}
                    disabled={!builderHasContent}
                  >
                    {t("nonogram.builder.useAsPuzzle")}
                  </Button>
                  <Button variant="outline" onClick={handleBuilderReset}>
                    {t("nonogram.builder.clearAll")}
                  </Button>
                </div>
              </div>

              {customSolution && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    {t("nonogram.builder.solverHeading")}
                  </p>
                  <NonogramGrid
                    rows={BUILDER_SIZE}
                    cols={BUILDER_SIZE}
                    initialState={customSolveGrid}
                    onGridChange={handleCustomSolveChange}
                    instructionsLabel={t("nonogram.instructions")}
                    resetLabel={t("nonogram.reset")}
                    emptyHintPlaceholder={placeholder}
                    rowHints={customHints?.rowHints}
                    columnHints={customHints?.columnHints}
                  />
                  <div className="flex items-center justify-center md:justify-start">
                    <Badge variant={customSolved ? "default" : "secondary"}>
                      {customSolved
                        ? t("nonogram.status.solved")
                        : t("nonogram.status.keepGoing")}
                    </Badge>
                  </div>
                </div>
              )}
            </section>
          )}
        </motion.div>
      </main>
    </div>
  );
}
