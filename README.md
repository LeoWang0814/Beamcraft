# Beamcraft - Grid Prism Puzzle

一个强调“清晰可推理”的 2D 导光解谜 Demo。你在棋盘上放置/旋转元件，引导 RGB 光束点亮三色接收器。

## 运行

```bash
npm install
npm run dev
```

## 构建与预览

```bash
npm run build
npm run preview
```

## 核心玩法

- D8 离散方向（每 45° 一档）
- 统一 Tick：每束光每 Tick 前进 1 格
- 颜色 bitmask：`R=1`、`G=2`、`B=4`、`W=7`
- 棱镜模板：`G` 直行、`R` 左偏 45°、`B` 右偏 45°
- 滤镜只透目标色，接收器按阈值累计
- 防死循环：`maxTicks` + `visited(cell,dir,color)` + `maxBounces`

## 操作键位

- `1..5` 选择工具（镜子 / 棱镜 / R/G/B 滤镜）
- `R` 顺时针旋转 45°
- `Shift + R` 逆时针旋转 45°
- `Delete` / `Backspace` 删除选中元件
- `Ctrl/⌘ + Z` 撤销
- `Ctrl/⌘ + Y` 或 `Ctrl/⌘ + Shift + Z` 重做

## 界面说明

- 左侧 `Tool Dock`：元件库存、功能描述、快捷键
- 中央 `Board`：网格 + Canvas 光路 + SVG 元件
- 右侧 `Mission`：关卡目标、提示、规则开关、接收器环形进度
- 左下 `Inspector`：选中元件详情、旋转/删除、解法串复制

说明：部分关卡启用了 `buildPads`，只有高亮构建位可放置元件，用于降低试错噪声、突出谜题意图。

## 项目结构

```text
src/
  app/
    App.tsx
    editorState.ts
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
    TopBar.tsx
    Toolbar.tsx
    Hud.tsx
    Inspector.tsx
  assets/pieces/
    SourceIcon.tsx
    PrismIcon.tsx
    MirrorIcon.tsx
    Filter*.tsx
    Receiver*.tsx
  levels/
    L01.json
    L02.json
    L03.json
```

## 新增关卡

1. 在 `src/levels/` 新增 `Lxx.json`。
2. 至少包含：`grid`、`mode`、`fixed`、`walls`、`inventory`、`rules`。
3. 可选增强字段：`subtitle`、`objective`、`hint`、`designerNote`、`buildPads`。
4. 文件会由 `import.meta.glob('../levels/*.json')` 自动加载。

## Vercel 部署

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
