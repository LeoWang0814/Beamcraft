import { useMemo } from 'react';

import { RaysCanvas } from './RaysCanvas';
import { SvgPiece } from './SvgPiece';

import type { BeamPath, GridPoint, LevelDefinition, PieceInstance, PlaceablePieceType } from '../engine/types';

interface BoardProps {
  level: LevelDefinition;
  pieces: PieceInstance[];
  paths: BeamPath[];
  currentTick: number;
  selectedCell: GridPoint | null;
  selectedTool: PlaceablePieceType | null;
  placeableCells: Set<string>;
  buildPadCells: Set<string>;
  onCellClick: (x: number, y: number) => void;
  cellSize?: number;
}

function key(x: number, y: number): string {
  return `${x},${y}`;
}

export function Board({
  level,
  pieces,
  paths,
  currentTick,
  selectedCell,
  selectedTool,
  placeableCells,
  buildPadCells,
  onCellClick,
  cellSize = 48,
}: BoardProps) {
  const width = level.grid.w * cellSize;
  const height = level.grid.h * cellSize;

  const wallSet = useMemo(() => new Set(level.walls.map((wall) => key(wall.x, wall.y))), [level.walls]);
  const fixedSet = useMemo(
    () =>
      new Set(
        level.fixed
          .filter((piece) => piece.locked || piece.type === 'SOURCE' || piece.type.startsWith('RECV'))
          .map((piece) => key(piece.x, piece.y)),
      ),
    [level.fixed],
  );

  const selectedKey = selectedCell ? key(selectedCell.x, selectedCell.y) : null;
  const hasBuildPads = buildPadCells.size > 0;

  return (
    <section className="panel-surface flex h-full w-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="eyebrow">Board</div>
          <div className="mt-1 text-sm text-muted">
            {selectedTool
              ? `当前放置：${selectedTool}（高亮格可放置）`
              : '点击元件可选中；选择工具后点击高亮格放置'}
          </div>
        </div>
        <div className="text-xs text-muted">{level.grid.w} × {level.grid.h}</div>
      </div>

      <div className="board-wrap relative mx-auto h-full w-full overflow-auto rounded-[14px] border border-line bg-board">
        <div className="relative mx-auto my-4" style={{ width, height }}>
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${level.grid.w}, ${cellSize}px)` }}>
            {Array.from({ length: level.grid.w * level.grid.h }).map((_, index) => {
              const x = index % level.grid.w;
              const y = Math.floor(index / level.grid.w);
              const cellKey = key(x, y);

              const isWall = wallSet.has(cellKey);
              const isFixed = fixedSet.has(cellKey);
              const isPad = buildPadCells.has(cellKey);
              const isSelected = selectedKey === cellKey;
              const canPlace = selectedTool ? placeableCells.has(cellKey) : false;
              const showPad = hasBuildPads && !isWall && !isFixed && isPad;

              return (
                <button
                  key={cellKey}
                  type="button"
                  className={`board-cell ${
                    isWall
                      ? 'board-cell-wall'
                      : isSelected
                        ? 'board-cell-selected'
                        : canPlace
                          ? 'board-cell-placeable'
                          : showPad
                            ? 'board-cell-pad'
                            : 'board-cell-default'
                  }`}
                  onClick={() => onCellClick(x, y)}
                  title={isWall ? 'Wall' : isFixed ? 'Locked' : `(${x}, ${y})`}
                  aria-label={`cell-${x}-${y}`}
                >
                  {isFixed ? <span className="board-tag">L</span> : null}
                </button>
              );
            })}
          </div>

          <RaysCanvas width={width} height={height} cellSize={cellSize} paths={paths} />

          <div className="pointer-events-none absolute inset-0">
            {pieces.map((piece) => (
              <SvgPiece
                key={piece.id ?? `piece-${piece.x}-${piece.y}-${piece.type}`}
                piece={piece}
                cellSize={cellSize}
                currentTick={currentTick}
                selected={Boolean(selectedCell && piece.x === selectedCell.x && piece.y === selectedCell.y)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

