import { PieceIconByType } from '../assets/pieces';
import { PLACEABLE_ORDER, type InventoryItem, type PlaceablePieceType } from '../engine/types';
import { TOOL_META, ZH, formatTemplate } from './i18n';

interface ToolbarProps {
  inventory: InventoryItem[];
  usedCounts: Record<PlaceablePieceType, number>;
  selectedTool: PlaceablePieceType | null;
  unlockedTools: Set<PlaceablePieceType>;
  highlightedUnlockTool: PlaceablePieceType | null;
  onSelectTool: (tool: PlaceablePieceType | null) => void;
}

const HOTKEYS: Partial<Record<PlaceablePieceType, string>> = {
  MIRROR: '1',
  PRISM: '2',
  FILTER_R: '3',
  FILTER_G: '4',
  FILTER_B: '5',
  MIXER: '6',
  SPLITTER: '7',
  DELAY: '8',
  GATE: '9',
};

function usageLabel(used: number, limit: number): string {
  if (limit === 0) {
    return ZH.toolbar.unavailable;
  }
  return formatTemplate(ZH.toolbar.used, { used, limit });
}

export function Toolbar({
  inventory,
  usedCounts,
  selectedTool,
  unlockedTools,
  highlightedUnlockTool,
  onSelectTool,
}: ToolbarProps) {
  return (
    <aside className="panel-surface flex h-full min-h-0 flex-col p-3">
      <div className="eyebrow">{ZH.toolbar.title}</div>
      <h2 className="panel-title mt-1 text-[17px]">{ZH.toolbar.subtitle}</h2>

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-auto pr-1">
        {PLACEABLE_ORDER.map((type) => {
          const item = inventory.find((entry) => entry.type === type);
          const limit = item?.count ?? 0;
          const used = usedCounts[type] ?? 0;
          const exhausted = used >= limit;
          const selected = selectedTool === type;
          const unlocked = unlockedTools.has(type);
          const highlight = highlightedUnlockTool === type;
          const disabled = !unlocked || ((exhausted || limit === 0) && !selected);
          const hotkey = HOTKEYS[type] ?? '-';

          return (
            <button
              key={type}
              type="button"
              className={`tool-card ${selected ? 'tool-card-selected' : ''} ${!unlocked ? 'tool-card-locked' : ''} ${
                highlight ? 'tool-card-unlocked-flash' : ''
              }`}
              disabled={disabled}
              onClick={() => onSelectTool(selected ? null : type)}
              title={unlocked ? TOOL_META[type].description : TOOL_META[type].unlockHint}
            >
              <div className="tool-icon-wrap">
                <PieceIconByType type={type} className="h-full w-full" />
              </div>

              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-medium text-text">{TOOL_META[type].title}</div>
                  <div className="hotkey-chip">{hotkey}</div>
                </div>
                <div className="mt-1 text-xs text-muted">
                  {unlocked ? TOOL_META[type].description : `${ZH.toolbar.locked} · ${TOOL_META[type].unlockHint}`}
                </div>
                <div className={`mt-2 text-[11px] ${unlocked ? 'text-muted' : 'text-amber-200/85'}`}>
                  {unlocked ? usageLabel(used, limit) : ZH.toolbar.locked}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-button border border-line bg-panel2 px-3 py-3 text-xs text-muted">
        <div className="font-medium text-text/90">{ZH.toolbar.hotkeyTitle}</div>
        <div className="mt-2 space-y-1">
          <div>{ZH.toolbar.hotkeySelect}</div>
          <div>{ZH.toolbar.hotkeyRotate}</div>
          <div>{ZH.toolbar.hotkeyDelete}</div>
          <div>{ZH.toolbar.hotkeyUndo}</div>
          <div>{ZH.toolbar.hotkeyRedo}</div>
        </div>
      </div>
    </aside>
  );
}
