import type { PieceIconProps } from './types';
import { ICON_STROKE } from './types';

interface ReceiverIconProps extends PieceIconProps {
  tone: 'R' | 'G' | 'B';
}

function toneColor(tone: 'R' | 'G' | 'B'): string {
  if (tone === 'R') {
    return 'var(--ray-r)';
  }
  if (tone === 'G') {
    return 'var(--ray-g)';
  }
  return 'var(--ray-b)';
}

export function ReceiverIcon({ className, tone }: ReceiverIconProps) {
  const color = toneColor(tone);

  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect x="8" y="8" width="48" height="48" rx="10" fill="rgba(255,255,255,0.03)" stroke="currentColor" {...ICON_STROKE} />
      <circle cx="32" cy="32" r="14" stroke={color} {...ICON_STROKE} />
      <circle cx="32" cy="32" r="7" fill="rgba(255,255,255,0.06)" stroke="currentColor" {...ICON_STROKE} />
      <path d="M32 17v4" stroke={color} {...ICON_STROKE} />
      <path d="M47 32h-4" stroke={color} {...ICON_STROKE} />
      <path d="M32 47v-4" stroke={color} {...ICON_STROKE} />
      <path d="M17 32h4" stroke={color} {...ICON_STROKE} />
    </svg>
  );
}
