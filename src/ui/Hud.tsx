import { receiverColor } from '../engine/colors';
import type { LevelDefinition, ReceiverKey, ReceiverRuntime, SimResult } from '../engine/types';

interface HudProps {
  sim: SimResult;
  level: LevelDefinition;
}

function progress(receiver: ReceiverRuntime): number {
  if (receiver.threshold <= 0) {
    return 1;
  }
  return Math.max(0, Math.min(1, receiver.received / receiver.threshold));
}

function ReceiverGauge({ receiver }: { receiver: ReceiverRuntime }) {
  const pct = progress(receiver);
  const color = receiverColor(receiver.key);
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="status-row">
      <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" aria-hidden="true">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 24 24)"
        />
        <circle cx="24" cy="24" r="3" fill={color} />
      </svg>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted">{receiver.key} Channel</span>
          <span className="font-medium" style={{ color }}>{receiver.received}/{receiver.threshold}</span>
        </div>
        <div className="mt-1 text-sm text-text">{receiver.lit ? '达标' : '未达标'}</div>
        {receiver.contaminated ? <div className="mt-1 text-xs text-amber-300/90">存在杂色污染</div> : null}
      </div>
    </div>
  );
}

function RuleChip({ enabled, label }: { enabled: boolean; label: string }) {
  return <div className={`rule-chip ${enabled ? 'rule-chip-on' : 'rule-chip-off'}`}>{label}</div>;
}

export function Hud({ sim, level }: HudProps) {
  const order: ReceiverKey[] = ['R', 'G', 'B'];

  return (
    <aside className="panel-surface h-full p-4">
      <div className="eyebrow">Mission</div>
      <h2 className="panel-title mt-2">关卡目标</h2>

      {level.objective ? <p className="mt-2 text-sm leading-6 text-muted">{level.objective}</p> : null}
      {level.hint ? <p className="mt-2 rounded-button border border-amber-200/20 bg-amber-300/5 px-3 py-2 text-xs text-amber-100/80">提示：{level.hint}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <RuleChip enabled={level.rules.purity} label="Purity" />
        <RuleChip enabled={level.rules.sync} label="Sync" />
        <RuleChip enabled={sim.victory} label="Victory" />
      </div>

      <div className="mt-4 space-y-3">
        {order.map((key) => (
          <ReceiverGauge key={key} receiver={sim.receivers[key]} />
        ))}
      </div>

      <div className="mt-4 rounded-button border border-line bg-panel2 p-3 text-xs text-muted">
        <div className="mb-2 font-medium text-text">仿真统计</div>
        <div className="stat-grid">
          <div>
            <div className="stat-k">放置</div>
            <div className="stat-v">{sim.stats.placedCount}</div>
          </div>
          <div>
            <div className="stat-k">Ticks</div>
            <div className="stat-v">{sim.stats.totalTicks}</div>
          </div>
          <div>
            <div className="stat-k">反射</div>
            <div className="stat-v">{sim.stats.bounceCount}</div>
          </div>
          <div>
            <div className="stat-k">漏光</div>
            <div className="stat-v">{sim.stats.leakCount}</div>
          </div>
        </div>
      </div>

      {level.designerNote ? (
        <p className="mt-4 text-[11px] leading-5 text-muted/90">{level.designerNote}</p>
      ) : null}
    </aside>
  );
}

