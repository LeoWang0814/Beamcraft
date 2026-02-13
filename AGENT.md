# AGENT Context Anchor

## 项目一句话目标与范围
在既有 D8 规则框架下，把 Beamcraft 做成“可推理、可验证、可维护”的高质量导光解谜小游戏，重点强化 Tick 时序玩法与关卡顿悟感。

## MVP 边界（当前仍遵守）
- 包含：D8、1格/tick、Prism/Mirror/Filter/Receiver、四档难度关卡、Undo/Redo、Inspector、Canvas 光路 + SVG 元件分层。
- 不包含：连续角度物理、复杂回放系统、在线关卡编辑/分享。

## 关键规则摘要
- 方向：D8（45°离散）。
- Tick：每 tick 固定推进 1 格。
- 颜色 bitmask：`R=1, G=2, B=4, W=7`。
- 棱镜模板：`R(dir-1) / G(dir) / B(dir+1)`。
- 滤镜：单色透过，其余吸收。
- 接收器：按通道累计阈值点亮。
- 防死循环：`maxTicks` + visited 状态上限 + `maxBounces`。

## 新增时序规则（Round 3）
- `sync` + `syncWindow` + `syncTargets`。
- `sequence`（顺序点亮 + 最大 tick 间隔）。

## 设计语言与 Tokens 摘要
- 主题：中性灰深色工作台 + 米白文本。
- 间距：8/16/24/32。
- 圆角：Panel 12 / Button 10 / Cell 8。
- 阴影：轻量 `soft + lift`。
- SVG 规范：`viewBox 0 0 64 64`、`stroke-width 2`、round cap/join。

## 当前完成度
- 里程碑 A（引擎稳定）：完成。
- 里程碑 B（UI 重构）：完成。
- 里程碑 C（关卡体系 17 关）：完成。
- 里程碑 D（Round 3：时序玩法 + 创意工具 + 导航修复）：完成。

### 里程碑 D 具体完成项
1. P0 输入稳定
- 全局单一 keydown 入口（capture）。
- 数字键工具热键重构为 `event.code` 优先（Digit/Numpad 1..9）。
- 文本输入场景过滤，减少焦点导致的偶发失效。

2. P0 导航升级
- TopBar：上一关/下一关、当前序号。
- 新增 Level Overview（按 difficulty 分组，展示完成与最佳数据）。
- 切关 150ms 淡入淡出 + 强制 RESET_LEVEL。

3. Tick 玩法正式化
- HUD 新增 `currentTick/maxTicks` 与 Play/Pause/Step/x1-x2-x4。
- 支持 `syncTargets` 与 `sequence` 胜利判定。

4. 新工具（4）
- `MIXER` / `SPLITTER` / `DELAY` / `GATE`。
- 覆盖：types、engine、SVG、Tool Dock、Inspector 参数、热键映射。

5. 关卡扩展
- 新增 9 关：`T05/T06/B06/B07/I06/I07/A04/A05/A06`。
- 当前总计 26 关：
  - tutorial 6
  - basic 7
  - intermediate 7
  - advanced 6

6. 脚本验证
- `check:reflection`（镜面反射）
- `check:levels`（全关卡可解 + 难度计数）
- `check:timing`（Mixer/Delay/Gate 时序）
- `check:hotkeys`（热键解析）

## 当前 TODO
- 可选：为关卡概览加入筛选（仅未完成 / 仅 Tick 关）。
- 可选：将热键稳定性做浏览器级 e2e（Playwright）自动化。
- 可选：在 HUD 增加 tick 事件小日志（接收器命中时间点）。

## 重要决策记录
1. `sim.ts` 采用“按 tick 批处理”最小重构。
- 原因：同 tick 合流、延迟释放、门控相位都需要同一 tick 视图。

2. 不引入重型依赖和复杂回放系统。
- 原因：保持性能与维护成本可控。

3. 时间规则只扩展到 `syncTargets` 与 `sequence`。
- 原因：满足核心玩法扩展，同时不破坏原有关卡与规则稳定性。

4. 新增关卡优先用脚本解验证。
- 原因：避免“看起来可解、实际不可解”的内容回归。
