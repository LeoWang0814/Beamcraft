import type { LevelDefinition } from '../engine/types';

interface TopBarProps {
  levels: LevelDefinition[];
  currentLevelIndex: number;
  onChangeLevel: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function TopBar({
  levels,
  currentLevelIndex,
  onChangeLevel,
  onUndo,
  onRedo,
  onReset,
  canUndo,
  canRedo,
}: TopBarProps) {
  const current = levels[currentLevelIndex];

  return (
    <header className="panel grid gap-3 p-3 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <div className="text-xs uppercase tracking-[0.12em] text-muted">Grid Prism Puzzle</div>
        <div className="mt-1 text-lg font-semibold text-text">{current.id} · {current.title}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="level-select" className="text-xs text-muted">
          关卡
        </label>
        <select
          id="level-select"
          className="rounded-button border border-white/10 bg-panel2 px-2 py-2 text-sm text-text"
          value={currentLevelIndex}
          onChange={(event) => onChangeLevel(Number(event.target.value))}
        >
          {levels.map((level, index) => (
            <option key={level.id} value={index}>
              {level.id} - {level.title}
            </option>
          ))}
        </select>

        <button type="button" className="app-button" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <button type="button" className="app-button" onClick={onRedo} disabled={!canRedo}>
          Redo
        </button>
        <button type="button" className="app-button" onClick={onReset}>
          重置
        </button>
      </div>
    </header>
  );
}
