# 🫧 自闭症友好型生成式音乐泡泡游戏 (Autism-Friendly Generative Music Bubble Game)

一个结合 **生成式音乐引擎** 的互动泡泡小游戏。

本项目特别针对 **自闭症谱系障碍 (ASD)** 用户进行了优化，提供感官调节、可预测性设置和数据追踪功能，旨在通过游戏化的方式进行感觉统合训练和认知技能提升。

> **核心机制**：系统会将你在一局游戏里“戳泡泡”产生的 **交互行为（时间/位置/频率）** 转化为音乐动机，由 **生成式音乐引擎** 自动谱写旋律并播放 / 导出 MIDI。

---

## ✨ 核心特性

### 🛡️ 自闭症友好设计 (Autism Friendly)
- **🎛️ 感官调节**：可自定义 **音效音量**、**动画强度**（速度）和 **色彩模式**（标准/高对比度/柔和）。
- **🔄 可预测模式**：减少随机性，泡泡按固定模式出现，帮助建立安全感。
- **📊 视觉辅助**：清晰的进度条、时间指示器和成就弹窗。

### 🎮 互动与游戏性
- **�️ 简单交互**：通过鼠标点击或触摸屏幕与泡泡互动，锻炼手眼协调。
- **⚙️ 灵活控制**：支持暂停/继续、三档速度切换（Slow / Normal / Fast）。

### 🎵 生成式音乐系统
- **🎼 动态谱曲**：回合结束时，系统根据你的游戏节奏和交互模式，实时生成一段独一无二的旋律。
- **🎹 多样化风格**：支持多种音乐风格生成。
- **💾 MIDI 导出**：可将生成的音乐下载为 `*.mid` 文件作为纪念。

### 🐳 部署与架构
- ** Docker 化**：支持 Docker / Nginx 一键部署。
- **🚀 轻量级**：纯前端架构，易于部署和访问。

---

## 📁 目录结构

```
.
├── src/
│   ├── frontend/              # Web 前端应用
│   │   ├── index.html         # 游戏入口
│   │   ├── js/                # 核心逻辑
│   │   │   ├── autism-friendly-features.js  # 感官调节与友好特性
│   │   │   ├── game-engine.js               # 游戏主循环
│   │   │   └── ...
│   │   ├── css/               # 样式文件
│   │   └── vendor/            # 第三方依赖 (Magenta, TFJS)
│   └── backend/               # (可选) 后端服务
├── docs/                      # 项目文档
│   ├── autism-friendly-usage-guide.md  # 自闭症友好功能使用指南
│   └── ...
├── scripts/                   # 辅助脚本
├── docker/                    # Docker 部署配置
└── vendor/                    # 本地化的模型权重和库
```

---

## 🚀 快速开始

### 前置要求
- 现代浏览器 (Chrome/Edge 推荐)

### 1. 运行游戏

#### 方式 A: 纯前端模式 (推荐)
最简单的方式，直接启动一个静态文件服务器：

```bash
python -m http.server 8081
```
然后访问：👉 **[http://localhost:8081/src/frontend/](http://localhost:8081/src/frontend/)**

### 2. Docker 部署
```bash
docker-compose -f docker/docker-compose.yml up --build
```

### 3. iPad/移动设备访问

```bash
# 启动支持局域网访问的服务器（包含HTTPS和WebSocket）
python scripts/start_for_ipad.py
```

📱 详细说明请查看 [iPad使用指南](docs/IPAD_SETUP.md)

---

## 📚 文档导航

详细的使用说明和设计理念请参考 `docs/` 目录：

- **[自闭症友好功能指南](docs/autism-friendly-usage-guide.md)**: 详细介绍感官调节、可预测模式及治疗价值。

---

## 🧠 FAQ & 故障排除

**Q: 没有声音？**
- 浏览器策略要求用户先与页面交互（点击任意处）才能播放音频。
- 检查侧边栏的“感官设置”中音量是否被调低。

**Q: 音乐生成失败？**
- 确保 `vendor/magenta` 和 `vendor/tf` 下的模型文件完整。
- 建议使用 Chrome 浏览器以获得最佳 WebAssembly 性能。

---

## 📜 许可证

本项目采用 **MIT License**。
