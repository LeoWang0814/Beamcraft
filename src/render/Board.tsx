import { useMemo } from 'react';

import { RaysCanvas } from './RaysCanvas';
import { SvgPiece } from './SvgPiece';

import type { BeamPath, GridPoint, LevelDefinition, PieceInstance } from '../engine/types';

interface BoardProps {
  level: LevelDefinition;
  pieces: PieceInstance[];
  paths: BeamPath[];
  selectedCell: GridPoint | null;
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
  selectedCell,
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

  return (
    <div className="panel h-full w-full overflow-auto p-3">
      <div className="relative mx-auto" style={{ width, height }}>
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${level.grid.w}, ${cellSize}px)` }}>
          {Array.from({ length: level.grid.w * level.grid.h }).map((_, index) => {
            const x = index % level.grid.w;
            const y = Math.floor(index / level.grid.w);
            const cellKey = key(x, y);
            const isWall = wallSet.has(cellKey);
            const isFixed = fixedSet.has(cellKey);
            const isSelected = selectedKey === cellKey;

            return (
              <button
                key={cellKey}
                type="button"
                className={`relative border border-gridline/80 transition-colors ${
                  isWall ? 'bg-wall/65' : 'bg-panel/10 hover:bg-white/[0.04]'
                } ${isSelected ? 'ring-1 ring-accent/90' : ''}`}
                onClick={() => onCellClick(x, y)}
                aria-label={`cell-${x}-${y}`}
                title={isFixed ? 'Locked cell' : isWall ? 'Wall cell' : `(${x}, ${y})`}
              >
                {isFixed ? <span className="absolute right-1 top-1 text-[9px] text-muted">L</span> : null}
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
              selected={Boolean(selectedCell && piece.x === selectedCell.x && piece.y === selectedCell.y)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
