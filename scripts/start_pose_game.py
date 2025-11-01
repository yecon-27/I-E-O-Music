#!/usr/bin/env python3
"""
启动完整的泡泡游戏系统
包括WebSocket服务器和HTTP服务器
"""

import subprocess
import sys
import time
import threading
import os

def start_websocket_server():
    """启动WebSocket服务器"""
    try:
        print("🔌 启动WebSocket服务器...")
        os.chdir('src/backend')
        subprocess.run([sys.executable, 'pose_websocket_server.py'], check=True)
    except Exception as e:
        print(f"❌ WebSocket服务器启动失败: {e}")

def start_http_server():
    """启动HTTP服务器"""
    try:
        print("🌐 启动HTTP服务器...")
        time.sleep(2)  # 等待WebSocket服务器启动
        os.chdir('../..')
        subprocess.run([sys.executable, 'scripts/start_https_server.py'], check=True)
    except Exception as e:
        print(f"❌ HTTP服务器启动失败: {e}")

def main():
    print("🎮 启动泡泡游戏系统")
    print("=" * 50)
    
    try:
        # 启动WebSocket服务器（后台）
        websocket_thread = threading.Thread(target=start_websocket_server)
        websocket_thread.daemon = True
        websocket_thread.start()
        
        # 启动HTTP服务器（前台）
        start_http_server()
        
    except KeyboardInterrupt:
        print("\n👋 游戏系统已停止")
    except Exception as e:
        print(f"❌ 系统启动失败: {e}")

if __name__ == "__main__":
    main()