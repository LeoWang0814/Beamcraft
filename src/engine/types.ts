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
  | 'RECV_R'
  | 'RECV_G'
  | 'RECV_B';

export type PlaceablePieceType = 'PRISM' | 'MIRROR' | 'FILTER_R' | 'FILTER_G' | 'FILTER_B';

export interface GridPoint {
  x: number;
  y: number;
}

export interface PieceInstance {
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

export interface Placement {
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
  maxBounces: number;
  maxTicks: number;
}

export interface LevelDefinition {
  id: string;
  title: string;
  subtitle?: string;
  objective?: string;
  hint?: string;
  designerNote?: string;
  buildPads?: GridPoint[];
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
  bounceCount: number;
  leakCount: number;
  solveTick: number | null;
}

export interface SimResult {
  paths: BeamPath[];
  receivers: Record<ReceiverKey, ReceiverRuntime>;
  victory: boolean;
  stats: SimStats;
}

export const PLACEABLE_ORDER: PlaceablePieceType[] = ['MIRROR', 'PRISM', 'FILTER_R', 'FILTER_G', 'FILTER_B'];

export const PIECE_LABELS: Record<PieceType, string> = {
  SOURCE: '光源',
  PRISM: '棱镜',
  MIRROR: '镜子',
  FILTER_R: '红滤镜',
  FILTER_G: '绿滤镜',
  FILTER_B: '蓝滤镜',
  RECV_R: '红接收器',
  RECV_G: '绿接收器',
  RECV_B: '蓝接收器',
};

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
