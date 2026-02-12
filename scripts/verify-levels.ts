import fs from 'node:fs';
import path from 'node:path';

import { simulateLevel } from '../src/engine/sim';
import type { LevelDefinition, Placement } from '../src/engine/types';

const levelIds = ['L01', 'L02', 'L03'] as const;

const knownSolutions: Record<string, Placement[]> = {
  L01: [{ id: 'p1', type: 'MIRROR', x: 7, y: 6, dir: 0 }],
  L02: [{ id: 'p1', type: 'FILTER_G', x: 10, y: 6, dir: 0 }],
  L03: [
    { id: 'p1', type: 'MIRROR', x: 6, y: 6, dir: 0 },
    { id: 'p2', type: 'MIRROR', x: 6, y: 4, dir: 1 },
  ],
};

function loadLevel(id: string): LevelDefinition {
  const filePath = path.join(process.cwd(), 'src', 'levels', `${id}.json`);
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw) as LevelDefinition;
}

let failed = false;

for (const id of levelIds) {
  const level = loadLevel(id);
  const placements = knownSolutions[id];
  const result = simulateLevel(level, placements);

  if (!result.victory) {
    failed = true;
    console.error(`[FAIL] ${id}: expected victory=true, got false`);
    continue;
  }

  console.log(
    `[PASS] ${id}: R=${result.receivers.R.received}, G=${result.receivers.G.received}, B=${result.receivers.B.received}, ticks=${result.stats.totalTicks}`,
  );
}

if (failed) {
  process.exit(1);
}
