import { PieceIconByType } from '../assets/pieces';

import type { InventoryItem, PlaceablePieceType } from '../engine/types';

interface ToolbarProps {
  inventory: InventoryItem[];
  usedCounts: Record<PlaceablePieceType, number>;
  selectedTool: PlaceablePieceType | null;
  onSelectTool: (tool: PlaceablePieceType | null) => void;
}

const HOTKEYS: Record<PlaceablePieceType, string> = {
  MIRROR: '1',
  PRISM: '2',
  FILTER_R: '3',
  FILTER_G: '4',
  FILTER_B: '5',
};

const LABELS: Record<PlaceablePieceType, string> = {
  MIRROR: '镜子',
  PRISM: '棱镜',
  FILTER_R: '红滤镜',
  FILTER_G: '绿滤镜',
  FILTER_B: '蓝滤镜',
};

export function Toolbar({ inventory, usedCounts, selectedTool, onSelectTool }: ToolbarProps) {
  return (
    <aside className="panel p-3">
      <div className="mb-3 text-sm font-medium">工具栏</div>

      <div className="space-y-2">
        {inventory.map((item) => {
          const used = usedCounts[item.type];
          const exhausted = used >= item.count;
          const selected = selectedTool === item.type;

          return (
            <button
              key={item.type}
              type="button"
              className={`flex w-full items-center gap-3 rounded-button border px-2 py-2 text-left transition-all ${
                selected
                  ? 'border-accent bg-accent/10'
                  : exhausted
                    ? 'border-white/5 bg-white/5 opacity-50'
                    : 'border-white/10 bg-panel2 hover:border-white/20 hover:bg-white/10'
              }`}
              disabled={exhausted && !selected}
              onClick={() => onSelectTool(selected ? null : item.type)}
            >
              <div className="h-10 w-10 text-text">
                <PieceIconByType type={item.type} className="h-full w-full" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-text">{LABELS[item.type]}</div>
                <div className="text-xs text-muted">
                  {used}/{item.count}
                </div>
              </div>
              <div className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-muted">{HOTKEYS[item.type]}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-white/10 pt-3 text-xs text-muted">
        <div>R: 顺时针 45°</div>
        <div>Shift+R: 逆时针 45°</div>
        <div>Delete: 删除</div>
        <div>Ctrl+Z / Ctrl+Y: 撤销 / 重做</div>
      </div>
    </aside>
  );
}
