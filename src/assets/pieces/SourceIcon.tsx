import type { PieceIconProps } from './types';
import { ICON_STROKE } from './types';

export function SourceIcon({ className }: PieceIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect x="8" y="8" width="48" height="48" rx="10" fill="rgba(255,255,255,0.03)" stroke="currentColor" {...ICON_STROKE} />
      <circle cx="24" cy="32" r="6" fill="var(--ray-white)" />
      <path d="M33 32h17" stroke="currentColor" {...ICON_STROKE} />
      <path d="M46 27l6 5-6 5" stroke="currentColor" {...ICON_STROKE} />
      <circle cx="18" cy="18" r="2" fill="var(--ray-r)" />
      <circle cx="24" cy="18" r="2" fill="var(--ray-g)" />
      <circle cx="30" cy="18" r="2" fill="var(--ray-b)" />
    </svg>
  );
}
