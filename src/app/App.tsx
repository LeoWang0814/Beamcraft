import { useEffect, useMemo, useRef, useState } from 'react';

import { Board } from '../render/Board';
import { CustomLevelEditor } from '../ui/CustomLevelEditor';
import { Hud } from '../ui/Hud';
import { Inspector } from '../ui/Inspector';
import { LevelOverview, type LevelProgressEntry } from '../ui/LevelOverview';
import { TopBar } from '../ui/TopBar';
import { Toolbar } from '../ui/Toolbar';

import { parseSharedLevel, validateAndNormalizeLevel } from '../custom/levelShare';
import { createInitialEditorState, countPlacementsByType, editorReducer } from './editorState';
import { isInteractiveElement, isRedo, isUndo, resolveToolHotkey } from './hotkeys';
import { loadLevels } from '../engine/levelLoader';
import { findPieceAt, getCombinedPieces, pointBlocked, simulateLevel } from '../engine/sim';
import { withChineseLevelText, ZH } from '../ui/i18n';
import {
  PIECE_LABELS,
  PLACEABLE_ORDER,
  type LevelDefinition,
  type PlaceablePieceType,
  type Placement,
} from '../engine/types';

const BUILTIN_LEVELS = loadLevels().map(withChineseLevelText);
const LEVEL_PROGRESS_KEY = 'beamcraft-progress-v3';
const CUSTOM_LEVELS_KEY = 'beamcraft-custom-levels-v1';
const UNLOCKED_SEEN_KEY = 'beamcraft-unlocked-tools-v1';

const TOOL_UNLOCK_REQUIREMENT: Record<PlaceablePieceType, number> = {
  MIRROR: 0,
  PRISM: 0,
  FILTER_R: 1,
  FILTER_G: 1,
  FILTER_B: 1,
  SPLITTER: 3,
  MIXER: 5,
  DELAY: 6,
  GATE: 8,
  LOGIC_GATE: 11,
  ACCUMULATOR: 13,
};

function keyOf(x: number, y: number): string {
  return `${x},${y}`;
}

function inventoryLimitFor(level: LevelDefinition, tool: PlaceablePieceType): number {
  const item = level.inventory.find((entry) => entry.type === tool);
  return item?.count ?? 0;
}

function effectiveTypeLimit(level: LevelDefinition, tool: PlaceablePieceType): number {
  const inventory = inventoryLimitFor(level, tool);
  const byRule = level.maxPlaceByType?.[tool];
  if (byRule === undefined) {
    return inventory;
  }
  return Math.min(inventory, byRule);
}

function levelUsesTimeRules(level: LevelDefinition): boolean {
  if (level.rules.sync || Boolean(level.rules.sequence)) {
    return true;
  }

  return level.fixed.some((piece) =>
    piece.type === 'DELAY' ||
    piece.type === 'GATE' ||
    piece.type === 'MIXER' ||
    piece.type === 'LOGIC_GATE' ||
    piece.type === 'ACCUMULATOR',
  );
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

    return JSON.parse(raw) as Record<string, LevelProgressEntry>;
  } catch {
    return {};
  }
}

function loadCustomLevels(): LevelDefinition[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CUSTOM_LEVELS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as LevelDefinition[];
    return parsed.map((level) => validateAndNormalizeLevel(level));
  } catch {
    return [];
  }
}

function loadSeenUnlocked(): Set<PlaceablePieceType> {
  if (typeof window === 'undefined') {
    return new Set<PlaceablePieceType>();
  }

  try {
    const raw = window.localStorage.getItem(UNLOCKED_SEEN_KEY);
    if (!raw) {
      return new Set<PlaceablePieceType>();
    }

    const values = JSON.parse(raw) as PlaceablePieceType[];
    return new Set(values);
  } catch {
    return new Set<PlaceablePieceType>();
  }
}

function saveSeenUnlocked(seen: Set<PlaceablePieceType>): void {
  window.localStorage.setItem(UNLOCKED_SEEN_KEY, JSON.stringify(Array.from(seen)));
}

function solveCodeFor(level: LevelDefinition, placements: Placement[]): string {
  return `${level.id}|${placements
    .map((placement) => {
      const cfg: string[] = [];
      if (placement.delayTicks !== undefined) cfg.push(`d${placement.delayTicks}`);
      if (placement.gateOpenTicks !== undefined) cfg.push(`go${placement.gateOpenTicks}`);
      if (placement.gateCloseTicks !== undefined) cfg.push(`gc${placement.gateCloseTicks}`);
      if (placement.mixerRequireDistinct !== undefined) cfg.push(`md${placement.mixerRequireDistinct ? 1 : 0}`);
      if (placement.logicMode) cfg.push(`lm${placement.logicMode}`);
      if (placement.logicOutputColor !== undefined) cfg.push(`lc${placement.logicOutputColor}`);
      if (placement.accumulatorTargetColor !== undefined) cfg.push(`at${placement.accumulatorTargetColor}`);
      if (placement.accumulatorThresholdTicks !== undefined) cfg.push(`ak${placement.accumulatorThresholdTicks}`);
      if (placement.accumulatorPulseTicks !== undefined) cfg.push(`ap${placement.accumulatorPulseTicks}`);
      if (placement.accumulatorOutputColor !== undefined) cfg.push(`ac${placement.accumulatorOutputColor}`);
      if (placement.accumulatorOutputIntensity !== undefined) cfg.push(`ai${placement.accumulatorOutputIntensity}`);
      const extra = cfg.length > 0 ? `:${cfg.join(',')}` : '';
      return `${placement.type}@${placement.x},${placement.y},${placement.dir}${extra}`;
    })
    .join('|')}`;
}

export function App() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [editor, dispatch] = useState(createInitialEditorState());
  const [notice, setNotice] = useState<string | null>(null);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [customEditorOpen, setCustomEditorOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [playbackTick, setPlaybackTick] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [runVersion, setRunVersion] = useState(0);
  const [progress, setProgress] = useState<Record<string, LevelProgressEntry>>(loadLevelProgress);
  const [customLevels, setCustomLevels] = useState<LevelDefinition[]>(loadCustomLevels);
  const [highlightedUnlockTool, setHighlightedUnlockTool] = useState<PlaceablePieceType | null>(null);

  const transitionTimerRef = useRef<number | null>(null);
  const selectedToolRef = useRef<PlaceablePieceType | null>(editor.selectedTool);
  const canEditSelectedRef = useRef(false);
  const autoRerunSignatureRef = useRef('');
  const seenUnlockedRef = useRef<Set<PlaceablePieceType>>(loadSeenUnlocked());

  const levels = useMemo(() => [...BUILTIN_LEVELS, ...customLevels], [customLevels]);
  const level = levels[Math.min(levelIndex, levels.length - 1)] ?? levels[0];
  const hasTimeRule = levelUsesTimeRules(level);
  const setEditorState = (
    updater: (state: ReturnType<typeof createInitialEditorState>) => ReturnType<typeof createInitialEditorState>,
  ): void => {
    dispatch((prev) => updater(prev));
  };

  useEffect(() => {
    if (levelIndex >= levels.length) {
      queueMicrotask(() => setLevelIndex(Math.max(0, levels.length - 1)));
    }
  }, [levelIndex, levels.length]);

  useEffect(() => {
    if (!window.location.hash.startsWith('#lvl=')) {
      return;
    }

    const raw = decodeURIComponent(window.location.hash.slice(5));
    try {
      const imported = parseSharedLevel(raw);
      queueMicrotask(() => {
        setCustomLevels((prev) => {
          const exists = prev.some((entry) => entry.id === imported.id);
          if (exists) {
            return prev.map((entry) => (entry.id === imported.id ? imported : entry));
          }
          return [...prev, imported];
        });
        setNotice('已从链接导入自定义关卡。');
      });
    } catch {
      queueMicrotask(() => setNotice('链接中的关卡字符串无效。'));
    }
  }, []);

  useEffect(() => {
    selectedToolRef.current = editor.selectedTool;
  }, [editor.selectedTool]);

  const buildPadSet = useMemo(
    () => new Set((level.buildPads ?? []).map((point) => keyOf(point.x, point.y))),
    [level.buildPads],
  );

  const allowedAreaSet = useMemo(
    () => new Set((level.allowedArea ?? []).map((point) => keyOf(point.x, point.y))),
    [level.allowedArea],
  );

  const wallSet = useMemo(
    () => new Set([...(level.walls ?? []), ...(level.blockedCells ?? [])].map((point) => keyOf(point.x, point.y))),
    [level.blockedCells, level.walls],
  );

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

  const sim = useMemo(() => {
    void runVersion;
    return simulateLevel(level, editor.placements, { tickLimit: simTickLimit });
  }, [editor.placements, level, simTickLimit, runVersion]);

  const displayTick = isPlaybackMode ? playbackTick : sim.stats.elapsedTicks;

  const selectedPiece = editor.selectedCell
    ? findPieceAt(combinedPieces, editor.selectedCell.x, editor.selectedCell.y)
    : undefined;

  const canEditSelected = Boolean(selectedPiece && !selectedPiece.fixed);

  useEffect(() => {
    canEditSelectedRef.current = canEditSelected;
  }, [canEditSelected]);

  const completedCount = useMemo(() => Object.values(progress).filter((entry) => entry.completed).length, [progress]);

  const unlockedTools = useMemo(() => {
    const unlocked = new Set<PlaceablePieceType>();

    for (const tool of PLACEABLE_ORDER) {
      if (completedCount >= TOOL_UNLOCK_REQUIREMENT[tool]) {
        unlocked.add(tool);
      }
    }

    for (const item of level.inventory) {
      if (item.count > 0) {
        unlocked.add(item.type);
      }
    }

    return unlocked;
  }, [completedCount, level.inventory]);

  useEffect(() => {
    const seen = seenUnlockedRef.current;
    const firstNew = PLACEABLE_ORDER.find((tool) => unlockedTools.has(tool) && !seen.has(tool));
    if (!firstNew) {
      return;
    }

    seen.add(firstNew);
    seenUnlockedRef.current = seen;
    saveSeenUnlocked(seen);
    setHighlightedUnlockTool(firstNew);
    setNotice(`新工具已解锁：${PIECE_LABELS[firstNew]}`);
    const timer = window.setTimeout(() => setHighlightedUnlockTool(null), 1800);
    return () => window.clearTimeout(timer);
  }, [unlockedTools]);

  const placeableCells = useMemo(() => {
    const result = new Set<string>();
    if (!editor.selectedTool || !unlockedTools.has(editor.selectedTool)) {
      return result;
    }

    const typeLimit = effectiveTypeLimit(level, editor.selectedTool);
    const used = usedCounts[editor.selectedTool];
    const totalLimit = level.maxPieces ?? Number.POSITIVE_INFINITY;

    for (let y = 0; y < level.grid.h; y += 1) {
      for (let x = 0; x < level.grid.w; x += 1) {
        const cellKey = keyOf(x, y);

        if (wallSet.has(cellKey) || fixedSet.has(cellKey)) {
          continue;
        }

        const existing = placementMap.get(cellKey);

        if (allowedAreaSet.size > 0 && !allowedAreaSet.has(cellKey) && !existing) {
          continue;
        }

        if (existing?.type === editor.selectedTool) {
          result.add(cellKey);
          continue;
        }

        const overTypeLimit = used >= typeLimit;
        const overTotalLimit = !existing && editor.placements.length >= totalLimit;
        if (!overTypeLimit && !overTotalLimit) {
          result.add(cellKey);
        }
      }
    }

    return result;
  }, [
    allowedAreaSet,
    editor.placements.length,
    editor.selectedTool,
    fixedSet,
    level,
    placementMap,
    unlockedTools,
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

    const interval = window.setInterval(() => {
      setPlaybackTick((prev) => {
        if (prev >= level.rules.maxTicks) {
          queueMicrotask(() => setIsPlaying(false));
          return prev;
        }
        return Math.min(level.rules.maxTicks, prev + playbackSpeed);
      });
    }, 220);

    return () => window.clearInterval(interval);
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

  const placementSignature = useMemo(
    () => editor.placements
      .map(
        (placement) =>
          `${placement.id}:${placement.type}:${placement.x}:${placement.y}:${placement.dir}:` +
          `${placement.delayTicks ?? ''}:${placement.gateOpenTicks ?? ''}:${placement.gateCloseTicks ?? ''}:` +
          `${placement.mixerRequireDistinct ?? ''}:${placement.logicMode ?? ''}:${placement.logicOutputColor ?? ''}:` +
          `${placement.accumulatorTargetColor ?? ''}:${placement.accumulatorThresholdTicks ?? ''}:` +
          `${placement.accumulatorPulseTicks ?? ''}:${placement.accumulatorOutputColor ?? ''}:${placement.accumulatorOutputIntensity ?? ''}`,
      )
      .join('|'),
    [editor.placements],
  );

  useEffect(() => {
    const signature = `${level.id}|${placementSignature}`;
    if (autoRerunSignatureRef.current === signature) {
      return;
    }
    autoRerunSignatureRef.current = signature;

    if (hasTimeRule) {
      queueMicrotask(() => {
        setPlaybackTick(0);
        setRunVersion((prev) => prev + 1);
        setIsPlaying(true);
        if (editor.placements.length > 0) {
          setNotice(ZH.notices.autoRerun);
        }
      });
    }
  }, [editor.placements.length, hasTimeRule, level.id, placementSignature]);

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
        setEditorState((state) => editorReducer(state, { type: 'UNDO' }));
        return;
      }

      if (isRedo(input)) {
        event.preventDefault();
        setEditorState((state) => editorReducer(state, { type: 'REDO' }));
        return;
      }

      if (!event.ctrlKey && !event.metaKey) {
        const tool = resolveToolHotkey(input);
        if (tool && unlockedTools.has(tool)) {
          event.preventDefault();
          const nextTool = selectedToolRef.current === tool ? null : tool;
          setEditorState((state) => editorReducer(state, { type: 'SET_TOOL', tool: nextTool }));
          setNotice(nextTool ? `工具切换：${PIECE_LABELS[nextTool]}` : '已取消工具选择');
          return;
        }
      }

      const key = event.key.toLowerCase();

      if (key === 'r') {
        event.preventDefault();
        if (!canEditSelectedRef.current) {
          setNotice(ZH.notices.selectEditable);
          return;
        }
        setEditorState((state) => editorReducer(state, { type: 'ROTATE_SELECTED', steps: event.shiftKey ? -1 : 1 }));
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        if (!canEditSelectedRef.current) {
          setNotice(ZH.notices.fixedCannotDelete);
          return;
        }
        setEditorState((state) => editorReducer(state, { type: 'DELETE_SELECTED' }));
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [unlockedTools]);

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
    window.localStorage.setItem(CUSTOM_LEVELS_KEY, JSON.stringify(customLevels));
  }, [customLevels]);

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
    setRunVersion((prev) => prev + 1);
  };

  const handleCellClick = (x: number, y: number): void => {
    const cellKey = keyOf(x, y);

    if (pointBlocked(level, x, y)) {
      setNotice(ZH.notices.blockedCell);
      setEditorState((state) => editorReducer(state, { type: 'SELECT_CELL', cell: null }));
      return;
    }

    const fixedAtCell = fixedSet.has(cellKey);
    const existingPlayerPiece = placementMap.get(cellKey);

    const selectedTool = editor.selectedTool;
    if (selectedTool) {
      if (!unlockedTools.has(selectedTool)) {
        setNotice('该工具尚未解锁。');
        return;
      }

      if (fixedAtCell) {
        setNotice(ZH.notices.fixedCannotReplace);
        setEditorState((state) => editorReducer(state, { type: 'SELECT_CELL', cell: { x, y } }));
        return;
      }

      if (allowedAreaSet.size > 0 && !allowedAreaSet.has(cellKey) && !existingPlayerPiece) {
        setNotice('该关限制了可放置区域。');
        return;
      }

      const typeLimit = effectiveTypeLimit(level, selectedTool);
      const usedType = usedCounts[selectedTool];
      const overTypeLimit = existingPlayerPiece?.type !== selectedTool && usedType >= typeLimit;

      if (overTypeLimit) {
        setNotice(ZH.notices.inventoryExhausted);
        return;
      }

      const maxPieces = level.maxPieces ?? Number.POSITIVE_INFINITY;
      if (!existingPlayerPiece && editor.placements.length >= maxPieces) {
        setNotice(ZH.notices.maxPiecesExceeded);
        return;
      }

      setEditorState((state) => editorReducer(state, { type: 'PLACE', x, y, pieceType: selectedTool }));
      return;
    }

    const piece = findPieceAt(combinedPieces, x, y);
    setEditorState((state) => editorReducer(state, { type: 'SELECT_CELL', cell: piece ? { x, y } : null }));
  };

  const solutionCode = solveCodeFor(level, editor.placements);

  const copySolution = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(solutionCode);
      setNotice(ZH.notices.copied);
    } catch {
      setNotice(ZH.notices.copyFailed);
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
      setEditorState(() => createInitialEditorState());
      setNotice(null);
      setOverviewOpen(false);
      resetPlayback(levels[nextIndex]);
      setTransitioning(false);
      transitionTimerRef.current = null;
    }, 150);
  };

  const handleResetLevel = (): void => {
    setEditorState(() => createInitialEditorState());
    setNotice(null);
    resetPlayback(level);
  };

  const handleRerun = (): void => {
    setPlaybackTick(0);
    setRunVersion((prev) => prev + 1);
    setIsPlaying(hasTimeRule);
    setNotice(ZH.notices.rerunDone);
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

  const handlePlaytestCustom = (rawLevel: LevelDefinition): void => {
    try {
      const normalized = validateAndNormalizeLevel(rawLevel);
      const base = normalized.id.trim() || `C${customLevels.length + 1}`;
      let candidate = base;
      let serial = 2;

      const occupied = new Set([...BUILTIN_LEVELS, ...customLevels].map((entry) => entry.id));
      while (occupied.has(candidate) && !customLevels.some((entry) => entry.id === candidate)) {
        candidate = `${base}_${serial}`;
        serial += 1;
      }

      const nextLevel = { ...normalized, id: candidate };
      const existingIndex = customLevels.findIndex((entry) => entry.id === nextLevel.id);
      const nextCustomLevels =
        existingIndex >= 0
          ? customLevels.map((entry, index) => (index === existingIndex ? nextLevel : entry))
          : [...customLevels, nextLevel];

      setCustomLevels(nextCustomLevels);
      setCustomEditorOpen(false);

      const jumpIndex = BUILTIN_LEVELS.length + (existingIndex >= 0 ? existingIndex : nextCustomLevels.length - 1);
      setLevelIndex(jumpIndex);
      setEditorState(() => createInitialEditorState());
      resetPlayback(nextLevel);
      setNotice('已进入自定义关卡试玩。');
    } catch (error) {
      setNotice(error instanceof Error ? `自定义关卡无效：${error.message}` : '自定义关卡无效');
    }
  };

  return (
    <>
      <div
        className={`app-shell mx-auto flex h-[100svh] w-full max-w-[1600px] flex-col gap-3 px-3 py-3 transition-opacity duration-150 ${
          transitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <TopBar
          levels={levels}
          currentLevelIndex={levelIndex}
          onChangeLevel={applyLevelChange}
          onPrevLevel={() => applyLevelChange(levelIndex - 1)}
          onNextLevel={() => applyLevelChange(levelIndex + 1)}
          onOpenOverview={() => setOverviewOpen(true)}
          onOpenCustomEditor={() => setCustomEditorOpen(true)}
          onUndo={() => setEditorState((state) => editorReducer(state, { type: 'UNDO' }))}
          onRedo={() => setEditorState((state) => editorReducer(state, { type: 'REDO' }))}
          onRerun={handleRerun}
          onReset={handleResetLevel}
          canUndo={editor.past.length > 0}
          canRedo={editor.future.length > 0}
          canPrevLevel={levelIndex > 0}
          canNextLevel={levelIndex < levels.length - 1}
          victory={sim.victory}
          tickCount={displayTick}
        />

        <main className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <div className="min-h-0 space-y-3">
            <Toolbar
              inventory={level.inventory}
              usedCounts={usedCounts}
              selectedTool={editor.selectedTool}
              unlockedTools={unlockedTools}
              highlightedUnlockTool={highlightedUnlockTool}
              onSelectTool={(tool) => setEditorState((state) => editorReducer(state, { type: 'SET_TOOL', tool }))}
            />
            <Inspector
              selectedPiece={selectedPiece}
              onRotateCw={() => setEditorState((state) => editorReducer(state, { type: 'ROTATE_SELECTED', steps: 1 }))}
              onRotateCcw={() => setEditorState((state) => editorReducer(state, { type: 'ROTATE_SELECTED', steps: -1 }))}
              onDelete={() => setEditorState((state) => editorReducer(state, { type: 'DELETE_SELECTED' }))}
              onUpdateConfig={(config) =>
                setEditorState((state) => editorReducer(state, { type: 'UPDATE_SELECTED_CONFIG', config }))
              }
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
            onRerun={handleRerun}
            onResetLevel={handleResetLevel}
          />
        </main>
      </div>

      <LevelOverview
        open={overviewOpen}
        levels={levels}
        currentLevelIndex={levelIndex}
        progress={progress}
        onClose={() => setOverviewOpen(false)}
        onSelectLevel={applyLevelChange}
      />

      <CustomLevelEditor open={customEditorOpen} onClose={() => setCustomEditorOpen(false)} onPlaytest={handlePlaytestCustom} />
    </>
  );
}
