import type { LevelDefinition, LevelDifficulty } from '../engine/types';
import { DIFFICULTY_LABEL, DIFFICULTY_ORDER, ZH } from './i18n';

interface TopBarProps {
  levels: LevelDefinition[];
  currentLevelIndex: number;
  onChangeLevel: (index: number) => void;
  onPrevLevel: () => void;
  onNextLevel: () => void;
  onOpenOverview: () => void;
  onOpenCustomEditor: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onRerun: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canPrevLevel: boolean;
  canNextLevel: boolean;
  victory: boolean;
  tickCount: number;
}

export function TopBar({
  levels,
  currentLevelIndex,
  onChangeLevel,
  onPrevLevel,
  onNextLevel,
  onOpenOverview,
  onOpenCustomEditor,
  onUndo,
  onRedo,
  onRerun,
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
    custom: [],
  };

  levels.forEach((level, index) => {
    grouped[level.difficulty].push({ level, index });
  });

  return (
    <header className="panel-surface px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[220px]">
          <div className="eyebrow">{ZH.appName}</div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-[24px] font-semibold leading-none tracking-tight text-text">{current.id}</h1>
            <div className="text-[17px] font-medium text-text/90">{current.title}</div>
          </div>
          {current.subtitle ? <p className="mt-1 max-w-[640px] text-xs text-muted">{current.subtitle}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className={`status-chip ${victory ? 'status-chip-success' : 'status-chip-idle'}`}>
            {victory ? ZH.topBar.statusVictory : ZH.topBar.statusReady}
          </div>
          <div className="status-chip status-chip-idle">
            {ZH.topBar.tick} {tickCount}
          </div>
          <div className="status-chip status-chip-idle">
            {ZH.topBar.level} {currentLevelIndex + 1}/{levels.length}
          </div>
          <div className="status-chip status-chip-idle">{DIFFICULTY_LABEL[current.difficulty]}</div>

          <button type="button" className="control-button" onClick={onPrevLevel} disabled={!canPrevLevel}>
            {ZH.topBar.prev}
          </button>
          <button type="button" className="control-button" onClick={onNextLevel} disabled={!canNextLevel}>
            {ZH.topBar.next}
          </button>
          <label htmlFor="level-select" className="sr-only">
            {ZH.topBar.selectLevel}
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
            {ZH.topBar.undo}
          </button>
          <button type="button" className="control-button" onClick={onRedo} disabled={!canRedo}>
            {ZH.topBar.redo}
          </button>
          <button type="button" className="control-button" onClick={onRerun}>
            {ZH.topBar.rerun}
          </button>
          <button type="button" className="control-button" onClick={onOpenOverview}>
            {ZH.topBar.overview}
          </button>
          <button type="button" className="control-button" onClick={onOpenCustomEditor}>
            {ZH.topBar.customEditor}
          </button>
          <button type="button" className="control-button control-button-accent" onClick={onReset}>
            {ZH.topBar.reset}
          </button>
        </div>
      </div>
    </header>
  );
}
