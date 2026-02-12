import type { PieceIconProps } from './types';
import { ICON_STROKE } from './types';

interface FilterIconProps extends PieceIconProps {
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

export function FilterIcon({ className, tone }: FilterIconProps) {
  const color = toneColor(tone);

  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect x="8" y="8" width="48" height="48" rx="10" fill="rgba(255,255,255,0.03)" stroke="currentColor" {...ICON_STROKE} />
      <rect x="18" y="20" width="28" height="24" rx="7" fill="rgba(255,255,255,0.02)" stroke="currentColor" {...ICON_STROKE} transform="rotate(-18 32 32)" />
      <path d="M20 38l26-9" stroke={color} {...ICON_STROKE} />
      <path d="M18 33l26-9" stroke={color} {...ICON_STROKE} opacity="0.8" />
      <path d="M22 43l26-9" stroke={color} {...ICON_STROKE} opacity="0.6" />
    </svg>
  );
}
