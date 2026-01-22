#!/usr/bin/env python3
"""
简单的HTTPS服务器，用于解决摄像头访问权限问题
现代浏览器通常要求HTTPS才能访问摄像头
"""

import http.server
import ssl
import socketserver
import os
import sys
from pathlib import Path

def create_self_signed_cert():
    """创建自签名证书"""
    try:
        import subprocess
        
        # 检查是否已存在证书
        if os.path.exists('server.crt') and os.path.exists('server.key'):
            print("✅ 发现现有证书文件")
            return True
            
        print("🔐 创建自签名证书...")
        
        # 使用openssl创建自签名证书
        cmd = [
            'openssl', 'req', '-x509', '-newkey', 'rsa:4096', 
            '-keyout', 'server.key', '-out', 'server.crt', 
            '-days', '365', '-nodes', '-subj', 
            '/C=CN/ST=State/L=City/O=Organization/CN=localhost'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ 证书创建成功")
            return True
        else:
            print(f"❌ 证书创建失败: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("❌ 未找到openssl命令")
        print("💡 请安装OpenSSL或使用HTTP模式（可能无法访问摄像头）")
        return False
    except Exception as e:
        print(f"❌ 证书创建失败: {e}")
        return False

def start_https_server(port=8443):
    """启动HTTPS服务器"""
    
    # 尝试创建证书
    if not create_self_signed_cert():
        print("\n⚠️  无法创建HTTPS证书，将启动HTTP服务器")
        print("📝 注意：HTTP模式下摄像头可能无法正常工作")
        start_http_server(port=8080)
        return
    
    try:
        # 创建HTTP处理器
        handler = http.server.SimpleHTTPRequestHandler
        
        # 创建服务器
        with socketserver.TCPServer(("", port), handler) as httpd:
            # 配置SSL
            context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            context.load_cert_chain('server.crt', 'server.key')
            httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
            
            print(f"🚀 HTTPS服务器启动成功！")
            print(f"📱 游戏地址: https://localhost:{port}/src/frontend/index.html")
            print(f"🧪 测试页面: https://localhost:{port}/test.html")
            print("\n⚠️  首次访问时浏览器会显示安全警告，点击'高级'→'继续访问'即可")
            print("🛑 按 Ctrl+C 停止服务器")
            
            httpd.serve_forever()
            
    except Exception as e:
        print(f"❌ HTTPS服务器启动失败: {e}")
        print("💡 尝试启动HTTP服务器...")
        start_http_server(port=8080)

def start_http_server(port=8080):
    """启动HTTP服务器（备用方案）"""
    try:
        handler = http.server.SimpleHTTPRequestHandler
        
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"🚀 HTTP服务器启动成功！")
            print(f"📱 游戏地址: http://localhost:{port}/src/frontend/index.html")
            print(f"🧪 测试页面: http://localhost:{port}/test.html")
            print("\n⚠️  HTTP模式下摄像头可能无法正常工作")
            print("💡 建议使用Chrome的--allow-running-insecure-content标志")
            print("🛑 按 Ctrl+C 停止服务器")
            
            httpd.serve_forever()
            
    except Exception as e:
        print(f"❌ HTTP服务器启动失败: {e}")

if __name__ == "__main__":
    print("🎯 泡泡游戏 HTTPS 服务器")
    print("=" * 50)
    
    # 检查端口参数
    port = 8443
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ 无效的端口号，使用默认端口 8443")
    
    try:
        start_https_server(port)
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
    except Exception as e:
        print(f"❌ 服务器错误: {e}")