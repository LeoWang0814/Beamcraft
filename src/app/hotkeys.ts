import type { PlaceablePieceType } from '../engine/types';

export interface KeyInput {
  key: string;
  code?: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

export const TOOL_HOTKEY_ORDER: PlaceablePieceType[] = [
  'MIRROR',
  'PRISM',
  'FILTER_R',
  'FILTER_G',
  'FILTER_B',
  'MIXER',
  'SPLITTER',
  'DELAY',
  'GATE',
];

const CODE_TO_INDEX: Record<string, number> = {
  Digit1: 0,
  Digit2: 1,
  Digit3: 2,
  Digit4: 3,
  Digit5: 4,
  Digit6: 5,
  Digit7: 6,
  Digit8: 7,
  Digit9: 8,
  Numpad1: 0,
  Numpad2: 1,
  Numpad3: 2,
  Numpad4: 3,
  Numpad5: 4,
  Numpad6: 5,
  Numpad7: 6,
  Numpad8: 7,
  Numpad9: 8,
};

const KEY_TO_INDEX: Record<string, number> = {
  '1': 0,
  '2': 1,
  '3': 2,
  '4': 3,
  '5': 4,
  '6': 5,
  '7': 6,
  '8': 7,
  '9': 8,
};

export function isInteractiveElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea';
}

export function resolveToolHotkey(input: KeyInput): PlaceablePieceType | null {
  const codeIndex = input.code ? CODE_TO_INDEX[input.code] : undefined;
  if (codeIndex !== undefined) {
    return TOOL_HOTKEY_ORDER[codeIndex] ?? null;
  }

  const keyIndex = KEY_TO_INDEX[input.key];
  if (keyIndex !== undefined) {
    return TOOL_HOTKEY_ORDER[keyIndex] ?? null;
  }

  return null;
}

export function isUndo(input: KeyInput): boolean {
  const key = input.key.toLowerCase();
  return (input.ctrlKey || input.metaKey) && key === 'z' && !input.shiftKey;
}

export function isRedo(input: KeyInput): boolean {
  const key = input.key.toLowerCase();
  return ((input.ctrlKey || input.metaKey) && key === 'y') || ((input.ctrlKey || input.metaKey) && key === 'z' && input.shiftKey);
}
