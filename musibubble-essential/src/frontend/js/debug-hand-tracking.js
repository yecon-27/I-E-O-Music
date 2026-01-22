/**
 * 手部追踪调试工具
 * 专门用于诊断手部偏好数据记录问题
 */

// 调试：监控手部数据记录
window.debugHandTracking = function() {
    console.log('[Debug] 开始监控手部数据记录...');
    
    if (!window.gameResultManager) {
        console.error('[Debug] GameResultManager 未找到');
        return;
    }
    
    // 保存原始的 recordBubblePop 方法
    const originalRecordBubblePop = window.gameResultManager.recordBubblePop;
    
    // 包装方法以添加调试信息
    window.gameResultManager.recordBubblePop = function(handType) {
        console.log('[Debug] recordBubblePop 被调用:', {
            handType: handType,
            isActive: this.isActive,
            currentHandStats: this.gameData.handStats
        });
        
        // 调用原始方法
        const result = originalRecordBubblePop.call(this, handType);
        
        console.log('[Debug] 记录后的手部统计:', this.gameData.handStats);
        
        return result;
    };
    
    console.log('[Debug] 手部数据监控已启动');
};

// 调试：检查碰撞回调
window.debugCollisionCallback = function() {
    console.log('[Debug] 检查碰撞回调设置...');
    
    if (!window.game || !window.game.collisionDetector) {
        console.error('[Debug] 游戏或碰撞检测器未找到');
        return;
    }
    
    console.log('[Debug] 碰撞检测器状态:');
    console.log('  - 回调数量:', window.game.collisionDetector.collisionCallbacks.length);
    console.log('  - 回调函数:', window.game.collisionDetector.collisionCallbacks);
    
    // 检查 handleBubblePop 是否存在
    if (window.game.handleBubblePop) {
        console.log('[Debug] handleBubblePop 方法存在');
    } else {
        console.error('[Debug] handleBubblePop 方法不存在');
    }
};

// 调试：手动触发碰撞
window.debugManualCollision = function(handType = 'rightHand') {
    console.log('[Debug] 手动触发碰撞 - 手部类型:', handType);
    
    if (!window.game || !window.game.bubbleManager) {
        console.error('[Debug] 游戏或泡泡管理器未找到');
        return;
    }
    
    const bubbles = window.game.bubbleManager.bubbles;
    if (bubbles.length === 0) {
        console.warn('[Debug] 没有泡泡可以戳破');
        return;
    }
    
    const bubble = bubbles[0];
    
    // 创建模拟碰撞对象
    const mockCollision = {
        handType: handType,
        hand: { x: bubble.x, y: bubble.y, visible: true },
        bubble: bubble,
        timestamp: performance.now()
    };
    
    console.log('[Debug] 模拟碰撞对象:', mockCollision);
    
    // 直接调用 handleBubblePop
    if (window.game.handleBubblePop) {
        window.game.handleBubblePop(mockCollision);
        console.log('[Debug] handleBubblePop 已调用');
    } else {
        console.error('[Debug] handleBubblePop 方法不存在');
    }
};

// 调试：检查手部位置更新
window.debugHandPositions = function() {
    console.log('[Debug] 检查手部位置更新...');
    
    if (!window.game) {
        console.error('[Debug] 游戏对象未找到');
        return;
    }
    
    console.log('[Debug] 当前手部位置:', window.game.handPositions);
    
    // 监控手部位置变化
    let lastPositions = JSON.stringify(window.game.handPositions);
    
    const checkInterval = setInterval(() => {
        const currentPositions = JSON.stringify(window.game.handPositions);
        if (currentPositions !== lastPositions) {
            console.log('[Debug] 手部位置更新:', window.game.handPositions);
            lastPositions = currentPositions;
        }
    }, 1000);
    
    // 10秒后停止监控
    setTimeout(() => {
        clearInterval(checkInterval);
        console.log('[Debug] 手部位置监控已停止');
    }, 10000);
    
    console.log('[Debug] 手部位置监控已启动（10秒）');
};

console.log('[Debug] 手部追踪调试工具加载完成');
console.log('[Debug] 调试命令:');
console.log('  - debugHandTracking() : 监控手部数据记录');
console.log('  - debugCollisionCallback() : 检查碰撞回调');
console.log('  - debugManualCollision("leftHand") : 手动触发碰撞');
console.log('  - debugHandPositions() : 监控手部位置变化');