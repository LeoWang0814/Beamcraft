import { decomposeIntensity } from './colors';
import {
  COLOR_BITS,
  FILTER_TO_COLOR,
  RECEIVER_TYPE_TO_KEY,
  type BeamPath,
  type BeamState,
  type ColorMask,
  type Dir8,
  type LevelDefinition,
  type LogicGateMode,
  type PieceInstance,
  type Placement,
  type ReceiverKey,
  type ReceiverRuntime,
  type SimEvent,
  type SimResult,
} from './types';
import { dirToVector, reflectByMirrorDir, rotateDir } from './directions';

const LOOP_VISIT_LIMIT = 8;
const DELAY_QUEUE_CAPACITY = 8;

export interface SimOptions {
  tickLimit?: number;
}

interface RuntimeBeam extends BeamState {
  segmentId: number;
}

interface DelayedBeam {
  releaseTick: number;
  x: number;
  y: number;
  dir: Dir8;
  color: ColorMask;
  intensity: number;
}

interface AccumulatorState {
  charge: number;
  pulseRemaining: number;
}

function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

function inBounds(level: LevelDefinition, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < level.grid.w && y < level.grid.h;
}

function clampDelayTicks(value: number | undefined): 1 | 2 | 3 {
  if (value === 2 || value === 3) {
    return value;
  }
  return 1;
}

function clampGateTicks(value: number | undefined): number {
  const normalized = Math.floor(value ?? 1);
  return Math.max(1, Math.min(9, normalized));
}

function clampLogicMode(mode: LogicGateMode | undefined): LogicGateMode {
  if (mode === 'XOR' || mode === 'NOT') {
    return mode;
  }
  return 'AND';
}

function clampColorMask(mask: ColorMask | undefined, fallback: ColorMask): ColorMask {
  if (mask === undefined) {
    return fallback;
  }
  return ((mask & COLOR_BITS.W) as ColorMask) || fallback;
}

function clampPositiveInt(value: number | undefined, fallback: number, min: number, max: number): number {
  const normalized = Math.floor(value ?? fallback);
  return Math.max(min, Math.min(max, normalized));
}

function normalizePieceConfig(piece: PieceInstance): PieceInstance {
  if (piece.type === 'DELAY') {
    return {
      ...piece,
      delayTicks: clampDelayTicks(piece.delayTicks),
    };
  }

  if (piece.type === 'GATE') {
    return {
      ...piece,
      gateOpenTicks: clampGateTicks(piece.gateOpenTicks),
      gateCloseTicks: clampGateTicks(piece.gateCloseTicks),
    };
  }

  if (piece.type === 'MIXER') {
    return {
      ...piece,
      mixerRequireDistinct: Boolean(piece.mixerRequireDistinct),
    };
  }

  if (piece.type === 'LOGIC_GATE') {
    return {
      ...piece,
      logicMode: clampLogicMode(piece.logicMode),
      logicOutputColor: clampColorMask(piece.logicOutputColor, COLOR_BITS.W),
    };
  }

  if (piece.type === 'ACCUMULATOR') {
    return {
      ...piece,
      accumulatorTargetColor: clampColorMask(piece.accumulatorTargetColor, COLOR_BITS.G),
      accumulatorThresholdTicks: clampPositiveInt(piece.accumulatorThresholdTicks, 5, 1, 12),
      accumulatorPulseTicks: clampPositiveInt(piece.accumulatorPulseTicks, 2, 1, 8),
      accumulatorOutputColor: clampColorMask(piece.accumulatorOutputColor, COLOR_BITS.G),
      accumulatorOutputIntensity: clampPositiveInt(piece.accumulatorOutputIntensity, 100, 1, 600),
    };
  }

  return piece;
}

function placementToPiece(placement: Placement): PieceInstance {
  return normalizePieceConfig({
    ...placement,
    fixed: false,
    locked: false,
  });
}

function createReceiverState(level: LevelDefinition): Record<ReceiverKey, ReceiverRuntime> {
  const base: Record<ReceiverKey, ReceiverRuntime> = {
    R: { key: 'R', threshold: 100, received: 0, lit: false, contaminated: false, firstSatisfiedTick: null },
    G: { key: 'G', threshold: 100, received: 0, lit: false, contaminated: false, firstSatisfiedTick: null },
    B: { key: 'B', threshold: 100, received: 0, lit: false, contaminated: false, firstSatisfiedTick: null },
  };

  for (const piece of level.fixed) {
    if (piece.type === 'RECV_R' || piece.type === 'RECV_G' || piece.type === 'RECV_B') {
      const key = RECEIVER_TYPE_TO_KEY[piece.type];
      base[key].threshold = piece.threshold ?? 100;
    }
  }

  return base;
}

function updateReceiver(receiver: ReceiverRuntime, energy: number, tick: number): void {
  receiver.received += energy;
  if (receiver.firstSatisfiedTick === null && receiver.received >= receiver.threshold) {
    receiver.firstSatisfiedTick = tick;
  }
}

function registerVisited(visited: Map<string, number>, beam: RuntimeBeam): boolean {
  const key = `${beam.x},${beam.y},${beam.dir},${beam.color},${beam.intensity}`;
  const count = (visited.get(key) ?? 0) + 1;
  visited.set(key, count);
  return count <= LOOP_VISIT_LIMIT;
}

function registerPathPoint(paths: Map<number, BeamPath>, beam: RuntimeBeam, x: number, y: number): void {
  const path = paths.get(beam.segmentId);
  if (!path) {
    return;
  }

  const last = path.points[path.points.length - 1];
  if (!last || last.x !== x || last.y !== y) {
    path.points.push({ x, y });
  }
}

function createRuntimeBeam(params: {
  id: number;
  segmentId: number;
  x: number;
  y: number;
  dir: Dir8;
  color: ColorMask;
  intensity: number;
  tick: number;
  paths: Map<number, BeamPath>;
}): RuntimeBeam {
  const beam: RuntimeBeam = {
    id: params.id,
    segmentId: params.segmentId,
    x: params.x,
    y: params.y,
    dir: params.dir,
    color: params.color,
    intensity: params.intensity,
    tick: params.tick,
  };

  params.paths.set(params.segmentId, {
    id: params.segmentId,
    color: params.color,
    intensity: params.intensity,
    points: [{ x: params.x, y: params.y }],
  });

  return beam;
}

function releaseDelayedBeams(
  delayQueues: Map<string, DelayedBeam[]>,
  tick: number,
  nextBeamId: () => number,
  nextSegmentId: () => number,
  paths: Map<number, BeamPath>,
  events: SimEvent[],
): RuntimeBeam[] {
  const released: RuntimeBeam[] = [];

  for (const [queueKey, queue] of delayQueues.entries()) {
    const keep: DelayedBeam[] = [];

    for (const item of queue) {
      if (item.releaseTick !== tick) {
        keep.push(item);
        continue;
      }

      events.push({
        tick,
        type: 'delay_release',
        x: item.x,
        y: item.y,
        color: item.color,
      });

      released.push(
        createRuntimeBeam({
          id: nextBeamId(),
          segmentId: nextSegmentId(),
          x: item.x,
          y: item.y,
          dir: item.dir,
          color: item.color,
          intensity: item.intensity,
          tick,
          paths,
        }),
      );
    }

    if (keep.length > 0) {
      delayQueues.set(queueKey, keep);
    } else {
      delayQueues.delete(queueKey);
    }
  }

  return released;
}

export function isGateOpenAtTick(piece: PieceInstance, tick: number): boolean {
  const openTicks = clampGateTicks(piece.gateOpenTicks);
  const closeTicks = clampGateTicks(piece.gateCloseTicks);
  const period = openTicks + closeTicks;
  const phase = ((tick - 1) % period + period) % period;
  return phase < openTicks;
}

function evaluateVictory(level: LevelDefinition, receivers: Record<ReceiverKey, ReceiverRuntime>): boolean {
  let victory = (['R', 'G', 'B'] as const).every((key) => receivers[key].lit);

  if (victory && level.rules.purity) {
    victory = (['R', 'G', 'B'] as const).every((key) => !receivers[key].contaminated);
  }

  if (victory && level.rules.sync) {
    const targets = level.rules.syncTargets ?? (['R', 'G', 'B'] as const);
    const ticks = targets.map((key) => receivers[key].firstSatisfiedTick);
    if (ticks.some((tick) => tick === null)) {
      victory = false;
    } else {
      const concreteTicks = ticks as number[];
      const diff = Math.max(...concreteTicks) - Math.min(...concreteTicks);
      victory = diff <= (level.rules.syncWindow ?? 2);
    }
  }

  if (victory && level.rules.sequence) {
    const { order, maxGap } = level.rules.sequence;
    let previousTick: number | null = null;

    for (const key of order) {
      const tick = receivers[key].firstSatisfiedTick;
      if (tick === null) {
        victory = false;
        break;
      }

      if (previousTick !== null) {
        const gap = tick - previousTick;
        if (gap <= 0 || gap > maxGap) {
          victory = false;
          break;
        }
      }

      previousTick = tick;
    }
  }

  return victory;
}

function computeLogicOutput(mode: LogicGateMode, inputs: RuntimeBeam[]): ColorMask {
  if (inputs.length === 0) {
    return COLOR_BITS.NONE;
  }

  const merged = inputs.reduce((sum, beam) => ((sum | beam.color) & COLOR_BITS.W) as ColorMask, COLOR_BITS.NONE as ColorMask);

  if (mode === 'NOT') {
    return (COLOR_BITS.W ^ merged) as ColorMask;
  }

  return merged;
}

export function simulateLevel(level: LevelDefinition, placements: Placement[], options?: SimOptions): SimResult {
  const board = new Map<string, PieceInstance>();
  const events: SimEvent[] = [];

  for (const fixedPiece of level.fixed) {
    board.set(cellKey(fixedPiece.x, fixedPiece.y), normalizePieceConfig(fixedPiece));
  }

  for (const placement of placements) {
    board.set(cellKey(placement.x, placement.y), placementToPiece(placement));
  }

  const blockedCells = level.blockedCells ?? [];
  const walls = new Set([...level.walls, ...blockedCells].map((wall) => cellKey(wall.x, wall.y)));

  const receivers = createReceiverState(level);
  const visited = new Map<string, number>();
  const paths = new Map<number, BeamPath>();
  const delayQueues = new Map<string, DelayedBeam[]>();
  const accumulatorState = new Map<string, AccumulatorState>();

  for (const piece of board.values()) {
    if (piece.type === 'ACCUMULATOR') {
      accumulatorState.set(cellKey(piece.x, piece.y), { charge: 0, pulseRemaining: 0 });
    }
  }

  const tickLimit = Math.min(level.rules.maxTicks, Math.max(0, options?.tickLimit ?? level.rules.maxTicks));

  let beamId = 1;
  let segmentId = 1;
  let totalTicks = 0;
  let elapsedTicks = 0;
  let bounceCount = 0;
  let leakCount = 0;

  const nextBeamId = (): number => {
    const value = beamId;
    beamId += 1;
    return value;
  };

  const nextSegmentId = (): number => {
    const value = segmentId;
    segmentId += 1;
    return value;
  };

  const spawnBeam = (
    beams: RuntimeBeam[],
    payload: {
      x: number;
      y: number;
      dir: Dir8;
      color: ColorMask;
      intensity: number;
      tick: number;
    },
  ): void => {
    if (payload.color === COLOR_BITS.NONE || payload.intensity <= 0) {
      return;
    }

    const beam = createRuntimeBeam({
      id: nextBeamId(),
      segmentId: nextSegmentId(),
      x: payload.x,
      y: payload.y,
      dir: payload.dir,
      color: payload.color,
      intensity: payload.intensity,
      tick: payload.tick,
      paths,
    });

    if (!registerVisited(visited, beam)) {
      return;
    }

    beams.push(beam);
  };

  let activeBeams: RuntimeBeam[] = [];

  for (const piece of level.fixed) {
    if (piece.type !== 'SOURCE') {
      continue;
    }

    spawnBeam(activeBeams, {
      x: piece.x,
      y: piece.y,
      dir: piece.dir,
      color: piece.color ?? COLOR_BITS.W,
      intensity: piece.intensity ?? 300,
      tick: 0,
    });
  }

  let timelineDone = false;

  while (elapsedTicks < tickLimit) {
    const hasAccumulatorPulse = Array.from(accumulatorState.values()).some((state) => state.pulseRemaining > 0);
    if (activeBeams.length === 0 && delayQueues.size === 0 && !hasAccumulatorPulse) {
      timelineDone = true;
      break;
    }

    elapsedTicks += 1;
    const currentTick = elapsedTicks;

    const arrivals = new Map<string, RuntimeBeam[]>();
    const nextActive: RuntimeBeam[] = [];

    for (const [key, state] of accumulatorState.entries()) {
      if (state.pulseRemaining <= 0) {
        continue;
      }

      const piece = board.get(key);
      if (!piece || piece.type !== 'ACCUMULATOR') {
        continue;
      }

      events.push({
        tick: currentTick,
        type: 'accumulator_pulse',
        x: piece.x,
        y: piece.y,
        color: piece.accumulatorOutputColor,
      });

      spawnBeam(nextActive, {
        x: piece.x,
        y: piece.y,
        dir: piece.dir,
        color: piece.accumulatorOutputColor ?? COLOR_BITS.G,
        intensity: piece.accumulatorOutputIntensity ?? 100,
        tick: currentTick,
      });

      state.pulseRemaining -= 1;
    }

    for (const beam of activeBeams) {
      const dirVec = dirToVector(beam.dir);
      const nextX = beam.x + dirVec.dx;
      const nextY = beam.y + dirVec.dy;

      totalTicks += 1;

      if (!inBounds(level, nextX, nextY) || walls.has(cellKey(nextX, nextY))) {
        registerPathPoint(paths, beam, nextX, nextY);
        leakCount += 1;
        continue;
      }

      registerPathPoint(paths, beam, nextX, nextY);
      const movedBeam: RuntimeBeam = {
        ...beam,
        x: nextX,
        y: nextY,
        tick: currentTick,
      };

      const key = cellKey(nextX, nextY);
      const list = arrivals.get(key);
      if (list) {
        list.push(movedBeam);
      } else {
        arrivals.set(key, [movedBeam]);
      }
    }

    const released = releaseDelayedBeams(delayQueues, currentTick, nextBeamId, nextSegmentId, paths, events);
    for (const beam of released) {
      if (registerVisited(visited, beam)) {
        nextActive.push(beam);
      }
    }

    const touchedAccumulators = new Set<string>();

    for (const [key, incoming] of arrivals.entries()) {
      const [xRaw, yRaw] = key.split(',');
      const x = Number(xRaw);
      const y = Number(yRaw);
      const piece = board.get(key);

      if (!piece) {
        for (const beam of incoming) {
          if (registerVisited(visited, beam)) {
            nextActive.push(beam);
          }
        }
        continue;
      }

      if (piece.type === 'SOURCE') {
        continue;
      }

      if (piece.type === 'RECV_R' || piece.type === 'RECV_G' || piece.type === 'RECV_B') {
        const keyColor = RECEIVER_TYPE_TO_KEY[piece.type];

        for (const beam of incoming) {
          const channel = decomposeIntensity(beam.color, beam.intensity);
          const accepted = channel[keyColor];
          const rejected = beam.intensity - accepted;

          if (accepted > 0) {
            updateReceiver(receivers[keyColor], accepted, currentTick);
            events.push({
              tick: currentTick,
              type: 'receiver_hit',
              x,
              y,
              receiver: keyColor,
              color: beam.color,
              amount: accepted,
            });
          }

          if (level.rules.purity) {
            const foreign =
              keyColor === 'R'
                ? channel.G + channel.B
                : keyColor === 'G'
                  ? channel.R + channel.B
                  : channel.R + channel.G;
            if (foreign > 0) {
              receivers[keyColor].contaminated = true;
            }
          }

          if (rejected > 0) {
            leakCount += 1;
          }
        }

        continue;
      }

      if (piece.type === 'FILTER_R' || piece.type === 'FILTER_G' || piece.type === 'FILTER_B') {
        const keyColor = FILTER_TO_COLOR[piece.type];

        for (const beam of incoming) {
          const channel = decomposeIntensity(beam.color, beam.intensity);
          const pass = channel[keyColor];

          if (pass <= 0) {
            continue;
          }

          const outputColor = keyColor === 'R' ? COLOR_BITS.R : keyColor === 'G' ? COLOR_BITS.G : COLOR_BITS.B;
          spawnBeam(nextActive, {
            x,
            y,
            dir: beam.dir,
            color: outputColor,
            intensity: pass,
            tick: currentTick,
          });
        }

        continue;
      }

      if (piece.type === 'MIRROR') {
        for (const beam of incoming) {
          if (bounceCount >= level.rules.maxBounces) {
            continue;
          }

          bounceCount += 1;
          spawnBeam(nextActive, {
            x,
            y,
            dir: reflectByMirrorDir(beam.dir, piece.dir),
            color: beam.color,
            intensity: beam.intensity,
            tick: currentTick,
          });
        }

        continue;
      }

      if (piece.type === 'PRISM') {
        for (const beam of incoming) {
          const channel = decomposeIntensity(beam.color, beam.intensity);

          if (channel.R > 0) {
            spawnBeam(nextActive, {
              x,
              y,
              dir: rotateDir(piece.dir, -1),
              color: COLOR_BITS.R,
              intensity: channel.R,
              tick: currentTick,
            });
          }

          if (channel.G > 0) {
            spawnBeam(nextActive, {
              x,
              y,
              dir: piece.dir,
              color: COLOR_BITS.G,
              intensity: channel.G,
              tick: currentTick,
            });
          }

          if (channel.B > 0) {
            spawnBeam(nextActive, {
              x,
              y,
              dir: rotateDir(piece.dir, 1),
              color: COLOR_BITS.B,
              intensity: channel.B,
              tick: currentTick,
            });
          }
        }

        continue;
      }

      if (piece.type === 'SPLITTER') {
        for (const beam of incoming) {
          spawnBeam(nextActive, {
            x,
            y,
            dir: piece.dir,
            color: beam.color,
            intensity: beam.intensity,
            tick: currentTick,
          });

          spawnBeam(nextActive, {
            x,
            y,
            dir: rotateDir(piece.dir, 2),
            color: beam.color,
            intensity: beam.intensity,
            tick: currentTick,
          });
        }

        continue;
      }

      if (piece.type === 'DELAY') {
        const queueKey = key;
        const queue = delayQueues.get(queueKey) ?? [];
        const delayTicks = clampDelayTicks(piece.delayTicks);

        for (const beam of incoming) {
          if (queue.length >= DELAY_QUEUE_CAPACITY) {
            leakCount += 1;
            continue;
          }

          queue.push({
            releaseTick: currentTick + delayTicks,
            x,
            y,
            dir: piece.dir,
            color: beam.color,
            intensity: beam.intensity,
          });
        }

        if (queue.length > 0) {
          delayQueues.set(queueKey, queue);
        }

        continue;
      }

      if (piece.type === 'GATE') {
        const gateOpen = isGateOpenAtTick(piece, currentTick);

        for (const beam of incoming) {
          if (!gateOpen) {
            leakCount += 1;
            events.push({ tick: currentTick, type: 'gate_block', x, y, color: beam.color });
            continue;
          }

          events.push({ tick: currentTick, type: 'gate_pass', x, y, color: beam.color });
          spawnBeam(nextActive, {
            x,
            y,
            dir: beam.dir,
            color: beam.color,
            intensity: beam.intensity,
            tick: currentTick,
          });
        }

        continue;
      }

      if (piece.type === 'MIXER') {
        const usable = incoming.filter((beam) => beam.intensity > 0 && beam.color !== COLOR_BITS.NONE);
        const uniqueDirs = new Set(usable.map((beam) => beam.dir));
        const meetsDistinct = !piece.mixerRequireDistinct || uniqueDirs.size >= 2;

        if (usable.length >= 2 && meetsDistinct) {
          const mergedColor = usable.reduce(
            (sum, beam) => ((sum | beam.color) & COLOR_BITS.W) as ColorMask,
            COLOR_BITS.NONE as ColorMask,
          );
          const mergedIntensity = usable.reduce((sum, beam) => sum + beam.intensity, 0);

          events.push({
            tick: currentTick,
            type: 'mixer_trigger',
            x,
            y,
            color: mergedColor,
            amount: mergedIntensity,
          });

          spawnBeam(nextActive, {
            x,
            y,
            dir: piece.dir,
            color: mergedColor,
            intensity: mergedIntensity,
            tick: currentTick,
          });
        } else {
          leakCount += usable.length;
        }

        continue;
      }

      if (piece.type === 'LOGIC_GATE') {
        const usable = incoming.filter((beam) => beam.intensity > 0 && beam.color !== COLOR_BITS.NONE);
        const mode = clampLogicMode(piece.logicMode);
        const shouldTrigger =
          mode === 'AND' ? usable.length >= 2 : mode === 'XOR' ? usable.length === 1 : usable.length > 0;

        if (shouldTrigger) {
          const outColor = mode === 'NOT' ? computeLogicOutput('NOT', usable) : piece.logicOutputColor ?? computeLogicOutput(mode, usable);
          const outIntensity = usable.reduce((sum, beam) => sum + beam.intensity, 0);

          events.push({
            tick: currentTick,
            type: 'logic_trigger',
            x,
            y,
            color: outColor,
            amount: outIntensity,
            meta: mode,
          });

          spawnBeam(nextActive, {
            x,
            y,
            dir: piece.dir,
            color: outColor,
            intensity: outIntensity,
            tick: currentTick,
          });
        } else {
          leakCount += usable.length;
        }

        continue;
      }

      if (piece.type === 'ACCUMULATOR') {
        touchedAccumulators.add(key);
        const state = accumulatorState.get(key) ?? { charge: 0, pulseRemaining: 0 };

        const targetColor = piece.accumulatorTargetColor ?? COLOR_BITS.G;
        const threshold = clampPositiveInt(piece.accumulatorThresholdTicks, 5, 1, 12);
        const active = incoming.some((beam) => (beam.color & targetColor) !== 0);

        if (active) {
          state.charge += 1;
          events.push({
            tick: currentTick,
            type: 'accumulator_charge',
            x,
            y,
            color: targetColor,
            amount: state.charge,
          });
        } else {
          state.charge = 0;
        }

        if (state.charge >= threshold && state.pulseRemaining <= 0) {
          state.charge = 0;
          state.pulseRemaining = clampPositiveInt(piece.accumulatorPulseTicks, 2, 1, 8);
        }

        accumulatorState.set(key, state);
        continue;
      }

      for (const beam of incoming) {
        if (registerVisited(visited, beam)) {
          nextActive.push(beam);
        }
      }
    }

    for (const [accKey, state] of accumulatorState.entries()) {
      if (touchedAccumulators.has(accKey) || state.pulseRemaining > 0) {
        continue;
      }

      // 连续计数规则：未被命中时归零。
      if (state.charge !== 0) {
        state.charge = 0;
        accumulatorState.set(accKey, state);
      }
    }

    activeBeams = nextActive;
  }

  if (!timelineDone) {
    const hasAccumulatorPulse = Array.from(accumulatorState.values()).some((state) => state.pulseRemaining > 0);
    if (activeBeams.length === 0 && delayQueues.size === 0 && !hasAccumulatorPulse) {
      timelineDone = true;
    }
  }

  for (const key of ['R', 'G', 'B'] as const) {
    receivers[key].lit = receivers[key].received >= receivers[key].threshold;
  }

  const victory = evaluateVictory(level, receivers);

  const solveTick = victory
    ? Math.max(receivers.R.firstSatisfiedTick ?? 0, receivers.G.firstSatisfiedTick ?? 0, receivers.B.firstSatisfiedTick ?? 0)
    : null;

  const resolvedPaths = Array.from(paths.values()).filter((path) => path.points.length > 1);

  return {
    paths: resolvedPaths,
    receivers,
    events,
    victory,
    timelineDone,
    stats: {
      placedCount: placements.length,
      totalTicks,
      elapsedTicks,
      tickLimit,
      bounceCount,
      leakCount,
      solveTick,
    },
  };
}

export function getCombinedPieces(level: LevelDefinition, placements: Placement[]): PieceInstance[] {
  return [...level.fixed.map(normalizePieceConfig), ...placements.map(placementToPiece)];
}

export function isPlaceablePiece(type: PieceInstance['type']): boolean {
  return (
    type === 'PRISM' ||
    type === 'MIRROR' ||
    type === 'FILTER_R' ||
    type === 'FILTER_G' ||
    type === 'FILTER_B' ||
    type === 'MIXER' ||
    type === 'SPLITTER' ||
    type === 'DELAY' ||
    type === 'GATE' ||
    type === 'LOGIC_GATE' ||
    type === 'ACCUMULATOR'
  );
}

export function findPieceAt(pieces: PieceInstance[], x: number, y: number): PieceInstance | undefined {
  return pieces.find((piece) => piece.x === x && piece.y === y);
}

export function pointBlocked(level: LevelDefinition, x: number, y: number): boolean {
  if (!inBounds(level, x, y)) {
    return true;
  }

  const blocked = level.blockedCells ?? [];
  return [...level.walls, ...blocked].some((wall) => wall.x === x && wall.y === y);
}

export function pieceColorMask(piece: PieceInstance): ColorMask {
  if (piece.type === 'FILTER_R' || piece.type === 'RECV_R') {
    return COLOR_BITS.R;
  }
  if (piece.type === 'FILTER_G' || piece.type === 'RECV_G') {
    return COLOR_BITS.G;
  }
  if (piece.type === 'FILTER_B' || piece.type === 'RECV_B') {
    return COLOR_BITS.B;
  }
  if (piece.type === 'LOGIC_GATE') {
    return piece.logicOutputColor ?? COLOR_BITS.W;
  }
  if (piece.type === 'ACCUMULATOR') {
    return piece.accumulatorOutputColor ?? COLOR_BITS.G;
  }
  return piece.color ?? COLOR_BITS.W;
}

