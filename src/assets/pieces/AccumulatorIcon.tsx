import { ICON_STROKE } from './types';
import type { PieceIconProps } from './types';

export function AccumulatorIcon({ className }: PieceIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect x="8" y="8" width="48" height="48" rx="10" fill="rgba(255,255,255,0.03)" stroke="currentColor" {...ICON_STROKE} />
      <rect x="18" y="20" width="28" height="24" rx="8" fill="rgba(255,255,255,0.03)" stroke="currentColor" {...ICON_STROKE} />
      <path d="M16 32h6" stroke="var(--ray-g)" {...ICON_STROKE} />
      <path d="M42 32h10" stroke="var(--ray-white)" {...ICON_STROKE} />
      <rect x="22" y="24" width="4" height="16" rx="2" fill="var(--ray-g)" opacity="0.5" />
      <rect x="28" y="24" width="4" height="16" rx="2" fill="var(--ray-g)" opacity="0.65" />
      <rect x="34" y="24" width="4" height="16" rx="2" fill="var(--ray-g)" opacity="0.8" />
    </svg>
  );
}
