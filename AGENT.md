# AGENT Context Anchor

## 项目一句话目标与范围
交付一个“可推理、可读、可维护”的 2D 网格导光解谜成品 Demo：D8 规则稳定、交互反馈清晰、视觉系统统一、三关完整可通。

## MVP 边界
- 包含：D8、1格/tick、Prism/Mirror/Filter/Receiver、三关可通、实时光路预览、Undo/Redo、Inspector、关卡目标与提示。
- 不包含：D16 连续推进、回放动画系统、内置关卡编辑器、在线分享系统。

## 关键规则摘要
- 方向：D8（45°离散档位）。
- Tick：每束光每 Tick 固定前进 1 格。
- 颜色：bitmask（R=1, G=2, B=4, W=7）。
- 棱镜模板：
  - G 直行（沿棱镜 dir）
  - R 左偏 45°（dir - 1）
  - B 右偏 45°（dir + 1）
- 滤镜：仅保留指定色分量，其他分量吸收。
- 接收器：按通道累计强度，达到阈值点亮；可选 purity/sync 参与胜利判定。
- 防死循环：`maxTicks` + `visited(cell,dir,color)` + `maxBounces`。

## 设计语言与 Tokens 摘要
- 风格：深色工作台 + 轻工业仪表感；克制高亮、避免浮夸渐变。
- 间距系统：8/16/24/32。
- 圆角：Panel 12px，Button 10px，Cell 8px。
- 阴影：`soft + lift` 双层轻阴影。
- 核心色：
  - bg `#0C1118`
  - panel `#131B27`
  - panel2 `#1A2432`
  - panel3 `#223044`
  - text `#EDF3FF`
  - muted `#99A8C2`
  - accent `#5EA5FF`
  - line `#2A384F`
- 光色：R `#FF5D75` / G `#5AF594` / B `#5F87FF`。
- SVG 规范：`viewBox 0 0 64 64`，`stroke-width 2`，`linecap/linejoin round`。

## 当前完成度
- 里程碑 A（规则引擎）：完成。
  - D8 推进、分色/反射/滤镜/接收、统计与死循环保护。
- 里程碑 B（UI 重构）：完成。
  - 全新 TopBar / Tool Dock / Board / Mission HUD / Inspector。
  - 放置高亮、构建位（buildPads）提示、无效操作 notice、解法串复制。
- 里程碑 C（关卡重做）：完成。
  - `L01`：单镜引导绿色。
  - `L02`：滤镜净化污染（purity=true）。
  - `L03`：双反射路径。
  - 三关均已用脚本验证有解（预设解法下 victory=true）。
- 质量验证：`npm run lint` 与 `npm run build` 均通过。

## 当前 TODO
- 可选：加入按 Tick 播放动画模式（当前为静态预览）。
- 可选：把关卡求解校验脚本固化到 `scripts/` 并接入 npm script。
- 可选：增加更细粒度的 engine 单元测试。

## 重要决策记录
1. 重新引入 `buildPads`（可选字段）限制可放置区域。
- 原因：减少无意义试错，让关卡意图更可读。
2. 将“选中元件操作”显式移入 `Inspector`。
- 原因：降低键盘依赖，编辑行为可见且可控。
3. 切关卡时显式同步 `RESET_LEVEL`。
- 原因：避免副作用链式状态更新，修复 lint 风险并提升可维护性。
4. 关卡目标写进 JSON（subtitle/objective/hint/designerNote）。
- 原因：修复“玩法摸不着头脑”的核心体验问题。
5. 维持 Canvas 光路 + SVG 元件分层。
- 原因：性能与清晰度兼顾，便于持续迭代美术和特效。
