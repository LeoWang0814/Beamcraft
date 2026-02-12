import assert from 'node:assert/strict';

import {
  mirrorKindFromDir,
  reflectBackslash,
  reflectByMirrorDir,
  reflectSlash,
  rotateDir,
  type DirVector,
  dirToVector,
  vectorToDir,
} from '../src/engine/directions';
import type { Dir8 } from '../src/engine/types';

const ALL_DIRS: Dir8[] = [0, 1, 2, 3, 4, 5, 6, 7];

const EXPECTED_SLASH: Record<Dir8, Dir8> = {
  0: 2,
  1: 1,
  2: 0,
  3: 7,
  4: 6,
  5: 5,
  6: 4,
  7: 3,
};

const EXPECTED_BACKSLASH: Record<Dir8, Dir8> = {
  0: 6,
  1: 5,
  2: 4,
  3: 3,
  4: 2,
  5: 1,
  6: 0,
  7: 7,
};

function reflectByFormulaSlash(dir: Dir8): Dir8 {
  const { dx, dy } = dirToVector(dir);
  return vectorToDir(-dy, -dx);
}

function reflectByFormulaBackslash(dir: Dir8): Dir8 {
  const { dx, dy } = dirToVector(dir);
  return vectorToDir(dy, dx);
}

function runReflectionTableTests(): void {
  for (const dir of ALL_DIRS) {
    assert.equal(reflectSlash(dir), EXPECTED_SLASH[dir], `slash table mismatch for dir ${dir}`);
    assert.equal(reflectBackslash(dir), EXPECTED_BACKSLASH[dir], `backslash table mismatch for dir ${dir}`);

    assert.equal(reflectSlash(dir), reflectByFormulaSlash(dir), `slash formula mismatch for dir ${dir}`);
    assert.equal(reflectBackslash(dir), reflectByFormulaBackslash(dir), `backslash formula mismatch for dir ${dir}`);
  }
}

function runInvolutionTests(): void {
  for (const dir of ALL_DIRS) {
    assert.equal(reflectSlash(reflectSlash(dir)), dir, `double slash reflection should return dir ${dir}`);
    assert.equal(reflectBackslash(reflectBackslash(dir)), dir, `double backslash reflection should return dir ${dir}`);
  }
}

function runMirrorKindTests(): void {
  for (const dir of ALL_DIRS) {
    const kind = mirrorKindFromDir(dir);
    if (dir % 2 === 0) {
      assert.equal(kind, '/', `dir ${dir} should map to / mirror`);
    } else {
      assert.equal(kind, '\\', `dir ${dir} should map to \\ mirror`);
    }
  }
}

function runEdgeCaseTests(): void {
  const cardinal: Dir8[] = [0, 2, 4, 6];

  for (const dir of cardinal) {
    const slash = reflectSlash(dir);
    const backslash = reflectBackslash(dir);

    assert.notEqual(slash, dir, `cardinal dir ${dir} should change on slash reflection`);
    assert.notEqual(backslash, dir, `cardinal dir ${dir} should change on backslash reflection`);

    const byMirrorSlash = reflectByMirrorDir(dir, 0);
    const byMirrorBackslash = reflectByMirrorDir(dir, 1);
    assert.equal(byMirrorSlash, slash, `mirror-dir slash mismatch for dir ${dir}`);
    assert.equal(byMirrorBackslash, backslash, `mirror-dir backslash mismatch for dir ${dir}`);
  }
}

function runRotationConsistencyTests(): void {
  for (const dir of ALL_DIRS) {
    const rotated = rotateDir(dir, 8);
    assert.equal(rotated, dir, `full rotation should preserve dir ${dir}`);

    const vec: DirVector = dirToVector(dir);
    const roundTrip = vectorToDir(vec.dx, vec.dy);
    assert.equal(roundTrip, dir, `vector roundtrip mismatch for dir ${dir}`);
  }
}

runReflectionTableTests();
runInvolutionTests();
runMirrorKindTests();
runEdgeCaseTests();
runRotationConsistencyTests();

console.log('[PASS] reflection harness: all deterministic mirror reflection checks succeeded');
