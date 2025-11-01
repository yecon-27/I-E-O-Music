# 使用Python 3.9作为基础镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgtk-3-0 \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目文件
COPY . .

# 暴露端口
EXPOSE 8080 8765

# 设置环境变量
ENV PYTHONPATH=/app/src/backend
ENV DISPLAY=:0

# 创建启动脚本
RUN echo '#!/bin/bash\n\
echo "🐳 启动泡泡游戏Docker容器"\n\
echo "================================"\n\
\n\
# 启动WebSocket服务器（后台）\n\
cd /app/src/backend\n\
python pose_websocket_server.py --host 0.0.0.0 &\n\
\n\
# 等待WebSocket服务器启动\n\
sleep 3\n\
\n\
# 启动HTTP服务器（前台）\n\
cd /app\n\
python -m http.server 8080 --bind 0.0.0.0\n\
' > /app/start.sh && chmod +x /app/start.sh

# 默认命令
CMD ["/app/start.sh"]