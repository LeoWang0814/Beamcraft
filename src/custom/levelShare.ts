import type { LevelDefinition, PieceInstance } from '../engine/types';

const SHARE_PREFIX = 'BC1';
const MAX_STRING_LENGTH = 12000;
const MAX_GRID_SIZE = 24;
const MAX_FIXED = 240;
const MAX_WALLS = 360;

interface EncodedPayload {
  version: 1;
  level: LevelDefinition;
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function toBase64Url(input: string): string {
  if (typeof window === 'undefined' || typeof window.btoa !== 'function') {
    throw new Error('当前环境不支持导出字符串');
  }

  const bytes = new TextEncoder().encode(input);
  let binary = '';
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
  }

  return window
    .btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  if (typeof window === 'undefined' || typeof window.atob !== 'function') {
    throw new Error('当前环境不支持导入字符串');
  }

  const binary = window.atob(padded);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function sanitizeFixedPieces(fixed: PieceInstance[]): PieceInstance[] {
  return fixed.map((piece, index) => ({
    ...piece,
    id: piece.id ?? `custom-fixed-${index}`,
    fixed: true,
    locked: true,
  }));
}

export function encodeLevelToShare(level: LevelDefinition): string {
  const payload: EncodedPayload = {
    version: 1,
    level,
  };

  const json = JSON.stringify(payload);
  const body = toBase64Url(json);
  const checksum = fnv1a(body);
  return `${SHARE_PREFIX}.${body}.${checksum}`;
}

export function parseSharedLevel(input: string): LevelDefinition {
  if (!input || input.length > MAX_STRING_LENGTH) {
    throw new Error('字符串长度非法');
  }

  const trimmed = input.trim();
  const [prefix, body, checksum] = trimmed.split('.');
  if (prefix !== SHARE_PREFIX || !body || !checksum) {
    throw new Error('字符串格式非法');
  }

  if (fnv1a(body) !== checksum) {
    throw new Error('校验失败，字符串可能损坏');
  }

  let payload: EncodedPayload;
  try {
    payload = JSON.parse(fromBase64Url(body)) as EncodedPayload;
  } catch {
    throw new Error('字符串解码失败');
  }

  if (!payload || payload.version !== 1 || !payload.level) {
    throw new Error('版本或内容非法');
  }

  return validateAndNormalizeLevel(payload.level);
}

export function validateAndNormalizeLevel(level: LevelDefinition): LevelDefinition {
  if (!level || level.mode !== 'D8') {
    throw new Error('关卡模式非法');
  }

  const width = Number(level.grid?.w ?? 0);
  const height = Number(level.grid?.h ?? 0);
  if (width < 4 || width > MAX_GRID_SIZE || height < 4 || height > MAX_GRID_SIZE) {
    throw new Error('网格尺寸超出允许范围');
  }

  if ((level.fixed?.length ?? 0) > MAX_FIXED) {
    throw new Error('固定元件数量过多');
  }

  if ((level.walls?.length ?? 0) > MAX_WALLS) {
    throw new Error('墙体数量过多');
  }

  const rules = level.rules ?? {
    purity: false,
    sync: false,
    maxBounces: 64,
    maxTicks: 240,
  };

  const normalized: LevelDefinition = {
    ...level,
    id: level.id || 'CUST',
    title: level.title || '自定义关卡',
    subtitle: level.subtitle || '由玩家创建',
    objective: level.objective || '点亮接收器并满足规则',
    hint: level.hint || '先连通，再优化时序',
    designerNote: level.designerNote || '分享自定义关卡',
    difficulty: 'custom',
    grid: { w: width, h: height },
    fixed: sanitizeFixedPieces(level.fixed ?? []),
    walls: level.walls ?? [],
    blockedCells: level.blockedCells ?? [],
    inventory: level.inventory ?? [],
    rules: {
      ...rules,
      maxTicks: Math.max(40, Math.min(800, Math.floor(rules.maxTicks))),
      maxBounces: Math.max(8, Math.min(512, Math.floor(rules.maxBounces))),
    },
  };

  return normalized;
}

export function toShareHashPayload(level: LevelDefinition): string {
  return `#lvl=${encodeURIComponent(encodeLevelToShare(level))}`;
}
