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
      className={`pointer-events-none absolute flex items-center justify-center rounded-cell transition-all ${
        selected ? 'ring-2 ring-accent' : ''
      }`}
      style={{
        left,
        top,
        width: cellSize,
        height: cellSize,
      }}
    >
      <div
        className="h-[86%] w-[86%] text-text"
        style={{
          transform: `rotate(${piece.dir * 45}deg)`,
          opacity: piece.fixed ? 0.9 : 1,
        }}
      >
        <PieceIconByType type={piece.type} className="h-full w-full" />
      </div>
      {piece.locked ? (
        <div className="absolute right-1 top-1 rounded bg-panel2/90 px-1 text-[9px] leading-none text-muted">L</div>
      ) : null}
    </div>
  );
}
