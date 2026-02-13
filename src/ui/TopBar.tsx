import type { LevelDefinition, LevelDifficulty } from '../engine/types';

interface TopBarProps {
  levels: LevelDefinition[];
  currentLevelIndex: number;
  onChangeLevel: (index: number) => void;
  onPrevLevel: () => void;
  onNextLevel: () => void;
  onOpenOverview: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canPrevLevel: boolean;
  canNextLevel: boolean;
  victory: boolean;
  tickCount: number;
}

const DIFFICULTY_LABEL: Record<LevelDifficulty, string> = {
  tutorial: '入门教学',
  basic: '基础',
  intermediate: '中级',
  advanced: '高级',
};

const DIFFICULTY_ORDER: LevelDifficulty[] = ['tutorial', 'basic', 'intermediate', 'advanced'];

export function TopBar({
  levels,
  currentLevelIndex,
  onChangeLevel,
  onPrevLevel,
  onNextLevel,
  onOpenOverview,
  onUndo,
  onRedo,
  onReset,
  canUndo,
  canRedo,
  canPrevLevel,
  canNextLevel,
  victory,
  tickCount,
}: TopBarProps) {
  const current = levels[currentLevelIndex];

  const grouped: Record<LevelDifficulty, Array<{ level: LevelDefinition; index: number }>> = {
    tutorial: [],
    basic: [],
    intermediate: [],
    advanced: [],
  };

  levels.forEach((level, index) => {
    grouped[level.difficulty].push({ level, index });
  });

  return (
    <header className="panel-surface px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[220px]">
          <div className="eyebrow">Beamcraft Puzzle Lab</div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-semibold leading-none tracking-tight text-text">{current.id}</h1>
            <div className="text-[20px] font-medium text-text/90">{current.title}</div>
          </div>
          {current.subtitle ? <p className="mt-2 max-w-[640px] text-sm text-muted">{current.subtitle}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className={`status-chip ${victory ? 'status-chip-success' : 'status-chip-idle'}`}>
            {victory ? '所有接收器已激活' : '调试中'}
          </div>
          <div className="status-chip status-chip-idle">Ticks {tickCount}</div>
          <div className="status-chip status-chip-idle">
            {currentLevelIndex + 1} / {levels.length}
          </div>
          <div className="status-chip status-chip-idle">{DIFFICULTY_LABEL[current.difficulty]}</div>

          <button type="button" className="control-button" onClick={onPrevLevel} disabled={!canPrevLevel}>
            上一关
          </button>
          <button type="button" className="control-button" onClick={onNextLevel} disabled={!canNextLevel}>
            下一关
          </button>
          <label htmlFor="level-select" className="sr-only">
            切换关卡
          </label>
          <select
            id="level-select"
            className="control-select"
            value={currentLevelIndex}
            onChange={(event) => onChangeLevel(Number(event.target.value))}
          >
            {DIFFICULTY_ORDER.map((difficulty) => (
              <optgroup key={difficulty} label={DIFFICULTY_LABEL[difficulty]}>
                {grouped[difficulty].map(({ level, index }) => (
                  <option key={level.id} value={index}>
                    {level.id} - {level.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <button type="button" className="control-button" onClick={onUndo} disabled={!canUndo}>
            Undo
          </button>
          <button type="button" className="control-button" onClick={onRedo} disabled={!canRedo}>
            Redo
          </button>
          <button type="button" className="control-button" onClick={onOpenOverview}>
            Overview
          </button>
          <button type="button" className="control-button control-button-accent" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
