import assert from 'node:assert/strict';

import { simulateLevel } from '../src/engine/sim';
import { COLOR_BITS, type LevelDefinition } from '../src/engine/types';

const baseRules = {
  purity: false,
  sync: false,
  maxBounces: 64,
  maxTicks: 80,
} as const;

function makeReceivers(thresholdR = 100, thresholdG = 0, thresholdB = 0) {
  return [
    { id: 'recv-r', type: 'RECV_R' as const, x: 5, y: 3, dir: 0 as const, threshold: thresholdR, locked: true },
    { id: 'recv-g', type: 'RECV_G' as const, x: 0, y: 0, dir: 0 as const, threshold: thresholdG, locked: true },
    { id: 'recv-b', type: 'RECV_B' as const, x: 6, y: 0, dir: 0 as const, threshold: thresholdB, locked: true },
  ];
}

const mixerSameTickLevel: LevelDefinition = {
  id: 'timing-mixer-same',
  title: 'timing mixer same tick',
  difficulty: 'tutorial',
  subtitle: 'timing',
  objective: 'timing',
  hint: 'timing',
  designerNote: 'timing',
  grid: { w: 7, h: 7 },
  mode: 'D8',
  fixed: [
    { id: 'src-r', type: 'SOURCE', x: 1, y: 3, dir: 0, color: COLOR_BITS.R, intensity: 100, locked: true },
    { id: 'src-g', type: 'SOURCE', x: 3, y: 1, dir: 6, color: COLOR_BITS.G, intensity: 100, locked: true },
    { id: 'mix', type: 'MIXER', x: 3, y: 3, dir: 0, mixerRequireDistinct: true, locked: true },
    ...makeReceivers(),
  ],
  walls: [],
  inventory: [],
  rules: baseRules,
};

const mixerMisalignedLevel: LevelDefinition = {
  ...mixerSameTickLevel,
  id: 'timing-mixer-misaligned',
  fixed: [
    { id: 'src-r', type: 'SOURCE', x: 1, y: 3, dir: 0, color: COLOR_BITS.R, intensity: 100, locked: true },
    { id: 'src-g', type: 'SOURCE', x: 3, y: 1, dir: 6, color: COLOR_BITS.G, intensity: 100, locked: true },
    { id: 'delay-r', type: 'DELAY', x: 2, y: 3, dir: 0, delayTicks: 1, locked: true },
    { id: 'mix', type: 'MIXER', x: 3, y: 3, dir: 0, mixerRequireDistinct: true, locked: true },
    ...makeReceivers(),
  ],
};

const delayLevel: LevelDefinition = {
  id: 'timing-delay',
  title: 'timing delay',
  difficulty: 'tutorial',
  subtitle: 'timing',
  objective: 'timing',
  hint: 'timing',
  designerNote: 'timing',
  grid: { w: 7, h: 7 },
  mode: 'D8',
  fixed: [
    { id: 'src-r', type: 'SOURCE', x: 1, y: 3, dir: 0, color: COLOR_BITS.R, intensity: 100, locked: true },
    { id: 'delay-r', type: 'DELAY', x: 2, y: 3, dir: 0, delayTicks: 2, locked: true },
    ...makeReceivers(),
  ],
  walls: [],
  inventory: [],
  rules: baseRules,
};

const gateOpenLevel: LevelDefinition = {
  id: 'timing-gate-open',
  title: 'timing gate open',
  difficulty: 'tutorial',
  subtitle: 'timing',
  objective: 'timing',
  hint: 'timing',
  designerNote: 'timing',
  grid: { w: 7, h: 7 },
  mode: 'D8',
  fixed: [
    { id: 'src-r', type: 'SOURCE', x: 1, y: 3, dir: 0, color: COLOR_BITS.R, intensity: 100, locked: true },
    { id: 'gate', type: 'GATE', x: 2, y: 3, dir: 0, gateOpenTicks: 1, gateCloseTicks: 1, locked: true },
    ...makeReceivers(),
  ],
  walls: [],
  inventory: [],
  rules: baseRules,
};

const gateBlockedLevel: LevelDefinition = {
  ...gateOpenLevel,
  id: 'timing-gate-block',
  fixed: [
    { id: 'src-r', type: 'SOURCE', x: 0, y: 3, dir: 0, color: COLOR_BITS.R, intensity: 100, locked: true },
    { id: 'gate', type: 'GATE', x: 2, y: 3, dir: 0, gateOpenTicks: 1, gateCloseTicks: 1, locked: true },
    ...makeReceivers(),
  ],
};

const logicAndLevel: LevelDefinition = {
  id: 'timing-logic-and',
  title: 'timing logic and',
  difficulty: 'advanced',
  subtitle: 'timing',
  objective: 'timing',
  hint: 'timing',
  designerNote: 'timing',
  grid: { w: 7, h: 7 },
  mode: 'D8',
  fixed: [
    { id: 'src-r', type: 'SOURCE', x: 1, y: 3, dir: 0, color: COLOR_BITS.R, intensity: 100, locked: true },
    { id: 'src-g', type: 'SOURCE', x: 3, y: 1, dir: 6, color: COLOR_BITS.G, intensity: 100, locked: true },
    { id: 'logic-and', type: 'LOGIC_GATE', x: 3, y: 3, dir: 0, logicMode: 'AND', logicOutputColor: COLOR_BITS.R, locked: true },
    ...makeReceivers(),
  ],
  walls: [],
  inventory: [],
  rules: baseRules,
};

const logicXorLevel: LevelDefinition = {
  ...logicAndLevel,
  id: 'timing-logic-xor-block',
  fixed: [
    { id: 'src-r', type: 'SOURCE', x: 1, y: 3, dir: 0, color: COLOR_BITS.R, intensity: 100, locked: true },
    { id: 'src-g', type: 'SOURCE', x: 3, y: 1, dir: 6, color: COLOR_BITS.G, intensity: 100, locked: true },
    { id: 'logic-xor', type: 'LOGIC_GATE', x: 3, y: 3, dir: 0, logicMode: 'XOR', logicOutputColor: COLOR_BITS.R, locked: true },
    ...makeReceivers(),
  ],
};

const accumulatorLevel: LevelDefinition = {
  id: 'timing-accumulator',
  title: 'timing accumulator',
  difficulty: 'advanced',
  subtitle: 'timing',
  objective: 'timing',
  hint: 'timing',
  designerNote: 'timing',
  grid: { w: 7, h: 7 },
  mode: 'D8',
  fixed: [
    { id: 'src-g', type: 'SOURCE', x: 1, y: 3, dir: 0, color: COLOR_BITS.G, intensity: 100, locked: true },
    {
      id: 'acc',
      type: 'ACCUMULATOR',
      x: 2,
      y: 3,
      dir: 0,
      accumulatorTargetColor: COLOR_BITS.G,
      accumulatorThresholdTicks: 1,
      accumulatorPulseTicks: 2,
      accumulatorOutputColor: COLOR_BITS.R,
      accumulatorOutputIntensity: 100,
      locked: true,
    },
    ...makeReceivers(200, 0, 0),
  ],
  walls: [],
  inventory: [],
  rules: baseRules,
};

const sameTick = simulateLevel(mixerSameTickLevel, []);
assert.equal(sameTick.victory, true, 'mixer should merge when two beams arrive in the same tick');

const misaligned = simulateLevel(mixerMisalignedLevel, []);
assert.equal(misaligned.victory, false, 'mixer should fail when inputs are not same-tick aligned');

const delayed = simulateLevel(delayLevel, []);
assert.equal(delayed.receivers.R.firstSatisfiedTick, 6, 'delay=2 should shift receiver hit to deterministic tick');

const gateOpen = simulateLevel(gateOpenLevel, []);
assert.equal(gateOpen.receivers.R.firstSatisfiedTick, 4, 'gate should pass on open phase');

const gateBlocked = simulateLevel(gateBlockedLevel, []);
assert.equal(gateBlocked.victory, false, 'gate should block when beam arrives on close phase');

const logicAnd = simulateLevel(logicAndLevel, []);
assert.equal(logicAnd.receivers.R.firstSatisfiedTick, 4, 'logic AND should output when two inputs arrive same tick');

const logicXor = simulateLevel(logicXorLevel, []);
assert.equal(logicXor.victory, false, 'logic XOR should reject dual-input same-tick arrivals');

const accumulator = simulateLevel(accumulatorLevel, []);
assert.equal(accumulator.receivers.R.firstSatisfiedTick, 6, 'accumulator pulse should hit receiver on deterministic tick');
assert.equal(
  accumulator.events.filter((event) => event.type === 'accumulator_pulse').length,
  2,
  'accumulator should emit configured pulse count',
);

console.log('[PASS] timing harness: mixer/delay/gate/logic/accumulator behaviors are deterministic');
