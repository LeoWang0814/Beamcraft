import { ICON_STROKE } from './types';
import type { PieceIconProps } from './types';

export function LogicGateIcon({ className }: PieceIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect x="8" y="8" width="48" height="48" rx="10" fill="rgba(255,255,255,0.03)" stroke="currentColor" {...ICON_STROKE} />
      <path d="M18 22h10" stroke="var(--ray-r)" {...ICON_STROKE} />
      <path d="M18 42h10" stroke="var(--ray-g)" {...ICON_STROKE} />
      <path d="M46 32h8" stroke="var(--ray-white)" {...ICON_STROKE} />
      <path d="M28 18h10c7 0 12 6 12 14s-5 14-12 14H28z" fill="rgba(255,255,255,0.03)" stroke="currentColor" {...ICON_STROKE} />
      <path d="M32 24h8" stroke="currentColor" {...ICON_STROKE} />
      <path d="M32 32h8" stroke="currentColor" {...ICON_STROKE} />
      <path d="M32 40h8" stroke="currentColor" {...ICON_STROKE} />
    </svg>
  );
}
