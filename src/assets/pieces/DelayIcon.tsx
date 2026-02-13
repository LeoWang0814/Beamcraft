import { ICON_STROKE } from './types';
import type { PieceIconProps } from './types';

export function DelayIcon({ className }: PieceIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect x="8" y="8" width="48" height="48" rx="10" fill="rgba(255,255,255,0.03)" stroke="currentColor" {...ICON_STROKE} />
      <circle cx="32" cy="32" r="13" fill="rgba(255,255,255,0.02)" stroke="currentColor" {...ICON_STROKE} />
      <path d="M32 25v8l6 4" stroke="var(--ray-white)" {...ICON_STROKE} />
      <path d="M16 32h6" stroke="var(--ray-white)" {...ICON_STROKE} />
      <path d="M42 32h6" stroke="var(--ray-white)" {...ICON_STROKE} />
      <circle cx="22" cy="20" r="2" fill="var(--ray-r)" />
      <circle cx="28" cy="20" r="2" fill="var(--ray-g)" />
      <circle cx="34" cy="20" r="2" fill="var(--ray-b)" />
    </svg>
  );
}
