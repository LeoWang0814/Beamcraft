import fs from 'node:fs';
import path from 'node:path';

import { simulateLevel } from '../src/engine/sim';
import type { LevelDefinition, LevelDifficulty, Placement } from '../src/engine/types';

const levelsDir = path.join(process.cwd(), 'src', 'levels');
const fileNames = fs.readdirSync(levelsDir).filter((file) => file.endsWith('.json')).sort();

const knownSolutions: Record<string, Placement[]> = {
  T01: [{ id: 'p1', type: 'MIRROR', x: 7, y: 6, dir: 0 }],
  T02: [{ id: 'p1', type: 'MIRROR', x: 7, y: 6, dir: 0 }],
  T03: [
    { id: 'p1', type: 'MIRROR', x: 7, y: 6, dir: 0 },
    { id: 'p2', type: 'FILTER_G', x: 9, y: 3, dir: 0 },
  ],
  T04: [{ id: 'p1', type: 'MIRROR', x: 9, y: 0, dir: 1 }],
  B01: [
    { id: 'p1', type: 'MIRROR', x: 7, y: 6, dir: 0 },
    { id: 'p2', type: 'MIRROR', x: 7, y: 1, dir: 1 },
  ],
  B02: [
    { id: 'p1', type: 'MIRROR', x: 7, y: 6, dir: 1 },
    { id: 'p2', type: 'FILTER_G', x: 9, y: 9, dir: 0 },
  ],
  B03: [
    { id: 'p1', type: 'MIRROR', x: 5, y: 6, dir: 0 },
    { id: 'p2', type: 'MIRROR', x: 5, y: 3, dir: 0 },
  ],
  B04: [{ id: 'p1', type: 'MIRROR', x: 7, y: 6, dir: 1 }],
  B05: [
    { id: 'p1', type: 'MIRROR', x: 7, y: 6, dir: 0 },
    { id: 'p2', type: 'FILTER_B', x: 10, y: 1, dir: 0 },
  ],
  I01: [
    { id: 'p1', type: 'MIRROR', x: 7, y: 6, dir: 0 },
    { id: 'p2', type: 'MIRROR', x: 7, y: 1, dir: 1 },
  ],
  I02: [
    { id: 'p1', type: 'FILTER_B', x: 10, y: 1, dir: 0 },
    { id: 'p2', type: 'FILTER_R', x: 10, y: 11, dir: 0 },
  ],
  I03: [
    { id: 'p1', type: 'PRISM', x: 3, y: 6, dir: 0 },
    { id: 'p2', type: 'MIRROR', x: 7, y: 6, dir: 0 },
  ],
  I04: [
    { id: 'p1', type: 'MIRROR', x: 4, y: 6, dir: 0 },
    { id: 'p2', type: 'MIRROR', x: 4, y: 1, dir: 1 },
  ],
  I05: [
    { id: 'p1', type: 'FILTER_G', x: 10, y: 6, dir: 0 },
  ],
  A01: [{ id: 'p1', type: 'MIRROR', x: 7, y: 6, dir: 0 }],
  A02: [
    { id: 'p1', type: 'FILTER_B', x: 10, y: 1, dir: 0 },
    { id: 'p2', type: 'FILTER_R', x: 10, y: 11, dir: 0 },
  ],
  A03: [
    { id: 'p1', type: 'MIRROR', x: 7, y: 6, dir: 0 },
    { id: 'p2', type: 'FILTER_G', x: 9, y: 3, dir: 0 },
  ],
};

const expectedCounts: Record<LevelDifficulty, number> = {
  tutorial: 4,
  basic: 5,
  intermediate: 5,
  advanced: 3,
};

const levels: LevelDefinition[] = fileNames.map((fileName) => {
  const raw = fs.readFileSync(path.join(levelsDir, fileName), 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw) as LevelDefinition;
});

let failed = false;

const counts: Record<LevelDifficulty, number> = {
  tutorial: 0,
  basic: 0,
  intermediate: 0,
  advanced: 0,
};

for (const level of levels) {
  counts[level.difficulty] += 1;

  if (!level.subtitle || !level.objective || !level.hint || !level.designerNote) {
    failed = true;
    console.error(`[FAIL] ${level.id}: missing one of subtitle/objective/hint/designerNote`);
    continue;
  }

  const placements = knownSolutions[level.id];
  if (!placements) {
    failed = true;
    console.error(`[FAIL] ${level.id}: no known solution in verify script`);
    continue;
  }

  const result = simulateLevel(level, placements);
  if (!result.victory) {
    failed = true;
    console.error(`[FAIL] ${level.id}: expected victory=true, got false`);
    continue;
  }

  console.log(
    `[PASS] ${level.id} (${level.difficulty}): R=${result.receivers.R.received}, G=${result.receivers.G.received}, B=${result.receivers.B.received}, ticks=${result.stats.totalTicks}`,
  );
}

for (const difficulty of Object.keys(expectedCounts) as LevelDifficulty[]) {
  if (counts[difficulty] !== expectedCounts[difficulty]) {
    failed = true;
    console.error(
      `[FAIL] difficulty count mismatch for ${difficulty}: got ${counts[difficulty]}, expected ${expectedCounts[difficulty]}`,
    );
  }
}

const solutionCount = Object.keys(knownSolutions).length;
if (solutionCount !== levels.length) {
  failed = true;
  console.error(`[FAIL] solution count mismatch: got ${solutionCount}, levels ${levels.length}`);
}

if (failed) {
  process.exit(1);
}

console.log('[PASS] level verification completed');
