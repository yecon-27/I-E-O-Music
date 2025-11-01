/**
 * Main application entry point
 * Handles initialization, UI interactions, and game coordination
 */

// Global game instance
let game = null;

// UI elements
const elements = {
    scoreValue: null,
    pauseBtn: null,
    slowBtn: null,
    normalBtn: null,
    fastBtn: null,
    pauseOverlay: null,
    encouragementMessage: null,
    pictogramToggle: null
};

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Bubble Popping Game - Initializing...');
    
    // Get UI elements
    initializeUIElements();
    
    // Initialize game engine
    initializeGame();
    
    // Set up event listeners
    setupEventListeners();
    
    // Handle responsive design
    setupResponsiveHandling();
    
    console.log('Application initialized successfully!');
});

/**
 * Get references to all UI elements
 */
function initializeUIElements() {
    elements.scoreValue = document.getElementById('score-value');
    elements.pauseBtn = document.getElementById('pause-btn');
    elements.slowBtn = document.getElementById('slow-btn');
    elements.normalBtn = document.getElementById('normal-btn');
    elements.fastBtn = document.getElementById('fast-btn');
    elements.pauseOverlay = document.getElementById('pause-overlay');
    elements.encouragementMessage = document.getElementById('encouragement-message');
    elements.pictogramToggle = document.getElementById('pictogram-toggle');
    elements.cameraToggle = document.getElementById('camera-toggle');
    elements.inputMode = document.getElementById('input-mode');
    elements.bubbleCount = document.getElementById('bubble-count');
    elements.poseModeToggle = document.getElementById('pose-mode-toggle');
    
    // Verify all elements were found
    const missingElements = Object.entries(elements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);
    
    if (missingElements.length > 0) {
        console.error('Missing UI elements:', missingElements);
        return false;
    }
    
    console.log('UI elements initialized successfully');
    return true;
}

/**
 * Initialize the game engine
 */
async function initializeGame() {
    try {
        // Create game engine instance
        game = new GameEngine('game-canvas');
        
        // Initialize game systems (now async)
        const initialized = await game.init();
        
        if (initialized) {
            console.log('Game engine ready');
            
            // Start the game automatically
            setTimeout(() => {
                game.start();
                showEncouragementMessage('欢迎！移动鼠标戳泡泡！');
                
                // Start status updates
                startStatusUpdates();
            }, 1000);
        } else {
            throw new Error('Failed to initialize game engine');
        }
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showErrorMessage('Failed to start game. Please refresh the page.');
    }
}

/**
 * Set up all event listeners for UI interactions
 */
function setupEventListeners() {
    // Pause/Resume button
    elements.pauseBtn.addEventListener('click', handlePauseToggle);
    
    // Speed control buttons
    elements.slowBtn.addEventListener('click', () => handleSpeedChange(0.5, 'slow'));
    elements.normalBtn.addEventListener('click', () => handleSpeedChange(1.0, 'normal'));
    elements.fastBtn.addEventListener('click', () => handleSpeedChange(1.5, 'fast'));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardInput);
    
    // Window resize handling
    window.addEventListener('resize', handleWindowResize);
    
    // Pictogram toggle
    if (elements.pictogramToggle) {
        elements.pictogramToggle.addEventListener('click', () => {
            if (!game || !game.poseDetector) return;
            const enabled = game.poseDetector.togglePictogramMode();
            elements.pictogramToggle.textContent = enabled ? 'Tokyo2020小人: 开' : 'Tokyo2020小人: 关';
        });
    }
    
    // Camera toggle
    if (elements.cameraToggle) {
        elements.cameraToggle.addEventListener('click', async () => {
            if (!game || !game.poseDetector) return;
            
            try {
                await game.poseDetector.init();
                elements.cameraToggle.textContent = '摄像头: 开';
                if (elements.inputMode) {
                    elements.inputMode.textContent = '手势';
                }
                showEncouragementMessage('摄像头已启动！伸出食指戳泡泡！');
            } catch (error) {
                console.log('摄像头启动失败，继续使用鼠标模式');
                showEncouragementMessage('摄像头启动失败，使用鼠标模式');
            }
        });
    }
    
    // Pose mode toggle (Tokyo2020 pictogram)
    if (elements.poseModeToggle) {
        elements.poseModeToggle.addEventListener('click', () => {
            if (!game || !game.poseDetector) return;
            const enabled = game.poseDetector.togglePictogramMode();
            elements.poseModeToggle.textContent = enabled ? '标准模式' : '小人模式';
            elements.poseModeToggle.className = enabled ? 'pose-btn active' : 'pose-btn';
        });
    }
    
    console.log('Event listeners set up successfully');
}

/**
 * Handle pause/resume button click
 */
function handlePauseToggle() {
    if (!game) return;
    
    const isPaused = game.togglePause();
    
    // Update UI
    elements.pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    
    if (isPaused) {
        elements.pauseOverlay.classList.remove('hidden');
        showEncouragementMessage('Take your time!');
    } else {
        elements.pauseOverlay.classList.add('hidden');
        showEncouragementMessage('Let\'s continue!');
    }
}

/**
 * Handle speed change button clicks
 */
function handleSpeedChange(speed, speedName) {
    if (!game) return;
    
    // Update game speed
    game.setSpeed(speed);
    
    // Update UI - remove active class from all speed buttons
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    const buttonMap = {
        'slow': elements.slowBtn,
        'normal': elements.normalBtn,
        'fast': elements.fastBtn
    };
    
    buttonMap[speedName].classList.add('active');
    
    // Show feedback message
    const speedMessages = {
        'slow': 'Slow and steady!',
        'normal': 'Perfect pace!',
        'fast': 'Speedy bubbles!'
    };
    
    showEncouragementMessage(speedMessages[speedName]);
}

/**
 * Handle keyboard input for accessibility
 */
function handleKeyboardInput(event) {
    if (!game) return;
    
    switch (event.code) {
        case 'Space':
            event.preventDefault();
            handlePauseToggle();
            break;
        case 'Digit1':
            handleSpeedChange(0.5, 'slow');
            break;
        case 'Digit2':
            handleSpeedChange(1.0, 'normal');
            break;
        case 'Digit3':
            handleSpeedChange(1.5, 'fast');
            break;
    }
}

/**
 * Handle window resize for responsive design
 */
function handleWindowResize() {
    if (game && game.handleResize) {
        game.handleResize();
    }
}

/**
 * Set up responsive design handling
 */
function setupResponsiveHandling() {
    // Initial resize handling
    handleWindowResize();
    
    // Set up responsive canvas scaling
    const canvas = document.getElementById('game-canvas');
    const gameArea = canvas.parentElement;
    
    // Create ResizeObserver for better responsive handling
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(entries => {
            handleWindowResize();
        });
        
        resizeObserver.observe(gameArea);
    }
}

/**
 * Show encouragement message with fade animation
 */
function showEncouragementMessage(message, duration = 2000) {
    if (!elements.encouragementMessage) return;
    
    // Set message text
    elements.encouragementMessage.textContent = message;
    
    // Animate in
    elements.encouragementMessage.style.opacity = '0';
    elements.encouragementMessage.style.transform = 'translate(-50%, -50%) scale(0.8)';
    
    // Trigger animation
    requestAnimationFrame(() => {
        elements.encouragementMessage.style.transition = 'all 0.3s ease-out';
        elements.encouragementMessage.style.opacity = '1';
        elements.encouragementMessage.style.transform = 'translate(-50%, -50%) scale(1)';
    });
    
    // Fade out after duration
    setTimeout(() => {
        elements.encouragementMessage.style.transition = 'all 0.5s ease-in';
        elements.encouragementMessage.style.opacity = '0';
        elements.encouragementMessage.style.transform = 'translate(-50%, -50%) scale(0.9)';
    }, duration);
}

/**
 * Show error message to user
 */
function showErrorMessage(message) {
    // Create error overlay
    const errorOverlay = document.createElement('div');
    errorOverlay.className = 'error-overlay';
    errorOverlay.innerHTML = `
        <div class="error-content">
            <h2>Oops! Something went wrong</h2>
            <p>${message}</p>
            <button onclick="location.reload()" class="control-btn">Refresh Page</button>
        </div>
    `;
    
    // Add error styles
    errorOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(248, 249, 250, 0.95);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    document.body.appendChild(errorOverlay);
}

/**
 * Update score display
 */
function updateScoreDisplay(score) {
    if (elements.scoreValue) {
        elements.scoreValue.textContent = score;
    }
}

/**
 * Get current game state (for debugging)
 */
function getGameState() {
    return game ? game.getState() : null;
}

/**
 * Get bubble manager for debugging
 */
function getBubbleManager() {
    return game ? game.getBubbleManager() : null;
}

/**
 * Get hand tracker for debugging
 */
function getHandTracker() {
    return game ? game.getHandTracker() : null;
}

/**
 * Start status updates for UI
 */
function startStatusUpdates() {
    setInterval(() => {
        if (game) {
            const state = game.getState();
            
            // Update bubble count
            if (elements.bubbleCount) {
                elements.bubbleCount.textContent = state.bubbleCount || 0;
            }
            
            // Update input mode based on pose detector status
            if (elements.inputMode && game.poseDetector) {
                const isCamera = game.poseDetector.isInitialized;
                elements.inputMode.textContent = isCamera ? '手势' : '鼠标';
            }
        }
    }, 500); // Update every 500ms
}

// Export functions for global access
window.gameApp = {
    updateScoreDisplay,
    showEncouragementMessage,
    getGameState,
    getBubbleManager,
    getHandTracker,
    startStatusUpdates
};