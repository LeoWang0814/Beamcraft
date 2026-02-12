import { PieceIconByType } from '../assets/pieces';
import type { PieceInstance } from '../engine/types';

interface SvgPieceProps {
  piece: PieceInstance;
  cellSize: number;
  selected: boolean;
}

export function SvgPiece({ piece, cellSize, selected }: SvgPieceProps) {
  const left = piece.x * cellSize;
  const top = piece.y * cellSize;

  return (
    <div
      className="pointer-events-none absolute flex items-center justify-center"
      style={{
        left,
        top,
        width: cellSize,
        height: cellSize,
      }}
    >
      <div
        className={`piece-chip ${selected ? 'piece-chip-selected' : ''} ${piece.fixed ? 'piece-chip-fixed' : ''}`}
        style={{
          transform: `rotate(${piece.dir * 45}deg)`,
        }}
      >
        <PieceIconByType type={piece.type} className="h-full w-full" />
      </div>

      {piece.locked ? <div className="piece-lock">锁</div> : null}
    </div>
  );
}
