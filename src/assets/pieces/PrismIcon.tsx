import type { PieceIconProps } from './types';
import { ICON_STROKE } from './types';

export function PrismIcon({ className }: PieceIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect x="8" y="8" width="48" height="48" rx="10" fill="rgba(255,255,255,0.03)" stroke="currentColor" {...ICON_STROKE} />
      <path d="M20 44l12-24 12 24z" fill="rgba(255,255,255,0.03)" stroke="currentColor" {...ICON_STROKE} />
      <path d="M32 20v26" stroke="var(--ray-g)" {...ICON_STROKE} />
      <path d="M32 20l-10 18" stroke="var(--ray-r)" {...ICON_STROKE} />
      <path d="M32 20l10 18" stroke="var(--ray-b)" {...ICON_STROKE} />
    </svg>
  );
}
