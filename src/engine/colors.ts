import { COLOR_BITS } from './types';
import type { ColorMask, ReceiverKey } from './types';

export const CHANNEL_ORDER: ReceiverKey[] = ['R', 'G', 'B'];

export function hasColor(mask: ColorMask, colorKey: ReceiverKey): boolean {
  return (mask & bitForColor(colorKey)) !== 0;
}

export function bitForColor(colorKey: ReceiverKey): ColorMask {
  if (colorKey === 'R') {
    return COLOR_BITS.R;
  }
  if (colorKey === 'G') {
    return COLOR_BITS.G;
  }
  return COLOR_BITS.B;
}

export function colorCount(mask: ColorMask): number {
  let count = 0;
  if ((mask & COLOR_BITS.R) !== 0) {
    count += 1;
  }
  if ((mask & COLOR_BITS.G) !== 0) {
    count += 1;
  }
  if ((mask & COLOR_BITS.B) !== 0) {
    count += 1;
  }
  return count;
}

export interface ChannelIntensity {
  R: number;
  G: number;
  B: number;
}

export function decomposeIntensity(mask: ColorMask, intensity: number): ChannelIntensity {
  const out: ChannelIntensity = { R: 0, G: 0, B: 0 };
  const active = CHANNEL_ORDER.filter((key) => hasColor(mask, key));
  if (active.length === 0 || intensity <= 0) {
    return out;
  }

  const base = Math.floor(intensity / active.length);
  const remainder = intensity - base * active.length;

  active.forEach((key, index) => {
    out[key] = base + (index < remainder ? 1 : 0);
  });

  return out;
}

export function maskToCss(mask: ColorMask): string {
  switch (mask) {
    case COLOR_BITS.R:
      return 'var(--ray-r)';
    case COLOR_BITS.G:
      return 'var(--ray-g)';
    case COLOR_BITS.B:
      return 'var(--ray-b)';
    case COLOR_BITS.R | COLOR_BITS.G:
      return 'var(--ray-y)';
    case COLOR_BITS.G | COLOR_BITS.B:
      return 'var(--ray-c)';
    case COLOR_BITS.R | COLOR_BITS.B:
      return 'var(--ray-m)';
    case COLOR_BITS.W:
      return 'var(--ray-white)';
    default:
      return 'var(--ray-white)';
  }
}

export function receiverColor(key: ReceiverKey): string {
  if (key === 'R') {
    return 'var(--ray-r)';
  }
  if (key === 'G') {
    return 'var(--ray-g)';
  }
  return 'var(--ray-b)';
}
