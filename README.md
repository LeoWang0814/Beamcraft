# Beamcraft - Grid Prism Puzzle

一个以 **D8 离散导光 + Tick 时序推理** 为核心的 2D 网格解谜小游戏。
当前版本支持全中文 UI、本地自定义关卡编辑与字符串分享。

## Run

```bash
npm install
npm run dev
```

## Build / Preview

```bash
npm run build
npm run preview
```

## Validation Scripts

```bash
npm run check:reflection
npm run check:levels
npm run check:timing
npm run check:hotkeys
npm run lint
```

## Core Rules

- D8 离散方向（每 45° 一档）
- 统一 Tick：每束光每 tick 前进 1 格
- 颜色 bitmask：`R=1`、`G=2`、`B=4`、`W=7`
- 棱镜模板：`G` 直行、`R` 左偏 45°、`B` 右偏 45°
- 防死循环：`maxTicks` + visited 状态上限 + `maxBounces`

## New Time Rules

- `sync + syncWindow (+ syncTargets)`：指定接收器必须在时间窗口内达标
- `sequence`：按指定顺序点亮（每步最大 tick 间隔）

## Tools

- 基础：`MIRROR`、`PRISM`、`FILTER_R/G/B`
- 时序扩展：`MIXER`、`SPLITTER`、`DELAY`、`GATE`
- 逻辑扩展：`LOGIC_GATE`、`ACCUMULATOR`

## Controls

- `1..9` 选择工具（与 Tool Dock 卡片编号对应）
- `R` 顺时针旋转 45°
- `Shift + R` 逆时针旋转 45°
- `Delete / Backspace` 删除选中元件
- `Ctrl/⌘ + Z` 撤销
- `Ctrl/⌘ + Y` 或 `Ctrl/⌘ + Shift + Z` 重做
- 顶栏 / HUD 支持 `重新运行`（保留摆放，从节拍 0 重跑）与 `重置关卡`（恢复关卡初始状态）

## UI Guide

- TopBar：上一关/下一关、分组下拉切关、Overview、Undo/Redo、重新运行、重置关卡、自定义关卡
- Tool Dock：库存、未解锁预告、快捷键、选中高亮
- Board：网格 + Canvas 光路 + SVG 元件（默认自由放置，`buildPads` 仅为提示）
- Mission HUD：规则状态、接收器进度、节拍控制（播放/暂停/单步/x1-x2-x4）与关键事件流
- Inspector：旋转/删除、Delay/Gate/Mixer/Logic/Accumulator 参数调节、解法串

## Level Set

- Tutorial：`T01..T06`（6 关）
- Basic：`B01..B07`（7 关）
- Intermediate：`I01..I07`（7 关）
- Advanced：`A01..A08`（8 关）

共 28 关。

## Custom Level & Share

- 入口：顶栏 `自定义关卡`
- 支持编辑：
  - 网格尺寸、规则（purity/sync/sequence/maxTicks/maxBounces）
  - 固定元件、墙体、阻断格
  - 工具库存
- 分享字符串格式：
  - `BC1.<payloadBase64Url>.<checksum>`
  - payload = `{ version: 1, level }`
  - checksum = FNV-1a
- 导入安全校验：
  - 字符串长度限制
  - 网格尺寸与元件数量上限
  - 非法字段拒绝并提示中文错误
- 支持 hash 链接导入：`#lvl=...`

## Project Structure

```text
src/
  app/
    App.tsx
    editorState.ts
    hotkeys.ts
  engine/
    types.ts
    directions.ts
    colors.ts
    levelLoader.ts
    sim.ts
  render/
    Board.tsx
    RaysCanvas.tsx
    SvgPiece.tsx
  ui/
    tokens.css
    i18n.ts
    TopBar.tsx
    Toolbar.tsx
    Hud.tsx
    Inspector.tsx
    LevelOverview.tsx
    CustomLevelEditor.tsx
  custom/
    levelShare.ts
  assets/pieces/
    ... all piece SVG React icons (64x64 unified style)
  levels/
    T01..T06 / B01..B07 / I01..I07 / A01..A08
scripts/
  test-reflection.ts
  verify-levels.ts
  check-timing.ts
  test-hotkeys.ts
```

## Add a New Level

1. 在 `src/levels/` 新增 `*.json`
2. 必填字段：
   `id`, `title`, `difficulty`, `subtitle`, `objective`, `hint`, `designerNote`, `grid`, `mode`, `fixed`, `walls`, `inventory`, `rules`
3. 在 `scripts/verify-levels.ts` 添加该关已知可解 placement
4. 运行 `npm run check:levels`

## Deploy (Vercel)

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
