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
  const visualRotation = piece.type === 'MIRROR' ? (piece.dir % 2 === 0 ? 0 : 90) : piece.dir * 45;

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
          transform: `rotate(${visualRotation}deg)`,
        }}
      >
        <PieceIconByType type={piece.type} className="h-full w-full" />
      </div>

      {piece.locked ? <div className="piece-lock">锁</div> : null}
    </div>
  );
}
