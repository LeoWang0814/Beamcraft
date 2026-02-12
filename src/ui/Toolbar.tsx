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

const TITLES: Record<PlaceablePieceType, string> = {
  MIRROR: '镜片 / Mirror',
  PRISM: '分色棱镜 / Prism',
  FILTER_R: '红滤镜 / R',
  FILTER_G: '绿滤镜 / G',
  FILTER_B: '蓝滤镜 / B',
};

const DESCRIPTIONS: Record<PlaceablePieceType, string> = {
  MIRROR: '将直线光反射为垂直方向，45°入射会折返对角。',
  PRISM: '白光拆分成 RGB 三束，方向由朝向决定。',
  FILTER_R: '仅允许红色能量通过。',
  FILTER_G: '仅允许绿色能量通过。',
  FILTER_B: '仅允许蓝色能量通过。',
};

function usageLabel(used: number, limit: number): string {
  if (limit === 0) {
    return '固定关卡中不可用';
  }
  return `已用 ${used} / ${limit}`;
}

export function Toolbar({ inventory, usedCounts, selectedTool, onSelectTool }: ToolbarProps) {
  return (
    <aside className="panel-surface h-full p-4">
      <div className="eyebrow">Tool Dock</div>
      <h2 className="panel-title mt-2">构建元件</h2>

      <div className="mt-4 space-y-2">
        {inventory.map((item) => {
          const used = usedCounts[item.type];
          const limit = item.count;
          const exhausted = used >= limit;
          const selected = selectedTool === item.type;

          return (
            <button
              key={item.type}
              type="button"
              className={`tool-card ${selected ? 'tool-card-selected' : ''}`}
              disabled={exhausted && !selected}
              onClick={() => onSelectTool(selected ? null : item.type)}
              title={DESCRIPTIONS[item.type]}
            >
              <div className="tool-icon-wrap">
                <PieceIconByType type={item.type} className="h-full w-full" />
              </div>

              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-medium text-text">{TITLES[item.type]}</div>
                  <div className="hotkey-chip">{HOTKEYS[item.type]}</div>
                </div>
                <div className="mt-1 truncate text-xs text-muted">{DESCRIPTIONS[item.type]}</div>
                <div className={`mt-2 text-xs ${exhausted && !selected ? 'text-amber-300/90' : 'text-muted'}`}>
                  {usageLabel(used, limit)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-button border border-line bg-panel2 px-3 py-3 text-xs text-muted">
        <div className="font-medium text-text/90">快捷键</div>
        <div className="mt-2 space-y-1">
          <div>R / Shift+R: 顺逆时针旋转 45°</div>
          <div>Delete / Backspace: 删除选中元件</div>
          <div>Ctrl/⌘ + Z: 撤销</div>
          <div>Ctrl/⌘ + Y 或 Shift+Z: 重做</div>
        </div>
      </div>
    </aside>
  );
}

