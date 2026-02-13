import type { LevelDefinition, LevelDifficulty } from '../engine/types';
import { DIFFICULTY_LABEL, DIFFICULTY_ORDER, ZH } from './i18n';

export interface LevelProgressEntry {
  completed: boolean;
  bestPlaced?: number;
  bestTicks?: number;
}

interface LevelOverviewProps {
  open: boolean;
  levels: LevelDefinition[];
  currentLevelIndex: number;
  progress: Record<string, LevelProgressEntry>;
  onClose: () => void;
  onSelectLevel: (index: number) => void;
}

export function LevelOverview({
  open,
  levels,
  currentLevelIndex,
  progress,
  onClose,
  onSelectLevel,
}: LevelOverviewProps) {
  if (!open) {
    return null;
  }

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
    <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]">
      <div className="panel-surface mx-auto mt-6 flex h-[calc(100svh-48px)] w-[min(1020px,96vw)] flex-col p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="eyebrow">{ZH.overview.subtitle}</div>
            <h2 className="panel-title mt-1">{ZH.overview.title}</h2>
          </div>
          <button type="button" className="control-button" onClick={onClose}>
            {ZH.overview.close}
          </button>
        </div>

        <div className="mt-3 min-h-0 space-y-3 overflow-auto pr-1">
          {DIFFICULTY_ORDER.map((difficulty) => {
            const list = grouped[difficulty];
            if (list.length === 0) {
              return null;
            }

            return (
              <section key={difficulty} className="rounded-button border border-line bg-panel2 p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  {DIFFICULTY_LABEL[difficulty]}
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map(({ level, index }) => {
                    const entry = progress[level.id];
                    const isCurrent = index === currentLevelIndex;

                    const cardClass = isCurrent
                      ? 'border-accent bg-[var(--accent-soft)]'
                      : entry?.completed
                        ? 'border-emerald-400/40 bg-emerald-400/10'
                        : 'border-line bg-panel';

                    return (
                      <button
                        key={level.id}
                        type="button"
                        className={`rounded-button border px-3 py-2 text-left transition ${cardClass}`}
                        onClick={() => onSelectLevel(index)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium text-text">
                            {level.id} · {level.title}
                          </div>
                          <div className="text-[11px] text-muted">
                            {entry?.completed ? ZH.overview.completed : ZH.overview.pending}
                          </div>
                        </div>
                        <div className="mt-1 text-[11px] text-muted">
                          {ZH.overview.bestPlace}: {entry?.bestPlaced ?? '-'} · {ZH.overview.bestTick}: {entry?.bestTicks ?? '-'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
