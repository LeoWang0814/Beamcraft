import { decomposeIntensity } from './colors';
import {
  COLOR_BITS,
  FILTER_TO_COLOR,
  RECEIVER_TYPE_TO_KEY,
  type BeamPath,
  type BeamState,
  type ColorMask,
  type LevelDefinition,
  type PieceInstance,
  type Placement,
  type ReceiverKey,
  type ReceiverRuntime,
  type SimResult,
} from './types';
import {
  dirToVector,
  mirrorKindFromDir,
  reflectBackslash,
  reflectSlash,
  rotateDir,
} from './directions';

function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

function inBounds(level: LevelDefinition, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < level.grid.w && y < level.grid.h;
}

function placementToPiece(placement: Placement): PieceInstance {
  return {
    ...placement,
    fixed: false,
    locked: false,
  };
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

interface RuntimeBeam extends BeamState {
  segmentId: number;
}

export function simulateLevel(level: LevelDefinition, placements: Placement[]): SimResult {
  const board = new Map<string, PieceInstance>();

  for (const fixedPiece of level.fixed) {
    board.set(cellKey(fixedPiece.x, fixedPiece.y), fixedPiece);
  }
  for (const placement of placements) {
    board.set(cellKey(placement.x, placement.y), placementToPiece(placement));
  }

  const walls = new Set(level.walls.map((wall) => cellKey(wall.x, wall.y)));
  const receivers = createReceiverState(level);

  let segmentId = 1;
  let beamId = 1;
  let totalTicks = 0;
  let bounceCount = 0;
  let leakCount = 0;

  const queue: RuntimeBeam[] = [];
  const paths: BeamPath[] = [];

  for (const piece of level.fixed) {
    if (piece.type !== 'SOURCE') {
      continue;
    }

    queue.push({
      id: beamId,
      segmentId,
      x: piece.x,
      y: piece.y,
      dir: piece.dir,
      color: piece.color ?? COLOR_BITS.W,
      intensity: piece.intensity ?? 300,
      tick: 0,
    });

    beamId += 1;
    segmentId += 1;
  }

  while (queue.length > 0) {
    const beam = queue.shift();
    if (!beam) {
      break;
    }

    const current: RuntimeBeam = { ...beam };
    const points = [{ x: current.x, y: current.y }];
    const visited = new Map<string, number>();

    while (current.tick < level.rules.maxTicks && current.color !== COLOR_BITS.NONE && current.intensity > 0) {
      const dirVec = dirToVector(current.dir);
      const nextX = current.x + dirVec.dx;
      const nextY = current.y + dirVec.dy;

      current.tick += 1;
      totalTicks += 1;

      if (!inBounds(level, nextX, nextY)) {
        points.push({ x: nextX, y: nextY });
        leakCount += 1;
        break;
      }

      if (walls.has(cellKey(nextX, nextY))) {
        points.push({ x: nextX, y: nextY });
        leakCount += 1;
        break;
      }

      current.x = nextX;
      current.y = nextY;
      points.push({ x: current.x, y: current.y });

      const loopKey = `${current.x},${current.y},${current.dir},${current.color}`;
      const loopCount = (visited.get(loopKey) ?? 0) + 1;
      visited.set(loopKey, loopCount);
      if (loopCount > 6) {
        break;
      }

      const piece = board.get(cellKey(current.x, current.y));
      if (!piece) {
        continue;
      }

      if (piece.type === 'SOURCE') {
        break;
      }

      if (piece.type === 'RECV_R' || piece.type === 'RECV_G' || piece.type === 'RECV_B') {
        const key = RECEIVER_TYPE_TO_KEY[piece.type];
        const channel = decomposeIntensity(current.color, current.intensity);
        const accepted = channel[key];
        const rejected = current.intensity - accepted;

        if (accepted > 0) {
          updateReceiver(receivers[key], accepted, current.tick);
        }

        if (level.rules.purity) {
          const foreign = key === 'R' ? channel.G + channel.B : key === 'G' ? channel.R + channel.B : channel.R + channel.G;
          if (foreign > 0) {
            receivers[key].contaminated = true;
          }
        }

        if (rejected > 0) {
          leakCount += 1;
        }

        break;
      }

      if (piece.type === 'FILTER_R' || piece.type === 'FILTER_G' || piece.type === 'FILTER_B') {
        const key = FILTER_TO_COLOR[piece.type];
        const channel = decomposeIntensity(current.color, current.intensity);
        const pass = channel[key];

        if (pass > 0) {
          const color = key === 'R' ? COLOR_BITS.R : key === 'G' ? COLOR_BITS.G : COLOR_BITS.B;
          queue.push({
            id: beamId,
            segmentId,
            x: current.x,
            y: current.y,
            dir: current.dir,
            color,
            intensity: pass,
            tick: current.tick,
          });
          beamId += 1;
          segmentId += 1;
        }

        break;
      }

      if (piece.type === 'MIRROR') {
        if (bounceCount >= level.rules.maxBounces) {
          break;
        }

        bounceCount += 1;
        const kind = mirrorKindFromDir(piece.dir);
        const reflectedDir = kind === '/' ? reflectSlash(current.dir) : reflectBackslash(current.dir);

        queue.push({
          id: beamId,
          segmentId,
          x: current.x,
          y: current.y,
          dir: reflectedDir,
          color: current.color,
          intensity: current.intensity,
          tick: current.tick,
        });
        beamId += 1;
        segmentId += 1;

        break;
      }

      if (piece.type === 'PRISM') {
        const channel = decomposeIntensity(current.color, current.intensity);

        if (channel.R > 0) {
          queue.push({
            id: beamId,
            segmentId,
            x: current.x,
            y: current.y,
            dir: rotateDir(piece.dir, -1),
            color: COLOR_BITS.R,
            intensity: channel.R,
            tick: current.tick,
          });
          beamId += 1;
          segmentId += 1;
        }

        if (channel.G > 0) {
          queue.push({
            id: beamId,
            segmentId,
            x: current.x,
            y: current.y,
            dir: piece.dir,
            color: COLOR_BITS.G,
            intensity: channel.G,
            tick: current.tick,
          });
          beamId += 1;
          segmentId += 1;
        }

        if (channel.B > 0) {
          queue.push({
            id: beamId,
            segmentId,
            x: current.x,
            y: current.y,
            dir: rotateDir(piece.dir, 1),
            color: COLOR_BITS.B,
            intensity: channel.B,
            tick: current.tick,
          });
          beamId += 1;
          segmentId += 1;
        }

        break;
      }
    }

    if (points.length > 1) {
      paths.push({
        id: current.segmentId,
        color: current.color,
        intensity: current.intensity,
        points,
      });
    }
  }

  for (const key of ['R', 'G', 'B'] as const) {
    receivers[key].lit = receivers[key].received >= receivers[key].threshold;
  }

  let victory = (['R', 'G', 'B'] as const).every((key) => receivers[key].lit);

  if (victory && level.rules.purity) {
    victory = (['R', 'G', 'B'] as const).every((key) => !receivers[key].contaminated);
  }

  if (victory && level.rules.sync) {
    const ticks = (['R', 'G', 'B'] as const).map((key) => receivers[key].firstSatisfiedTick);
    if (ticks.some((tick) => tick === null)) {
      victory = false;
    } else {
      const concreteTicks = ticks as number[];
      const diff = Math.max(...concreteTicks) - Math.min(...concreteTicks);
      victory = diff <= (level.rules.syncWindow ?? 2);
    }
  }

  const solveTick = victory
    ? Math.max(
        receivers.R.firstSatisfiedTick ?? 0,
        receivers.G.firstSatisfiedTick ?? 0,
        receivers.B.firstSatisfiedTick ?? 0,
      )
    : null;

  return {
    paths,
    receivers,
    victory,
    stats: {
      placedCount: placements.length,
      totalTicks,
      bounceCount,
      leakCount,
      solveTick,
    },
  };
}

export function getCombinedPieces(level: LevelDefinition, placements: Placement[]): PieceInstance[] {
  return [...level.fixed, ...placements.map(placementToPiece)];
}

export function isPlaceablePiece(type: PieceInstance['type']): boolean {
  return type === 'PRISM' || type === 'MIRROR' || type === 'FILTER_R' || type === 'FILTER_G' || type === 'FILTER_B';
}

export function findPieceAt(pieces: PieceInstance[], x: number, y: number): PieceInstance | undefined {
  return pieces.find((piece) => piece.x === x && piece.y === y);
}

export function pointBlocked(level: LevelDefinition, x: number, y: number): boolean {
  if (!inBounds(level, x, y)) {
    return true;
  }

  return level.walls.some((wall) => wall.x === x && wall.y === y);
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
  return piece.color ?? COLOR_BITS.W;
}
