# 🫧 Bubble Popping Game with MediaPipe Pose Detection

一个结合了 MediaPipe 姿势检测和 Tokyo2020 风格小人的互动泡泡游戏。

## ✨ 特性

- 🎮 **互动游戏体验** - 使用手势或鼠标戳破泡泡
- 🏃 **MediaPipe 姿势检测** - 实时检测手部位置
- 🎨 **Tokyo2020 风格** - 经典的奥运会小人图标风格
- 🎯 **多种控制模式** - 支持摄像头手势和鼠标控制
- ⚡ **实时反馈** - 流畅的动画和即时响应

## 🚀 快速开始

### 环境要求

- Python 3.7+
- 现代浏览器 (Chrome/Firefox/Edge)
- 摄像头 (可选，用于手势控制)

### 安装和运行

1. **克隆项目**

   ```bash
   git clone <your-repo-url>
   cd bubble-popping-game
   ```

2. **安装依赖**

   ```bash
   pip install -r requirements.txt
   ```

3. **启动服务器**

   ````bash
   # 启动WebSocket服务器 (用于姿势检测)
   python src/backend/pose_websocket_server.py

   # 启动HTTP服务器 (在新终端中)
   python -m http.server 8080
   ```![alt text](image.png)

   ````

4. **打开游戏**
   访问: `http://localhost:8080/src/frontend/index.html`

### HTTPS 模式 (推荐用于摄像头访问)

```bash
python scripts/start_https_server.py
```

### Docker 部署 (推荐用于生产环境)

```bash
# 开发模式
docker-compose -f docker/docker-compose.yml up --build

# 生产模式（带Nginx）
docker-compose -f docker/docker-compose.yml --profile production up --build
```

### HTTPS 模式 (推荐用于摄像头访问)

```bash
python scripts/start_https_server.py
```

## 🎮 游戏说明

### 控制方式

- **鼠标模式**: 移动鼠标指针戳破泡泡
- **手势模式**: 点击"摄像头"按钮启用，使用手部动作控制

### 游戏功能

- **暂停/继续**: 点击 Pause 按钮或按空格键
- **速度控制**: Slow/Normal/Fast 三种速度
- **Tokyo2020 小人**: 切换经典奥运风格显示
- **实时状态**: 显示手势检测状态和游戏信息

## 📁 项目结构

```
bubble-popping-game/
├── src/
│   ├── frontend/          # 前端代码
│   │   ├── index.html    # 主游戏页面
│   │   ├── css/          # 样式文件
│   │   ├── js/           # JavaScript游戏逻辑
│   │   └── assets/       # 静态资源
│   ├── backend/          # 后端服务
│   │   ├── pose_websocket_server.py  # WebSocket服务器
│   │   └── utils/        # 工具函数
│   └── tests/            # 测试页面
├── docs/                 # 项目文档
├── scripts/              # 启动脚本
└── docker/              # Docker配置
```

## 🛠️ 技术栈

- **前端**: HTML5 Canvas, JavaScript ES6+, CSS3
- **后端**: Python, WebSocket, MediaPipe
- **姿势检测**: MediaPipe Pose
- **实时通信**: WebSocket
- **容器化**: Docker (可选)

## 📖 详细文档

- [姿势检测集成说明](docs/POSE_INTEGRATION_README.md)
- [手势控制规则](docs/GESTURE_RULES.md)
- [镜像修复测试](docs/MIRROR_FIX_TEST.md)
- [功能更新日志](docs/UPDATED_FEATURES.md)

## 🐛 故障排除

### 摄像头无法访问

1. 检查浏览器权限设置
2. 确保没有其他程序占用摄像头
3. 尝试使用 HTTPS 模式
4. 查看浏览器控制台错误信息

### 游戏无法启动

1. 确认 Python 依赖已安装
2. 检查端口是否被占用
3. 验证文件路径是否正确

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](LICENSE)

## 🙏 致谢

- MediaPipe 团队提供的优秀姿势检测库
- Tokyo2020 奥运会的设计灵感
