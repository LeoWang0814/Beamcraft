import type { LevelDefinition, PieceInstance } from './types';

type RawLevelModule = { default: LevelDefinition } | LevelDefinition;

const LEVEL_MODULES = import.meta.glob('../levels/*.json', {
  eager: true,
}) as Record<string, RawLevelModule>;

function ensureIds(level: LevelDefinition): LevelDefinition {
  const fixed: PieceInstance[] = level.fixed.map((piece, index) => ({
    ...piece,
    id: piece.id ?? `fixed-${level.id}-${index}`,
    fixed: true,
  }));

  return {
    ...level,
    fixed,
  };
}

export function loadLevels(): LevelDefinition[] {
  const levels = Object.values(LEVEL_MODULES)
    .map((moduleValue) => ('default' in moduleValue ? moduleValue.default : moduleValue))
    .map(ensureIds)
    .sort((a, b) => a.id.localeCompare(b.id));

  return levels;
}
