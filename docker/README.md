# 🐳 Docker 部署指南

## 快速启动

### 开发模式
```bash
cd bubble-popping-game-clean
docker-compose -f docker/docker-compose.yml up --build
```

### 生产模式（带Nginx）
```bash
cd bubble-popping-game-clean
docker-compose -f docker/docker-compose.yml --profile production up --build
```

## 访问地址

- **开发模式**: http://localhost:8080/src/frontend/index.html
- **生产模式**: http://localhost/
- **WebSocket**: ws://localhost:8765

## 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DISPLAY` | `:0` | X11显示（Linux GUI支持） |
| `PYTHONUNBUFFERED` | `1` | Python输出不缓冲 |

## 端口映射

| 容器端口 | 主机端口 | 服务 |
|----------|----------|------|
| 8080 | 8080 | HTTP服务器 |
| 8765 | 8765 | WebSocket服务器 |
| 80 | 80 | Nginx（生产模式） |
| 443 | 443 | Nginx HTTPS（生产模式） |

## 常用命令

### 构建镜像
```bash
docker build -f docker/Dockerfile -t bubble-game .
```

### 运行容器
```bash
docker run -p 8080:8080 -p 8765:8765 bubble-game
```

### 查看日志
```bash
docker-compose -f docker/docker-compose.yml logs -f
```

### 停止服务
```bash
docker-compose -f docker/docker-compose.yml down
```

### 重新构建
```bash
docker-compose -f docker/docker-compose.yml up --build --force-recreate
```

## 故障排除

### 摄像头权限问题
Docker容器中的摄像头访问需要特殊配置：

```bash
# Linux系统
docker run --device=/dev/video0 -p 8080:8080 bubble-game

# 或使用特权模式
docker run --privileged -p 8080:8080 bubble-game
```

### 网络问题
检查端口是否被占用：
```bash
netstat -tulpn | grep :8080
netstat -tulpn | grep :8765
```

### 性能优化
生产环境建议：
- 使用多阶段构建减小镜像大小
- 配置资源限制
- 启用健康检查

## 安全注意事项

1. **生产环境**：使用HTTPS和安全的WebSocket连接
2. **防火墙**：只开放必要的端口
3. **更新**：定期更新基础镜像和依赖
4. **监控**：配置日志和监控系统