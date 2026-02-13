# IMPLEMENTATION_NOTES

## 目标与约束
- 目标：在不破坏核心规则的前提下，把 Beamcraft 从 Demo 提升为“可玩、烧脑、可分享”的高质量导光解谜。
- 不变约束：
  - D8 离散方向（45°）
  - 1 格 / 节拍推进
  - 颜色 bitmask（`R=1,G=2,B=4,W=7`）
  - Prism / Mirror / Filter / Receiver 核心语义
  - 防死循环机制
  - Canvas 光路 + SVG 元件分层架构

## 规则基线（保持）
- 棱镜：`R(dir-1) / G(dir) / B(dir+1)`。
- 滤镜：单色透过、其余吸收。
- 接收器：按颜色阈值累计，支持 purity/sync/sequence 组合判定。
- 循环保护：`maxTicks + visited + maxBounces`。

## Round 5 关键实现

### 1) 节拍玩法正式化
- 保留静态预览，同时将节拍控制提升为一等交互：
  - 播放/暂停/单步
  - x1/x2/x4
  - `currentTick / maxTicks`
  - HUD 关键事件流（接收器命中、门控放行/阻断、延迟释放、合流触发、逻辑触发、累积器充放）
- 新增「重新运行」：
  - 从当前摆放状态回到节拍 0 重跑，不清空摆放。
- 新增「重置关卡」：
  - 恢复该关初始摆放与状态。

### 2) “静态预览 vs 时序规则”取舍说明
- 对非时序关：默认静态预览（一次性展示全路径）以降低认知负担。
- 对时序关（含 sync/sequence 或时序工具）：编辑后自动触发从节拍 0 重跑，确保玩家立刻观察时序后果。
- 不做完整回放系统：
  - 原因：当前目标是可维护与性能稳定，不引入高复杂度帧级缓存体系。

### 3) 放置规则调整（自由放置优先）
- 默认允许在空格自由放置（不再依赖 buildPads 做硬限制）。
- 关卡约束改为显式字段：
  - `blockedCells`
  - `allowedArea`（可选）
  - `maxPieces`
  - `maxPlaceByType`
- `buildPads` 仅做教学高亮提示，不参与强制判定。

### 4) 新工具扩展（离散、可解释、可验证）
- `LOGIC_GATE`
  - 模式：`AND` / `XOR` / `NOT`
  - 输入：同格同节拍光束集合
  - 输出：按模式决定是否输出，方向由元件朝向决定
- `ACCUMULATOR`
  - 对指定颜色做连续节拍累积
  - 达阈值后释放脉冲（可配脉冲节拍数、输出颜色、输出强度）
- 两者均已接入：
  - types
  - engine 处理
  - SVG 图标
  - Tool Dock
  - Inspector 参数编辑
  - 事件日志

### 5) 自定义关卡与分享串
- 编辑器能力：
  - 网格尺寸、规则、库存
  - 固定元件放置
  - 墙体/阻断格
  - 一键试玩
- 导出格式：
  - `BC1.<payloadBase64Url>.<checksum>`
  - payload：`{ version: 1, level }`
  - checksum：FNV-1a
- 校验策略：
  - 严格长度、网格大小、元件数量上限
  - 非法字符串/结构直接拒绝并给出中文错误

### 6) 输入与导航稳定性
- 热键入口维持单一 `window keydown (capture)`。
- 数字键工具切换支持 `Digit/Numpad`，过滤文本输入场景。
- 顶栏提供上一关/下一关、关卡概览、重新运行、重置关卡。

### 7) 布局与视觉约束
- 中性灰主题 token 化管理（`src/ui/tokens.css`）。
- 根布局固定全视口，无 body 纵向滚动：
  - `html/body/#root` 全高
  - `overflow: hidden`
- 局部滚动仅在必要容器内（如概览列表、面板内容）。

## 校验脚本与质量门禁
- `check:reflection`：镜面反射确定性。
- `check:levels`：关卡可解性 + 元信息/计数约束。
- `check:timing`：Mixer/Delay/Gate/Logic/Accumulator 时序行为。
- `check:hotkeys`：工具热键与撤销/重做解析。
- `lint` / `build`：静态质量与打包通过。
