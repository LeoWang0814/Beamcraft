import { PieceIconByType } from '../assets/pieces';
import { isGateOpenAtTick } from '../engine/sim';
import type { PieceInstance } from '../engine/types';

interface SvgPieceProps {
  piece: PieceInstance;
  cellSize: number;
  currentTick: number;
  selected: boolean;
}

export function SvgPiece({ piece, cellSize, currentTick, selected }: SvgPieceProps) {
  const left = piece.x * cellSize;
  const top = piece.y * cellSize;
  const visualRotation = piece.type === 'MIRROR' ? (piece.dir % 2 === 0 ? 0 : 90) : piece.dir * 45;
  const gateOpen = piece.type === 'GATE' ? isGateOpenAtTick(piece, Math.max(1, currentTick)) : false;

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
        className={`piece-chip ${selected ? 'piece-chip-selected' : ''} ${piece.fixed ? 'piece-chip-fixed' : ''} ${
          piece.type === 'GATE' ? (gateOpen ? 'piece-chip-gate-open' : 'piece-chip-gate-closed') : ''
        }`}
        style={{
          transform: `rotate(${visualRotation}deg)`,
        }}
      >
        <PieceIconByType type={piece.type} className="h-full w-full" />
      </div>

      {piece.type === 'GATE' ? (
        <div className={`piece-gate-indicator ${gateOpen ? 'piece-gate-indicator-open' : 'piece-gate-indicator-closed'}`} />
      ) : null}

      {piece.locked ? <div className="piece-lock">锁</div> : null}
    </div>
  );
}
