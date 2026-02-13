import { ICON_STROKE } from './types';
import type { PieceIconProps } from './types';

export function GateIcon({ className }: PieceIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect x="8" y="8" width="48" height="48" rx="10" fill="rgba(255,255,255,0.03)" stroke="currentColor" {...ICON_STROKE} />
      <rect x="20" y="18" width="24" height="28" rx="6" fill="rgba(255,255,255,0.02)" stroke="currentColor" {...ICON_STROKE} />
      <path d="M14 32h10" stroke="var(--ray-white)" {...ICON_STROKE} />
      <path d="M40 32h10" stroke="var(--ray-white)" {...ICON_STROKE} />
      <path d="M30 22v20" stroke="currentColor" {...ICON_STROKE} />
      <path d="M34 22v20" stroke="currentColor" {...ICON_STROKE} />
      <circle cx="32" cy="32" r="2" fill="var(--accent)" />
    </svg>
  );
}
