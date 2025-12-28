# 🫧 Bubble Popping Game with MediaPipe Pose + Magenta MusicRNN

一个结合 **MediaPipe Pose 姿势检测**、**Tokyo2020 风格小人** 与 **Magenta MusicRNN（AI 续写旋律）** 的互动泡泡小游戏。

> 说明：AI 生成的音乐会把你在一局游戏里“戳泡泡”产生的 **音符事件（音高/时间）** 当作 *primer*，由 **Magenta MusicRNN** 自动续写旋律并播放 / 导出 MIDI。
  
---

## ✨ 特性

- 🎮 交互：鼠标或手势实时戳泡泡，流畅动画与即时反馈  
- 🏃 姿势检测：MediaPipe Pose；可切换 Tokyo2020 小人风格  
- 🎵 AI 音乐：回合结束时用 *primer* 续写旋律（可下载为 `*.mid`）  
- ⚙️ 控制：暂停/继续、速度切换（Slow / Normal / Fast）、输入方式显示、回合倒计时（可选）  
- 🐳 部署：支持 Docker / Nginx 的生产配置  
- 🔒 HTTPS：便于浏览器授权摄像头（强烈推荐）

---

## 📁 目录结构（关键路径）

```
.
├── src/
│   ├── frontend/
│   │   ├── index.html                 # 入口页面（所有相对路径以此为基准）
│   │   ├── css/
│   │   ├── js/                        # 游戏逻辑（main.js / game-engine.js / pose-detector.js ...）
│   │   └── vendor/
│   │       └── mediapipe/             # *必须* 把 Pose 的 JS/WASM/二进制资源拷到这里
│   │           ├── pose/
│   │           ├── camera_utils/
│   │           ├── control_utils/
│   │           └── drawing_utils/
│   └── backend/
│       ├── pose_websocket_server.py
│       └── utils/
├── vendor/
│   ├── tf/                            # 本地化 TFJS：tf.min.js
│   └── magenta/
│       ├── music.js                   # 本地化 Magenta UMD
│       └── checkpoints/
│           └── music_rnn/
│               └── melody_rnn/        # MusicRNN 模型目录（本地）
├── scripts/
├── docker/
└── README.md
```

> `index.html` 位于 `src/frontend/`，因此 **TFJS / Magenta** 的引用路径是 `../../vendor/...`；  
> **MediaPipe** 的资源要放在 `src/frontend/vendor/mediapipe/...`，页面里引用 `./vendor/mediapipe/...`。

---

## 🚀 快速开始

### 1. 运行游戏
在项目根目录下打开终端，运行以下命令：
```bash
python -m http.server 8081
```

### 2. 访问游戏
打开浏览器，访问以下链接：
👉 **[http://localhost:8081/src/frontend/](http://localhost:8081/src/frontend/)**

### ⚠️ 常见问题
- **摄像头打不开？**
  - 请确保 **关闭了其他使用摄像头的软件**（如 Zoom、Teams、腾讯会议等）。
  - 刷新页面后，点击浏览器弹出的“允许”按钮。

---

## 📦 进阶运行（可选）

### HTTPS 模式（如需远程访问）
```bash
python scripts/start_https_server.py
```

### Docker 部署
```bash
docker-compose -f docker/docker-compose.yml up --build
```

---

## 🎮 游戏说明

- **鼠标模式**：直接移动指针戳泡泡  
- **手势模式**：点击「摄像头」按钮启用，伸出食指即可控制  
- **暂停 / 继续**：点击 Pause 或按空格  
- **速度切换**：Slow / Normal / Fast  
- **Tokyo2020 小人**：可一键切换显示风格

> 回合结束时，会将本局采到的音符量化为 *primer*，用 **Magenta MusicRNN** 续写旋律并播放，同时可 **下载 MIDI**（`magenta_rnn_output.mid`）。

---

## 🧠 FAQ

**Q1：AI 生成的音乐根据什么来的？会录我的声音吗？**  
A：**不会录音**。AI 使用你在游戏中戳泡泡得到的 **音符（pitch）与时间（dt）** 序列作为 *primer*，由 RNN 在该基础上 **续写旋律**。

**Q2：浏览器没声音？**  
A：首次播放前需要一次 **用户手势** 解锁音频：点击页面或按键即可。代码里已在 `pointerdown/keydown` 兜底 `AudioContext.resume()`。

**Q3：控制台提示 `multinomial` 未实现？**  
A：请使用 **TFJS 2.8.6 / 2.7.0**，并在续写前 **切换到 CPU 后端** 或直接在 CPU 上初始化模型（本仓的 `main.js` 已内置 CPU 兜底）。

**Q4：MIDI 导出只有几十字节或听起来很短？**  
A：多数情况是续写得到的音符很少或总时长为 0。代码已在导出前做兜底：若 `totalTime` 过小，会根据音符的 `endTime` 做最小延长。

**Q5：MediaPipe 404？**  
A：确认已把 `@mediapipe/pose` 的 **WASM / 二进制 / 资源** 拷到 `src/frontend/vendor/mediapipe/pose/`，并用相对 `index.html` 的路径加载。

---

## 🛠 故障排除

- **Cannot get user media / 摄像头拒绝**：  
  用 HTTPS、检查浏览器权限、关闭占用摄像头的其他软件。  

- **CORS / 静态文件 404**：  
  用内置 `http.server` 或 Nginx；确认路径相对 `src/frontend/index.html`。  

- **Magenta / TFJS 兼容**：  
  以 **2.8.6** 为主，若出错回退 **2.7.0**；续写时强制走 **CPU**。  

- **声音仍无**：  
  在页面上 **点击任意按钮** 触发一次手势；或者打开控制台执行：  
  ```js
  window.mm?.Player?.tone?.context?.resume?.()
  ```

---

## 📜 许可证

本项目采用 **MIT License**。

---

## 🙏 致谢

- [MediaPipe](https://developers.google.com/mediapipe) 团队提供的优秀姿势检测  
- [Magenta](https://magenta.tensorflow.org/) 提供的 MusicRNN  
- Tokyo2020 pictogram 的视觉灵感
