import type { PieceIconProps } from './types';
import { ICON_STROKE } from './types';

export function MirrorIcon({ className }: PieceIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect x="8" y="8" width="48" height="48" rx="10" fill="rgba(255,255,255,0.03)" stroke="currentColor" {...ICON_STROKE} />
      <path d="M18 46L46 18" stroke="currentColor" {...ICON_STROKE} />
      <path d="M16 48l4-4" stroke="rgba(255,255,255,0.35)" {...ICON_STROKE} />
      <path d="M44 20l4-4" stroke="rgba(255,255,255,0.35)" {...ICON_STROKE} />
      <path d="M22 42h10" stroke="rgba(255,255,255,0.35)" {...ICON_STROKE} />
    </svg>
  );
}
