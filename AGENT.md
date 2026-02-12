# AGENT Context Anchor

## 项目一句话目标与范围
构建一个高质感、可部署的 2D Web 网格导光解谜 MVP：D8 离散光路、可编辑摆放、三关可通关、统一设计系统与可维护工程结构。

## MVP 边界
- 包含：D8、1格/tick、Prism/Mirror/Filter/Receiver、三关、实时预览、Undo/Redo、基础统计、解法串导出。
- 不包含：D16 连续推进、复杂时间机关（Delay/Sync 高阶机制）、关卡编辑器、社区分享。

## 关键规则摘要
- 方向：D8（每 45° 一档）。
- Tick：所有光束速度统一 1 格/tick。
- 颜色：bitmask（R=1, G=2, B=4, W=7）。
- 棱镜分色模板：
  - G：直行（沿棱镜朝向）
  - R：左偏 45°
  - B：右偏 45°
- 滤镜：仅透单色，其余吸收。
- 接收器：R/G/B 各自累计，阈值达标点亮；可选 purity/sync 规则参与胜利判定。
- 防死循环：`maxTicks` + `visited(cell,dir,color)` 计数上限；镜面反射受 `maxBounces` 限制。

## 设计语言与 Tokens 摘要
- 风格：扁平、克制、统一、轻质感。
- 间距：8/16/24/32。
- 圆角：Panel 12px，Button 10px，Cell 8px。
- 阴影：极轻双层阴影，避免重黑影。
- 颜色：
  - bg `#0F1115`
  - panel `#161A22`
  - panel2 `#1C2230`
  - text `#E8ECF4`
  - muted `#A7B0C3`
  - accent `#7AA2F7`
  - rayR `#FF4D6D` / rayG `#3DFF8A` / rayB `#4D7CFF`
- SVG 规范：`viewBox 0 0 64 64`，`stroke-width 2`，`linecap/linejoin round`。

## 当前完成度
- 已完成里程碑 1（引擎跑通）：
  - D8 推进、Prism/Mirror/Filter/Receiver 规则、死循环保护、统计输出。
- 已完成里程碑 2（UI 完整）：
  - 顶栏（关卡切换、Undo/Redo、重置）
  - 工具栏（库存、选中、快捷键提示）
  - HUD（接收器进度、通关态、统计）
  - Canvas 光路 + SVG 元件 overlay。
- 已完成里程碑 3（三关可通）：
  - `L01` 教学（含固定 Prism + Mirror）
  - `L02` 引入滤镜 + purity
  - `L03` 需要多次反射。
- 已完成文档：
  - `IMPLEMENTATION_NOTES.md`
  - `README.md`
  - `START_COMMAND.md`
  - `CHANGELOG.md`

## 当前 TODO
- 可选：增加动画播放模式（按 Tick 逐段播放）。
- 可选：加入解法串导入回放。
- 可选：补充引擎单元测试。

## 重要决策记录
1. 先实现 D8 格中心推进，不提前做 D16。
- 原因：规格明确 D8 为 MVP 推荐；优先保证稳定性与关卡可控性。
2. 强度使用整数而非浮点。
- 原因：避免累计误差，阈值判定可预测。
3. 光路使用 Canvas，元件使用 SVG 覆盖层。
- 原因：性能和清晰度更好，且便于统一视觉语言。
4. 引擎与 UI 强分层（`engine/render/ui`）。
- 原因：可维护性更好，后续扩展 D16 或新元件风险更低。
5. L02 使用 purity 规则制造“必须滤镜”的关卡约束。
- 原因：仅靠阈值不足以强制滤镜使用，purity 可直观体现滤色目的。
