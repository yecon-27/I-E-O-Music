# MusiBubbles Safety Envelope — 专家模式 Auditory

MusiBubbles 是一个面向感觉敏感场景（如 ASD）的可审计音乐奖励原型，采用 Input–Envelope–Output（I–E–O）约束优先框架：将「输入」与「输出」之间插入低风险安全包络，对关键参数设定边界并进行确定性约束，同时记录所有干预用于审计与复现。项目当前重点是「专家模式 Auditory」的配置、联动与证据产出，不涉及早期的 MediaPipe 或 AIGC 生成器内容。

---

## 设计原则

- 可预测优先：输出变化受声明边界约束，同一输入产生稳定结果。[advanced-music-generator.js](file:///d:/MusiBubble-Safety-Envelope/src/frontend/js/advanced-music-generator.js#L647-L680)
- 模式级映射：奖励关联行为模式（节奏密度、序列性等），不做逐击声化放大噪声。[game-result-manager.js](file:///d:/MusiBubble-Safety-Envelope/src/frontend/js/game-result-manager.js#L1145-L1174)
- 低风险包络：对过载维度（BPM、增益、对比）施加边界并审计干预。[game-integration.js](file:///d:/MusiBubble-Safety-Envelope/src/frontend/js/game-integration.js#L30-L93)
- 可审计可配置：默认保守设定，专家模式下在边界内可调，所有请求值与有效值均记录。[audit-dashboard.js](file:///d:/MusiBubble-Safety-Envelope/src/frontend/js/audit-dashboard.js#L45-L111)

更多理论背景与证据结构见论文草稿 [main.tex](file:///d:/MusiBubble-Safety-Envelope/main.tex#L24-L118)。

---

## 功能概览（专家模式 Auditory）

- 专家调试抽屉：快捷键 Ctrl+Shift+E 打开，切换 expertMode，并提供参数预览入口。[expert-drawer.js](file:///d:/MusiBubble-Safety-Envelope/src/frontend/js/expert-drawer.js#L968-L1020)
- 包络联动映射：tempo→rewardBpm，volume→音量与等级标签，density→泡泡/节奏密度标签；不安全模式下强制专家路径。[game-integration.js](file:///d:/MusiBubble-Safety-Envelope/src/frontend/js/game-integration.js#L30-L93)
- 预览与覆盖：preview 写入 expertMode/expertOverride 与奖励参数（BPM、动态对比、片段范围、音量级别）。[music-param-controller.js](file:///d:/MusiBubble-Safety-Envelope/src/frontend/js/music-param-controller.js#L972-L1019)
- 生成器分支控制：expertOverride > expertMode > 常规派生；skipEnvelope 时跳过约束使用原值。[advanced-music-generator.js](file:///d:/MusiBubble-Safety-Envelope/src/frontend/js/advanced-music-generator.js#L647-L680)
- 结果页专家视图：行为分析、点击轨迹、频谱入口、刷新与退出按钮。[game-result-manager.js](file:///d:/MusiBubble-Safety-Envelope/src/frontend/js/game-result-manager.js#L57-L114)
- 频谱对比与导出：生成/导出 PNG、JSON，用于基线 vs 约束的工程证据。[spectrogram-comparison.js](file:///d:/MusiBubble-Safety-Envelope/src/frontend/js/spectrogram-comparison.js#L52-L59)
- 专家审计看板：会话元数据、约束执行、日志与回放入口。[audit-dashboard.js](file:///d:/MusiBubble-Safety-Envelope/src/frontend/js/audit-dashboard.js#L12-L37)

---

## 界面类型

- 游戏主界面：主 Canvas、轨迹提示与鼓励消息。[index.html](file:///d:/MusiBubble-Safety-Envelope/src/frontend/index.html#L113-L123)
- 结果页普通视图：统计与操作按钮。[index.html](file:///d:/MusiBubble-Safety-Envelope/src/frontend/index.html#L127-L209)
- 结果页专家视图：行为分析、轨迹散点、参数与频谱入口。[index.html](file:///d:/MusiBubble-Safety-Envelope/src/frontend/index.html#L211-L497)
- 专家调试抽屉：参数预览与快捷操作。[expert-drawer.js](file:///d:/MusiBubble-Safety-Envelope/src/frontend/js/expert-drawer.js#L278-L317)
- 会话设置弹窗：音量/音色/延迟/反馈等设置。[index.html](file:///d:/MusiBubble-Safety-Envelope/src/frontend/index.html#L613-L719)
- 右侧监控侧边栏：实时数据、Lane 分布、模式预测、最近点击。[index.html](file:///d:/MusiBubble-Safety-Envelope/src/frontend/index.html#L501-L586)
- 暂停覆盖层：暂停遮罩与提示。[index.html](file:///d:/MusiBubble-Safety-Envelope/src/frontend/index.html#L119-L122)
- 频谱分析区：对比图渲染与导出。[game-result-manager.js](file:///d:/MusiBubble-Safety-Envelope/src/frontend/js/game-result-manager.js#L2226-L2416)
- 专家审计看板：动态创建与渲染。[audit-dashboard.js](file:///d:/MusiBubble-Safety-Envelope/src/frontend/js/audit-dashboard.js#L251-L298)

---

## 快速开始

- 安装依赖
```bash
npm ci
```
- 开发运行（本地静态服务）
```bash
npx serve src/frontend -l 3000
```
- 构建静态资源（用于部署）
```bash
node scripts/build-vercel.js
```
构建输出位于 `public/`，[build-vercel.js](file:///d:/MusiBubble-Safety-Envelope/scripts/build-vercel.js) 会同步修正 vendor 路径。

---

## 部署说明

- Vercel：已在 [vercel.json](file:///d:/MusiBubble-Safety-Envelope/vercel.json) 指定
  - installCommand: `npm ci`
  - buildCommand: `node scripts/build-vercel.js`
  - outputDirectory: `public`
  这样可避免构建机尝试执行 `pip3 install`（PEP 668 外部托管环境），仅部署前端静态资源。

- 局域网/iPad 访问：见脚本
  - [start_for_ipad.py](file:///d:/MusiBubble-Safety-Envelope/scripts/start_for_ipad.py)
  - [start_https_server.py](file:///d:/MusiBubble-Safety-Envelope/scripts/start_https_server.py)

---

## 目录结构

```
.
├── src/
│   └── frontend/
│       ├── index.html
│       ├── css/
│       └── js/
│           ├── game-engine.js
│           ├── game-integration.js
│           ├── game-result-manager.js
│           ├── expert-drawer.js
│           ├── music-param-controller.js
│           └── spectrogram-comparison.js
├── scripts/
│   └── build-vercel.js
├── public/           # 构建输出
├── vercel.json
└── main.tex          # 论文草稿（设计与证据背景）
```

---

## 使用要点

- 打开专家模式：按 Ctrl+Shift+E，或不安全模式联动触发。
- 配置安全范围：在抽屉/结果页专家视图内调参，超界将被包络约束并记录。
- 预览与导出：结果页专家视图提供频谱与 JSON 导出，用于基线 vs 约束对比。
- 复现与审计：请求值与有效值、约束次数等在会话报告中可复盘。

---

## 许可证

MIT License
