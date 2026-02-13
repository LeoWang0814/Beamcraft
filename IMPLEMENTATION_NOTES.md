# IMPLEMENTATION_NOTES

## 目标与范围（MVP+）
- 交付可本地运行且可部署 Vercel 的 2D 网格解谜 Demo。
- 技术栈固定：Vite + React + TypeScript + Tailwind CSS。
- 核心规则保持 D8，不引入 D16 连续推进。

## 强制玩法规则（保持不变）
- 方向模式：D8（0~7，每 45°）。
- 时间推进：统一 Tick，光束每 Tick 固定前进 1 格（格中心到格中心）。
- 颜色模型：bitmask（R=1, G=2, B=4, W=7）。
- 棱镜规则：G 直行，R 左偏 45°，B 右偏 45°。
- 镜子规则：离散反射，`/` 与 `\\` 两类有效姿态。
- 滤镜规则：仅透指定通道。
- 接收器规则：R/G/B 分通道累计，阈值达标。
- 防死循环：`maxTicks` + `visited(cell,dir,color)` + `maxBounces`。

## 编辑与交互
- 放置：工具栏选择后点击格子放置。
- 构建位：`buildPads` 限制可放置区域（可选）。
- 旋转：`R` 顺时针 45°，`Shift+R` 逆时针 45°。
- 删除：`Delete/Backspace`。
- Undo/Redo：`Ctrl/⌘+Z`、`Ctrl/⌘+Y`、`Ctrl/⌘+Shift+Z`。
- 切关：清空选中与编辑历史。

## 关卡结构字段（统一）
- 必填：`id`、`title`、`difficulty`、`subtitle`、`objective`、`hint`、`designerNote`、`grid`、`mode`、`fixed`、`walls`、`inventory`、`rules`
- 可选：`buildPads`
- `difficulty` 枚举：`tutorial` / `basic` / `intermediate` / `advanced`

## UI 与视觉规范
- 布局：顶栏 + 左侧工具栏 + 中央棋盘 + 右侧 HUD + Inspector。
- 顶栏：关卡名、难度分组切换、Undo/Redo、重置。
- 工具栏：库存、选中、快捷键提示。
- HUD：目标文本、规则状态、接收器进度、统计。
- 主题：中性灰 + 米白文本，避免强蓝偏色。

## 设计 tokens（集中管理）
- 间距：8/16/24/32
- 圆角：面板 12px，按钮 10px，格子 8px
- 主色：
  - `bg #141412`
  - `panel #20201E`
  - `panel2 #272724`
  - `panel3 #30302D`
  - `text #F2EFE8`
  - `muted #B4AFA5`
  - `accent #C7B08A`
  - `line #3B3934`
- 光色：
  - `rayR #FF5D75`
  - `rayG #5AF594`
  - `rayB #5F87FF`
- SVG：`viewBox 0 0 64 64`，`stroke-width=2`，`linecap/linejoin=round`

## 渲染策略
- 光路：Canvas 独立层，状态变化时重绘。
- 颜色解析：Canvas 绘制前将 CSS 变量解析成实际颜色，避免黑线回退。
- 元件：SVG overlay 自绘统一风格。

## 验证脚本
- `npm run check:levels`：验证 17 关可解，且难度数量分布正确。
- `npm run check:reflection`：验证镜面反射映射与边界方向一致性。

## 工程结构约束
- `engine/`：纯逻辑与类型
- `render/`：Canvas / board 渲染
- `ui/`：面板与交互组件
- `assets/pieces/`：统一 64x64 SVG 元件
- `levels/`：四档难度关卡库

## 验收清单映射
- [x] D8 + 1格/tick + 防死循环
- [x] Prism/Mirror/Filter/Receiver 规则正确
- [x] 放置/旋转/删除 + Undo/Redo
- [x] 顶栏/工具栏/HUD/Inspector 完整
- [x] Canvas 光路 + SVG 元件
- [x] 四档难度关卡体系（17 关）
- [x] README + CHANGELOG + 验证脚本
