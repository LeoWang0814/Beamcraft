# AGENT Context Anchor

## 项目一句话目标与范围
在既有 D8 离散规则下，把 Beamcraft 打磨为“可推理、可验证、可分享”的高质量导光解谜小游戏，核心强调时序（节拍）玩法与顿悟式关卡体验。

## MVP 边界（当前）
- 包含：D8、1格/节拍、Canvas 光路 + SVG 元件分层、四档内置关卡 + 自定义关卡、Undo/Redo、Inspector、本地导入/导出分享串。
- 不包含：连续角度物理、随机机制、在线服务端存档/排行榜、重型回放系统。

## 关键规则摘要
- 方向：D8（45°离散）。
- 节拍推进：每束光每节拍固定推进 1 格。
- 颜色 bitmask：`R=1, G=2, B=4, W=7`。
- 棱镜模板：`R(dir-1) / G(dir) / B(dir+1)`。
- 滤镜：单色透过，其余吸收。
- 接收器：按通道累计阈值并判定点亮。
- 防死循环：`maxTicks` + visited 状态上限 + `maxBounces`。

## 时序规则（已落地）
- `sync` + `syncWindow` + `syncTargets`：目标接收器需在窗口内同步达标。
- `sequence`：按顺序点亮，并受 `maxGap` 约束。
- HUD：显示 `currentTick / maxTicks`、关键事件、播放控制（播放/暂停/单步/x1-x2-x4）。

## 工具体系（当前）
- 基础：`MIRROR`、`PRISM`、`FILTER_R/G/B`。
- 时序创意：`MIXER`、`SPLITTER`、`DELAY`、`GATE`。
- 逻辑扩展：`LOGIC_GATE`、`ACCUMULATOR`。

## 关卡与放置约束策略
- 默认自由放置：不再把 `buildPads` 作为硬性放置限制。
- 约束字段：
  - `blockedCells`（不可放置/不可通过）
  - `fixed`（关卡预置不可移动元件）
  - `allowedArea`（仅关卡显式启用时限制）
  - `maxPieces` / `maxPlaceByType`（数量约束）
- `buildPads` 仅作为教学提示高亮。

## 自定义关卡与分享（Round 5）
- 自定义关卡编辑器：可设网格、规则、库存、固定元件、墙体/阻断格并试玩。
- 分享串格式：`BC1.<payloadBase64Url>.<checksum>`。
- 载荷结构：`{ version: 1, level: LevelDefinition }`。
- 校验与安全：
  - FNV-1a checksum
  - 严格长度和尺寸限制（含固定元件/墙体上限）
  - 非法字段直接拒绝并提示中文错误
- 支持 hash 分享导入：`#lvl=...`。

## 设计语言与 Tokens 摘要
- 主题：中性灰深色工作台 + 米白文本。
- 间距：8/16/24/32。
- 圆角：Panel 12 / Button 10 / Cell 8。
- 阴影：轻量 `soft + lift`。
- SVG 规范：`viewBox 0 0 64 64`、`stroke-width 2`、round cap/join。
- 视口策略：`html/body/#root` 全高 + `overflow: hidden`，主界面无 body 纵向滚动。

## 当前完成度
- 里程碑 A（引擎稳定）：完成。
- 里程碑 B（UI 重构）：完成。
- 里程碑 C（关卡体系扩展至 28 关）：完成。
- 里程碑 D（时序玩法 + 导航 +热键稳定）：完成。
- 里程碑 E（Round 5：可重跑 + 全中文 + 自定义分享 + 逻辑工具）：完成。

### 里程碑 E 具体完成项
1. 可重跑模拟
- TopBar/HUD 提供「重新运行」「重置关卡」。
- 时序关编辑后自动从节拍 0 重跑，确保反馈即时。

2. 全中文 UI
- 新增并统一使用 `src/ui/i18n.ts` 字典。
- 顶栏、工具栏、HUD、Inspector、Overview、编辑器、提示文案全部走字典。

3. 放置规则调整
- 移除 `buildPads` 强制放置限制。
- 默认可在空格自由放置；仅在关卡显式约束字段启用时限制。

4. 新工具接入
- `LOGIC_GATE`、`ACCUMULATOR` 覆盖 types/engine/SVG/ToolDock/Inspector。
- 时序事件流加入 `logic_trigger`、`accumulator_charge`、`accumulator_pulse`。

5. 编辑器与分享
- 内置自定义关卡编辑器（本地）。
- 单行分享串导出、导入校验、Hash 链接复制与加载。

6. QA/稳定性
- 修复 `sim.ts` 延迟队列 key 写回错误。
- 修复 App 状态与热键闭包相关 lint/行为风险。
- 扩展 `check:timing` 覆盖 Mixer/Delay/Gate/Logic/Accumulator。
- `check:reflection` / `check:levels` / `check:timing` / `check:hotkeys` / `lint` / `build` 全通过。

7. 内置关卡补充（逻辑/累积器）
- 新增 `A07`（逻辑门同节拍对齐）。
- 新增 `A08`（累积器连续充能与脉冲释放）。
- 当前内置关卡总数 28（tutorial 6 / basic 7 / intermediate 7 / advanced 8）。

## 当前 TODO
- 可选：为概览面板增加筛选（仅未完成 / 仅时序关）。
- 可选：为热键稳定性补浏览器级 e2e（Playwright）。
- 可选：在自定义编辑器增加 `syncTargets` 可视化选择器（当前可通过 JSON/导入支持）。

## 重要决策记录
1. `sim.ts` 保持“按节拍批处理”的最小重构。
- 原因：同节拍合流、延迟释放、门控相位与逻辑门都依赖同一节拍视图。

2. 不引入重型依赖与复杂回放。
- 原因：维持 60FPS 目标与可维护性。

3. 采用本地分享串而非在线系统。
- 原因：满足“可分享”目标，同时避免服务端复杂度与安全维护成本。

4. 保持既有核心物理不变，仅做离散扩展。
- 原因：遵守 D8 / 1格每节拍 / bitmask / 防死循环的非谈判约束。
