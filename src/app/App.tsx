import { useEffect, useMemo, useReducer } from 'react';

import { Board } from '../render/Board';
import { Hud } from '../ui/Hud';
import { Toolbar } from '../ui/Toolbar';
import { TopBar } from '../ui/TopBar';

import { createInitialEditorState, countPlacementsByType, editorReducer } from './editorState';
import { loadLevels } from '../engine/levelLoader';
import { findPieceAt, getCombinedPieces, pointBlocked, simulateLevel } from '../engine/sim';
import type { PlaceablePieceType } from '../engine/types';

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

function inventoryLimitFor(levelIndex: number, tool: PlaceablePieceType): number {
  const item = levels[levelIndex].inventory.find((entry) => entry.type === tool);
  return item?.count ?? 0;
}

export function App() {
  const [levelIndex, setLevelIndex] = useReducer((_: number, next: number) => next, 0);
  const [editor, dispatch] = useReducer(editorReducer, undefined, createInitialEditorState);

  const level = levels[levelIndex];

  const usedCounts = useMemo(() => countPlacementsByType(editor.placements), [editor.placements]);

  const combinedPieces = useMemo(
    () => getCombinedPieces(level, editor.placements),
    [editor.placements, level],
  );

  const sim = useMemo(() => simulateLevel(level, editor.placements), [level, editor.placements]);

  useEffect(() => {
    dispatch({ type: 'RESET_LEVEL' });
  }, [levelIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveElement(event.target)) {
        return;
      }

      if (event.ctrlKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        dispatch({ type: 'UNDO' });
        return;
      }

      if (event.ctrlKey && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        dispatch({ type: 'REDO' });
        return;
      }

      const tool = TOOL_HOTKEY_MAP[event.key];
      if (tool) {
        dispatch({ type: 'SET_TOOL', tool: editor.selectedTool === tool ? null : tool });
        return;
      }

      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        dispatch({ type: 'ROTATE_SELECTED', steps: event.shiftKey ? -1 : 1 });
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        dispatch({ type: 'DELETE_SELECTED' });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editor.selectedTool]);

  const handleCellClick = (x: number, y: number): void => {
    if (pointBlocked(level, x, y)) {
      dispatch({ type: 'SELECT_CELL', cell: null });
      return;
    }

    const fixedAtCell = level.fixed.find((piece) => piece.x === x && piece.y === y);

    if (editor.selectedTool) {
      if (fixedAtCell) {
        dispatch({ type: 'SELECT_CELL', cell: { x, y } });
        return;
      }

      const existingPlayerPiece = editor.placements.find((piece) => piece.x === x && piece.y === y);
      const limit = inventoryLimitFor(levelIndex, editor.selectedTool);
      const used = usedCounts[editor.selectedTool];

      const canPlace = existingPlayerPiece?.type === editor.selectedTool || used < limit;
      if (!canPlace) {
        return;
      }

      dispatch({ type: 'PLACE', x, y, pieceType: editor.selectedTool });
      return;
    }

    const piece = findPieceAt(combinedPieces, x, y);
    dispatch({ type: 'SELECT_CELL', cell: piece ? { x, y } : null });
  };

  const selectedPiece = editor.selectedCell
    ? findPieceAt(combinedPieces, editor.selectedCell.x, editor.selectedCell.y)
    : undefined;

  const solutionCode = `${level.id}:${editor.placements
    .map((placement) => `${placement.type}@${placement.x},${placement.y},${placement.dir}`)
    .join(';')}`;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col gap-4 p-4">
      <TopBar
        levels={levels}
        currentLevelIndex={levelIndex}
        onChangeLevel={setLevelIndex}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onReset={() => dispatch({ type: 'RESET_LEVEL' })}
        canUndo={editor.past.length > 0}
        canRedo={editor.future.length > 0}
      />

      <main className="grid flex-1 gap-4 lg:grid-cols-[272px_minmax(0,1fr)_284px]">
        <Toolbar
          inventory={level.inventory}
          usedCounts={usedCounts}
          selectedTool={editor.selectedTool}
          onSelectTool={(tool) => dispatch({ type: 'SET_TOOL', tool })}
        />

        <div className="flex min-h-[560px] flex-col gap-3">
          <Board
            level={level}
            pieces={combinedPieces}
            paths={sim.paths}
            selectedCell={editor.selectedCell}
            onCellClick={handleCellClick}
          />
          <div className="panel flex flex-wrap items-center justify-between gap-2 p-3 text-xs text-muted">
            <div>当前选中: {selectedPiece ? selectedPiece.type : '无'}</div>
            <div className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">解法串: {solutionCode}</div>
          </div>
        </div>

        <Hud sim={sim} purityEnabled={level.rules.purity} />
      </main>
    </div>
  );
}
