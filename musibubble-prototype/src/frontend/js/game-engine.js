/**
 * Game Engine - Core game loop and rendering system
 * Handles game state, timing, and coordinates all game systems.
 */
class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.gameSpeed = 1.0; // 1.0 = normal, 0.5 = slow, 1.5 = fast
        
        // Timing
        this.lastFrameTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        
        // Game systems (will be initialized later)
        this.bubbleManager = null;
        this.handTracker = null;
        this.collisionDetector = null;
        this.soundManager = null;
        this.scoreManager = null;
        this.animationManager = null;
        this.roundActive = false;
        this.roundStart = 0;
        this.roundNotes = [];     // 仅存本局的命中事件（相对时间）
        this.roundTimer = null;
        this.onRoundEnd = null;   // 结束回调（供步骤C用）
        window.Sessions ??= [];   // 所有历史局的归档
        this.roundDurationMs = 0;   // 本局总时长（毫秒）
        this.roundEndAt = 0;        // 计划结束的绝对时间戳
        this.roundRemainingMs = null; // 暂停时的剩余毫秒
        this.roundPausedAt = 0;     // 进入暂停的时间戳
        this.sessionConfig = {
            volumeLevel: 'medium',
            rhythmDensity: 'normal',
            timbre: 'piano',
            feedbackLatencyMs: 0,
            immediateToneMode: 'full', // full | visual | off
            rewardEnabled: true,
            rewardBpm: 125,
            rewardDurationSec: 10,
            expertMode: false,
        };
        if (window.sessionConfig) {
            this.sessionConfig = { ...this.sessionConfig, ...window.sessionConfig };
        }
                
        // Canvas setup
        this.setupCanvas();
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);

        // Subscribe to language changes
        if (window.i18n) {
            window.i18n.subscribe(() => this.onLanguageChanged());
        }
    }

    t(key, params) {
        return window.i18n ? window.i18n.t(key, params) : key;
    }

    onLanguageChanged() {
        if (!this.isRunning) {
            this.clearCanvas();
            this.drawBackground();
            this.drawCenteredMessage(this.t('game.ready'), '#95C3D8');
        } else if (this.isPaused) {
            this.render(); // Will call drawCenteredMessage with 'game.paused'
        }
    }

    setSessionConfig(cfg = {}) {
        this.sessionConfig = { ...this.sessionConfig, ...cfg };
        window.sessionConfig = this.sessionConfig;
        const vol = this.sessionConfig.volumeLevel;
        const gain =
            vol === 'low' ? 0.4 :
            vol === 'high' ? 1.0 : 0.7;
        window.popSynth?.setVolume?.(gain);
        const timbre = this.sessionConfig.timbre || 'piano';
        window.popSynth?.setTimbre?.(timbre);
        const density = this.sessionConfig.rhythmDensity || 'normal';
        this.bubbleManager?.setDensity?.(density);
    }
    
    /**
     * Set up canvas with proper sizing and context settings
     */
    setupCanvas() {
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Configure rendering context for smooth graphics
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Set default styles
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
    }
    
    /**
     * Initialize all game systems
     */
    async init() {
        console.log('Initializing Game Engine...');
      
        // 1) Bubble + Collision
        this.bubbleManager = new BubbleManager(this.canvas.width, this.canvas.height);
        // 让 PopSynth 可用（如未创建则创建一次）
        window.popSynth ??= new PopSynth();
        this.setSessionConfig(this.sessionConfig);
        this.setupLaneGuides();
        const unlockAudio = () => window.popSynth?.resume?.();
        window.addEventListener('pointerdown', unlockAudio, { once: true });
        this.bubbleManager.setOnPop((b) => {
            if (!b?.note) return;
        
            const cfg = this.sessionConfig || {};
            const playImmediate = cfg.immediateToneMode === 'full';
            const delay = cfg.feedbackLatencyMs || 0;
        
            if (playImmediate) {
                window.popSynth?.resume?.();
                setTimeout(() => {
                    window.popSynth?.play?.(b.note.freq, { dur: 0.15 });
                }, delay);
            }
            this.triggerLanePop(b.laneId);
            if (window.autismFeatures) {
                window.autismFeatures.recordSuccess({
                    id: b.id,
                    midi: b.note.midi,
                    laneId: b.laneId
                });
            }
            this.appendTrailDot(b.note?.name, b.color);
            if (this.roundActive) {
                this.roundNotes.push({
                    dt: performance.now() - this.roundStart,
                    id: b.id,
                    midi: b.note.midi,
                    freq: b.note.freq,
                    name: b.note.name,
                    laneId: b.laneId,
                });
            }
        });
        this.collisionDetector = new CollisionDetector();
        this.collisionDetector.addCollisionCallback(this.handleBubblePop.bind(this));
        this.clearCanvas();
        this.drawBackground();
        this.drawCenteredMessage(this.t('game.ready'), '#95C3D8');
        this.score = 0;
        this.handPositions = {
          leftHand:  { x: 0, y: 0, visible: false },
          rightHand: { x: 0, y: 0, visible: false }
        };
        // this.handTracker = new HandTracker();
        // this.handTracker.onPositionUpdate = (pos) => {
        //   this.handPositions.rightHand = { x: pos.x, y: pos.y, visible: true };
        // };
        // this.handTracker.onHandDetected = () => { this.handPositions.rightHand.visible = true; };
        // this.handTracker.onHandLost     = () => { this.handPositions.rightHand.visible = false; };
        // this.handTracker.initialize();
        this.poseDetector = null;
        this.setupMouseFallback();
        if (window.autismFeatures && typeof window.autismFeatures.onAudioSystemReady === 'function') {
            window.autismFeatures.onAudioSystemReady();
        }
        
        console.log('Game Engine initialized successfully');
        return true;
      }

    setupLaneGuides() {
        const gameMain = this.canvas?.parentElement;
        this.laneLabelsEl = document.getElementById('lane-labels');
        this.clickTrailEl = document.getElementById('click-trail');
        if (!this.laneLabelsEl && gameMain) {
            this.laneLabelsEl = document.createElement('div');
            this.laneLabelsEl.id = 'lane-labels';
            this.laneLabelsEl.className = 'lane-labels';
            gameMain.appendChild(this.laneLabelsEl);
        }
        if (!this.clickTrailEl && gameMain) {
            this.clickTrailEl = document.createElement('div');
            this.clickTrailEl.id = 'click-trail';
            this.clickTrailEl.className = 'click-trail';
            gameMain.appendChild(this.clickTrailEl);
        }
        if (!this.laneLabelsEl || !window.BUBBLE_LANES) return;
        
        const lanes = window.BUBBLE_LANES;
        this.laneLabelsEl.innerHTML = '';
        this.laneLabelElements = {}; // Store references
        
        // Calculate lane width percentage to match BubbleManager logic
        // x = laneWidth * (laneIndex + 1)
        // laneWidth = canvasWidth / (lanes.length + 1)
        const totalSlots = lanes.length + 1;

        lanes.forEach((lane, index) => {
            const div = document.createElement('div');
            div.className = 'lane-label';
            div.textContent = lane.note.name[0]; // e.g., 'C', 'D'
            
            // Position using percentage to match canvas coordinates
            const leftPercent = ((index + 1) / totalSlots) * 100;
            div.style.left = `${leftPercent}%`;
            
            // Store original color for active state
            div.dataset.color = lane.color;
            
            this.laneLabelsEl.appendChild(div);
            this.laneLabelElements[lane.id] = div;
        });

        // Initialize click trail empty
        if (this.clickTrailEl) this.clickTrailEl.innerHTML = '';
    }

    /**
     * Update lane label highlights based on active bubbles
     */
    updateLaneHighlights() {
        if (!this.bubbleManager || !this.laneLabelElements) return;
        
        const bubbles = this.bubbleManager.getBubbles();
        const activeLanes = new Set();
        
        // Mark lanes as active if they have any bubble (active or popping)
        bubbles.forEach(b => activeLanes.add(b.laneId));
        
        Object.entries(this.laneLabelElements).forEach(([laneId, el]) => {
            const isActive = activeLanes.has(parseInt(laneId));
            if (isActive) {
                if (!el.classList.contains('active')) {
                    el.classList.add('active');
                    el.style.color = el.dataset.color; // Highlight text with lane color
                }
            } else {
                if (el.classList.contains('active')) {
                    el.classList.remove('active');
                    el.style.color = ''; // Revert to CSS default
                }
            }
        });
    }

    
    triggerLanePop(laneId) {
        const el = this.laneLabelElements?.[laneId];
        if (!el) return;
        // 如果动画正在进行中，忽略新的触发请求
        if (el.classList.contains('pop')) return;
        el.classList.add('pop');
        el.style.color = el.dataset.color;
        setTimeout(() => {
            el.classList.remove('pop');
        }, 600);
    }
    
    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) {
            console.log('Game is already running');
            return;
        }
        
        console.log('Starting game...');
        this.isRunning = true;
        this.isPaused = false;
        this.lastFrameTime = performance.now();
        
        // Start the game loop
        requestAnimationFrame(this.gameLoop);
    }
    
    /**
     * Pause or resume the game
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        const now = performance.now();
      
        if (!this.roundActive) {
          this.lastFrameTime = now;
          return this.isPaused;
        }
      
        if (this.isPaused) {
          if (this.roundTimer) {
            clearTimeout(this.roundTimer);
            this.roundTimer = null;
          }
          this.roundRemainingMs = Math.max(0, this.roundEndAt - now);
          this.roundPausedAt = now;
        } else {
          const pausedMs = now - (this.roundPausedAt || now);
          this.roundStart += pausedMs;
          this.roundEndAt = now + (this.roundRemainingMs ?? 0);
          this.roundTimer = setTimeout(() => this.stopRound({ save: true }),
                                       this.roundRemainingMs ?? 0);
          this.roundPausedAt = 0;
          this.roundRemainingMs = null;
          this.lastFrameTime = now;
        }
        return this.isPaused;
      }
    
    /**
     * Stop the game
     */
    stop() {
        console.log('Stopping game...');
        this.isRunning = false;
        this.isPaused = false;
        this.stopRound?.({ save: false });
      }
    
    /**
     * Set game speed (0.5 = slow, 1.0 = normal, 1.5 = fast)
     */
    setSpeed(speed) {
        const validSpeeds = [0.5, 1.0, 1.5];
        if (validSpeeds.includes(speed)) {
            this.gameSpeed = speed;
            console.log(`Game speed set to: ${speed === 0.5 ? 'Slow' : speed === 1.0 ? 'Normal' : 'Fast'}`);
        } else {
            console.warn('Invalid speed value. Use 0.5, 1.0, or 1.5');
        }
    }
    
    /**
     * Main game loop - handles timing and calls update/render
     */
    gameLoop(currentTime) {
        if (!this.isRunning) {
            return;
        }
        
        // Calculate delta time
        const deltaTime = currentTime - this.lastFrameTime;
        
        // Only update if enough time has passed (frame rate limiting)
        if (deltaTime >= this.frameInterval) {
            // Update game state (only if not paused)
            if (!this.isPaused) {
                this.update(deltaTime * this.gameSpeed);
            }
            
            // Always render (to show pause overlay, etc.)
            this.render();
            
            this.lastFrameTime = currentTime;
        }
        
        // Continue the loop
        requestAnimationFrame(this.gameLoop);
    }
    
    /**
     * Update all game systems
     */
    update(deltaTime) {
        // Add: check for hand detection timeout
        if (this.handTracker && this.handTracker.checkHandTimeout) {
            this.handTracker.checkHandTimeout();
        }
        
        // Update bubble system
        if (this.bubbleManager) {
            this.bubbleManager.update(deltaTime, this.gameSpeed);
        }
        
        // Check for collisions between hands and bubbles
        if (this.collisionDetector && this.bubbleManager) {
            const bubbles = this.bubbleManager.getBubbles();
            this.collisionDetector.checkCollisions(this.handPositions, bubbles);
        }
        
        // Keep time for animations
        const time = performance.now() * 0.001; // Convert to seconds
        this.animationTime = time;
    }
    
    /**
     * Render the current frame
     */
    render() {
        // Clear the canvas
        this.clearCanvas();
        
        // Draw background
        this.drawBackground();
        
        // Render game objects here (will be expanded in later tasks)
        this.renderGameObjects();

        // Update lane indicators
        this.updateLaneHighlights();
        
        // Draw debug info if needed
        if (this.isPaused) {
            this.drawCenteredMessage(this.t('game.paused'), '#6C757D');
        }
    }
    
    /**
     * Clear the entire canvas
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Draw the background gradient
     */
    drawBackground() {
        // Create gradient background (autism-friendly soft colors)
        // 使用更干净的白色到浅蓝色的渐变，避免看起来发灰
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#FFFFFF'); // Pure White
        gradient.addColorStop(1, '#E1F5FE'); // Very Light Blue
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Render game objects
     */
    renderGameObjects() {
        // Render bubbles
        if (this.bubbleManager) {
            this.bubbleManager.render(this.ctx);
        }
        
        // Render hand cursors
        if (this.collisionDetector) {
            this.collisionDetector.renderHandCursors(this.ctx, this.handPositions);
        }
    }
    
    /**
     * Draw centered text message
     */
    drawCenteredMessage(text, color = '#2C3E50') {
        this.ctx.fillStyle = color;
        this.ctx.font = 'bold 24px "Segoe UI", sans-serif';
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
    }
    
    /**
     * Get current game state
     */
    getState() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            gameSpeed: this.gameSpeed,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            bubbleCount: this.bubbleManager ? this.bubbleManager.getBubbleCount() : 0
        };
    }
    
    /**
     * Get bubble manager for debugging
     */
    getBubbleManager() {
        return this.bubbleManager;
    }
    
    
    detectPopAttempts(positions) {
        if (!this.lastHandPositions) {
            this.lastHandPositions = {
                leftHand: { x: 0, y: 0, timestamp: Date.now() },
                rightHand: { x: 0, y: 0, timestamp: Date.now() }
            };
        }
        
        const now = Date.now();
        const speedThreshold = 150; // 像素/秒，超过这个速度认为是尝试戳泡泡
        if (positions.leftHand.visible) {
            const deltaTime = (now - this.lastHandPositions.leftHand.timestamp) / 1000;
            if (deltaTime > 0) {
                const dx = positions.leftHand.x - this.lastHandPositions.leftHand.x;
                const dy = positions.leftHand.y - this.lastHandPositions.leftHand.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const speed = distance / deltaTime;
                
                if (speed > speedThreshold) {
                    this.recordAttempt(positions.leftHand.x, positions.leftHand.y);
                }
            }
            this.lastHandPositions.leftHand = {
                x: positions.leftHand.x,
                y: positions.leftHand.y,
                timestamp: now
            };
        }
        if (positions.rightHand.visible) {
            const deltaTime = (now - this.lastHandPositions.rightHand.timestamp) / 1000;
            if (deltaTime > 0) {
                const dx = positions.rightHand.x - this.lastHandPositions.rightHand.x;
                const dy = positions.rightHand.y - this.lastHandPositions.rightHand.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const speed = distance / deltaTime;
                
                if (speed > speedThreshold) {
                    this.recordAttempt(positions.rightHand.x, positions.rightHand.y);
                }
            }
            this.lastHandPositions.rightHand = {
                x: positions.rightHand.x,
                y: positions.rightHand.y,
                timestamp: now
            };
        }
    }
    
    
    recordAttempt(x, y) {
        const now = Date.now();
        if (this.lastAttemptTime && (now - this.lastAttemptTime) < 500) {
            return;
        }
        this.lastAttemptTime = now;
        const bubbles = this.bubbleManager ? this.bubbleManager.getBubbles() : [];
        let hit = false;
        
        for (const bubble of bubbles) {
            const distance = Math.sqrt(
                Math.pow(x - bubble.x, 2) + Math.pow(y - bubble.y, 2)
            );
            if (distance <= bubble.radius + 35) { // 35是手部半径
                hit = true;
                break;
            }
        }
        if (!hit && window.sessionLogger) {
            window.sessionLogger.recordClick(x, y, false);
        }
        if (this.poseDetector?.handDataTracker) {
            this.poseDetector.handDataTracker.recordPop(hit);
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Keep original size - no scaling
        // Remove any existing transform to maintain original 1024x768 size
        this.canvas.style.transform = 'none';
        this.canvas.style.transformOrigin = 'center center';
        
        // Update bubble manager with original dimensions
        if (this.bubbleManager) {
            this.bubbleManager.handleResize(this.canvas.width, this.canvas.height);
        }
        
        // Update pose detector dimensions
        if (this.poseDetector) {
            this.poseDetector.updateCanvasDimensions(this.canvas.width, this.canvas.height);
        }
    }
        
    startRound(seconds = 30, opts = {}) {
        if (this.roundActive) this.stopRound({ save: false });

        this.roundActive = true;
        this.roundStart = performance.now();
        this.roundNotes = [];
        this.onRoundEnd = (typeof opts.onEnd === 'function') ? opts.onEnd : null;
        if (opts.clearHistory) window.Sessions = [];
        this.bubbleManager?.clearAllBubbles();
        const initialCount = this.bubbleManager?.targetBubbleCount || 4;
        for (let i = 0; i < initialCount; i++) {
            this.bubbleManager?.scheduleSpawn(null, i * 800);
        }
        if (this.clickTrailEl) this.clickTrailEl.innerHTML = '';
        this.roundDurationMs = seconds * 1000;
        this.roundEndAt = this.roundStart + this.roundDurationMs;
        this.roundRemainingMs = this.roundDurationMs; // 初始剩余=总时长
        this.roundPausedAt = 0;
        window.sessionLogger?.startRecording();
        // window.gameApp?.showEncouragementMessage?.(this.t('game.samplingStarted', { seconds }), 1000);
        this.roundTimer = setTimeout(() => this.stopRound({ save: true }),
                                    this.roundRemainingMs);
        }

    
    stopRound({ save = true } = {}) {
        if (!this.roundActive) return;
      
        if (this.roundTimer) { clearTimeout(this.roundTimer); this.roundTimer = null; }
      
        this.roundActive = false;
      
        const endedAt = performance.now();
        const session = {
          startedAt: this.roundStart,
          endedAt,
          durationSec: (endedAt - this.roundStart) / 1000, // 已自动不含暂停
          notes: this.roundNotes.slice(),
          meta: { seed: window.__LEVEL_SEED ?? null, scale: 'pentatonic', gameSpeed: this.gameSpeed }
        };
      
        if (save) window.Sessions.push(session);
        
        try { this.onRoundEnd?.(session); } catch(e) { console.warn(e); }
        window.dispatchEvent(new CustomEvent('round:ended', { detail: session }));
        const report = window.sessionLogger?.stopRecording();
        if (report) console.log(JSON.stringify(report));
        // window.gameApp?.showEncouragementMessage?.(this.t('game.samplingCompleted', { count: session.notes.length }), 1200);
        this.onRoundEnd = null;
        this.roundRemainingMs = null;
        this.roundPausedAt = 0;
        this.roundNotes = [];
      }
    getRoundRemainingMs() {
        if (!this.roundActive) return 0;
        if (this.isPaused && this.roundRemainingMs != null) return this.roundRemainingMs;
        return Math.max(0, this.roundEndAt - performance.now());
    }
      

    
    getLastSession() {
    return window.Sessions?.[window.Sessions.length - 1] ?? null;
    }

    
    appendTrailDot(noteName = '', color = '#666') {
        return;
    }

    
    downloadLastSessionJSON(filename = 'session.json') {
    const s = this.getLastSession();
    if (!s) { console.warn('No session'); return; }
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    }
    /**
     * Handle bubble pop collision
     */
    handleBubblePop(collision) {
        if (!this.bubbleManager) return;
        const popped = this.bubbleManager.popBubble(collision.bubble.id);
        if (!popped) return;  // 已在冷却中或正在爆炸，忽略
        this.score += 10;
        window.gameApp?.updateScoreDisplay?.(this.score);
        if (window.gameResultManager) {
            const handType = collision.handType || 'unknown';
            window.gameResultManager.recordBubblePop(handType);
            console.log('📊 记录泡泡戳破 - 手部类型:', handType);
        }
      
        //    popAnimation.duration 目前为 300ms，这里给一点余量
        setTimeout(() => {
          this.bubbleManager?.removeBubble(collision.bubble.id);
        }, 320);
      
        console.log(`Bubble popped! Score: ${this.score}`);
      }
    
    /**
     * Setup mouse fallback for testing without camera
     */
    setupMouseFallback() {
        console.log('Setting up mouse control');
        
        // Track mouse position as right hand
        this.canvas.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            const x = (event.clientX - rect.left) * scaleX;
            const y = (event.clientY - rect.top) * scaleY;
            
            this.handPositions.rightHand = {
                x: x,
                y: y,
                visible: true
            };
            
            // Store for pose detector simulation
            window.testMousePosition = { x, y };
        });
        
        // Handle mouse click to pop bubbles
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            const x = (event.clientX - rect.left) * scaleX;
            const y = (event.clientY - rect.top) * scaleY;
            
            // Check collision with bubbles
            if (this.bubbleManager) {
                const poppedBubble = this.bubbleManager.checkCollision(x, y);
                if (poppedBubble) {
                    console.log('🖱️ 鼠标点击戳破泡泡:', poppedBubble.id);
                    if (window.sessionLogger) {
                        window.sessionLogger.recordBubblePop(poppedBubble);
                        window.sessionLogger.recordClick(x, y, true);
                    }
                    if (window.gameResultManager) {
                        window.gameResultManager.recordBubblePop('rightHand');
                        console.log('📊 记录右手戳破数据');
                    }
                } else {
                    if (window.sessionLogger) {
                        window.sessionLogger.recordClick(x, y, false);
                    }
                }
            }
        });

        // Hide hand when mouse leaves canvas
        this.canvas.addEventListener('mouseleave', () => {
            this.handPositions.rightHand.visible = false;
            window.testMousePosition = null;
        });
    }
    
    /**
     * Get current score
     */
    getScore() {
        return this.score;
    }
    
    /**
     * Reset game state
     */
    
    reset() {
        this.stopRound?.({ save: false });
    
        this.score = 0;
        this.bubbleManager?.clearAllBubbles();
        this.collisionDetector?.reset();
        window.gameApp?.updateScoreDisplay?.(this.score);
        console.log('Game reset');
    }
    
    /**
     * togglePictogram() {
     */
    togglePictogram() {
        if (!this.poseDetector) return false;
        const enabled = this.poseDetector.togglePictogramMode();
        return enabled;
    }
    
    /**
     * Get current hand tracker
     */
    getHandTracker() {
        return this.handTracker;
    }
}

// Export for use in other modules
window.GameEngine = GameEngine;
