import { receiverColor } from '../engine/colors';
import type { ColorMask, LevelDefinition, ReceiverKey, ReceiverRuntime, SimEvent, SimResult } from '../engine/types';
import { ZH, colorMaskLabel, formatTemplate } from './i18n';

interface HudProps {
  sim: SimResult;
  level: LevelDefinition;
  currentTick: number;
  maxTicks: number;
  isPlaying: boolean;
  playbackSpeed: 1 | 2 | 4;
  onTogglePlay: () => void;
  onStep: () => void;
  onChangeSpeed: (speed: 1 | 2 | 4) => void;
  onRerun: () => void;
  onResetLevel: () => void;
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
      <svg viewBox="0 0 48 48" className="h-11 w-11 shrink-0" aria-hidden="true">
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
          <span className="text-muted">{receiver.key} 通道</span>
          <span className="font-medium" style={{ color }}>
            {receiver.received}/{receiver.threshold}
          </span>
        </div>
        <div className="mt-1 text-sm text-text">{receiver.lit ? ZH.hud.receiverDone : ZH.hud.receiverPending}</div>
        {receiver.contaminated ? <div className="mt-1 text-xs text-amber-300/90">{ZH.hud.receiverContaminated}</div> : null}
      </div>
    </div>
  );
}

function RuleChip({ enabled, label }: { enabled: boolean; label: string }) {
  return <div className={`rule-chip ${enabled ? 'rule-chip-on' : 'rule-chip-off'}`}>{label}</div>;
}

function eventText(event: SimEvent): string {
  const colorLabel = event.color !== undefined ? colorMaskLabel(event.color as ColorMask) : '';

  if (event.type === 'receiver_hit') {
    return `${event.tick}T 命中 ${event.receiver} 接收器 +${event.amount ?? 0}`;
  }
  if (event.type === 'gate_pass') {
    return `${event.tick}T 门控放行（${event.x},${event.y}）`;
  }
  if (event.type === 'gate_block') {
    return `${event.tick}T 门控阻断（${event.x},${event.y}）`;
  }
  if (event.type === 'delay_release') {
    return `${event.tick}T 延迟释放 ${colorLabel}`;
  }
  if (event.type === 'mixer_trigger') {
    return `${event.tick}T 合流触发 -> ${colorLabel}`;
  }
  if (event.type === 'logic_trigger') {
    return `${event.tick}T 逻辑门(${event.meta ?? 'AND'}) 输出 ${colorLabel}`;
  }
  if (event.type === 'accumulator_charge') {
    return `${event.tick}T 累积器充能 ${event.amount ?? 0}`;
  }
  if (event.type === 'accumulator_pulse') {
    return `${event.tick}T 累积器释放脉冲`;
  }

  return `${event.tick}T 事件`;
}

export function Hud({
  sim,
  level,
  currentTick,
  maxTicks,
  isPlaying,
  playbackSpeed,
  onTogglePlay,
  onStep,
  onChangeSpeed,
  onRerun,
  onResetLevel,
}: HudProps) {
  const order: ReceiverKey[] = ['R', 'G', 'B'];
  const hasTimeRule = Boolean(level.rules.sync || level.rules.sequence);

  const visibleEvents = sim.events
    .filter((event) => event.tick <= Math.max(1, currentTick))
    .slice(-8)
    .reverse();

  return (
    <aside className="panel-surface flex h-full min-h-0 flex-col p-3">
      <div className="eyebrow">{ZH.hud.title}</div>
      <h2 className="panel-title mt-1 text-[17px]">{ZH.hud.objective}</h2>

      {level.objective ? <p className="mt-2 text-xs leading-5 text-muted">{level.objective}</p> : null}
      {level.hint ? (
        <p className="mt-2 rounded-button border border-amber-200/20 bg-amber-300/5 px-3 py-2 text-[11px] text-amber-100/80">
          {ZH.hud.hint}：{level.hint}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <RuleChip enabled={level.rules.purity} label={ZH.hud.rules.purity} />
        <RuleChip
          enabled={level.rules.sync}
          label={level.rules.sync ? `${ZH.hud.rules.sync}≤${level.rules.syncWindow ?? 2}` : ZH.hud.rules.sync}
        />
        <RuleChip enabled={Boolean(level.rules.sequence)} label={ZH.hud.rules.sequence} />
        <RuleChip enabled={sim.victory} label={ZH.hud.rules.victory} />
      </div>

      <div className="mt-3 rounded-button border border-line bg-panel2 p-3 text-xs text-muted">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="font-medium text-text">{ZH.hud.playbackTitle}</div>
          <div>
            {currentTick} / {maxTicks}
          </div>
        </div>
        {hasTimeRule ? <div className="mb-2 text-[11px] text-amber-100/70">{ZH.hud.playbackRuleHint}</div> : null}
        <div className="flex items-center gap-2">
          <button type="button" className="control-button flex-1" onClick={onTogglePlay}>
            {isPlaying ? ZH.hud.pause : ZH.hud.play}
          </button>
          <button type="button" className="control-button" onClick={onStep}>
            {ZH.hud.step}
          </button>
          <select
            className="control-select"
            value={playbackSpeed}
            onChange={(event) => onChangeSpeed(Number(event.target.value) as 1 | 2 | 4)}
          >
            <option value={1}>x1</option>
            <option value={2}>x2</option>
            <option value={4}>x4</option>
          </select>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" className="control-button" onClick={onRerun}>
            重新运行
          </button>
          <button type="button" className="control-button" onClick={onResetLevel}>
            重置关卡
          </button>
        </div>
        {level.rules.sequence ? (
          <div className="mt-2 text-[11px] text-muted">
            {formatTemplate(ZH.hud.sequenceHint, {
              order: level.rules.sequence.order.join('→'),
              maxGap: level.rules.sequence.maxGap,
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        {order.map((key) => (
          <ReceiverGauge key={key} receiver={sim.receivers[key]} />
        ))}
      </div>

      <div className="mt-3 rounded-button border border-line bg-panel2 p-3 text-xs text-muted">
        <div className="mb-2 font-medium text-text">{ZH.hud.stats}</div>
        <div className="stat-grid">
          <div>
            <div className="stat-k">{ZH.hud.placed}</div>
            <div className="stat-v">{sim.stats.placedCount}</div>
          </div>
          <div>
            <div className="stat-k">{ZH.hud.beamSteps}</div>
            <div className="stat-v">{sim.stats.totalTicks}</div>
          </div>
          <div>
            <div className="stat-k">{ZH.hud.bounces}</div>
            <div className="stat-v">{sim.stats.bounceCount}</div>
          </div>
          <div>
            <div className="stat-k">{ZH.hud.leaks}</div>
            <div className="stat-v">{sim.stats.leakCount}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 rounded-button border border-line bg-panel2 p-3 text-xs text-muted">
        <div className="mb-2 font-medium text-text">{ZH.hud.events}</div>
        <div className="space-y-1 overflow-auto pr-1">
          {visibleEvents.length === 0 ? (
            <div className="text-muted/80">{ZH.hud.eventsEmpty}</div>
          ) : (
            visibleEvents.map((event, index) => (
              <div key={`${event.type}-${event.tick}-${index}`} className="rounded-md border border-line bg-panel px-2 py-1">
                {eventText(event)}
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
