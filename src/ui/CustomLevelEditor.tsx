import { useMemo, useState } from 'react';

import { PieceIconByType } from '../assets/pieces';
import {
  encodeLevelToShare,
  parseSharedLevel,
  toShareHashPayload,
  validateAndNormalizeLevel,
} from '../custom/levelShare';
import { COLOR_BITS, PLACEABLE_ORDER, type Dir8, type LevelDefinition, type PieceType } from '../engine/types';
import { PIECE_LABELS } from '../engine/types';
import { ZH, colorMaskLabel, formatTemplate } from './i18n';

type BrushType = 'ERASE' | 'WALL' | 'BLOCK' | PieceType;

interface CustomLevelEditorProps {
  open: boolean;
  onClose: () => void;
  onPlaytest: (level: LevelDefinition) => void;
}

function keyOf(x: number, y: number): string {
  return `${x},${y}`;
}

function createDefaultLevel(): LevelDefinition {
  return {
    id: 'CUST',
    title: '我的关卡',
    difficulty: 'custom',
    subtitle: '由玩家创建',
    objective: '点亮接收器并满足规则',
    hint: '先连通光路，再考虑时序',
    designerNote: '自定义关卡',
    grid: { w: 10, h: 10 },
    mode: 'D8',
    fixed: [],
    walls: [],
    blockedCells: [],
    inventory: PLACEABLE_ORDER.map((type) => ({ type, count: type === 'MIRROR' ? 2 : 1 })),
    rules: {
      purity: false,
      sync: false,
      syncWindow: 2,
      maxBounces: 128,
      maxTicks: 280,
    },
  };
}

function clampDir(value: number): Dir8 {
  return (((Math.floor(value) % 8) + 8) % 8) as Dir8;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

export function CustomLevelEditor({ open, onClose, onPlaytest }: CustomLevelEditorProps) {
  const [draft, setDraft] = useState<LevelDefinition>(() => createDefaultLevel());
  const [brush, setBrush] = useState<BrushType>('WALL');
  const [brushDir, setBrushDir] = useState<Dir8>(0);
  const [sourceColor, setSourceColor] = useState<typeof COLOR_BITS.R | typeof COLOR_BITS.G | typeof COLOR_BITS.B | typeof COLOR_BITS.W>(
    COLOR_BITS.W,
  );
  const [sourceIntensity, setSourceIntensity] = useState(300);
  const [receiverThreshold, setReceiverThreshold] = useState(100);
  const [shareText, setShareText] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const wallSet = useMemo(() => new Set(draft.walls.map((wall) => keyOf(wall.x, wall.y))), [draft.walls]);
  const blockedSet = useMemo(
    () => new Set((draft.blockedCells ?? []).map((point) => keyOf(point.x, point.y))),
    [draft.blockedCells],
  );
  const fixedMap = useMemo(() => {
    const map = new Map<string, PieceType>();
    for (const piece of draft.fixed) {
      map.set(keyOf(piece.x, piece.y), piece.type);
    }
    return map;
  }, [draft.fixed]);

  if (!open) {
    return null;
  }

  const updateDraft = (updater: (prev: LevelDefinition) => LevelDefinition): void => {
    setDraft((prev) => updater(prev));
  };

  const trimByGrid = (next: LevelDefinition): LevelDefinition => {
    const { w, h } = next.grid;
    return {
      ...next,
      fixed: next.fixed.filter((piece) => piece.x >= 0 && piece.y >= 0 && piece.x < w && piece.y < h),
      walls: next.walls.filter((wall) => wall.x >= 0 && wall.y >= 0 && wall.x < w && wall.y < h),
      blockedCells: (next.blockedCells ?? []).filter((cell) => cell.x >= 0 && cell.y >= 0 && cell.x < w && cell.y < h),
    };
  };

  const upsertPoint = (points: Array<{ x: number; y: number }>, x: number, y: number): Array<{ x: number; y: number }> => {
    const set = new Set(points.map((point) => keyOf(point.x, point.y)));
    set.add(keyOf(x, y));
    return Array.from(set).map((entry) => {
      const [px, py] = entry.split(',').map(Number);
      return { x: px, y: py };
    });
  };

  const upsertInventoryCount = (level: LevelDefinition, type: typeof PLACEABLE_ORDER[number], count: number) => {
    const next = level.inventory.slice();
    const index = next.findIndex((entry) => entry.type === type);
    if (index >= 0) {
      next[index] = { ...next[index], count };
    } else {
      next.push({ type, count });
    }
    return next;
  };

  const applyBrush = (x: number, y: number): void => {
    updateDraft((prev) => {
      const nextFixed = prev.fixed.filter((piece) => !(piece.x === x && piece.y === y));
      let nextWalls = prev.walls.filter((wall) => !(wall.x === x && wall.y === y));
      let nextBlocked = (prev.blockedCells ?? []).filter((cell) => !(cell.x === x && cell.y === y));

      if (brush === 'ERASE') {
        return { ...prev, fixed: nextFixed, walls: nextWalls, blockedCells: nextBlocked };
      }

      if (brush === 'WALL') {
        nextWalls = upsertPoint(nextWalls, x, y);
        return { ...prev, fixed: nextFixed, walls: nextWalls, blockedCells: nextBlocked };
      }

      if (brush === 'BLOCK') {
        nextBlocked = upsertPoint(nextBlocked, x, y);
        return { ...prev, fixed: nextFixed, walls: nextWalls, blockedCells: nextBlocked };
      }

      const piece: LevelDefinition['fixed'][number] = {
        id: `custom-${brush}-${x}-${y}`,
        type: brush,
        x,
        y,
        dir: brushDir,
        locked: true,
        fixed: true,
      };

      if (brush === 'SOURCE') {
        piece.color = sourceColor;
        piece.intensity = sourceIntensity;
      }

      if (brush === 'RECV_R' || brush === 'RECV_G' || brush === 'RECV_B') {
        piece.threshold = receiverThreshold;
      }

      if (brush === 'DELAY') {
        piece.delayTicks = 1;
      }

      if (brush === 'GATE') {
        piece.gateOpenTicks = 1;
        piece.gateCloseTicks = 1;
      }

      if (brush === 'MIXER') {
        piece.mixerRequireDistinct = false;
      }

      if (brush === 'LOGIC_GATE') {
        piece.logicMode = 'AND';
        piece.logicOutputColor = COLOR_BITS.G;
      }

      if (brush === 'ACCUMULATOR') {
        piece.accumulatorTargetColor = COLOR_BITS.G;
        piece.accumulatorThresholdTicks = 5;
        piece.accumulatorPulseTicks = 2;
        piece.accumulatorOutputColor = COLOR_BITS.G;
        piece.accumulatorOutputIntensity = 100;
      }

      return {
        ...prev,
        fixed: [...nextFixed, piece],
        walls: nextWalls,
        blockedCells: nextBlocked,
      };
    });
  };

  const handlePlaytest = (): void => {
    try {
      const normalized = validateAndNormalizeLevel({
        ...draft,
        difficulty: 'custom',
      });
      onPlaytest(normalized);
      setNotice('自定义关卡已载入试玩。');
    } catch (error) {
      setNotice(error instanceof Error ? `无法试玩：${error.message}` : '无法试玩：配置非法');
    }
  };

  const copyText = async (value: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(ZH.notices.copied);
    } catch {
      setNotice(ZH.notices.copyFailed);
    }
  };

  const handleExport = async (): Promise<void> => {
    try {
      const normalized = validateAndNormalizeLevel({
        ...draft,
        difficulty: 'custom',
      });
      const encoded = encodeLevelToShare(normalized);
      setShareText(encoded);
      await copyText(encoded);
      setNotice(ZH.editor.exported);
    } catch (error) {
      setNotice(error instanceof Error ? `导出失败：${error.message}` : '导出失败');
    }
  };

  const handleImport = (): void => {
    try {
      const imported = parseSharedLevel(shareText);
      setDraft(imported);
      setNotice(ZH.editor.imported);
    } catch (error) {
      setNotice(error instanceof Error ? `${ZH.editor.invalid}（${error.message}）` : ZH.editor.invalid);
    }
  };

  const handleCopyShareLink = async (): Promise<void> => {
    try {
      const normalized = validateAndNormalizeLevel({
        ...draft,
        difficulty: 'custom',
      });
      const url = `${window.location.origin}${window.location.pathname}${toShareHashPayload(normalized)}`;
      await copyText(url);
      setNotice(ZH.editor.shared);
    } catch (error) {
      setNotice(error instanceof Error ? `分享失败：${error.message}` : '分享失败');
    }
  };

  const palette: BrushType[] = [
    'ERASE',
    'WALL',
    'BLOCK',
    'SOURCE',
    'RECV_R',
    'RECV_G',
    'RECV_B',
    'MIRROR',
    'PRISM',
    'FILTER_R',
    'FILTER_G',
    'FILTER_B',
    'MIXER',
    'SPLITTER',
    'DELAY',
    'GATE',
    'LOGIC_GATE',
    'ACCUMULATOR',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]">
      <div className="panel-surface mx-auto mt-4 flex h-[calc(100svh-32px)] w-[min(1320px,96vw)] flex-col p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="eyebrow">{ZH.editor.title}</div>
            <h2 className="panel-title mt-1">{ZH.editor.subtitle}</h2>
          </div>
          <button type="button" className="control-button" onClick={onClose}>
            {ZH.editor.close}
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-auto rounded-button border border-line bg-panel2 p-3">
            <div className="space-y-2 text-xs text-muted">
              <label className="block">
                <div className="mb-1">{ZH.editor.id}</div>
                <input
                  className="control-select w-full"
                  value={draft.id}
                  onChange={(event) => updateDraft((prev) => ({ ...prev, id: event.target.value }))}
                />
              </label>
              <label className="block">
                <div className="mb-1">{ZH.editor.name}</div>
                <input
                  className="control-select w-full"
                  value={draft.title}
                  onChange={(event) => updateDraft((prev) => ({ ...prev, title: event.target.value }))}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <div className="mb-1">{ZH.editor.width}</div>
                  <input
                    type="number"
                    className="control-select w-full"
                    value={draft.grid.w}
                    onChange={(event) =>
                      updateDraft((prev) => trimByGrid({ ...prev, grid: { ...prev.grid, w: clampInt(Number(event.target.value), 4, 24) } }))
                    }
                  />
                </label>
                <label className="block">
                  <div className="mb-1">{ZH.editor.height}</div>
                  <input
                    type="number"
                    className="control-select w-full"
                    value={draft.grid.h}
                    onChange={(event) =>
                      updateDraft((prev) => trimByGrid({ ...prev, grid: { ...prev.grid, h: clampInt(Number(event.target.value), 4, 24) } }))
                    }
                  />
                </label>
              </div>
              <label className="block">
                <div className="mb-1">{ZH.editor.objective}</div>
                <input
                  className="control-select w-full"
                  value={draft.objective ?? ''}
                  onChange={(event) => updateDraft((prev) => ({ ...prev, objective: event.target.value }))}
                />
              </label>
              <label className="block">
                <div className="mb-1">{ZH.editor.hint}</div>
                <input
                  className="control-select w-full"
                  value={draft.hint ?? ''}
                  onChange={(event) => updateDraft((prev) => ({ ...prev, hint: event.target.value }))}
                />
              </label>
              <label className="block">
                <div className="mb-1">{ZH.editor.note}</div>
                <input
                  className="control-select w-full"
                  value={draft.designerNote ?? ''}
                  onChange={(event) => updateDraft((prev) => ({ ...prev, designerNote: event.target.value }))}
                />
              </label>
            </div>

            <div className="mt-3 rounded-button border border-line bg-panel p-3 text-xs text-muted">
              <div className="mb-2 font-medium text-text">{ZH.editor.rules}</div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={draft.rules.purity}
                    onChange={(event) => updateDraft((prev) => ({ ...prev, rules: { ...prev.rules, purity: event.target.checked } }))}
                  />
                  {ZH.hud.rules.purity}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={draft.rules.sync}
                    onChange={(event) => updateDraft((prev) => ({ ...prev, rules: { ...prev.rules, sync: event.target.checked } }))}
                  />
                  {ZH.hud.rules.sync}
                </label>
              </div>
              <label className="mt-2 block">
                <div className="mb-1">{ZH.editor.syncWindow}</div>
                <input
                  type="number"
                  className="control-select w-full"
                  value={draft.rules.syncWindow ?? 2}
                  onChange={(event) =>
                    updateDraft((prev) => ({ ...prev, rules: { ...prev.rules, syncWindow: clampInt(Number(event.target.value), 0, 12) } }))
                  }
                />
              </label>
              <label className="mt-2 block">
                <div className="mb-1">{ZH.editor.sequenceOrder}</div>
                <input
                  className="control-select w-full"
                  value={draft.rules.sequence?.order.join(',') ?? ''}
                  onChange={(event) => {
                    const order = event.target.value
                      .split(',')
                      .map((item) => item.trim().toUpperCase())
                      .filter((item): item is 'R' | 'G' | 'B' => item === 'R' || item === 'G' || item === 'B');

                    updateDraft((prev) => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        sequence: order.length > 0 ? { order, maxGap: prev.rules.sequence?.maxGap ?? 2 } : undefined,
                      },
                    }));
                  }}
                />
              </label>
              <label className="mt-2 block">
                <div className="mb-1">{ZH.editor.sequenceGap}</div>
                <input
                  type="number"
                  className="control-select w-full"
                  value={draft.rules.sequence?.maxGap ?? 2}
                  onChange={(event) =>
                    updateDraft((prev) => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        sequence: prev.rules.sequence
                          ? { ...prev.rules.sequence, maxGap: clampInt(Number(event.target.value), 1, 20) }
                          : { order: ['R', 'G', 'B'], maxGap: clampInt(Number(event.target.value), 1, 20) },
                      },
                    }))
                  }
                />
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="block">
                  <div className="mb-1">{ZH.editor.maxTicks}</div>
                  <input
                    type="number"
                    className="control-select w-full"
                    value={draft.rules.maxTicks}
                    onChange={(event) =>
                      updateDraft((prev) => ({ ...prev, rules: { ...prev.rules, maxTicks: clampInt(Number(event.target.value), 40, 800) } }))
                    }
                  />
                </label>
                <label className="block">
                  <div className="mb-1">{ZH.editor.maxBounces}</div>
                  <input
                    type="number"
                    className="control-select w-full"
                    value={draft.rules.maxBounces}
                    onChange={(event) =>
                      updateDraft((prev) => ({ ...prev, rules: { ...prev.rules, maxBounces: clampInt(Number(event.target.value), 8, 512) } }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="mt-3 rounded-button border border-line bg-panel p-3 text-xs text-muted">
              <div className="mb-2 font-medium text-text">{ZH.editor.inventory}</div>
              <div className="space-y-1">
                {PLACEABLE_ORDER.map((type) => {
                  const item = draft.inventory.find((entry) => entry.type === type);
                  const count = item?.count ?? 0;
                  return (
                    <label key={type} className="flex items-center justify-between gap-2">
                      <span>{PIECE_LABELS[type]}</span>
                      <input
                        type="number"
                        className="control-select w-[88px]"
                        value={count}
                        onChange={(event) =>
                          updateDraft((prev) => ({
                            ...prev,
                            inventory: upsertInventoryCount(prev, type, clampInt(Number(event.target.value), 0, 12)),
                          }))
                        }
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="flex min-h-0 flex-col rounded-button border border-line bg-panel2 p-3">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
              <label className="flex items-center gap-2">
                <span>{ZH.editor.brush}</span>
                <select
                  className="control-select"
                  value={brush}
                  onChange={(event) => setBrush(event.target.value as BrushType)}
                >
                  {palette.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry === 'ERASE'
                        ? '橡皮擦'
                        : entry === 'WALL'
                          ? '墙体'
                          : entry === 'BLOCK'
                            ? '阻断格'
                            : PIECE_LABELS[entry]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                <span>{ZH.editor.dir}</span>
                <input
                  type="number"
                  className="control-select w-[88px]"
                  value={brushDir}
                  onChange={(event) => setBrushDir(clampDir(Number(event.target.value)))}
                />
              </label>
              <label className="flex items-center gap-2">
                <span>{ZH.editor.sourceColor}</span>
                <select
                  className="control-select"
                  value={sourceColor}
                  onChange={(event) => setSourceColor(Number(event.target.value) as typeof sourceColor)}
                >
                  <option value={COLOR_BITS.R}>{colorMaskLabel(COLOR_BITS.R)}</option>
                  <option value={COLOR_BITS.G}>{colorMaskLabel(COLOR_BITS.G)}</option>
                  <option value={COLOR_BITS.B}>{colorMaskLabel(COLOR_BITS.B)}</option>
                  <option value={COLOR_BITS.W}>{colorMaskLabel(COLOR_BITS.W)}</option>
                </select>
              </label>
              <label className="flex items-center gap-2">
                <span>{ZH.editor.sourceIntensity}</span>
                <input
                  type="number"
                  className="control-select w-[88px]"
                  value={sourceIntensity}
                  onChange={(event) => setSourceIntensity(clampInt(Number(event.target.value), 1, 600))}
                />
              </label>
              <label className="flex items-center gap-2">
                <span>{ZH.editor.receiverThreshold}</span>
                <input
                  type="number"
                  className="control-select w-[88px]"
                  value={receiverThreshold}
                  onChange={(event) => setReceiverThreshold(clampInt(Number(event.target.value), 0, 600))}
                />
              </label>
            </div>

            <div className="mb-2 text-xs text-muted">{ZH.editor.placeHint}</div>

            <div className="min-h-0 flex-1 overflow-auto rounded-button border border-line bg-board p-2">
              <div
                className="grid gap-[1px]"
                style={{
                  gridTemplateColumns: `repeat(${draft.grid.w}, minmax(0, 32px))`,
                  width: 'fit-content',
                }}
              >
                {Array.from({ length: draft.grid.w * draft.grid.h }).map((_, index) => {
                  const x = index % draft.grid.w;
                  const y = Math.floor(index / draft.grid.w);
                  const cellKey = keyOf(x, y);
                  const pieceType = fixedMap.get(cellKey);
                  const isWall = wallSet.has(cellKey);
                  const isBlocked = blockedSet.has(cellKey);

                  return (
                    <button
                      key={cellKey}
                      type="button"
                      className={`relative h-8 w-8 border border-gridline ${
                        isWall ? 'bg-wall' : isBlocked ? 'bg-red-500/30' : 'bg-transparent'
                      }`}
                      title={formatTemplate('{cell} ({x},{y})', { cell: ZH.board.cell, x, y })}
                      aria-label={formatTemplate('{cell}-{x}-{y}', { cell: ZH.board.cell, x, y })}
                      onClick={() => applyBrush(x, y)}
                    >
                      {pieceType ? (
                        <span className="pointer-events-none absolute inset-[3px] rounded-[6px] border border-line bg-panel text-text">
                          <PieceIconByType type={pieceType} className="h-full w-full" />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <button type="button" className="control-button" onClick={handlePlaytest}>
                {ZH.editor.playtest}
              </button>
              <button type="button" className="control-button" onClick={() => void handleExport()}>
                {ZH.editor.export}
              </button>
              <button type="button" className="control-button" onClick={handleImport}>
                {ZH.editor.import}
              </button>
              <button type="button" className="control-button" onClick={() => void handleCopyShareLink()}>
                {ZH.editor.shareLink}
              </button>
            </div>

            <div className="mt-2">
              <div className="mb-1 text-xs text-muted">{ZH.editor.payload}</div>
              <textarea
                className="control-select h-20 w-full resize-none font-mono text-[11px]"
                value={shareText}
                onChange={(event) => setShareText(event.target.value)}
              />
            </div>

            <div className={`mt-2 text-xs ${notice ? 'text-text' : 'text-transparent'}`}>{notice ?? '.'}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
