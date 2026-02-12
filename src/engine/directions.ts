import type { Dir8 } from './types';

export interface DirVector {
  dx: number;
  dy: number;
}

export const DIR8_VECTORS: Record<Dir8, DirVector> = {
  0: { dx: 1, dy: 0 },
  1: { dx: 1, dy: -1 },
  2: { dx: 0, dy: -1 },
  3: { dx: -1, dy: -1 },
  4: { dx: -1, dy: 0 },
  5: { dx: -1, dy: 1 },
  6: { dx: 0, dy: 1 },
  7: { dx: 1, dy: 1 },
};

const VECTOR_TO_DIR: Record<string, Dir8> = {
  '1,0': 0,
  '1,-1': 1,
  '0,-1': 2,
  '-1,-1': 3,
  '-1,0': 4,
  '-1,1': 5,
  '0,1': 6,
  '1,1': 7,
};

export function wrapDir(value: number): Dir8 {
  return (((value % 8) + 8) % 8) as Dir8;
}

export function rotateDir(dir: Dir8, steps: number): Dir8 {
  return wrapDir(dir + steps);
}

export function dirToVector(dir: Dir8): DirVector {
  return DIR8_VECTORS[dir];
}

export function vectorToDir(dx: number, dy: number): Dir8 {
  return VECTOR_TO_DIR[`${dx},${dy}`];
}

export function reflectSlash(dir: Dir8): Dir8 {
  const { dx, dy } = dirToVector(dir);
  return vectorToDir(-dy, -dx);
}

export function reflectBackslash(dir: Dir8): Dir8 {
  const { dx, dy } = dirToVector(dir);
  return vectorToDir(dy, dx);
}

export function mirrorKindFromDir(dir: Dir8): '/' | '\\' {
  return dir % 2 === 0 ? '/' : '\\';
}
