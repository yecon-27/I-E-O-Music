/**
 * Bubble Manager - Handles bubble creation, movement, and lifecycle management
 * Implements autism-friendly design with calming colors and smooth animations
 */
class BubbleManager {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Bubble collection
        this.bubbles = [];
        this.nextBubbleId = 0;
        
        // Timing for spawning
        this.lastSpawnTime = 0;
        this.baseSpawnInterval = 1500; // 1.5 seconds between spawns (matches requirement)
        
        // Bubble configuration (matches design document specifications)
        this.config = {
            minRadius: 30,
            maxRadius: 60,
            baseSpeed: 2, // pixels per frame at 60fps (consistent upward movement)
            spawnMargin: 50 // margin from screen edges for spawning
        };
        
        // Autism-friendly color palette (soft, calming colors)
        this.colors = [
            '#FFE5E5', // Soft pink
            '#E5F3FF', // Soft blue
            '#E5FFE5', // Soft green
            '#FFF5E5', // Soft yellow
            '#F0E5FF', // Soft purple
            '#B8E6B8', // Calming green
            '#B8D4E6', // Calming blue
            '#E6D4B8', // Warm beige
            '#E6B8D4', // Soft rose
            '#D4E6B8'  // Light lime
        ];

        this.noteOptions = {
            rootMidi: 60,               // C 调
            scale: 'pentatonic_major',  // 想更柔和可换 'pentatonic_minor'
            octaves: [0, 1, 2],
            preferRange: [60, 84]       // C4..C6
          };
        
        // ★ 新增：命中回调占位（外部可订阅）
        this.onPop = null;
        
        // 自闭症友好功能
        this.predictableMode = false;
        this.predictablePattern = [];
        this.patternIndex = 0;
        this.initPredictablePattern();
    }
    
    /**
     * 初始化可预测的泡泡出现模式
     */
    initPredictablePattern() {
        // 创建一个重复的、可预测的模式
        this.predictablePattern = [
            { x: 0.2, y: 1.0, color: 0, size: 0.6 }, // 左下
            { x: 0.8, y: 1.0, color: 1, size: 0.8 }, // 右下
            { x: 0.5, y: 1.0, color: 2, size: 0.7 }, // 中下
            { x: 0.3, y: 1.0, color: 3, size: 0.5 }, // 左中下
            { x: 0.7, y: 1.0, color: 4, size: 0.9 }, // 右中下
            { x: 0.1, y: 1.0, color: 5, size: 0.6 }, // 最左
            { x: 0.9, y: 1.0, color: 6, size: 0.6 }, // 最右
            { x: 0.5, y: 1.0, color: 7, size: 1.0 }  // 中央大泡泡
        ];
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
        // Adjust spawn rate based on game speed
        const adjustedSpawnInterval = this.baseSpawnInterval / gameSpeed;
        
        if (currentTime - this.lastSpawnTime >= adjustedSpawnInterval) {
            this.spawnBubble();
            this.lastSpawnTime = currentTime;
        }
    }
    
    /**
    * Create a new bubble at the bottom of the screen
    */
    spawnBubble() {
        let x, y, radius, color, speed;
        
        if (this.predictableMode && this.predictablePattern.length > 0) {
            // 可预测模式：使用固定模式
            const pattern = this.predictablePattern[this.patternIndex];
            
            x = pattern.x * (this.canvasWidth - 2 * this.config.spawnMargin) + this.config.spawnMargin;
            y = this.canvasHeight + 50;
            
            const sizeRange = this.config.maxRadius - this.config.minRadius;
            radius = this.config.minRadius + (sizeRange * pattern.size);
            
            color = this.colors[pattern.color % this.colors.length];
            speed = this.config.baseSpeed; // 固定速度
            
            // 循环模式
            this.patternIndex = (this.patternIndex + 1) % this.predictablePattern.length;
        } else {
            // 随机模式：原有逻辑
            x = this.config.spawnMargin + 
                Math.random() * (this.canvasWidth - 2 * this.config.spawnMargin);
            y = this.canvasHeight + 50;
            
            radius = this.config.minRadius + 
                Math.random() * (this.config.maxRadius - this.config.minRadius);
            
            color = this.colors[Math.floor(Math.random() * this.colors.length)];
            
            const speedVariation = 0.8 + Math.random() * 0.4;
            speed = this.config.baseSpeed * speedVariation;
        }

    // Create bubble object
        const bubble = {
            id: this.nextBubbleId++,
            x, y,
            radius,
            color,
            speed,
            isPopping: false,
            popAnimation: null,
            floatOffset: Math.random() * Math.PI * 2, // Random phase for floating
            floatAmplitude: 1 + Math.random() * 2,    // Small horizontal drift

            // ★ 音符：命中前就决定 —— A 步骤的关键
            note: null,

            // ★ 命中冷却的时间戳（B 步骤会用）
            lastHitAt: 0
    };

        // 绑定“悦耳”的随机音调（五声音阶，可复现随机用 __LEVEL_SEED）
        const pick = window.AudioNotes && window.AudioNotes.pickNoteForBubble;
        if (pick) {
            bubble.note = pick(bubble.id, {
                ...this.noteOptions,
                rngSeedBase: window.__LEVEL_SEED || 0
            });
        } else {
            // 兜底：AudioNotes 未加载时用 C4（避免运行时报错）
            bubble.note = { midi: 60, freq: 261.6256, name: 'C4', rootMidi: 60, scale: 'fallback' };
            console.warn('[BubbleManager] AudioNotes not found, using fallback note.');
        }

        this.bubbles.push(bubble);
}
    
    /**
     * Update positions of all bubbles
     */
    updateBubblePositions(deltaTime, gameSpeed) {
        const time = performance.now() * 0.001; // Convert to seconds for smooth animation
        
        this.bubbles.forEach(bubble => {
            if (!bubble.isPopping) {
                // Move bubble upward at consistent speed
                // gameSpeed: 0.5 = slow (50%), 1.0 = normal (100%), 1.5 = fast (150%)
                bubble.y -= bubble.speed * gameSpeed;
                
                // Add subtle horizontal floating motion for natural appearance
                const floatX = Math.sin(time * 0.5 + bubble.floatOffset) * bubble.floatAmplitude;
                bubble.x += floatX * 0.1; // Very subtle horizontal drift
                
                // Keep bubbles within horizontal bounds
                if (bubble.x < bubble.radius) {
                    bubble.x = bubble.radius;
                } else if (bubble.x > this.canvasWidth - bubble.radius) {
                    bubble.x = this.canvasWidth - bubble.radius;
                }
            }
        });
    }
    
    /**
     * Remove bubbles that have moved off screen
     */
    removeOffscreenBubbles() {
        const initialCount = this.bubbles.length;
        
        // Remove bubbles that are above the screen (with some margin)
        this.bubbles = this.bubbles.filter(bubble => {
            const shouldRemove = bubble.y <= -bubble.radius - 50;
            
            // 记录未被戳中的泡泡（失败事件）
            if (shouldRemove && !bubble.isPopping && window.autismFeatures) {
                window.autismFeatures.recordMiss();
            }
            
            return !shouldRemove;
        });
        
        const removedCount = initialCount - this.bubbles.length;
        if (removedCount > 0) {
            console.log(`Removed ${removedCount} offscreen bubbles`);
        }
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
     * Render a single bubble with autism-friendly styling
     */
    renderBubble(ctx, bubble) {
        ctx.save();
        
        // Create radial gradient for smooth, calming bubble appearance
        const gradient = ctx.createRadialGradient(
            bubble.x - bubble.radius * 0.3, // Highlight offset for 3D effect
            bubble.y - bubble.radius * 0.3,
            0,
            bubble.x,
            bubble.y,
            bubble.radius
        );
        
        // Soft gradient stops for autism-friendly appearance
        gradient.addColorStop(0, this.lightenColor(bubble.color, 0.3)); // Bright center
        gradient.addColorStop(0.7, bubble.color); // Main color
        gradient.addColorStop(1, this.darkenColor(bubble.color, 0.2)); // Darker edge
        
        // Draw main bubble
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add very subtle border for definition (autism-friendly)
        ctx.strokeStyle = this.darkenColor(bubble.color, 0.1);
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Add shine effect for realistic bubble appearance
        this.addBubbleShine(ctx, bubble);
        
        ctx.restore();
    }
    
    /**
     * Add shine effect to make bubbles look more realistic
     */
    addBubbleShine(ctx, bubble) {
        // Small highlight circle
        const shineRadius = bubble.radius * 0.25;
        const shineX = bubble.x - bubble.radius * 0.25;
        const shineY = bubble.y - bubble.radius * 0.25;
        
        const shineGradient = ctx.createRadialGradient(
            shineX, shineY, 0,
            shineX, shineY, shineRadius
        );
        
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = shineGradient;
        ctx.beginPath();
        ctx.arc(shineX, shineY, shineRadius, 0, Math.PI * 2);
        ctx.fill();
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
        const initialLength = this.bubbles.length;
        this.bubbles = this.bubbles.filter(bubble => bubble.id !== bubbleId);
        
        if (this.bubbles.length < initialLength) {
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
            
            console.log(`Started pop animation for bubble ${bubbleId}`);
            return true;
        }
        return false;
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
}

// Export for use in other modules
window.BubbleManager = BubbleManager;