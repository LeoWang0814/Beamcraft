import { useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { Board } from '../render/Board';
import { Hud } from '../ui/Hud';
import { Inspector } from '../ui/Inspector';
import { LevelOverview, type LevelProgressEntry } from '../ui/LevelOverview';
import { Toolbar } from '../ui/Toolbar';
import { TopBar } from '../ui/TopBar';

import {
  createInitialEditorState,
  countPlacementsByType,
  editorReducer,
} from './editorState';
import {
  isInteractiveElement,
  isRedo,
  isUndo,
  resolveToolHotkey,
} from './hotkeys';
import { loadLevels } from '../engine/levelLoader';
import { findPieceAt, getCombinedPieces, pointBlocked, simulateLevel } from '../engine/sim';
import { PIECE_LABELS, type LevelDefinition, type PlaceablePieceType, type Placement } from '../engine/types';

const levels = loadLevels();
const LEVEL_PROGRESS_KEY = 'beamcraft-progress-v2';

function keyOf(x: number, y: number): string {
  return `${x},${y}`;
}

function inventoryLimitFor(levelIndex: number, tool: PlaceablePieceType): number {
  const item = levels[levelIndex].inventory.find((entry) => entry.type === tool);
  return item?.count ?? 0;
}

function levelUsesTimeRules(level: LevelDefinition): boolean {
  if (level.rules.sync || Boolean(level.rules.sequence)) {
    return true;
  }

  return level.fixed.some((piece) => piece.type === 'DELAY' || piece.type === 'GATE' || piece.type === 'MIXER');
}

function loadLevelProgress(): Record<string, LevelProgressEntry> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(LEVEL_PROGRESS_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, LevelProgressEntry>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function App() {
  const [levelIndex, setLevelIndex] = useReducer((_: number, next: number) => next, 0);
  const [editor, dispatch] = useReducer(editorReducer, undefined, createInitialEditorState);
  const [notice, setNotice] = useState<string | null>(null);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [playbackTick, setPlaybackTick] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [isPlaying, setIsPlaying] = useState(() => levelUsesTimeRules(levels[0]));
  const [progress, setProgress] = useState<Record<string, LevelProgressEntry>>(loadLevelProgress);

  const transitionTimerRef = useRef<number | null>(null);
  const selectedToolRef = useRef<PlaceablePieceType | null>(editor.selectedTool);
  const canEditSelectedRef = useRef(false);

  const level = levels[levelIndex];
  const hasTimeRule = levelUsesTimeRules(level);

  useEffect(() => {
    selectedToolRef.current = editor.selectedTool;
  }, [editor.selectedTool]);

  const buildPadSet = useMemo(
    () => new Set((level.buildPads ?? []).map((point) => keyOf(point.x, point.y))),
    [level.buildPads],
  );

  const wallSet = useMemo(() => new Set(level.walls.map((point) => keyOf(point.x, point.y))), [level.walls]);
  const fixedSet = useMemo(() => new Set(level.fixed.map((piece) => keyOf(piece.x, piece.y))), [level.fixed]);

  const usedCounts = useMemo(() => countPlacementsByType(editor.placements), [editor.placements]);

  const placementMap = useMemo(() => {
    const map = new Map<string, Placement>();
    for (const placement of editor.placements) {
      map.set(keyOf(placement.x, placement.y), placement);
    }
    return map;
  }, [editor.placements]);

  const combinedPieces = useMemo(() => getCombinedPieces(level, editor.placements), [editor.placements, level]);

  const isPlaybackMode = hasTimeRule || isPlaying || playbackTick > 0;
  const simTickLimit = isPlaybackMode ? playbackTick : level.rules.maxTicks;

  const sim = useMemo(
    () => simulateLevel(level, editor.placements, { tickLimit: simTickLimit }),
    [editor.placements, level, simTickLimit],
  );

  const displayTick = isPlaybackMode ? playbackTick : sim.stats.elapsedTicks;

  const selectedPiece = editor.selectedCell
    ? findPieceAt(combinedPieces, editor.selectedCell.x, editor.selectedCell.y)
    : undefined;

  const canEditSelected = Boolean(selectedPiece && !selectedPiece.fixed);

  useEffect(() => {
    canEditSelectedRef.current = canEditSelected;
  }, [canEditSelected]);

  const placeableCells = useMemo(() => {
    const result = new Set<string>();
    if (!editor.selectedTool) {
      return result;
    }

    const limit = inventoryLimitFor(levelIndex, editor.selectedTool);
    const used = usedCounts[editor.selectedTool];

    for (let y = 0; y < level.grid.h; y += 1) {
      for (let x = 0; x < level.grid.w; x += 1) {
        const cellKey = keyOf(x, y);

        if (wallSet.has(cellKey) || fixedSet.has(cellKey)) {
          continue;
        }

        const existing = placementMap.get(cellKey);

        if (buildPadSet.size > 0 && !buildPadSet.has(cellKey) && !existing) {
          continue;
        }

        if (existing?.type === editor.selectedTool) {
          result.add(cellKey);
          continue;
        }

        if (used < limit) {
          result.add(cellKey);
        }
      }
    }

    return result;
  }, [
    buildPadSet,
    editor.selectedTool,
    fixedSet,
    level.grid.h,
    level.grid.w,
    levelIndex,
    placementMap,
    usedCounts,
    wallSet,
  ]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const id = window.setTimeout(() => setNotice(null), 1800);
    return () => window.clearTimeout(id);
  }, [notice]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const id = window.setInterval(() => {
      setPlaybackTick((prev) => {
        if (prev >= level.rules.maxTicks) {
          return prev;
        }
        return Math.min(level.rules.maxTicks, prev + playbackSpeed);
      });
    }, 240);

    return () => window.clearInterval(id);
  }, [isPlaying, level.rules.maxTicks, playbackSpeed]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const reachedEnd = playbackTick >= level.rules.maxTicks;
    const timelineDoneAtCurrent = sim.timelineDone && playbackTick >= sim.stats.elapsedTicks;
    if (reachedEnd || timelineDoneAtCurrent) {
      queueMicrotask(() => setIsPlaying(false));
    }
  }, [isPlaying, level.rules.maxTicks, playbackTick, sim.stats.elapsedTicks, sim.timelineDone]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveElement(event.target)) {
        return;
      }

      const input = {
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      };

      if (isUndo(input)) {
        event.preventDefault();
        dispatch({ type: 'UNDO' });
        return;
      }

      if (isRedo(input)) {
        event.preventDefault();
        dispatch({ type: 'REDO' });
        return;
      }

      if (!event.ctrlKey && !event.metaKey) {
        const tool = resolveToolHotkey(input);
        if (tool) {
          event.preventDefault();
          const nextTool = selectedToolRef.current === tool ? null : tool;
          dispatch({ type: 'SET_TOOL', tool: nextTool });
          setNotice(nextTool ? `工具切换：${PIECE_LABELS[nextTool]}` : '已取消工具选择');
          return;
        }
      }

      const key = event.key.toLowerCase();

      if (key === 'r') {
        event.preventDefault();
        if (!canEditSelectedRef.current) {
          setNotice('请选择一个可编辑元件后再旋转。');
          return;
        }
        dispatch({ type: 'ROTATE_SELECTED', steps: event.shiftKey ? -1 : 1 });
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        if (!canEditSelectedRef.current) {
          setNotice('固定元件不可删除。');
          return;
        }
        dispatch({ type: 'DELETE_SELECTED' });
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  useEffect(() => {
    if (!sim.victory) {
      return;
    }

    const solveTick = sim.stats.solveTick ?? sim.stats.elapsedTicks;
    const placedCount = editor.placements.length;

    queueMicrotask(() => {
      setProgress((prev) => {
        const existing = prev[level.id];
        const bestPlaced = existing?.bestPlaced === undefined ? placedCount : Math.min(existing.bestPlaced, placedCount);
        const bestTicks = existing?.bestTicks === undefined ? solveTick : Math.min(existing.bestTicks, solveTick);

        if (existing?.completed && existing.bestPlaced === bestPlaced && existing.bestTicks === bestTicks) {
          return prev;
        }

        return {
          ...prev,
          [level.id]: {
            completed: true,
            bestPlaced,
            bestTicks,
          },
        };
      });
    });
  }, [editor.placements.length, level.id, sim.stats.elapsedTicks, sim.stats.solveTick, sim.victory]);

  useEffect(() => {
    window.localStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const resetPlayback = (nextLevel: LevelDefinition): void => {
    setPlaybackTick(0);
    setPlaybackSpeed(1);
    setIsPlaying(levelUsesTimeRules(nextLevel));
  };

  const handleCellClick = (x: number, y: number): void => {
    const cellKey = keyOf(x, y);

    if (pointBlocked(level, x, y)) {
      setNotice('该格是墙体，不能放置。');
      dispatch({ type: 'SELECT_CELL', cell: null });
      return;
    }

    const fixedAtCell = fixedSet.has(cellKey);
    const existingPlayerPiece = placementMap.get(cellKey);

    if (editor.selectedTool) {
      if (fixedAtCell) {
        setNotice('固定元件不可覆盖。');
        dispatch({ type: 'SELECT_CELL', cell: { x, y } });
        return;
      }

      if (buildPadSet.size > 0 && !buildPadSet.has(cellKey) && !existingPlayerPiece) {
        setNotice('该关仅允许在高亮构建位放置元件。');
        return;
      }

      const limit = inventoryLimitFor(levelIndex, editor.selectedTool);
      const used = usedCounts[editor.selectedTool];
      const canPlace = existingPlayerPiece?.type === editor.selectedTool || used < limit;

      if (!canPlace) {
        setNotice('该元件库存已用尽。');
        return;
      }

      dispatch({ type: 'PLACE', x, y, pieceType: editor.selectedTool });
      return;
    }

    const piece = findPieceAt(combinedPieces, x, y);
    dispatch({ type: 'SELECT_CELL', cell: piece ? { x, y } : null });
  };

  const solutionCode = `${level.id}|${editor.placements
    .map((placement) => {
      const cfg: string[] = [];
      if (placement.delayTicks) {
        cfg.push(`d${placement.delayTicks}`);
      }
      if (placement.gateOpenTicks) {
        cfg.push(`o${placement.gateOpenTicks}`);
      }
      if (placement.gateCloseTicks) {
        cfg.push(`c${placement.gateCloseTicks}`);
      }
      if (placement.mixerRequireDistinct) {
        cfg.push('md1');
      }
      const extra = cfg.length > 0 ? `:${cfg.join(',')}` : '';
      return `${placement.type}@${placement.x},${placement.y},${placement.dir}${extra}`;
    })
    .join('|')}`;

  const copySolution = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(solutionCode);
      setNotice('解法串已复制。');
    } catch {
      setNotice('复制失败，请手动复制文本。');
    }
  };

  const applyLevelChange = (nextIndex: number): void => {
    if (nextIndex < 0 || nextIndex >= levels.length || nextIndex === levelIndex) {
      return;
    }

    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
    }

    setTransitioning(true);
    transitionTimerRef.current = window.setTimeout(() => {
      setLevelIndex(nextIndex);
      dispatch({ type: 'RESET_LEVEL' });
      setNotice(null);
      setOverviewOpen(false);
      resetPlayback(levels[nextIndex]);
      setTransitioning(false);
      transitionTimerRef.current = null;
    }, 150);
  };

  const handleChangeLevel = (nextIndex: number): void => {
    applyLevelChange(nextIndex);
  };

  const handleReset = (): void => {
    dispatch({ type: 'RESET_LEVEL' });
    setNotice(null);
    resetPlayback(level);
  };

  const handleTogglePlay = (): void => {
    if (!isPlaybackMode) {
      setPlaybackTick(0);
    }

    setIsPlaying((prev) => {
      if (!prev && playbackTick >= level.rules.maxTicks) {
        setPlaybackTick(0);
      }
      return !prev;
    });
  };

  const handleStep = (): void => {
    setIsPlaying(false);
    setPlaybackTick((prev) => {
      const base = isPlaybackMode ? prev : 0;
      return Math.min(level.rules.maxTicks, base + 1);
    });
  };

  return (
    <>
      <div
        className={`app-shell mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-4 px-4 py-5 transition-opacity duration-150 ${
          transitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <TopBar
          levels={levels}
          currentLevelIndex={levelIndex}
          onChangeLevel={handleChangeLevel}
          onPrevLevel={() => applyLevelChange(levelIndex - 1)}
          onNextLevel={() => applyLevelChange(levelIndex + 1)}
          onOpenOverview={() => setOverviewOpen(true)}
          onUndo={() => dispatch({ type: 'UNDO' })}
          onRedo={() => dispatch({ type: 'REDO' })}
          onReset={handleReset}
          canUndo={editor.past.length > 0}
          canRedo={editor.future.length > 0}
          canPrevLevel={levelIndex > 0}
          canNextLevel={levelIndex < levels.length - 1}
          victory={sim.victory}
          tickCount={displayTick}
        />

        <main className="grid flex-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)_340px]">
          <div className="flex min-h-[320px] flex-col gap-4">
            <Toolbar
              inventory={level.inventory}
              usedCounts={usedCounts}
              selectedTool={editor.selectedTool}
              onSelectTool={(tool) => dispatch({ type: 'SET_TOOL', tool })}
            />
            <Inspector
              selectedPiece={selectedPiece}
              onRotateCw={() => dispatch({ type: 'ROTATE_SELECTED', steps: 1 })}
              onRotateCcw={() => dispatch({ type: 'ROTATE_SELECTED', steps: -1 })}
              onDelete={() => dispatch({ type: 'DELETE_SELECTED' })}
              onUpdateConfig={(config) => dispatch({ type: 'UPDATE_SELECTED_CONFIG', config })}
              canRotate={canEditSelected}
              canDelete={canEditSelected}
              solutionCode={solutionCode}
              onCopySolution={copySolution}
              notice={notice}
            />
          </div>

          <Board
            level={level}
            pieces={combinedPieces}
            paths={sim.paths}
            currentTick={Math.max(displayTick, 1)}
            selectedCell={editor.selectedCell}
            selectedTool={editor.selectedTool}
            placeableCells={placeableCells}
            buildPadCells={buildPadSet}
            onCellClick={handleCellClick}
          />

          <Hud
            sim={sim}
            level={level}
            currentTick={displayTick}
            maxTicks={level.rules.maxTicks}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onTogglePlay={handleTogglePlay}
            onStep={handleStep}
            onChangeSpeed={setPlaybackSpeed}
          />
        </main>
      </div>

      <LevelOverview
        open={overviewOpen}
        levels={levels}
        currentLevelIndex={levelIndex}
        progress={progress}
        onClose={() => setOverviewOpen(false)}
        onSelectLevel={(index) => applyLevelChange(index)}
      />
    </>
  );
}

