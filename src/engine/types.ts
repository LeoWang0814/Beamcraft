export type Dir8 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const COLOR_BITS = {
  NONE: 0,
  R: 1,
  G: 2,
  B: 4,
  W: 7,
} as const;

export type ColorMask = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PieceType =
  | 'SOURCE'
  | 'PRISM'
  | 'MIRROR'
  | 'FILTER_R'
  | 'FILTER_G'
  | 'FILTER_B'
  | 'MIXER'
  | 'SPLITTER'
  | 'DELAY'
  | 'GATE'
  | 'LOGIC_GATE'
  | 'ACCUMULATOR'
  | 'RECV_R'
  | 'RECV_G'
  | 'RECV_B';

export type PlaceablePieceType =
  | 'PRISM'
  | 'MIRROR'
  | 'FILTER_R'
  | 'FILTER_G'
  | 'FILTER_B'
  | 'MIXER'
  | 'SPLITTER'
  | 'DELAY'
  | 'GATE'
  | 'LOGIC_GATE'
  | 'ACCUMULATOR';

export interface GridPoint {
  x: number;
  y: number;
}

export interface PieceConfig {
  delayTicks?: 1 | 2 | 3;
  gateOpenTicks?: number;
  gateCloseTicks?: number;
  mixerRequireDistinct?: boolean;
  logicMode?: LogicGateMode;
  logicOutputColor?: ColorMask;
  accumulatorTargetColor?: ColorMask;
  accumulatorThresholdTicks?: number;
  accumulatorPulseTicks?: number;
  accumulatorOutputColor?: ColorMask;
  accumulatorOutputIntensity?: number;
}

export interface PieceInstance extends PieceConfig {
  id?: string;
  type: PieceType;
  x: number;
  y: number;
  dir: Dir8;
  color?: ColorMask;
  intensity?: number;
  threshold?: number;
  locked?: boolean;
  fixed?: boolean;
}

export interface Placement extends PieceConfig {
  id: string;
  type: PlaceablePieceType;
  x: number;
  y: number;
  dir: Dir8;
}

export interface InventoryItem {
  type: PlaceablePieceType;
  count: number;
}

export interface LevelRules {
  purity: boolean;
  sync: boolean;
  syncWindow?: number;
  syncTargets?: ReceiverKey[];
  sequence?: SequenceRule;
  maxBounces: number;
  maxTicks: number;
}

export interface SequenceRule {
  order: ReceiverKey[];
  maxGap: number;
}

export type LevelDifficulty = 'tutorial' | 'basic' | 'intermediate' | 'advanced' | 'custom';

export type LogicGateMode = 'AND' | 'XOR' | 'NOT';

export interface LevelDefinition {
  id: string;
  title: string;
  difficulty: LevelDifficulty;
  subtitle?: string;
  objective?: string;
  hint?: string;
  designerNote?: string;
  buildPads?: GridPoint[];
  blockedCells?: GridPoint[];
  allowedArea?: GridPoint[];
  maxPieces?: number;
  maxPlaceByType?: Partial<Record<PlaceablePieceType, number>>;
  grid: {
    w: number;
    h: number;
  };
  mode: 'D8';
  fixed: PieceInstance[];
  walls: GridPoint[];
  inventory: InventoryItem[];
  rules: LevelRules;
}

export interface BeamState {
  id: number;
  x: number;
  y: number;
  dir: Dir8;
  color: ColorMask;
  intensity: number;
  tick: number;
}

export interface BeamPath {
  id: number;
  color: ColorMask;
  intensity: number;
  points: GridPoint[];
}

export type ReceiverKey = 'R' | 'G' | 'B';

export interface ReceiverRuntime {
  key: ReceiverKey;
  threshold: number;
  received: number;
  lit: boolean;
  contaminated: boolean;
  firstSatisfiedTick: number | null;
}

export interface SimStats {
  placedCount: number;
  totalTicks: number;
  elapsedTicks: number;
  tickLimit: number;
  bounceCount: number;
  leakCount: number;
  solveTick: number | null;
}

export interface SimResult {
  paths: BeamPath[];
  receivers: Record<ReceiverKey, ReceiverRuntime>;
  events: SimEvent[];
  victory: boolean;
  timelineDone: boolean;
  stats: SimStats;
}

export const PLACEABLE_ORDER: PlaceablePieceType[] = [
  'MIRROR',
  'PRISM',
  'FILTER_R',
  'FILTER_G',
  'FILTER_B',
  'MIXER',
  'SPLITTER',
  'DELAY',
  'GATE',
  'LOGIC_GATE',
  'ACCUMULATOR',
];

export const PIECE_LABELS: Record<PieceType, string> = {
  SOURCE: '光源',
  PRISM: '棱镜',
  MIRROR: '镜子',
  FILTER_R: '红滤镜',
  FILTER_G: '绿滤镜',
  FILTER_B: '蓝滤镜',
  MIXER: '混色器',
  SPLITTER: '分光器',
  DELAY: '延迟器',
  GATE: '门控器',
  LOGIC_GATE: '逻辑门',
  ACCUMULATOR: '累积器',
  RECV_R: '红接收器',
  RECV_G: '绿接收器',
  RECV_B: '蓝接收器',
};

export type SimEventType =
  | 'receiver_hit'
  | 'gate_pass'
  | 'gate_block'
  | 'delay_release'
  | 'mixer_trigger'
  | 'logic_trigger'
  | 'accumulator_charge'
  | 'accumulator_pulse';

export interface SimEvent {
  tick: number;
  type: SimEventType;
  x: number;
  y: number;
  receiver?: ReceiverKey;
  color?: ColorMask;
  amount?: number;
  meta?: string;
}

export const FILTER_TO_COLOR: Record<'FILTER_R' | 'FILTER_G' | 'FILTER_B', ReceiverKey> = {
  FILTER_R: 'R',
  FILTER_G: 'G',
  FILTER_B: 'B',
};

export const RECEIVER_TYPE_TO_KEY: Record<'RECV_R' | 'RECV_G' | 'RECV_B', ReceiverKey> = {
  RECV_R: 'R',
  RECV_G: 'G',
  RECV_B: 'B',
};
