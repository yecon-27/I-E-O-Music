/**
 * Main application entry point
 * Handles initialization, UI interactions, and game coordination
 */

// --- Magenta UMD 全局兜底获取 ---
// ---- 安全获取 Magenta UMD 全局 ----
const mm =
  window.mm ||
  (window.magenta && window.magenta.music) ||
  window.magentamusic ||
  window.magentaMusic || null;

if (!mm || !mm.MusicRNN) {
  console.error('[Magenta] UMD 未就绪：请检查 index.html 是否在 main.js 之前引入 tf.min.js 与 music.js');
}

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
      // ① 固定随机种子
      if (!window.__LEVEL_SEED) {
        const u32 = new Uint32Array(1);
        try { crypto.getRandomValues(u32); } catch { u32[0] = Math.floor(Math.random() * 2**32); }
        window.__LEVEL_SEED = (u32[0] >>> 0);
      }
      console.log('[Game Seed]', window.__LEVEL_SEED);
  
      // ② 创建并初始化游戏引擎
      game = new GameEngine('game-canvas');
      const initialized = await game.init();
      if (!initialized) throw new Error('Failed to initialize game engine');
      console.log('Game engine ready');

      // 预热 Magenta（边玩边下模型/音色）
      initMusicRNN().catch(err => console.warn('[Magenta warmup failed]', err));
  
      // （可选）额外加一个 keydown 解锁兜底；pointerdown 已在 GameEngine 里加过
      window.addEventListener('keydown', () => window.popSynth?.resume?.(), { once: true });
  
      // ③ 启动游戏 & 开一局 60s
      setTimeout(() => {
        game.start();
        game.startRound(60, {
          clearHistory: true,
          onEnd: async (session) => {
            try {
              console.log('Round ended:', session);
              game.stop();
          
              await generateMelodyFromSession(session, {
                primerBars: 2,
                continueSteps: 128,
                temperature: 1.0,
                downloadMidi: true,
              });
            } catch (err) {
              console.error('[AI] submit failed:', err);
              showEncouragementMessage('AI 生成失败：查看控制台错误', 1500);
            }
          }
        });
        showEncouragementMessage('欢迎！移动鼠标/伸出食指戳泡泡！');
        startStatusUpdates();
      }, 1000);
  
    } catch (e) {
      console.error('Failed to initialize game:', e);
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
  
        // ✅（可选）查询剩余时间（秒）
        if (typeof game.getRoundRemainingMs === 'function') {
          const secs = Math.ceil(game.getRoundRemainingMs() / 1000);
          // 不想显示 UI 就不写元素；仅调试可打印：
          // console.log('remaining:', secs, 's');
  
          // 如果以后想显示到 UI：
          elements.countdown && (elements.countdown.textContent = secs);
        }
  
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
    }, 500);
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

// ===== Magenta MusicRNN（固定 CPU 后端）=====
const MAGENTA = {
    model: null,
    player: null,
    stepsPerQuarter: 4,
    qpm: 120,
    __backend: null,   // 记录当前模型所在后端
  };
  
  async function initMusicRNN({ forceReload = false, backend = 'cpu' } = {}) {
    const mm = window.mm;
    if (!mm || !mm.MusicRNN) {
      console.error('[Magenta] UMD 未加载：确认 index.html 里 tf.min.js 和 vendor/magenta/music.js 在 main.js 之前引入');
      return;
    }
  
    const tfjs = window.tf;
    if (tfjs && tfjs.getBackend() !== backend) {
      await tfjs.setBackend(backend);   // ← 关键：先选好后端，再初始化模型
      await tfjs.ready();
    }
  
    // 同一后端且已初始化则直接返回
    if (!forceReload && MAGENTA.model && MAGENTA.__backend === backend) {
      return;
    }
  
    // 如果之前用的是别的后端，重建模型（避免权重丢失）
    try { MAGENTA.model?.dispose?.(); } catch {}
    MAGENTA.model = new mm.MusicRNN('../../vendor/magenta/checkpoints/music_rnn/melody_rnn');
    await MAGENTA.model.initialize();
  
    MAGENTA.player ??= new mm.Player();
    MAGENTA.__backend = backend;
  
    console.log('[Magenta] MusicRNN ready on backend =', backend);
  }
  
  // 量化（保持你原来的逻辑）
  function sessionToQuantized(session, sustainSec = 0.2) {
    const notes = [...session.notes].sort((a, b) => a.dt - b.dt);
    const ns = {
      ticksPerQuarter: 220,
      totalTime: Math.max(0.001, ...notes.map(n => (n.dt / 1000 + sustainSec))),
      tempos: [{ time: 0, qpm: MAGENTA.qpm }],
      notes: notes.map(n => ({
        pitch: n.midi,
        startTime: n.dt / 1000,
        endTime: n.dt / 1000 + sustainSec,
        velocity: 80,
      })),
    };
    return mm.sequences.quantizeNoteSequence(ns, MAGENTA.stepsPerQuarter);
  }
  
  // 生成 + 播放（临时切到 CPU 执行 continueSequence，避免 multinomial 报错）
  async function generateMelodyFromSession(session, {
    primerBars = 2,
    continueSteps = 128,
    temperature = 1.1,
    downloadMidi = true,
  } = {}) {
    // 确保 CPU 上初始化（很重要）
    await initMusicRNN({ backend: 'cpu' });
  
    if (!session?.notes?.length) {
      window.gameApp?.showEncouragementMessage?.('本局没有采到音符', 1200);
      return;
    }
  
    // 取用户 primer
    const qns = sessionToQuantized(session);
    const primerSteps = Math.min(primerBars * 16, qns.totalQuantizedSteps);
    const primer = mm.sequences.clone(qns);
    primer.totalQuantizedSteps = primerSteps;
    primer.notes = qns.notes.filter(n => n.quantizedEndStep <= primerSteps);
  
    let cont = null;
  
    // 1) 用户 primer
    try {
      cont = await MAGENTA.model.continueSequence(primer, continueSteps, temperature);
    } catch (err) {
      console.warn('[Magenta] user-primer continue failed:', err);
    }
  
    // 2) 为空则用内置 seed
    if (!cont?.notes?.length) {
      console.warn('[Magenta] empty with user primer, retry with fallback seed');
      const seed = buildFallbackSeed();
      try {
        cont = await MAGENTA.model.continueSequence(seed, continueSteps, Math.max(0.8, temperature));
      } catch (err2) {
        console.warn('[Magenta] fallback seed failed:', err2);
      }
    }
  
    // 3) 还不行用贪心（temperature = 0.0）
    if (!cont?.notes?.length) {
      console.warn('[Magenta] fallback to greedy decoding (temperature=0)');
      const seed = buildFallbackSeed();
      try {
        cont = await MAGENTA.model.continueSequence(seed, continueSteps, 0.0);
      } catch (err3) {
        console.error('[Magenta] greedy also failed:', err3);
        showEncouragementMessage('AI 生成失败：查看控制台错误', 1500);
        return;
      }
    }
  
    const full = mm.sequences.unquantizeSequence(cont);
    if ((!full.totalTime || full.totalTime <= 0) && full.notes?.length) {
      full.totalTime = Math.max(...full.notes.map(n => n.endTime), 0.001);
    }
  
    try { await mm.Player.tone?.context?.resume?.(); } catch {}
  
    MAGENTA.player.stop();
    MAGENTA.player.start(full);
    window.gameApp?.showEncouragementMessage?.('已生成并播放 AI 旋律 🎵', 1500);
  
    if (downloadMidi) {
      const midi = mm.sequenceProtoToMidi(full);
      const blob = new Blob([midi], { type: 'audio/midi' });
      const url  = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'magenta_rnn_output.mid'; a.click();
      URL.revokeObjectURL(url);
    }
  }

  // ---------- A) 通用 helper：临时切到 CPU 执行一段函数（带日志） ----------
async function withCPU(fn) {
    const tf = window.tf;
    if (!tf) throw new Error('TFJS (tf.min.js) 未加载');
    const prev = tf.getBackend?.() || 'cpu';
    try {
      if (prev !== 'cpu') {
        await tf.setBackend('cpu');
        await tf.ready();
      }
      // 调试确认确实在 CPU
      console.log('[TFJS] using backend:', tf.getBackend());
      return await fn();
    } finally {
      if (prev !== 'cpu') {
        await tf.setBackend(prev);
        await tf.ready();
        console.log('[TFJS] restored backend:', tf.getBackend());
      }
    }
  }
  
  function buildFallbackSeed(qpm = MAGENTA.qpm, spq = MAGENTA.stepsPerQuarter) {
    const seed = {
      ticksPerQuarter: 220,
      totalTime: 1.0,
      tempos: [{ time: 0, qpm }],
      notes: [
        { pitch: 60, startTime: 0.00, endTime: 0.25, velocity: 90 }, // C4
        { pitch: 64, startTime: 0.25, endTime: 0.50, velocity: 90 }, // E4
        { pitch: 67, startTime: 0.50, endTime: 0.75, velocity: 90 }, // G4
        { pitch: 72, startTime: 0.75, endTime: 1.00, velocity: 90 }, // C5
      ],
    };
    return mm.sequences.quantizeNoteSequence(seed, spq);
  }
  
  // 便于调试
  Object.assign(window.gameApp, {
    initMusicRNN,
    buildFallbackSeed,
    MAGENTA,
  });