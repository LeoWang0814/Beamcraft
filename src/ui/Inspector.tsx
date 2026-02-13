import { PieceIconByType } from '../assets/pieces';
import { COLOR_BITS, PIECE_LABELS, type PieceInstance } from '../engine/types';
import { ZH, colorMaskLabel, logicModeLabel } from './i18n';

interface InspectorProps {
  selectedPiece: PieceInstance | undefined;
  onRotateCw: () => void;
  onRotateCcw: () => void;
  onDelete: () => void;
  onUpdateConfig: (
    config: Partial<
      Pick<
        PieceInstance,
        | 'delayTicks'
        | 'gateOpenTicks'
        | 'gateCloseTicks'
        | 'mixerRequireDistinct'
        | 'logicMode'
        | 'logicOutputColor'
        | 'accumulatorTargetColor'
        | 'accumulatorThresholdTicks'
        | 'accumulatorPulseTicks'
        | 'accumulatorOutputColor'
        | 'accumulatorOutputIntensity'
      >
    >,
  ) => void;
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
    return piece.dir % 2 === 0 ? '/' : '\\';
  }
  return rotationLabel(piece.dir);
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)));
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
    <section className="panel-surface flex h-full min-h-0 flex-col p-3">
      <div className="eyebrow">{ZH.inspector.title}</div>
      <h2 className="panel-title mt-1 text-[17px]">{ZH.inspector.selected}</h2>

      <div className="mt-2 rounded-button border border-line bg-panel2 p-3">
        {selectedPiece ? (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-button border border-line bg-panel p-1.5 text-text">
              <PieceIconByType type={selectedPiece.type} className="h-full w-full" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text">{PIECE_LABELS[selectedPiece.type]}</div>
              <div className="mt-1 text-xs text-muted">
                {ZH.inspector.coord} ({selectedPiece.x}, {selectedPiece.y}) · {ZH.inspector.dir} {orientationLabel(selectedPiece)}
              </div>
              {selectedPiece.fixed ? <div className="mt-1 text-xs text-amber-300/85">{ZH.inspector.fixedHint}</div> : null}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted">{ZH.inspector.empty}</div>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button type="button" className="control-button" disabled={!canRotate} onClick={onRotateCcw}>
            {ZH.inspector.rotateCcw}
          </button>
          <button type="button" className="control-button" disabled={!canRotate} onClick={onRotateCw}>
            {ZH.inspector.rotateCw}
          </button>
          <button type="button" className="control-button" disabled={!canDelete} onClick={onDelete}>
            {ZH.inspector.remove}
          </button>
        </div>

        {selectedPiece && !selectedPiece.fixed && selectedPiece.type === 'DELAY' ? (
          <div className="mt-3 rounded-button border border-line bg-panel p-2 text-xs text-muted">
            <div className="mb-2 text-text">{ZH.inspector.delayTicks}</div>
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
            <div className="mb-2 text-text">{ZH.inspector.gatePhase}</div>
            <div className="grid grid-cols-2 gap-2">
              <label>
                <div className="mb-1">{ZH.inspector.gateOpen}</div>
                <input
                  type="number"
                  className="control-select w-full"
                  value={selectedPiece.gateOpenTicks ?? 1}
                  onChange={(event) => onUpdateConfig({ gateOpenTicks: clampInt(Number(event.target.value), 1, 9) })}
                />
              </label>
              <label>
                <div className="mb-1">{ZH.inspector.gateClose}</div>
                <input
                  type="number"
                  className="control-select w-full"
                  value={selectedPiece.gateCloseTicks ?? 1}
                  onChange={(event) => onUpdateConfig({ gateCloseTicks: clampInt(Number(event.target.value), 1, 9) })}
                />
              </label>
            </div>
          </div>
        ) : null}

        {selectedPiece && !selectedPiece.fixed && selectedPiece.type === 'MIXER' ? (
          <div className="mt-3 rounded-button border border-line bg-panel p-2 text-xs text-muted">
            <div className="mb-2 text-text">{ZH.inspector.mixerDistinct}</div>
            <button
              type="button"
              className="control-button w-full"
              onClick={() => onUpdateConfig({ mixerRequireDistinct: !selectedPiece.mixerRequireDistinct })}
            >
              {selectedPiece.mixerRequireDistinct ? '开启' : '关闭'}
            </button>
          </div>
        ) : null}

        {selectedPiece && !selectedPiece.fixed && selectedPiece.type === 'LOGIC_GATE' ? (
          <div className="mt-3 rounded-button border border-line bg-panel p-2 text-xs text-muted">
            <div className="grid grid-cols-2 gap-2">
              <label>
                <div className="mb-1">{ZH.inspector.logicMode}</div>
                <select
                  className="control-select w-full"
                  value={selectedPiece.logicMode ?? 'AND'}
                  onChange={(event) => onUpdateConfig({ logicMode: event.target.value as PieceInstance['logicMode'] })}
                >
                  <option value="AND">{logicModeLabel('AND')}</option>
                  <option value="XOR">{logicModeLabel('XOR')}</option>
                  <option value="NOT">{logicModeLabel('NOT')}</option>
                </select>
              </label>
              <label>
                <div className="mb-1">{ZH.inspector.logicColor}</div>
                <select
                  className="control-select w-full"
                  value={selectedPiece.logicOutputColor ?? COLOR_BITS.G}
                  onChange={(event) => onUpdateConfig({ logicOutputColor: Number(event.target.value) as PieceInstance['logicOutputColor'] })}
                >
                  {[COLOR_BITS.R, COLOR_BITS.G, COLOR_BITS.B, COLOR_BITS.W].map((mask) => (
                    <option key={mask} value={mask}>
                      {colorMaskLabel(mask)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ) : null}

        {selectedPiece && !selectedPiece.fixed && selectedPiece.type === 'ACCUMULATOR' ? (
          <div className="mt-3 rounded-button border border-line bg-panel p-2 text-xs text-muted">
            <div className="grid grid-cols-2 gap-2">
              <label>
                <div className="mb-1">{ZH.inspector.accumulatorTarget}</div>
                <select
                  className="control-select w-full"
                  value={selectedPiece.accumulatorTargetColor ?? COLOR_BITS.G}
                  onChange={(event) =>
                    onUpdateConfig({ accumulatorTargetColor: Number(event.target.value) as PieceInstance['accumulatorTargetColor'] })
                  }
                >
                  {[COLOR_BITS.R, COLOR_BITS.G, COLOR_BITS.B, COLOR_BITS.W].map((mask) => (
                    <option key={mask} value={mask}>
                      {colorMaskLabel(mask)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <div className="mb-1">{ZH.inspector.accumulatorThreshold}</div>
                <input
                  type="number"
                  className="control-select w-full"
                  value={selectedPiece.accumulatorThresholdTicks ?? 5}
                  onChange={(event) => onUpdateConfig({ accumulatorThresholdTicks: clampInt(Number(event.target.value), 1, 12) })}
                />
              </label>
              <label>
                <div className="mb-1">{ZH.inspector.accumulatorPulse}</div>
                <input
                  type="number"
                  className="control-select w-full"
                  value={selectedPiece.accumulatorPulseTicks ?? 2}
                  onChange={(event) => onUpdateConfig({ accumulatorPulseTicks: clampInt(Number(event.target.value), 1, 8) })}
                />
              </label>
              <label>
                <div className="mb-1">{ZH.inspector.accumulatorColor}</div>
                <select
                  className="control-select w-full"
                  value={selectedPiece.accumulatorOutputColor ?? COLOR_BITS.G}
                  onChange={(event) =>
                    onUpdateConfig({ accumulatorOutputColor: Number(event.target.value) as PieceInstance['accumulatorOutputColor'] })
                  }
                >
                  {[COLOR_BITS.R, COLOR_BITS.G, COLOR_BITS.B, COLOR_BITS.W].map((mask) => (
                    <option key={mask} value={mask}>
                      {colorMaskLabel(mask)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="col-span-2">
                <div className="mb-1">{ZH.inspector.accumulatorIntensity}</div>
                <input
                  type="number"
                  className="control-select w-full"
                  value={selectedPiece.accumulatorOutputIntensity ?? 100}
                  onChange={(event) =>
                    onUpdateConfig({ accumulatorOutputIntensity: clampInt(Number(event.target.value), 1, 600) })
                  }
                />
              </label>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-2 rounded-button border border-line bg-panel2 p-3">
        <div className="text-xs font-medium text-text">{ZH.inspector.solution}</div>
        <div className="mt-2 max-h-[56px] overflow-auto rounded-md bg-black/20 p-2 font-mono text-[11px] leading-5 text-muted">
          {solutionCode || ZH.inspector.solutionEmpty}
        </div>
        <button type="button" className="control-button mt-2 w-full" onClick={onCopySolution}>
          {ZH.inspector.copySolution}
        </button>
      </div>

      <div className={`mt-2 min-h-[20px] text-xs transition-opacity ${notice ? 'opacity-100' : 'opacity-0'}`}>
        {notice ?? ' '}
      </div>
    </section>
  );
}
