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
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/useWindowSize";

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
  const [showHints, setShowHints] = useState(false);
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

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
      const solved = isPuzzleSolved(grid, solutionGrid);
      setPuzzleSolved(solved);
      
      // Auto-load next random puzzle when solved
      if (solved && !puzzleSolved) {
        // Show confetti!
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
        
        setTimeout(() => {
          // Pick random puzzle different from current
          const otherPuzzles = PRESET_PUZZLES.filter(p => p.id !== activePuzzle.id);
          const randomPuzzle = otherPuzzles[Math.floor(Math.random() * otherPuzzles.length)];
          if (randomPuzzle) {
            setSelectedPuzzleId(randomPuzzle.id);
          }
        }, 2000); // Short delay for celebration
      }
    },
    [activePuzzle.id, setPuzzleProgress, solutionGrid, puzzleSolved, setSelectedPuzzleId]
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

  // Secret hint code: Press H-I-N-T
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setKeySequence(prev => {
        const newSeq = [...prev, key].slice(-4); // Keep last 4 keys
        if (newSeq.join('') === 'hint') {
          setShowHints(true);
          setTimeout(() => setShowHints(false), 5000); // Show for 5 seconds
        }
        return newSeq;
      });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Mystery puzzle names (only shown when hint code is active)
  const mysteryNames: Record<string, string> = {
    'mystery-01': 'Eule',
    'mystery-02': 'Kristallkugel',
    'mystery-03': 'Mond',
    'mystery-04': 'Glocke',
    'mystery-05': 'Blitz',
    'mystery-06': 'Zielscheibe',
    'mystery-07': 'Würfel',
    'mystery-08': 'Schmetterling',
    'mystery-09': 'Pilz',
    'mystery-10': 'Gitarre',
    'mystery-11': 'Blume',
    'mystery-12': 'Haus',
    'mystery-13': 'Krone',
    'mystery-14': 'Ballon',
    'mystery-15': 'Fisch',
    'mystery-16': 'Stern',
    'mystery-17': 'Zylinder',
    'mystery-18': 'Kirschblüte',
    'mystery-19': 'Glocke',
    'mystery-20': 'Geschenk',
    'mystery-21': 'Fuchs',
    'mystery-22': 'Pizza-Slice',
    'mystery-23': 'Welle',
    'mystery-24': 'Schlüssel',
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Confetti celebration when puzzle is solved */}
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      
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
            {showHints && mode === "levels" && mysteryNames[activePuzzle.id] && (
              <div className="bg-primary/20 border border-primary/40 rounded-lg p-3 text-center animate-in fade-in-0 slide-in-from-top-2">
                <p className="text-sm font-semibold text-primary">
                  🔍 Geheimer Tipp: <span className="font-bold">{mysteryNames[activePuzzle.id]}</span>
                </p>
              </div>
            )}
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
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePuzzle.id}
                  initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
                  animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex flex-col gap-4"
                >
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
                  <motion.div 
                    className="flex items-center justify-center md:justify-start"
                    animate={puzzleSolved ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
                    transition={{ duration: 0.6 }}
                  >
                    <Badge variant={puzzleSolved ? "default" : "secondary"}>
                      {puzzleSolved
                        ? t("nonogram.status.solved")
                        : t("nonogram.status.keepGoing")}
                    </Badge>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
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
