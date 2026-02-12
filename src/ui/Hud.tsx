import { receiverColor } from '../engine/colors';
import type { ReceiverKey, ReceiverRuntime, SimResult } from '../engine/types';

interface HudProps {
  sim: SimResult;
  purityEnabled: boolean;
}

function progress(receiver: ReceiverRuntime): number {
  if (receiver.threshold <= 0) {
    return 1;
  }
  return Math.max(0, Math.min(1, receiver.received / receiver.threshold));
}

function ReceiverCard({ receiver, purityEnabled }: { receiver: ReceiverRuntime; purityEnabled: boolean }) {
  const pct = progress(receiver);
  const color = receiverColor(receiver.key);

  return (
    <div className="rounded-button border border-white/10 bg-panel2 p-2">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted">{receiver.key} Receiver</span>
        <span style={{ color }}>{receiver.received}/{receiver.threshold}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${Math.round(pct * 100)}%`, backgroundColor: color }}
        />
      </div>
      <div className="mt-2 text-[11px] text-muted">
        {receiver.lit ? '已达标' : '未达标'}
        {purityEnabled && receiver.contaminated ? ' · 受污染' : ''}
      </div>
    </div>
  );
}

export function Hud({ sim, purityEnabled }: HudProps) {
  const order: ReceiverKey[] = ['R', 'G', 'B'];

  return (
    <aside className="panel p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">状态</div>
        <div className={`rounded px-2 py-1 text-xs ${sim.victory ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-muted'}`}>
          {sim.victory ? '通关' : '进行中'}
        </div>
      </div>

      <div className="space-y-2">
        {order.map((key) => (
          <ReceiverCard key={key} receiver={sim.receivers[key]} purityEnabled={purityEnabled} />
        ))}
      </div>

      <div className="mt-4 border-t border-white/10 pt-3 text-xs text-muted">
        <div className="mb-1 text-text">统计</div>
        <div>放置数: {sim.stats.placedCount}</div>
        <div>Ticks: {sim.stats.totalTicks}</div>
        <div>反射次数: {sim.stats.bounceCount}</div>
        <div>漏光计数: {sim.stats.leakCount}</div>
      </div>
    </aside>
  );
}
