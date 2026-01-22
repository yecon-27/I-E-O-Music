
window.debugHandTracking = function() {
    console.log('[Debug] 开始监控手部数据记录...');
    
    if (!window.gameResultManager) {
        console.error('[Debug] GameResultManager 未找到');
        return;
    }
    const originalRecordBubblePop = window.gameResultManager.recordBubblePop;
    window.gameResultManager.recordBubblePop = function(handType) {
        console.log('[Debug] recordBubblePop 被调用:', {
            handType: handType,
            isActive: this.isActive,
            currentHandStats: this.gameData.handStats
        });
        const result = originalRecordBubblePop.call(this, handType);
        
        console.log('[Debug] 记录后的手部统计:', this.gameData.handStats);
        
        return result;
    };
    
    console.log('[Debug] 手部数据监控已启动');
};
window.debugCollisionCallback = function() {
    console.log('[Debug] 检查碰撞回调设置...');
    
    if (!window.game || !window.game.collisionDetector) {
        console.error('[Debug] 游戏或碰撞检测器未找到');
        return;
    }
    
    console.log('[Debug] 碰撞检测器状态:');
    console.log('  - 回调数量:', window.game.collisionDetector.collisionCallbacks.length);
    console.log('  - 回调函数:', window.game.collisionDetector.collisionCallbacks);
    if (window.game.handleBubblePop) {
        console.log('[Debug] handleBubblePop 方法存在');
    } else {
        console.error('[Debug] handleBubblePop 方法不存在');
    }
};
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
    const mockCollision = {
        handType: handType,
        hand: { x: bubble.x, y: bubble.y, visible: true },
        bubble: bubble,
        timestamp: performance.now()
    };
    
    console.log('[Debug] 模拟碰撞对象:', mockCollision);
    if (window.game.handleBubblePop) {
        window.game.handleBubblePop(mockCollision);
        console.log('[Debug] handleBubblePop 已调用');
    } else {
        console.error('[Debug] handleBubblePop 方法不存在');
    }
};
window.debugHandPositions = function() {
    console.log('[Debug] 检查手部位置更新...');
    
    if (!window.game) {
        console.error('[Debug] 游戏对象未找到');
        return;
    }
    
    console.log('[Debug] 当前手部位置:', window.game.handPositions);
    let lastPositions = JSON.stringify(window.game.handPositions);
    
    const checkInterval = setInterval(() => {
        const currentPositions = JSON.stringify(window.game.handPositions);
        if (currentPositions !== lastPositions) {
            console.log('[Debug] 手部位置更新:', window.game.handPositions);
            lastPositions = currentPositions;
        }
    }, 1000);
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