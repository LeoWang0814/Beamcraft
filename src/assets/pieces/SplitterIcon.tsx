import { ICON_STROKE } from './types';
import type { PieceIconProps } from './types';

export function SplitterIcon({ className }: PieceIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect x="8" y="8" width="48" height="48" rx="10" fill="rgba(255,255,255,0.03)" stroke="currentColor" {...ICON_STROKE} />
      <rect x="22" y="22" width="20" height="20" rx="6" fill="rgba(255,255,255,0.02)" stroke="currentColor" {...ICON_STROKE} />
      <path d="M14 32h10" stroke="var(--ray-white)" {...ICON_STROKE} />
      <path d="M40 32h10" stroke="var(--ray-white)" {...ICON_STROKE} />
      <path d="M32 24V14" stroke="var(--ray-white)" {...ICON_STROKE} />
      <path d="M44 32l6-4-6-4" stroke="currentColor" {...ICON_STROKE} />
      <path d="M32 20l-4-6-4 6" stroke="currentColor" {...ICON_STROKE} />
    </svg>
  );
}
