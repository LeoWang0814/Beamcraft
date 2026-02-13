import { PieceIconByType } from '../assets/pieces';
import { PIECE_LABELS, type PieceInstance } from '../engine/types';

interface InspectorProps {
  selectedPiece: PieceInstance | undefined;
  onRotateCw: () => void;
  onRotateCcw: () => void;
  onDelete: () => void;
  onUpdateConfig: (config: Partial<Pick<PieceInstance, 'delayTicks' | 'gateOpenTicks' | 'gateCloseTicks' | 'mixerRequireDistinct'>>) => void;
  canRotate: boolean;
  canDelete: boolean;
  solutionCode: string;
  onCopySolution: () => void;
  notice: string | null;
}

function rotationLabel(dir: number): string {
  const angle = ((dir % 8) + 8) % 8;
  return `${angle * 45}°`;
}

function orientationLabel(piece: PieceInstance): string {
  if (piece.type === 'MIRROR') {
    return piece.dir % 2 === 0 ? '/ mirror' : '\\ mirror';
  }
  return rotationLabel(piece.dir);
}

function clampGateTick(value: number): number {
  return Math.max(1, Math.min(9, Math.floor(value)));
}

export function Inspector({
  selectedPiece,
  onRotateCw,
  onRotateCcw,
  onDelete,
  onUpdateConfig,
  canRotate,
  canDelete,
  solutionCode,
  onCopySolution,
  notice,
}: InspectorProps) {
  return (
    <section className="panel-surface p-4">
      <div className="eyebrow">Inspector</div>
      <h2 className="panel-title mt-2">当前选中</h2>

      <div className="mt-3 rounded-button border border-line bg-panel2 p-3">
        {selectedPiece ? (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-button border border-line bg-panel p-1.5 text-text">
              <PieceIconByType type={selectedPiece.type} className="h-full w-full" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text">{PIECE_LABELS[selectedPiece.type]}</div>
              <div className="mt-1 text-xs text-muted">
                坐标 ({selectedPiece.x}, {selectedPiece.y}) · 朝向 {orientationLabel(selectedPiece)}
              </div>
              {selectedPiece.fixed ? <div className="mt-1 text-xs text-amber-300/85">固定元件不可编辑</div> : null}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted">点击棋盘中的元件查看属性。</div>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button type="button" className="control-button" disabled={!canRotate} onClick={onRotateCcw}>
            -45°
          </button>
          <button type="button" className="control-button" disabled={!canRotate} onClick={onRotateCw}>
            +45°
          </button>
          <button type="button" className="control-button" disabled={!canDelete} onClick={onDelete}>
            删除
          </button>
        </div>

        {selectedPiece && !selectedPiece.fixed && selectedPiece.type === 'DELAY' ? (
          <div className="mt-3 rounded-button border border-line bg-panel p-2 text-xs text-muted">
            <div className="mb-2 text-text">Delay Ticks</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="control-button"
                onClick={() => onUpdateConfig({ delayTicks: Math.max(1, (selectedPiece.delayTicks ?? 1) - 1) as 1 | 2 | 3 })}
              >
                -
              </button>
              <div className="min-w-[56px] text-center text-sm text-text">{selectedPiece.delayTicks ?? 1}</div>
              <button
                type="button"
                className="control-button"
                onClick={() => onUpdateConfig({ delayTicks: Math.min(3, (selectedPiece.delayTicks ?? 1) + 1) as 1 | 2 | 3 })}
              >
                +
              </button>
            </div>
          </div>
        ) : null}

        {selectedPiece && !selectedPiece.fixed && selectedPiece.type === 'GATE' ? (
          <div className="mt-3 rounded-button border border-line bg-panel p-2 text-xs text-muted">
            <div className="mb-2 text-text">Gate Phase</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="mb-1 text-[11px]">Open Ticks</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="control-button"
                    onClick={() =>
                      onUpdateConfig({ gateOpenTicks: clampGateTick((selectedPiece.gateOpenTicks ?? 1) - 1) })
                    }
                  >
                    -
                  </button>
                  <div className="min-w-[36px] text-center text-text">{selectedPiece.gateOpenTicks ?? 1}</div>
                  <button
                    type="button"
                    className="control-button"
                    onClick={() =>
                      onUpdateConfig({ gateOpenTicks: clampGateTick((selectedPiece.gateOpenTicks ?? 1) + 1) })
                    }
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <div className="mb-1 text-[11px]">Close Ticks</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="control-button"
                    onClick={() =>
                      onUpdateConfig({ gateCloseTicks: clampGateTick((selectedPiece.gateCloseTicks ?? 1) - 1) })
                    }
                  >
                    -
                  </button>
                  <div className="min-w-[36px] text-center text-text">{selectedPiece.gateCloseTicks ?? 1}</div>
                  <button
                    type="button"
                    className="control-button"
                    onClick={() =>
                      onUpdateConfig({ gateCloseTicks: clampGateTick((selectedPiece.gateCloseTicks ?? 1) + 1) })
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {selectedPiece && !selectedPiece.fixed && selectedPiece.type === 'MIXER' ? (
          <div className="mt-3 rounded-button border border-line bg-panel p-2 text-xs text-muted">
            <div className="mb-2 text-text">Mixer Constraint</div>
            <button
              type="button"
              className="control-button w-full"
              onClick={() => onUpdateConfig({ mixerRequireDistinct: !selectedPiece.mixerRequireDistinct })}
            >
              {selectedPiece.mixerRequireDistinct ? '需不同方向输入: 开' : '需不同方向输入: 关'}
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-3 rounded-button border border-line bg-panel2 p-3">
        <div className="text-xs font-medium text-text">解法串</div>
        <div className="mt-2 max-h-[52px] overflow-auto rounded-md bg-black/20 p-2 font-mono text-[11px] leading-5 text-muted">
          {solutionCode || '当前无放置记录'}
        </div>
        <button type="button" className="control-button mt-2 w-full" onClick={onCopySolution}>
          复制解法串
        </button>
      </div>

      <div className={`mt-3 min-h-[24px] text-xs transition-opacity ${notice ? 'opacity-100' : 'opacity-0'}`}>
        {notice ?? ' '}
      </div>
    </section>
  );
}

