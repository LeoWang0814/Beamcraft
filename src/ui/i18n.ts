import type {
  ColorMask,
  LevelDefinition,
  LevelDifficulty,
  LogicGateMode,
  PlaceablePieceType,
} from '../engine/types';
import { COLOR_BITS } from '../engine/types';

export const ZH = {
  appName: '光迹工坊',
  topBar: {
    statusReady: '推演中',
    statusVictory: '已达成',
    tick: '节拍',
    level: '关卡',
    prev: '上一关',
    next: '下一关',
    selectLevel: '切换关卡',
    undo: '撤销',
    redo: '重做',
    rerun: '重新运行',
    reset: '重置关卡',
    overview: '关卡概览',
    customEditor: '自定义关卡',
  },
  board: {
    title: '棋盘',
    placing: '当前工具：{tool}',
    placingHint: '高亮仅为教学建议，普通空格可直接放置。',
    idleHint: '点击元件可选中；选择工具后点击格子放置。',
    wall: '墙体',
    locked: '固定',
    cell: '格子',
  },
  toolbar: {
    title: '工具栏',
    subtitle: '元件库',
    used: '已用 {used} / {limit}',
    unavailable: '当前关卡不可用',
    locked: '未解锁',
    hotkeyTitle: '快捷键',
    hotkeySelect: '1..9：切换工具',
    hotkeyRotate: 'R / Shift+R：顺逆时针旋转 45°',
    hotkeyDelete: 'Delete / Backspace：删除选中元件',
    hotkeyUndo: 'Ctrl/⌘ + Z：撤销',
    hotkeyRedo: 'Ctrl/⌘ + Y 或 Ctrl/⌘ + Shift + Z：重做',
  },
  inspector: {
    title: '属性面板',
    selected: '当前选中',
    empty: '点击棋盘中的元件查看属性。',
    coord: '坐标',
    dir: '朝向',
    fixedHint: '固定元件不可编辑',
    rotateCcw: '-45°',
    rotateCw: '+45°',
    remove: '删除',
    delayTicks: '延迟节拍',
    gatePhase: '门控相位',
    gateOpen: '开',
    gateClose: '关',
    mixerDistinct: '需不同方向输入',
    logicMode: '逻辑模式',
    logicColor: '输出颜色',
    accumulatorTarget: '累积颜色',
    accumulatorThreshold: '触发阈值(连续节拍)',
    accumulatorPulse: '脉冲节拍',
    accumulatorColor: '脉冲颜色',
    accumulatorIntensity: '脉冲强度',
    solution: '解法串',
    solutionEmpty: '当前无放置记录',
    copySolution: '复制解法串',
  },
  hud: {
    title: '任务',
    objective: '目标',
    hint: '提示',
    rules: {
      purity: '纯净',
      sync: '同步',
      sequence: '序列',
      victory: '完成',
    },
    playbackTitle: '节拍控制',
    playbackRuleHint: '当前关卡启用时序规则，建议使用播放或单步推演。',
    play: '播放',
    pause: '暂停',
    step: '单步',
    speed: '倍速',
    events: '关键事件',
    eventsEmpty: '暂无事件',
    stats: '统计',
    placed: '放置',
    beamSteps: '光束步数',
    bounces: '反射',
    leaks: '漏光',
    receiverDone: '达标',
    receiverPending: '未达标',
    receiverContaminated: '存在杂色污染',
    sequenceHint: '顺序：{order}，每步间隔 ≤ {maxGap} 节拍',
  },
  overview: {
    title: '关卡概览',
    subtitle: '快速跳转',
    close: '关闭',
    completed: '已完成',
    pending: '未完成',
    bestPlace: '最佳放置',
    bestTick: '最佳节拍',
    groupCustom: '自定义',
  },
  editor: {
    title: '自定义关卡',
    subtitle: '本地创建、试玩与分享',
    close: '关闭',
    id: '关卡编号',
    name: '关卡名称',
    difficulty: '难度',
    width: '宽',
    height: '高',
    objective: '目标文本',
    hint: '提示文本',
    note: '设计说明',
    brush: '画笔',
    dir: '方向',
    sourceColor: '光源颜色',
    sourceIntensity: '光源强度',
    receiverThreshold: '接收阈值',
    placeHint: '点击格子进行放置，重复点击同类元件可覆盖参数。',
    playtest: '试玩该关',
    export: '导出字符串',
    import: '导入字符串',
    shareLink: '复制分享链接',
    payload: '关卡字符串',
    invalid: '导入失败：字符串无效或超出限制。',
    imported: '导入成功，已加载到编辑器。',
    exported: '已生成并复制关卡字符串。',
    shared: '分享链接已复制。',
    inventory: '工具库存',
    rules: '规则',
    syncWindow: '同步窗口',
    sequenceOrder: '序列顺序（如 G,B,R）',
    sequenceGap: '序列最大间隔',
    maxTicks: '最大节拍',
    maxBounces: '最大反射',
  },
  notices: {
    selectEditable: '请选择一个可编辑元件后再操作。',
    fixedCannotDelete: '固定元件不可删除。',
    blockedCell: '该格不可放置。',
    fixedCannotReplace: '固定元件不可覆盖。',
    inventoryExhausted: '该元件库存已用尽。',
    maxPiecesExceeded: '超出本关可放置总数限制。',
    autoRerun: '检测到时序规则，已自动从节拍 0 重跑。',
    copied: '已复制。',
    copyFailed: '复制失败，请手动复制。',
    rerunDone: '已从节拍 0 重新运行当前摆放。',
  },
} as const;

export const DIFFICULTY_ORDER: LevelDifficulty[] = ['tutorial', 'basic', 'intermediate', 'advanced', 'custom'];

export const DIFFICULTY_LABEL: Record<LevelDifficulty, string> = {
  tutorial: '教学',
  basic: '基础',
  intermediate: '中级',
  advanced: '高级',
  custom: '自定义',
};

export const TOOL_META: Record<PlaceablePieceType, { title: string; description: string; unlockHint: string }> = {
  MIRROR: {
    title: '镜面反射器',
    description: '将入射光按镜面规则反射。',
    unlockHint: '默认解锁：基础导光核心。',
  },
  PRISM: {
    title: '分色棱镜',
    description: '白光拆分为 R/G/B 三束。',
    unlockHint: '教学阶段解锁：学习颜色分流。',
  },
  FILTER_R: {
    title: '红滤镜',
    description: '只允许红光通过。',
    unlockHint: '教学阶段解锁：学习颜色净化。',
  },
  FILTER_G: {
    title: '绿滤镜',
    description: '只允许绿光通过。',
    unlockHint: '教学阶段解锁：学习颜色净化。',
  },
  FILTER_B: {
    title: '蓝滤镜',
    description: '只允许蓝光通过。',
    unlockHint: '教学阶段解锁：学习颜色净化。',
  },
  MIXER: {
    title: '混色器',
    description: '同节拍合流并按位合成颜色。',
    unlockHint: '中级解锁：学习同节拍对齐。',
  },
  SPLITTER: {
    title: '分光器',
    description: '将一束光复制为两路输出。',
    unlockHint: '基础解锁：学习多目标路径规划。',
  },
  DELAY: {
    title: '延迟器',
    description: '缓存输入并在 N 节拍后输出。',
    unlockHint: '中级解锁：学习时序对齐。',
  },
  GATE: {
    title: '门控器',
    description: '按开/关周期决定是否放行。',
    unlockHint: '中高级解锁：学习相位推理。',
  },
  LOGIC_GATE: {
    title: '逻辑门',
    description: '按与门/异或/反相条件决定是否输出。',
    unlockHint: '高级解锁：学习时序逻辑。',
  },
  ACCUMULATOR: {
    title: '累积器',
    description: '累计指定颜色连续节拍后释放脉冲。',
    unlockHint: '高级解锁：学习充能与释放时机。',
  },
};

export function formatTemplate(value: string, vars: Record<string, string | number>): string {
  let result = value;
  for (const [key, raw] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(raw));
  }
  return result;
}

export function colorMaskLabel(mask: ColorMask): string {
  if (mask === COLOR_BITS.R) return '红';
  if (mask === COLOR_BITS.G) return '绿';
  if (mask === COLOR_BITS.B) return '蓝';
  if (mask === COLOR_BITS.W) return '白';
  if (mask === (COLOR_BITS.R | COLOR_BITS.G)) return '黄';
  if (mask === (COLOR_BITS.G | COLOR_BITS.B)) return '青';
  if (mask === (COLOR_BITS.R | COLOR_BITS.B)) return '品红';
  return '无';
}

export function logicModeLabel(mode: LogicGateMode): string {
  if (mode === 'AND') return '与门';
  if (mode === 'XOR') return '异或门';
  return '反门';
}

export function withChineseLevelText(level: LevelDefinition): LevelDefinition {
  if (level.difficulty === 'custom') {
    return level;
  }

  const localized = LEVEL_ZH[level.id];
  if (!localized) {
    return level;
  }

  return {
    ...level,
    title: localized.title,
    subtitle: localized.subtitle,
    objective: localized.objective,
    hint: localized.hint,
    designerNote: localized.designerNote,
  };
}

const LEVEL_ZH: Record<
  string,
  { title: string; subtitle: string; objective: string; hint: string; designerNote: string }
> = {
  T01: { title: '单镜折返', subtitle: '学习最基础的镜面反射。', objective: '放置 1 个镜子让绿色命中接收器。', hint: '镜子保持“/”方向。', designerNote: '教学只讲反射，不引入其他机制。' },
  T02: { title: '分色入门', subtitle: '继续熟悉单步反射。', objective: '在单镜条件下点亮三色接收器。', hint: '先观察主光路再放镜子。', designerNote: '重复核心动作，帮助建立空间感。' },
  T03: { title: '滤镜净化', subtitle: '学习颜色筛选。', objective: '利用绿滤镜让 G 达到双倍阈值。', hint: '过滤杂色后再进接收器。', designerNote: '引导玩家理解纯净思维。' },
  T04: { title: '双路汇聚', subtitle: '体验路径长度差异。', objective: '用一个镜子让两路绿光汇聚。', hint: '优先处理远路。', designerNote: '首次出现明显路径时差。' },
  T05: { title: '同节拍合流', subtitle: '两束光必须同节拍到达混色器。', objective: '放置混色器让 G 达到 200。', hint: '混色器输出方向朝右上。', designerNote: '关键约束是“同节拍”，不是“同位置”。' },
  T06: { title: '延迟过门', subtitle: '门控在偶数节拍关闭。', objective: '放置延迟器让光在开门时通过。', hint: '默认延迟 1 节拍即可。', designerNote: '用最短案例建立相位概念。' },
  B01: { title: '两镜联动', subtitle: '组合两个反射节点。', objective: '用两面镜子打通三色路径。', hint: '先定第一面镜子。', designerNote: '基础空间推理。' },
  B02: { title: '净化支路', subtitle: '主路 + 滤镜支路。', objective: '保证绿色增益且不污染。', hint: '错误路径会把杂色带入接收器。', designerNote: '引导玩家比较两条路线。' },
  B03: { title: '回折走廊', subtitle: '镜面连续折返。', objective: '用两次反射命中目标。', hint: '检查每次转向后的下一格。', designerNote: '强调离散方向连锁。' },
  B04: { title: '逆向思考', subtitle: '从接收器反推镜子位置。', objective: '只用一面镜子完成全通。', hint: '先看绿色最短路。', designerNote: '训练逆向设计。' },
  B05: { title: '蓝路净化', subtitle: '双路中只净化一条。', objective: '让蓝色达到 200。', hint: '滤镜应放在汇入点前。', designerNote: '引导玩家区分主支路价值。' },
  B06: { title: '分光双达', subtitle: '一束光服务两个目标。', objective: '放置分光器同时供给 R 与 G。', hint: '分光器默认朝右可直接成立。', designerNote: '强调资源复用。' },
  B07: { title: '窗口穿越', subtitle: '门控 + 延迟组合。', objective: '让 G 穿过时间窗，R 保持在线。', hint: '延迟 1 节拍足够改变命中相位。', designerNote: '误导点是“看起来直通”。' },
  I01: { title: '同步预热', subtitle: '首次严格同步约束。', objective: '在同步窗口内完成三色。', hint: '优先校准最慢通道。', designerNote: '引入节奏感。' },
  I02: { title: '双滤镜分工', subtitle: '两侧噪声源叠加。', objective: '在纯净规则下满足双高阈值。', hint: 'R/B 两路都要净化。', designerNote: '训练多约束并行处理。' },
  I03: { title: '自放棱镜', subtitle: '棱镜位置不再固定。', objective: '自行决定分色起点并接入镜子。', hint: '把棱镜放在主束第三格附近。', designerNote: '从执行题升级为设计题。' },
  I04: { title: '镜阵回旋', subtitle: '双镜形成受控回折。', objective: '让三色在有限反射次数内完成。', hint: '错误方向会导致漏光。', designerNote: '考察反射稳定性。' },
  I05: { title: '绿增益', subtitle: '单滤镜实现双倍绿能。', objective: 'G 达到 200 并保持其余通道。', hint: '滤镜放在主路汇入口。', designerNote: '强调阈值差异的布局策略。' },
  I06: { title: '延迟合流', subtitle: '先对齐再混色。', objective: '用延迟器 + 混色器让 G 达到 200。', hint: '延迟器朝下输出，再在混色器右上出光。', designerNote: '关键约束是“对齐后再合流”。' },
  I07: { title: '分流穿门', subtitle: '分支路径存在门控相位陷阱。', objective: '分光后延迟北支路，完成 R/G。', hint: '延迟器要朝上输出。', designerNote: '错误直觉是“分光后立即成立”。' },
  A01: { title: '同步窗口', subtitle: '全通道进入严格窗口。', objective: '在同步窗口 2 内点亮三色。', hint: '绿色通常是最慢通道。', designerNote: '高级关从时序对齐开始。' },
  A02: { title: '纯净同步', subtitle: '高阈值 + 纯净 + 同步叠加。', objective: 'R/B 达到 200 且通过同步判定。', hint: '先保证纯净，再调节时差。', designerNote: '多目标叠加约束。' },
  A03: { title: '终局并流', subtitle: '主路与噪声路并行。', objective: '在纯净 + 同步规则下让 G 达到 200。', hint: '主路定向后再处理噪声过滤。', designerNote: '综合路径治理题。' },
  A04: { title: '零窗口对齐', subtitle: 'R 与 G 必须同节拍达标。', objective: '调整延迟让 R/G 在同一节拍满足。', hint: '延迟器设为 2 节拍。', designerNote: '顿悟点是“精确到同节拍”。' },
  A05: { title: '序列电路', subtitle: '按 G→B→R 顺序点亮。', objective: '通过两个延迟器构造顺序达标。', hint: '分别设置 1 节拍与 2 节拍。', designerNote: '错误路径是“三路越快越好”。' },
  A06: { title: '相位晶格', subtitle: '门控 + 延迟 + 混色 + 分光联动。', objective: '让 R/G 在同节拍同步完成。', hint: '门控开2关1，延迟=1 且朝下输出。', designerNote: '需要同时满足相位和合流时机。' },
  A07: { title: '逻辑窗口', subtitle: '两路输入必须同节拍触发与门。', objective: '用一个延迟器让 R/G 同节拍进入逻辑门并输出到红接收器。', hint: '在 (4,3) 放置延迟器，朝下输出，延迟设为 1。', designerNote: '误导点是“几乎对齐就够了”。关键约束：与门只认同节拍双输入。' },
  A08: { title: '电容脉冲', subtitle: '连续命中充能后再释放脉冲。', objective: '放置一个累积器，吃满两次连续绿光后向红接收器释放两次脉冲。', hint: '在 (4,5) 放累积器，目标色 G，阈值 2，脉冲 2。', designerNote: '误导点是只看路径长度。关键约束是“连续节拍充能”而非单次命中。' },
};
