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
        
        // Canvas setup
        this.setupCanvas();
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
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
        
        // Initialize bubble manager
        this.bubbleManager = new BubbleManager(this.canvas.width, this.canvas.height);
        console.log('BubbleManager initialized');
        
        // Clear canvas with initial background
        this.clearCanvas();
        this.drawBackground();
        
        // Draw initial message
        this.drawCenteredMessage('Game Ready!', '#95C3D8');
        
        // Add: score and handPositions
        this.score = 0;
        this.handPositions = {
            leftHand: { x: 0, y: 0, visible: false },
            rightHand: { x: 0, y: 0, visible: false }
        };

        // Collision + Hand tracking setup
        this.collisionDetector = new CollisionDetector();
        this.collisionDetector.addCollisionCallback(this.handleBubblePop.bind(this));

        this.handTracker = new HandTracker();
        this.handTracker.onPositionUpdate = (pos) => {
            this.handPositions.rightHand = { x: pos.x, y: pos.y, visible: true };
        };
        this.handTracker.onHandDetected = () => {
            this.handPositions.rightHand.visible = true;
        };
        this.handTracker.onHandLost = () => {
            this.handPositions.rightHand.visible = false;
        };
        this.handTracker.initialize();

        // PoseDetector for gesture control and pictogram overlay
        this.poseDetector = new PoseDetector(this.canvas.width, this.canvas.height);
        
        // 连接pose-detector的手势数据到game-engine
        this.poseDetector.setHandMoveCallback((positions) => {
            // 更新game-engine的手势位置
            this.handPositions.leftHand = {
                x: positions.leftHand.x,
                y: positions.leftHand.y,
                visible: positions.leftHand.visible
            };
            this.handPositions.rightHand = {
                x: positions.rightHand.x,
                y: positions.rightHand.y,
                visible: positions.rightHand.visible
            };
        });
        
        await this.poseDetector.init();

        console.log('Game Engine initialized successfully');
        return true;
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
        console.log(this.isPaused ? 'Game paused' : 'Game resumed');
        
        if (!this.isPaused) {
            // Reset timing when resuming
            this.lastFrameTime = performance.now();
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
        
        // Draw debug info if needed
        if (this.isPaused) {
            this.drawCenteredMessage('PAUSED', '#6C757D');
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
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#E3F2FD'); // Light blue
        gradient.addColorStop(1, '#F3E5F5'); // Light purple
        
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
    
    /**
     * Handle bubble pop collision
     */
    handleBubblePop(collision) {
        // Remove the bubble
        if (this.bubbleManager) {
            const success = this.bubbleManager.removeBubble(collision.bubble.id);
            if (success) {
                // Update score
                this.score += 10;
                
                // Notify UI
                if (window.gameApp && window.gameApp.updateScoreDisplay) {
                    window.gameApp.updateScoreDisplay(this.score);
                }
                
                // Show encouragement
                if (window.gameApp && window.gameApp.showEncouragementMessage) {
                    const messages = [
                        'Great job!', 'Nice pop!', 'Awesome!', 
                        'Keep going!', 'Fantastic!', 'Well done!'
                    ];
                    const message = messages[Math.floor(Math.random() * messages.length)];
                    window.gameApp.showEncouragementMessage(message, 1000);
                }
                
                console.log(`Bubble popped! Score: ${this.score}`);
            }
        }
    }
    
    /**
     * Setup mouse fallback for testing without camera
     */
    setupMouseFallback() {
        console.log('Setting up mouse fallback for pose detection');
        
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
        this.score = 0;
        if (this.bubbleManager) {
            this.bubbleManager.clearAllBubbles();
        }
        if (this.collisionDetector) {
            this.collisionDetector.reset();
        }
        
        // Update UI
        if (window.gameApp && window.gameApp.updateScoreDisplay) {
            window.gameApp.updateScoreDisplay(this.score);
        }
        
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