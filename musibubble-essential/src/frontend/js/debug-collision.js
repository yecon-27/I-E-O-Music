/**
 * 碰撞检测调试工具
 * 用于诊断泡泡戳破数据记录问题
 */

// 调试：监控所有泡泡戳破事件
window.debugCollisionSystem = function() {
    console.log('[Debug] 开始监控碰撞系统...');
    
    if (!window.game || !window.game.bubbleManager) {
        console.error('[Debug] 游戏或泡泡管理器未找到');
        return;
    }
    
    // 保存原始的 onPop 回调
    const originalOnPop = window.game.bubbleManager.onPop;
    
    // 包装 onPop 回调以添加调试信息
    window.game.bubbleManager.onPop = function(bubble) {
        console.log('[Debug] 泡泡戳破事件触发:', {
            bubbleId: bubble.id,
            position: { x: bubble.x, y: bubble.y },
            note: bubble.note?.name,
            timestamp: Date.now()
        });
        
        // 检查 GameResultManager 状态
        if (window.gameResultManager) {
            console.log('[Debug] GameResultManager 状态:');
            console.log('  - isActive:', window.gameResultManager.isActive);
            console.log('  - 戳破前数量:', window.gameResultManager.gameData.bubblesPopped);
            
            // 调用原始回调
            if (originalOnPop) {
                originalOnPop.call(this, bubble);
            }
            
            console.log('  - 戳破后数量:', window.gameResultManager.gameData.bubblesPopped);
        } else {
            console.error('[Debug] GameResultManager 未找到');
            
            // 仍然调用原始回调
            if (originalOnPop) {
                originalOnPop.call(this, bubble);
            }
        }
    };
    
    console.log('[Debug] 碰撞监控已启动');
    console.log('[Debug] 现在戳破泡泡时会显示详细调试信息');
};

// 调试：手动触发泡泡戳破
window.debugPopBubble = function() {
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
    console.log('[Debug] 手动戳破泡泡:', bubble.id);
    
    // 直接调用 checkCollision
    const result = window.game.bubbleManager.checkCollision(bubble.x, bubble.y);
    console.log('[Debug] 戳破结果:', result);
};

// 调试：检查游戏状态
window.debugGameState = function() {
    console.log('[Debug] 游戏状态检查:');
    
    console.log('[Debug] 游戏对象:', {
        exists: !!window.game,
        isRunning: window.game?.isRunning,
        roundActive: window.game?.roundActive,
        score: window.game?.score
    });
    
    console.log('[Debug] 泡泡管理器:', {
        exists: !!window.game?.bubbleManager,
        bubbleCount: window.game?.bubbleManager?.bubbles?.length || 0,
        onPopExists: !!window.game?.bubbleManager?.onPop
    });
    
    console.log('[Debug] 碰撞检测器:', {
        exists: !!window.game?.collisionDetector,
        callbackCount: window.game?.collisionDetector?.collisionCallbacks?.length || 0
    });
    
    console.log('[Debug] 结果管理器:', {
        exists: !!window.gameResultManager,
        isActive: window.gameResultManager?.isActive,
        bubblesPopped: window.gameResultManager?.gameData?.bubblesPopped || 0
    });
    
    console.log('[Debug] 手部位置:', window.game?.handPositions);
};

console.log('[Debug] 碰撞调试工具加载完成');
console.log('[Debug] 调试命令:');
console.log('  - debugCollisionSystem() : 监控碰撞系统');
console.log('  - debugPopBubble() : 手动戳破泡泡');
console.log('  - debugGameState() : 检查游戏状态');