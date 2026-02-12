import { useEffect, useMemo, useReducer, useState } from 'react';

import { Board } from '../render/Board';
import { Hud } from '../ui/Hud';
import { Inspector } from '../ui/Inspector';
import { Toolbar } from '../ui/Toolbar';
import { TopBar } from '../ui/TopBar';

import { createInitialEditorState, countPlacementsByType, editorReducer } from './editorState';
import { loadLevels } from '../engine/levelLoader';
import { findPieceAt, getCombinedPieces, pointBlocked, simulateLevel } from '../engine/sim';
import type { PlaceablePieceType, Placement } from '../engine/types';

const levels = loadLevels();

const TOOL_HOTKEY_MAP: Record<string, PlaceablePieceType> = {
  '1': 'MIRROR',
  '2': 'PRISM',
  '3': 'FILTER_R',
  '4': 'FILTER_G',
  '5': 'FILTER_B',
};

function isInteractiveElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select';
}

function keyOf(x: number, y: number): string {
  return `${x},${y}`;
}

function inventoryLimitFor(levelIndex: number, tool: PlaceablePieceType): number {
  const item = levels[levelIndex].inventory.find((entry) => entry.type === tool);
  return item?.count ?? 0;
}

export function App() {
  const [levelIndex, setLevelIndex] = useReducer((_: number, next: number) => next, 0);
  const [editor, dispatch] = useReducer(editorReducer, undefined, createInitialEditorState);
  const [notice, setNotice] = useState<string | null>(null);

  const level = levels[levelIndex];

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

  const combinedPieces = useMemo(
    () => getCombinedPieces(level, editor.placements),
    [editor.placements, level],
  );

  const sim = useMemo(() => simulateLevel(level, editor.placements), [level, editor.placements]);

  const selectedPiece = editor.selectedCell
    ? findPieceAt(combinedPieces, editor.selectedCell.x, editor.selectedCell.y)
    : undefined;

  const canEditSelected = Boolean(selectedPiece && !selectedPiece.fixed);

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

    const id = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(id);
  }, [notice]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveElement(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const withCmd = event.ctrlKey || event.metaKey;

      if (withCmd && key === 'z' && !event.shiftKey) {
        event.preventDefault();
        dispatch({ type: 'UNDO' });
        return;
      }

      if ((withCmd && key === 'y') || (withCmd && key === 'z' && event.shiftKey)) {
        event.preventDefault();
        dispatch({ type: 'REDO' });
        return;
      }

      const tool = TOOL_HOTKEY_MAP[event.key];
      if (tool) {
        dispatch({ type: 'SET_TOOL', tool: editor.selectedTool === tool ? null : tool });
        return;
      }

      if (key === 'r') {
        event.preventDefault();
        if (!canEditSelected) {
          setNotice('请选择一个可编辑元件后再旋转。');
          return;
        }
        dispatch({ type: 'ROTATE_SELECTED', steps: event.shiftKey ? -1 : 1 });
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        if (!canEditSelected) {
          setNotice('固定元件不可删除。');
          return;
        }
        dispatch({ type: 'DELETE_SELECTED' });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canEditSelected, editor.selectedTool]);

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
    .map((placement) => `${placement.type}@${placement.x},${placement.y},${placement.dir}`)
    .join('|')}`;

  const copySolution = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(solutionCode);
      setNotice('解法串已复制。');
    } catch {
      setNotice('复制失败，请手动复制文本。');
    }
  };

  const handleChangeLevel = (nextIndex: number): void => {
    setLevelIndex(nextIndex);
    dispatch({ type: 'RESET_LEVEL' });
    setNotice(null);
  };

  return (
    <div className="app-shell mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-4 px-4 py-5">
      <TopBar
        levels={levels}
        currentLevelIndex={levelIndex}
        onChangeLevel={handleChangeLevel}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onReset={() => dispatch({ type: 'RESET_LEVEL' })}
        canUndo={editor.past.length > 0}
        canRedo={editor.future.length > 0}
        victory={sim.victory}
        tickCount={sim.stats.totalTicks}
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
          selectedCell={editor.selectedCell}
          selectedTool={editor.selectedTool}
          placeableCells={placeableCells}
          buildPadCells={buildPadSet}
          onCellClick={handleCellClick}
        />

        <Hud sim={sim} level={level} />
      </main>
    </div>
  );
}
