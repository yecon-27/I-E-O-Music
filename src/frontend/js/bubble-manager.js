/**
 * Bubble Manager - Handles bubble creation, movement, and lifecycle management
 * 现改为“7 条垂直 lane 固定映射”的模式，便于记录稳定的 lane→note。
 */

// 为泡泡管理器单独定义 lane，避免与其他脚本的全局命名冲突
// 使用降低饱和度的现代配色
const BUBBLE_LANES = [
    { id: 1, color: '#F87171', note: { name: 'C4', midi: 60, freq: 261.6256 } }, // Soft Red
    { id: 2, color: '#FB923C', note: { name: 'D4', midi: 62, freq: 293.6648 } }, // Soft Orange
    { id: 3, color: '#FBBF24', note: { name: 'E4', midi: 64, freq: 329.6276 } }, // Soft Yellow
    { id: 4, color: '#60A5FA', note: { name: 'G4', midi: 67, freq: 391.9954 } }, // Soft Blue
    { id: 5, color: '#A78BFA', note: { name: 'A4', midi: 69, freq: 440.0 } }, // Soft Purple
];
// 从左到右的高度比例（归一化 0-1），依次由高到低
// 从左到右统一从底部生成，使用相同的起始高度（避免梯度）
const LANE_HEIGHT_RATIO = [1.05, 1.05, 1.05, 1.05, 1.05];

class BubbleManager {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Bubble collection
        this.bubbles = [];
        this.nextBubbleId = 0;
        this.spawnTimers = [];
        
        // 同屏泡泡控制：放慢速度、减少同屏数量，便于规律点击
        this.minOnScreen = 3;
        this.maxOnScreen = 4;
        this.targetBubbleCount = 4;
        this.spawnSequenceIndex = 0; // 顺序生成用
        
        // 时间控制（保持少量泡泡即可，无需频繁 spawn 定时器）
        this.lastSpawnTime = 0;
        this.baseSpawnInterval = 2000; // 加大生成间隔，拉开先后高度
        
        // Bubble configuration：减速，拉开上下间距
        this.config = {
            minRadius: 30,
            maxRadius: 30,
            baseSpeed: 1.2, // px per frame @60fps，约 7-8s 飞完屏幕
            spawnMargin: 40
        };
        
        // ★ 命中回调占位（外部可订阅）
        this.onPop = null;
        
        // 自闭症友好功能
        this.predictableMode = false;
        this.predictablePattern = [];
        this.patternIndex = 0;
        this.initPredictablePattern();
    }

    /**
     * 设置泡泡密度 (rhythmDensity)
     * @param {'sparse' | 'normal' | number} density - 字符串枚举或数字倍率 (1.0 = normal)
     */
    setDensity(density) {
        if (typeof density === 'number') {
            // 数字倍率模式 (专家模式)
            // 1.0 = 2000ms interval, 4 bubbles
            // 2.0 = 1000ms interval, 8 bubbles (clamped by maxOnScreen)
            const multiplier = Math.max(0.1, density);
            this.baseSpawnInterval = 2000 / multiplier;
            this.targetBubbleCount = Math.max(2, Math.min(10, Math.round(4 * multiplier)));
            this.minOnScreen = Math.max(1, this.targetBubbleCount - 1);
            this.maxOnScreen = this.targetBubbleCount + 2;
            console.log(`🫧 泡泡密度: 倍率 ${multiplier.toFixed(2)}x (间隔 ${this.baseSpawnInterval.toFixed(0)}ms)`);
        } else if (density === 'sparse') {
            this.minOnScreen = 2;
            this.maxOnScreen = 3;
            this.targetBubbleCount = 2;
            this.baseSpawnInterval = 3000; // 更长的生成间隔
            console.log('🫧 泡泡密度: 稀疏 (2个)');
        } else {
            this.minOnScreen = 3;
            this.maxOnScreen = 4;
            this.targetBubbleCount = 4;
            this.baseSpawnInterval = 2000;
            console.log('🫧 泡泡密度: 正常 (4个)');
        }
    }
    
    /**
     * 初始化可预测的泡泡出现模式
     */
    initPredictablePattern() {
        // 7 条等距 lane，从左到右
        this.predictablePattern = BUBBLE_LANES.map((lane, idx) => ({
            x: (idx + 1) / (BUBBLE_LANES.length + 1),
            y: 1.0,
            color: lane.id - 1,
            size: 1.0
        }));
    }
    
    /**
     * 设置可预测模式
     */
    setPredictableMode(enabled) {
        this.predictableMode = enabled;
        if (enabled) {
            this.patternIndex = 0;
            console.log('🔄 规律模式已启用 - 泡泡将按固定位置出现');
        } else {
            console.log('🎲 随机模式已启用 - 泡泡将随机出现');
        }
    }

    /**
     * 初始化同屏泡泡（在一局开始时调用）
     */
    seedBubbles(count = 1) {
        const n = Math.max(1, Math.min(count, this.maxOnScreen));
        for (let i = 0; i < n; i++) {
            this.spawnBubble();
        }
    }
    
    /**
     * Update all bubbles - movement, lifecycle, and spawning
     */
    update(deltaTime, gameSpeed = 1.0) {
        const currentTime = performance.now();
        
        // Spawn new bubbles based on timing
        this.handleBubbleSpawning(currentTime, gameSpeed);
        
        // Update existing bubbles
        this.updateBubblePositions(deltaTime, gameSpeed);
        
        // Remove bubbles that have left the screen
        this.removeOffscreenBubbles();
    }
    
    /**
     * Handle spawning of new bubbles
     */
    handleBubbleSpawning(currentTime, gameSpeed) {
        // 控制同屏数量：不超过 maxOnScreen
        if (this.bubbles.length >= this.maxOnScreen) return;

        const adjustedSpawnInterval = this.baseSpawnInterval / gameSpeed;

        // 初始或不足 minOnScreen 时，按间隔逐个补齐
        if (this.bubbles.length < this.targetBubbleCount &&
            currentTime - this.lastSpawnTime >= adjustedSpawnInterval) {
            this.scheduleSpawn(null, 0);
            this.lastSpawnTime = currentTime;
            return;
        }
    }
    
    /**
    * Create a new bubble at the bottom of the screen
    */
    spawnBubble(laneId = null) {
        let lane;
        if (laneId) {
            lane = BUBBLE_LANES.find((l) => l.id === laneId);
        } else {
            // 按顺序从左到右生成（C-D-E-G-A），循环
            lane = BUBBLE_LANES[this.spawnSequenceIndex % BUBBLE_LANES.length];
            this.spawnSequenceIndex++;
        }
        if (!lane) return;

        // 若该 lane 已有未爆的泡泡，延迟再试，避免同 lane 重叠
        const occupied = this.bubbles.some(
            (b) => b.laneId === lane.id && !b.isPopping
        );
        if (occupied) {
            // 再延迟一小段时间重试
            this.scheduleSpawn(lane.id, 200);
            return;
        }

        const laneIndex = lane.id - 1;
        const laneWidth = this.canvasWidth / (BUBBLE_LANES.length + 1);
        const x = laneWidth * (laneIndex + 1);
        // 固定起始高度：从左到右依次由高到低，队列再向下错开
        const laneQueueSize = this.bubbles.filter(b => b.laneId === lane.id && !b.isPopping).length;
        const y = this.getLaneY(lane.id, laneQueueSize);
        const radius = this.config.minRadius;
        const speed = this.config.baseSpeed;

        const bubble = {
            id: this.nextBubbleId++,
            x,
            y,
            radius,
            color: lane.color,
            speed,
            laneId: lane.id,
            isPopping: false,
            popAnimation: null,
            floatOffset: 0,
            floatAmplitude: 0,
            note: lane.note,
            lastHitAt: 0,
        };

        this.bubbles.push(bubble);
    }

    /**
     * 带延时的生成，避免同一时间多只泡泡在同一水平线
     */
    scheduleSpawn(laneId = null, delayMs = 0) {
        const timer = setTimeout(() => {
            this.spawnBubble(laneId);
        }, delayMs);
        this.spawnTimers.push(timer);
    }

    /**
     * 计算某个 lane 的基础高度（归一化到画布），队列内再向下偏移
     */
    getLaneY(laneId, queueIndex = 0) {
        const ratio = LANE_HEIGHT_RATIO[(laneId - 1) % LANE_HEIGHT_RATIO.length] || 1.05;
        const baseY = this.canvasHeight * ratio; // 统一位于画布下方
        const step = this.config.minRadius * 3; // 队列向下轻微偏移，避免贴合
        return baseY + queueIndex * step;
    }
    
    /**
     * Update positions of all bubbles
     */
    updateBubblePositions(deltaTime, gameSpeed) {
        const time = performance.now() * 0.001; // Convert to seconds for smooth animation
        
        this.bubbles.forEach(bubble => {
            if (!bubble.isPopping) {
                bubble.y -= bubble.speed * gameSpeed;
            }
        });
    }
    
    /**
     * Remove bubbles that have moved off screen
     */
    removeOffscreenBubbles() {
        const initialCount = this.bubbles.length;
        
        // Remove bubbles that are above the screen (with some margin)
        const remaining = [];
        this.bubbles.forEach(bubble => {
            const shouldRemove = bubble.y <= -bubble.radius - 10;
            if (shouldRemove) {
                this.respawnSameLane(bubble);
            } else {
                remaining.push(bubble);
            }
        });
        this.bubbles = remaining;
    }
    
    /**
     * Render all bubbles with smooth animations
     */
    render(ctx) {
        this.bubbles.forEach(bubble => {
            this.renderBubble(ctx, bubble);
        });
    }
    
    /**
     * Render a single bubble with Modern Matte / Micro-texture styling
     * Updated: Visual noise reduction (No scale, Light envelope, Thin ripple)
     */
    renderBubble(ctx, bubble) {
        ctx.save();
        
        let alpha = 0.35;
        let radius = bubble.radius;
        let isRipple = false;
        let rippleRadius = 0;
        let rippleAlpha = 0;

        // Handle Pop Animation State
        if (bubble.isPopping && bubble.popAnimation) {
            const now = performance.now();
            const elapsed = now - bubble.popAnimation.startTime;
            const duration = bubble.popAnimation.duration; // 300ms
            const t = Math.min(1, Math.max(0, elapsed / duration)); // 0 -> 1

            // 1. Light Effect: Alpha 0.3 -> 1.0 -> 0.3 (linear decay)
            // "Trigger alpha from 0.3 jump to 1.0, then linear decay"
            alpha = 1.0 - (0.7 * t); 

            // 2. No Scale Animation (Radius stays constant)
            // "禁甩动作：去掉大幅度的 Scale（缩放）动画"
            radius = bubble.radius;

            // 3. Ripple Effect
            // "增加一个向外扩散的 0.5px 极细圆环动画"
            isRipple = true;
            // Ripple expands from radius to radius + 15px
            rippleRadius = radius + (15 * t);
            rippleAlpha = 1.0 - t; // Fade out
        }
        
        // 1. Base Fill
        ctx.fillStyle = this.hexToRgba(bubble.color, alpha); 
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Subtle Top Highlight
        // Adjust highlight intensity based on alpha state
        const highlightOpacity = bubble.isPopping ? 0.4 : 0.2;
        
        const gradient = ctx.createRadialGradient(
            bubble.x - radius * 0.25,
            bubble.y - radius * 0.25,
            0,
            bubble.x,
            bubble.y,
            radius
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${highlightOpacity})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${highlightOpacity * 0.25})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 3. Clean, Thin Border
        ctx.strokeStyle = this.hexToRgba(bubble.color, Math.min(1, alpha + 0.25));
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 4. Draw Ripple (if popping)
        if (isRipple) {
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, rippleRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${rippleAlpha})`;
            ctx.lineWidth = 0.5; // 0.5px极细
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * Helper to convert Hex to RGBA
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Add shine effect to make bubbles look more realistic
     * (Deprecated/Unused in new style, kept for compatibility if needed later)
     */
    addBubbleShine(ctx, bubble) {
        // ... kept empty or unused
    }
    
    /**
     * Get all active bubbles
     */
    getBubbles() {
        return this.bubbles;
    }

    /**
     * Register a callback to be invoked when a bubble is popped.
     * @param {(bubble: object) => void} cb
     */
    setOnPop(cb) {
        this.onPop = (typeof cb === 'function') ? cb : null;
    }
    
    /**
     * Remove a specific bubble by ID
     */
    removeBubble(bubbleId) {
        const remaining = [];
        let removedBubble = null;
        this.bubbles.forEach(bubble => {
            if (bubble.id === bubbleId) {
                removedBubble = bubble;
            } else {
                remaining.push(bubble);
            }
        });
        this.bubbles = remaining;
        
        if (removedBubble) {
            this.respawnSameLane(removedBubble);
            console.log(`Removed bubble ${bubbleId}`);
            return true;
        }
        return false;
    }
    
    /**
     * Trigger pop animation for a bubble (will be expanded in later tasks)
     */
    popBubble(bubbleId) {
        const bubble = this.bubbles.find(b => b.id === bubbleId);
        if (bubble && !bubble.isPopping) {
            // 可选：命中冷却，避免同一帧/抖动重复触发
            const now = performance.now();
            if (bubble.lastHitAt && (now - bubble.lastHitAt) < 120) return false;
            bubble.lastHitAt = now;

            bubble.isPopping = true;
            bubble.popAnimation = {
                startTime: performance.now(),
                duration: 300, // 300ms pop animation
                initialRadius: bubble.radius,
                initialOpacity: 1.0
            };

            // ★ 触发命中回调（下一步 B 会在这里播放音调 + 记录）
        if (this.onPop) {
            try { this.onPop(bubble); }
            catch (e) { console.warn('[BubbleManager] onPop callback error:', e); }
        }
        
            // ★ 触发全局事件供侧边栏等模块使用
            window.dispatchEvent(new CustomEvent('bubble:popped', { detail: bubble }));
            
            console.log(`Started pop animation for bubble ${bubbleId}`);
            return true;
        }
        return false;
    }

    /**
     * 鼠标点击检测：找到第一个距离<=半径的泡泡并触发 pop
     */
    checkCollision(x, y) {
        for (const bubble of this.bubbles) {
            const dx = bubble.x - x;
            const dy = bubble.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= bubble.radius) {
                const ok = this.popBubble(bubble.id);
                return ok ? bubble : null;
            }
        }
        return null;
    }
    
    /**
     * Set spawn rate (bubbles per second)
     */
    setSpawnRate(bubblesPerSecond) {
        this.baseSpawnInterval = 1000 / bubblesPerSecond;
        console.log(`Spawn rate set to ${bubblesPerSecond} bubbles per second`);
    }
    
    /**
     * Clear all bubbles
     */
    clearAllBubbles() {
        const count = this.bubbles.length;
        this.bubbles = [];
        // 取消未执行的定时生成
        this.spawnTimers.forEach(t => clearTimeout(t));
        this.spawnTimers = [];
        
        // 重置生成计时和序列，防止自动生成逻辑立即触发，导致与 startRound 的手动生成重叠
        this.lastSpawnTime = performance.now();
        this.spawnSequenceIndex = 0;
        
        console.log(`Cleared ${count} bubbles`);
    }
    
    /**
     * Get bubble count
     */
    getBubbleCount() {
        return this.bubbles.length;
    }
    
    /**
     * Utility function to lighten a color
     */
    lightenColor(color, amount) {
        // Convert hex to RGB, lighten, and convert back
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * amount));
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * amount));
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * amount));
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
     * Utility function to darken a color
     */
    darkenColor(color, amount) {
        // Convert hex to RGB, darken, and convert back
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * amount));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * amount));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * amount));
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
     * Handle canvas resize
     */
    handleResize(newWidth, newHeight) {
        this.canvasWidth = newWidth;
        this.canvasHeight = newHeight;
        
        // Remove any bubbles that are now outside the new bounds
        this.bubbles = this.bubbles.filter(bubble => {
            return bubble.x >= 0 && bubble.x <= newWidth;
        });
        
        console.log(`BubbleManager resized to ${newWidth}x${newHeight}`);
    }

    /**
     * 同 lane 立即重生，保持颜色/音符稳定映射
     */
    respawnSameLane(bubble) {
        if (!bubble || typeof bubble.laneId !== 'number') return;
        // 随机延时 150-350ms，避免多只泡泡同一水平线同时出现
        const delay = 150 + Math.random() * 200;
        this.scheduleSpawn(bubble.laneId, delay);
    }
}

// Export for use in other modules
window.BubbleManager = BubbleManager;
window.BUBBLE_LANES = BUBBLE_LANES;
