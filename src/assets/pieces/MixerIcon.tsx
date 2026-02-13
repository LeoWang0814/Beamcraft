import { ICON_STROKE } from './types';
import type { PieceIconProps } from './types';

export function MixerIcon({ className }: PieceIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect x="8" y="8" width="48" height="48" rx="10" fill="rgba(255,255,255,0.03)" stroke="currentColor" {...ICON_STROKE} />
      <circle cx="32" cy="32" r="11" fill="rgba(255,255,255,0.02)" stroke="currentColor" {...ICON_STROKE} />
      <path d="M14 24h10" stroke="var(--ray-r)" {...ICON_STROKE} />
      <path d="M18 40h6" stroke="var(--ray-g)" {...ICON_STROKE} />
      <path d="M40 32h10" stroke="var(--ray-white)" {...ICON_STROKE} />
      <circle cx="26" cy="24" r="2" fill="var(--ray-r)" />
      <circle cx="24" cy="40" r="2" fill="var(--ray-g)" />
      <circle cx="38" cy="32" r="2" fill="var(--ray-b)" />
      <circle cx="32" cy="32" r="3" fill="var(--ray-white)" />
    </svg>
  );
}
