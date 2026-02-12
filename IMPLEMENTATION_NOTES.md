# IMPLEMENTATION_NOTES

## 目标与范围（MVP）
- 交付一个可本地运行且可部署 Vercel 的 2D 网格解谜 Demo。
- 技术栈固定：Vite + React + TypeScript + Tailwind CSS。
- 本阶段仅实现 D8（8 向）基础规则，不实现 D16 连续推进。

## 强制玩法规则（必须实现）
- 方向模式：D8（0~7，每 45°）。
- 时间推进：统一 Tick，光束每 Tick 固定前进 1 格（格中心到格中心）。
- 光束状态：`(x, y, dir, colorMask, intensity, tick)`。
- 交互触发：光束进入格中心时，若格子有元件则触发该元件规则。
- 颜色模型：bitmask（R=1, G=2, B=4, W=7）。
- 强度模型：整数强度，白光默认 300；分色后按颜色数量平均拆分。
- 棱镜规则：
  - G 沿棱镜朝向直行；
  - R 为相对直行左偏 45°；
  - B 为相对直行右偏 45°；
  - 输入为混色时，仅输出包含的颜色子束。
- 镜子规则：离散查表反射，支持 `/` 与 `\\` 两种有效姿态（通过 45°旋转切换）。
- 滤镜规则：仅透过指定色分量，其余吸收。
- 接收器规则：
  - R/G/B 接收器分别累计对应颜色强度；
  - 达到阈值（默认 100）点亮；
  - 三者全部达标则通关。
- 终止与保护：越界/撞墙终止；`maxTicks` + `visited(cell,dir,color)` 防死循环。

## 编辑与交互（必须实现）
- 放置：工具栏选择后点击格子放置。
- 构建位：部分关卡使用 `buildPads` 限制放置区域，减少无效试错。
- 旋转：`R` 顺时针 45°，`Shift+R` 逆时针 45°（选中元件时）。
- 删除：`Delete/Backspace` 删除选中元件。
- 撤销重做：`Ctrl+Z/Ctrl+Y`，至少覆盖放置/旋转/删除。
- 关卡切换时：清空选中与历史（编辑状态重置）。

## UI 与视觉规范（必须实现）
- 布局：顶栏 + 左侧工具栏 + 中央棋盘 + 右侧 HUD。
- 顶栏：关卡名、关卡切换、Undo/Redo、重置。
- 工具栏：元件库存、选中状态、快捷键提示。
- HUD：接收器进度、通关提示、统计（放置数/ticks/反射次数）。
- 网格：轻量格线；墙体/不可放置格清晰但克制。

## 设计 tokens（集中管理）
- 间距体系：8/16/24/32。
- 圆角：面板 12px，按钮 10px，网格单元 8px。
- 阴影：统一轻阴影（两层低透明）。
- 色板（CSS Variables / Tailwind theme）：
  - `bg #0C1118`
  - `panel #131B27`
  - `panel2 #1A2432`
  - `panel3 #223044`
  - `text #EDF3FF`
  - `muted #99A8C2`
  - `accent #5EA5FF`
  - `rayR #FF5D75`
  - `rayG #5AF594`
  - `rayB #5F87FF`
- SVG 统一规范：
  - `viewBox="0 0 64 64"`
  - `stroke-width="2"`
  - `stroke-linecap="round"`
  - `stroke-linejoin="round"`

## 渲染策略
- 光路：Canvas 独立层绘制 polyline + 轻微 glow；仅状态变化时重绘。
- 元件：SVG overlay（自绘、统一风格）。

## 工程结构约束
- `engine/`：纯逻辑与类型。
- `render/`：Canvas / board 渲染。
- `ui/`：面板与交互组件。
- `assets/pieces/`：统一 64x64 SVG 元件组件。
- `levels/`：至少 L01/L02/L03 三关 JSON。

## 验收清单映射
- [x] D8 + 1格/tick + 防死循环
- [x] Prism/Mirror/Filter/Receiver 规则正确
- [x] 放置/旋转/删除 + Undo/Redo
- [x] 顶栏/工具栏/HUD 完整
- [x] Canvas 光路 + SVG 元件
- [x] 3 关可通关
- [x] README 启动说明 + 快捷键 + 结构说明
