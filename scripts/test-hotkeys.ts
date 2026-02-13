import assert from 'node:assert/strict';

import { isRedo, isUndo, resolveToolHotkey } from '../src/app/hotkeys';

function keyInput(partial: Partial<{
  key: string;
  code: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}> = {}) {
  return {
    key: partial.key ?? '',
    code: partial.code,
    ctrlKey: partial.ctrlKey ?? false,
    metaKey: partial.metaKey ?? false,
    shiftKey: partial.shiftKey ?? false,
  };
}

assert.equal(resolveToolHotkey(keyInput({ code: 'Digit1' })), 'MIRROR');
assert.equal(resolveToolHotkey(keyInput({ code: 'Digit5' })), 'FILTER_B');
assert.equal(resolveToolHotkey(keyInput({ code: 'Digit9' })), 'GATE');
assert.equal(resolveToolHotkey(keyInput({ code: 'Numpad6' })), 'MIXER');
assert.equal(resolveToolHotkey(keyInput({ key: '7' })), 'SPLITTER');
assert.equal(resolveToolHotkey(keyInput({ key: '0' })), null);

assert.equal(isUndo(keyInput({ key: 'z', ctrlKey: true })), true);
assert.equal(isUndo(keyInput({ key: 'z', metaKey: true })), true);
assert.equal(isUndo(keyInput({ key: 'z', ctrlKey: true, shiftKey: true })), false);

assert.equal(isRedo(keyInput({ key: 'y', ctrlKey: true })), true);
assert.equal(isRedo(keyInput({ key: 'z', ctrlKey: true, shiftKey: true })), true);
assert.equal(isRedo(keyInput({ key: 'y' })), false);

console.log('[PASS] hotkey parser checks passed');
