# Beamcraft - Grid Prism Puzzle MVP

2D Web 解谜 Demo（Vite + React + TypeScript + Tailwind），核心玩法是网格内放置/旋转元件并实时重算光路。

## 本地启动

```bash
npm install
npm run dev
```

## 生产构建与预览

```bash
npm run build
npm run preview
```

## 键位

- `1` 选择镜子
- `2` 选择棱镜
- `3` 选择红滤镜
- `4` 选择绿滤镜
- `5` 选择蓝滤镜
- `R` 顺时针旋转 45°（选中元件）
- `Shift + R` 逆时针旋转 45°（选中元件）
- `Delete` / `Backspace` 删除选中元件
- `Ctrl + Z` 撤销
- `Ctrl + Y` 重做

## 规则摘要

- D8（8 向，每 45°）
- Tick 推进：1 格 / tick
- 颜色 bitmask：`R=1`、`G=2`、`B=4`、`W=7`
- 棱镜分色：`G` 直行，`R` 左偏 45°，`B` 右偏 45°
- 滤镜仅透过目标色，接收器按阈值累计
- 防死循环：`maxTicks` + `(cell,dir,color)` 访问计数

## 项目结构

```text
src/
  app/
    App.tsx                 # 应用装配、状态、键位、关卡切换
    editorState.ts          # 编辑状态机（放置/旋转/删除/Undo/Redo）
  engine/
    types.ts                # 类型系统
    directions.ts           # D8 方向与反射规则
    colors.ts               # 颜色与强度分解
    levelLoader.ts          # 从 src/levels/*.json 加载关卡
    sim.ts                  # 光路模拟引擎
  render/
    Board.tsx               # 棋盘网格 + 元件层 + 光路层
    RaysCanvas.tsx          # Canvas 光路渲染
    SvgPiece.tsx            # SVG 元件渲染
  ui/
    tokens.css              # 设计 tokens
    TopBar.tsx              # 顶栏
    Toolbar.tsx             # 工具栏
    Hud.tsx                 # 接收器状态与统计
  assets/
    pieces/                 # 自绘统一风格 SVG 元件组件
  levels/
    L01.json
    L02.json
    L03.json
```

## 如何新增关卡

1. 在 `src/levels/` 新增 `Lxx.json`。
2. 按现有关卡字段编写：`grid/mode/fixed/walls/inventory/rules`。
3. 关卡会由 `import.meta.glob('../levels/*.json')` 自动加载。

## 部署到 Vercel

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
