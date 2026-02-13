# AGENT Context Anchor

## 项目一句话目标与范围
交付一个“可推理、可读、可维护”的 2D 网格导光解谜成品 Demo：D8 规则稳定、交互反馈清晰、视觉系统统一，并具备分级关卡体系。

## MVP 边界
- 包含：D8、1格/tick、Prism/Mirror/Filter/Receiver、四档难度关卡、实时光路预览、Undo/Redo、Inspector、关卡目标与提示。
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
- 风格：中性灰深色工作台 + 米白文本，克制高亮。
- 间距系统：8/16/24/32。
- 圆角：Panel 12px，Button 10px，Cell 8px。
- 阴影：`soft + lift` 双层轻阴影。
- 核心色：
  - bg `#141412`
  - panel `#20201E`
  - panel2 `#272724`
  - panel3 `#30302D`
  - text `#F2EFE8`
  - muted `#B4AFA5`
  - accent `#C7B08A`
  - line `#3B3934`
- 光色：R `#FF5D75` / G `#5AF594` / B `#5F87FF`。
- SVG 规范：`viewBox 0 0 64 64`，`stroke-width 2`，`linecap/linejoin round`。

## 当前完成度
- 里程碑 A（规则引擎）：完成。
  - D8 推进、分色/反射/滤镜/接收、统计与死循环保护。
- 里程碑 B（UI 重构）：完成。
  - TopBar / Tool Dock / Board / Mission HUD / Inspector。
  - 放置高亮、构建位（buildPads）提示、无效操作 notice、解法串复制。
- 里程碑 C（关卡体系扩展）：完成。
  - Tutorial：`T01`-`T04`（4 关）
  - Basic：`B01`-`B05`（5 关）
  - Intermediate：`I01`-`I05`（5 关）
  - Advanced：`A01`-`A03`（3 关）
  - 关卡字段统一：`subtitle/objective/hint/designerNote/difficulty`。
- 质量验证：
  - `npm run check:reflection`
  - `npm run check:levels`
  - `npm run lint`
  - `npm run build`

## 当前 TODO
- 可选：加入按 Tick 播放动画模式（当前为静态预览）。
- 可选：把反射 harness 扩展为正式单元测试并接入 CI。
- 可选：扩充 advanced 关卡到 4 关并引入更严格同步窗口。

## 重要决策记录
1. 继续维持 Canvas 光路 + SVG 元件分层。
- 原因：性能与清晰度兼顾，满足扩关后仍稳定。
2. 不新增工具（Round 本次）。
- 原因：优先扩展关卡深度，避免系统复杂度无谓上升。
3. 关卡引入 `difficulty` 并在 UI 按难度分组。
- 原因：便于学习曲线控制与内容组织。
4. `verify-levels` 升级为全关卡验证并校验难度数量。
- 原因：防止新增关卡出现不可解/漏配字段回归。
5. 镜子视觉保持两种有效姿态（`/`、`\`）。
- 原因：视觉反馈与反射逻辑一致，降低认知噪音。
