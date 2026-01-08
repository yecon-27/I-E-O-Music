#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
iPad访问启动脚本
Start servers for iPad access over local network
"""

import os
import sys
import subprocess
import threading
import time
import socket
from pathlib import Path

def get_local_ip():
    """获取本机局域网IP"""
    try:
        # 创建一个UDP socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # 连接到外部地址（不会真的发送数据）
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def print_banner():
    """打印启动横幅"""
    banner = """
    📱 ================================== 📱
         iPad 泡泡游戏启动器
         Bubble Game for iPad
    📱 ================================== 📱
    """
    print(banner)

def start_websocket_server(host='0.0.0.0'):
    """启动WebSocket服务器"""
    print("🚀 启动WebSocket服务器...")
    
    project_root = Path(__file__).parent.parent
    server_script = project_root / "src" / "backend" / "pose_websocket_server.py"
    
    if not server_script.exists():
        print(f"❌ 找不到服务器脚本: {server_script}")
        return None
    
    try:
        process = subprocess.Popen([
            sys.executable, str(server_script),
            "--host", host,
            "--port", "8765",
            "--width", "1280",
            "--height", "720"
        ], cwd=str(project_root))
        
        print(f"✅ WebSocket服务器已启动 (ws://{host}:8765)")
        return process
        
    except Exception as e:
        print(f"❌ 启动WebSocket服务器失败: {e}")
        return None

def start_https_server():
    """启动HTTPS服务器"""
    print("🌐 启动HTTPS服务器...")
    
    project_root = Path(__file__).parent.parent
    https_script = project_root / "scripts" / "start_https_server.py"
    
    if not https_script.exists():
        print(f"❌ 找不到HTTPS脚本: {https_script}")
        return None
    
    try:
        process = subprocess.Popen([
            sys.executable, str(https_script), "8443"
        ], cwd=str(project_root))
        
        print("✅ HTTPS服务器已启动 (https://0.0.0.0:8443)")
        return process
        
    except Exception as e:
        print(f"❌ 启动HTTPS服务器失败: {e}")
        return None

def print_instructions(local_ip):
    """打印使用说明"""
    instructions = f"""
    📋 iPad访问说明:
    
    1. 📶 确保iPad和电脑在同一WiFi网络
    
    2. 🌐 在iPad的Safari浏览器中访问:
       https://{local_ip}:8443/src/frontend/index.html
    
    3. ⚠️  首次访问会显示安全警告:
       • 点击"显示详细信息"
       • 点击"访问此网站"
       • 确认继续
    
    4. 🎮 游戏控制:
       • 点击"启用摄像头"按钮
       • 允许摄像头权限
       • 开始用手势玩游戏！
    
    5. 💡 提示:
       • 建议横屏使用
       • 确保光线充足
       • 保持适当距离（1-2米）
    
    6. 🔧 如果WebSocket连接失败:
       • 检查防火墙设置
       • 确保端口8765未被占用
       • 尝试重启服务器
    
    📱 本机IP地址: {local_ip}
    🌐 HTTPS端口: 8443
    🔌 WebSocket端口: 8765
    
    按 Ctrl+C 停止所有服务
    """
    print(instructions)

def check_firewall():
    """检查防火墙提示"""
    print("\n🔥 防火墙检查:")
    print("   如果iPad无法连接，请确保Windows防火墙允许:")
    print("   • Python.exe")
    print("   • 端口 8443 (HTTPS)")
    print("   • 端口 8765 (WebSocket)")
    print()

def main():
    """主函数"""
    print_banner()
    
    # 获取本机IP
    local_ip = get_local_ip()
    print(f"🌐 检测到本机IP: {local_ip}\n")
    
    print("="*50)
    
    # 启动WebSocket服务器（绑定到所有接口）
    websocket_process = start_websocket_server(host='0.0.0.0')
    if not websocket_process:
        input("按回车键退出...")
        return
    
    time.sleep(2)
    
    # 启动HTTPS服务器
    https_process = start_https_server()
    if not https_process:
        websocket_process.terminate()
        input("按回车键退出...")
        return
    
    time.sleep(2)
    
    print("\n" + "="*50)
    print("🎉 服务器启动完成!")
    
    check_firewall()
    print_instructions(local_ip)
    
    try:
        # 保持运行
        while True:
            time.sleep(1)
            
            # 检查进程是否还在运行
            if websocket_process.poll() is not None:
                print("⚠️  WebSocket服务器已停止")
                break
            if https_process.poll() is not None:
                print("⚠️  HTTPS服务器已停止")
                break
                
    except KeyboardInterrupt:
        print("\n🛑 正在关闭系统...")
        
        # 终止所有进程
        if websocket_process:
            websocket_process.terminate()
        if https_process:
            https_process.terminate()
        
        print("✅ 系统已关闭")

if __name__ == "__main__":
    main()
