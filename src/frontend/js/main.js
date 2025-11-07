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
      // 将游戏实例暴露到全局，供结果窗口等模块统一使用
      window.game = game;
      const initialized = await game.init();
      if (!initialized) throw new Error('Failed to initialize game engine');
      console.log('Game engine ready');

      // ③ 确保游戏结果管理器已初始化
      if (typeof GameResultManager !== 'undefined') {
        if (!window.gameResultManager) {
          window.gameResultManager = new GameResultManager();
        }
        console.log('Game result manager ready');
      } else {
        console.warn('GameResultManager not found');
      }

      // 预热 Magenta（边玩边下模型/音色）
      initMusicRNN().catch(err => console.warn('[Magenta warmup failed]', err));
  
      // （可选）额外加一个 keydown 解锁兜底；pointerdown 已在 GameEngine 里加过
      window.addEventListener('keydown', () => window.popSynth?.resume?.(), { once: true });
  
      // ③ 启动游戏 & 开一局 60s
      setTimeout(() => {
        // 重置自闭症友好功能的成就系统
        if (window.autismFeatures) {
          window.autismFeatures.resetAchievements();
        }
        
        // 启动游戏结果追踪
        if (window.gameResultManager) {
          window.gameResultManager.startGame();
          console.log('Game result tracking started');
        }
        
        game.start();
        game.startRound(60, {
          clearHistory: true,
          onEnd: async (session) => {
            try {
              console.log('Round ended:', session);
              game.stop();
              
              // 触发游戏结果管理器结束游戏并显示结果
              if (window.gameResultManager) {
                window.gameResultManager.endGame();
                console.log('📊 游戏结果已显示');
              }
          
              // 可选的音乐生成（默认禁用以避免卡顿）
              // 可以通过 window.enableAIMusic = true 来动态启用AI音乐生成
              const enableMusicGeneration = window.enableAIMusic || false;
              
              if (enableMusicGeneration) {
                setTimeout(async () => {
                  try {
                    await generateMelodyFromSession(session, {
                      primerBars: 2,
                      continueSteps: 64, // 减少步数，加快生成
                      temperature: 1.0,
                      downloadMidi: false, // 禁用自动下载
                    });
                  } catch (musicError) {
                    console.warn('🎵 音乐生成失败，但不影响游戏结果:', musicError);
                  }
                }, 100);
              } else {
                // 创建更丰富的测试音乐供结果窗口使用
                window.lastGeneratedSequence = createRichTestMusic(session);
                console.log('🎵 音乐生成已禁用，使用丰富测试序列');
              }
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
    
    // 移除重复的pictogramToggle功能，只保留pose-mode-toggle
    
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
    elements.pauseBtn.textContent = isPaused ? '▶️ 继续' : '⏸️ 暂停';
    
    if (isPaused) {
        elements.pauseOverlay.classList.remove('hidden');
        showEncouragementMessage('休息一下！⏸️');
    } else {
        elements.pauseOverlay.classList.add('hidden');
        showEncouragementMessage('继续加油！▶️');
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
        'slow': '慢慢来，很好！🐌',
        'normal': '节奏刚好！👍',
        'fast': '快速挑战！⚡'
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
    
    // Animate in - 使用新的CSS样式 (顶部居中)
    elements.encouragementMessage.style.opacity = '0';
    elements.encouragementMessage.style.transform = 'translateX(-50%) translateY(-20px) scale(0.8)';
    
    // Trigger animation
    requestAnimationFrame(() => {
        elements.encouragementMessage.style.transition = 'all 0.3s ease-out';
        elements.encouragementMessage.style.opacity = '1';
        elements.encouragementMessage.style.transform = 'translateX(-50%) translateY(0) scale(1)';
    });
    
    // Fade out after duration
    setTimeout(() => {
        elements.encouragementMessage.style.transition = 'all 0.5s ease-in';
        elements.encouragementMessage.style.opacity = '0';
        elements.encouragementMessage.style.transform = 'translateX(-50%) translateY(-10px) scale(0.9)';
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
  
        // ✅ 查询剩余时间并更新进度条
        if (typeof game.getRoundRemainingMs === 'function') {
          const remainingMs = game.getRoundRemainingMs();
          const totalMs = game.roundDurationMs || 60000; // 默认60秒
          
          // 更新自闭症友好的进度显示
          if (window.autismFeatures) {
            window.autismFeatures.updateProgress(remainingMs, totalMs);
          }
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
  
    // 创建SoundFont播放器以确保使用正确的音色
    if (!MAGENTA.player) {
      try {
        // 尝试使用SoundFont播放器（如果可用）
        MAGENTA.player = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus');
        console.log('🎹 使用SoundFont播放器（钢琴音色）');
      } catch (e) {
        // 降级到普通播放器
        MAGENTA.player = new mm.Player();
        console.log('🎵 使用默认播放器');
      }
    }
    MAGENTA.__backend = backend;
    // 暴露到全局，供结果弹窗播放使用
    window.MAGENTA = MAGENTA;
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

    // 为每次生成引入轻微随机扰动（增强差异性）
    const tempAdj = temperature + (Math.random() - 0.5) * 0.25; // ±0.125
    const stepsAdj = Math.max(32, continueSteps + Math.floor((Math.random() - 0.5) * 24)); // ±12 步
    console.log('[Magenta] sampling params:', { temperature: tempAdj.toFixed(3), continueSteps: stepsAdj });
  
    // 1) 用户 primer
    try {
      cont = await MAGENTA.model.continueSequence(primer, stepsAdj, tempAdj);
    } catch (err) {
      console.warn('[Magenta] user-primer continue failed:', err);
    }
  
    // 2) 为空则用内置 seed（已随机化）
    if (!cont?.notes?.length) {
      console.warn('[Magenta] empty with user primer, retry with fallback seed');
      const seed = buildFallbackSeed();
      try {
        cont = await MAGENTA.model.continueSequence(seed, stepsAdj, Math.max(0.8, tempAdj));
      } catch (err2) {
        console.warn('[Magenta] fallback seed failed:', err2);
      }
    }
  
    // 3) 还不行用贪心（temperature = 0.0）
    if (!cont?.notes?.length) {
      console.warn('[Magenta] fallback to greedy decoding (temperature=0)');
      const seed = buildFallbackSeed();
      try {
        cont = await MAGENTA.model.continueSequence(seed, stepsAdj, 0.0);
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
    
    // 保存生成的音乐序列供后续播放
    window.lastGeneratedSequence = full;
    
    window.gameApp?.showEncouragementMessage?.('已生成并播放 AI 旋律 🎵', 1500);
  
    if (downloadMidi) {
      try {
        // 改进MIDI生成，确保有声音
        const enhancedSequence = enhanceMidiSequence(full);
        
        // 验证序列结构
        if (!enhancedSequence || !Array.isArray(enhancedSequence.notes)) {
          console.warn('⚠️ 增强序列结构无效，跳过MIDI下载');
          return;
        }
        
        console.log('🎵 准备转换MIDI，序列信息:', {
          notes: enhancedSequence.notes.length,
          totalTime: enhancedSequence.totalTime,
          ticksPerQuarter: enhancedSequence.ticksPerQuarter
        });
        
        const midi = mm.sequenceProtoToMidi(enhancedSequence);
        
        if (!midi || !midi.length) {
          console.warn('⚠️ MIDI转换结果为空');
          return;
        }
        
        const blob = new Blob([midi], { type: 'audio/midi' });
        const url  = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; 
        a.download = 'magenta_rnn_output.mid'; 
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('✅ MIDI文件已下载，包含', enhancedSequence.notes?.length || 0, '个音符');
      } catch (midiError) {
        console.warn('⚠️ MIDI下载失败:', midiError);
        // 不抛出错误，让音乐播放继续进行
      }
    }
  }

  /**
   * 增强MIDI序列，确保MIDI文件有声音
   */
  function enhanceMidiSequence(sequence) {
    if (!sequence || !sequence.notes || sequence.notes.length === 0) {
      console.warn('⚠️ 序列为空，创建默认音符');
      // 创建一个简单的默认序列
      return {
        ticksPerQuarter: 220,
        totalTime: 4.0,
        tempos: [{ time: 0, qpm: 120 }],
        notes: [
          { pitch: 60, startTime: 0, endTime: 0.5, velocity: 80 },
          { pitch: 64, startTime: 0.5, endTime: 1.0, velocity: 80 },
          { pitch: 67, startTime: 1.0, endTime: 1.5, velocity: 80 },
          { pitch: 72, startTime: 1.5, endTime: 2.0, velocity: 80 }
        ],
        instrumentInfos: [{ instrument: 0, program: 0, isDrum: false }]
      };
    }
    
    // 复制原序列
    const enhanced = JSON.parse(JSON.stringify(sequence));
    
    // 确保所有必需的属性存在
    enhanced.ticksPerQuarter = enhanced.ticksPerQuarter || 220;
    enhanced.tempos = Array.isArray(enhanced.tempos) && enhanced.tempos.length > 0 
      ? enhanced.tempos 
      : [{ time: 0, qpm: 120 }];
    
    // 确保notes是数组
    if (!Array.isArray(enhanced.notes)) {
      enhanced.notes = [];
    }
    
    // 增强音符
    enhanced.notes = enhanced.notes.map(note => {
      const enhancedNote = { ...note };
      
      // 确保音符有合理的持续时间（至少0.1秒）
      if (!enhancedNote.endTime || enhancedNote.endTime <= enhancedNote.startTime) {
        enhancedNote.endTime = enhancedNote.startTime + 0.25;
      }
      
      const duration = enhancedNote.endTime - enhancedNote.startTime;
      if (duration < 0.1) {
        enhancedNote.endTime = enhancedNote.startTime + 0.25;
      }
      
      // 确保音符有合理的力度
      enhancedNote.velocity = enhancedNote.velocity || 80;
      if (enhancedNote.velocity < 30) {
        enhancedNote.velocity = 60;
      }
      
      // 确保音符在合理的音高范围内
      if (enhancedNote.pitch < 21) enhancedNote.pitch = 60; // C4
      if (enhancedNote.pitch > 108) enhancedNote.pitch = 72; // C5
      
      return enhancedNote;
    });
    
    // 确保总时长合理
    if (enhanced.notes.length > 0) {
      const maxEndTime = Math.max(...enhanced.notes.map(n => n.endTime));
      enhanced.totalTime = Math.max(enhanced.totalTime || 0, maxEndTime + 0.5);
    } else {
      enhanced.totalTime = 2.0;
    }
    
    // 添加乐器信息（钢琴）
    if (!Array.isArray(enhanced.instrumentInfos) || enhanced.instrumentInfos.length === 0) {
      enhanced.instrumentInfos = [
        {
          instrument: 0, // 钢琴
          program: 0,
          isDrum: false
        }
      ];
    }
    
    // 添加其他可能需要的属性
    enhanced.keySignatures = enhanced.keySignatures || [];
    enhanced.timeSignatures = enhanced.timeSignatures || [];
    enhanced.controlChanges = enhanced.controlChanges || [];
    
    console.log('🎵 MIDI序列已增强:', {
      notes: enhanced.notes.length,
      totalTime: enhanced.totalTime,
      ticksPerQuarter: enhanced.ticksPerQuarter,
      tempos: enhanced.tempos.length,
      instrumentInfos: enhanced.instrumentInfos.length
    });
    
    return enhanced;
  }
  
  /**
   * 创建丰富的测试音乐序列
   * 基于游戏数据生成更有趣的多乐器音乐
   */
  function createRichTestMusic(session) {
    const bubbleCount = session?.notes?.length || 0;
    const duration = Math.max(12, Math.min(30, bubbleCount * 0.4)); // 12-30秒
    
    // 基于泡泡数量选择音乐风格和乐器
    let musicStyle, instruments;
    if (bubbleCount < 10) {
      musicStyle = 'gentle'; // 温和风格
      instruments = [
        { channel: 0, program: 0, name: 'Acoustic Grand Piano' },
        { channel: 1, program: 73, name: 'Flute' }
      ];
    } else if (bubbleCount < 25) {
      musicStyle = 'cheerful'; // 欢快风格
      instruments = [
        { channel: 0, program: 0, name: 'Acoustic Grand Piano' },
        { channel: 1, program: 40, name: 'Violin' },
        { channel: 2, program: 32, name: 'Acoustic Bass' }
      ];
    } else {
      musicStyle = 'orchestral'; // 管弦乐风格
      instruments = [
        { channel: 0, program: 0, name: 'Acoustic Grand Piano' },
        { channel: 1, program: 40, name: 'Violin' },
        { channel: 2, program: 41, name: 'Viola' },
        { channel: 3, program: 32, name: 'Acoustic Bass' },
        { channel: 4, program: 73, name: 'Flute' }
      ];
    }
    
    // 音阶选择
    const scales = {
      gentle: [60, 62, 64, 67, 69], // 五声音阶，温和
      cheerful: [60, 62, 64, 65, 67, 69, 71, 72], // 大调音阶，欢快
      orchestral: [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79] // 扩展音阶
    };
    
    const scale = scales[musicStyle];
    const notes = [];
    
    // 1. 生成主旋律（钢琴 - 通道0）
    generateMelody(notes, scale, duration, 0, 0);
    
    // 2. 生成和声层（根据乐器数量）
    if (instruments.length > 1) {
      generateHarmony(notes, scale, duration, 1, instruments[1].program);
    }
    
    if (instruments.length > 2) {
      generateBassLine(notes, scale, duration, 2, instruments[2].program);
    }
    
    if (instruments.length > 3) {
      generateCounterMelody(notes, scale, duration, 3, instruments[3].program);
    }
    
    if (instruments.length > 4) {
      generateOrnaments(notes, scale, duration, 4, instruments[4].program);
    }
    
    // 3. 添加打击乐（如果是管弦乐风格）
    if (musicStyle === 'orchestral') {
      generatePercussion(notes, duration);
    }
    
    // 4. 创建动态变化
    addDynamicChanges(notes, duration);
    
    return {
      ticksPerQuarter: 220,
      totalTime: duration,
      tempos: [{ time: 0, qpm: 120 }],
      notes: notes,
      instrumentInfos: instruments.map(inst => ({
        instrument: inst.channel,
        program: inst.program,
        isDrum: inst.channel === 9, // 通道9是打击乐
        name: inst.name
      })),
      keySignatures: [{ time: 0, key: 0, scale: 0 }],
      timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }]
    };
  }
  
  // 生成主旋律
  function generateMelody(notes, scale, duration, channel, program) {
    let currentTime = 0;
    const noteLength = 0.5;
    
    while (currentTime < duration - 2) {
      if (Math.random() < 0.15) { // 15%概率休息
        currentTime += noteLength;
        continue;
      }
      
      const pitch = scale[Math.floor(Math.random() * scale.length)] + 12; // 高八度
      const velocity = 70 + Math.floor(Math.random() * 30);
      const length = noteLength * (0.7 + Math.random() * 0.6);
      
      notes.push({
        pitch: pitch,
        startTime: currentTime,
        endTime: currentTime + length,
        velocity: velocity,
        instrument: channel,
        program: program
      });
      
      currentTime += noteLength;
    }
  }
  
  // 生成和声
  function generateHarmony(notes, scale, duration, channel, program) {
    const chordInterval = 2.0; // 每2秒一个和弦
    
    for (let time = 0; time < duration - 2; time += chordInterval) {
      const rootIndex = Math.floor(Math.random() * scale.length);
      const root = scale[rootIndex];
      
      // 三和弦
      const chordNotes = [
        { pitch: root, interval: 0 },
        { pitch: scale[(rootIndex + 2) % scale.length], interval: 0.1 },
        { pitch: scale[(rootIndex + 4) % scale.length], interval: 0.2 }
      ];
      
      chordNotes.forEach(note => {
        notes.push({
          pitch: note.pitch,
          startTime: time + note.interval,
          endTime: time + chordInterval * 0.9,
          velocity: 50 + Math.floor(Math.random() * 20),
          instrument: channel,
          program: program
        });
      });
    }
  }
  
  // 生成低音线
  function generateBassLine(notes, scale, duration, channel, program) {
    let currentTime = 0;
    const noteLength = 1.0; // 低音较长
    
    while (currentTime < duration - 1) {
      const pitch = scale[Math.floor(Math.random() * 3)] - 24; // 低两个八度
      const velocity = 60 + Math.floor(Math.random() * 20);
      
      notes.push({
        pitch: pitch,
        startTime: currentTime,
        endTime: currentTime + noteLength * 0.8,
        velocity: velocity,
        instrument: channel,
        program: program
      });
      
      currentTime += noteLength;
    }
  }
  
  // 生成对位旋律
  function generateCounterMelody(notes, scale, duration, channel, program) {
    let currentTime = 0.25; // 稍微错开
    const noteLength = 0.75;
    
    while (currentTime < duration - 2) {
      if (Math.random() < 0.3) { // 30%概率休息
        currentTime += noteLength;
        continue;
      }
      
      const pitch = scale[Math.floor(Math.random() * scale.length)] + 6; // 中等音域
      const velocity = 55 + Math.floor(Math.random() * 25);
      
      notes.push({
        pitch: pitch,
        startTime: currentTime,
        endTime: currentTime + noteLength * 0.6,
        velocity: velocity,
        instrument: channel,
        program: program
      });
      
      currentTime += noteLength;
    }
  }
  
  // 生成装饰音
  function generateOrnaments(notes, scale, duration, channel, program) {
    const ornamentTimes = [];
    for (let i = 0; i < duration; i += 4) {
      if (Math.random() < 0.7) { // 70%概率添加装饰
        ornamentTimes.push(i + Math.random() * 2);
      }
    }
    
    ornamentTimes.forEach(time => {
      const pitch = scale[Math.floor(Math.random() * scale.length)] + 24; // 高音区
      const velocity = 40 + Math.floor(Math.random() * 30);
      
      // 快速的装饰音符
      for (let i = 0; i < 3; i++) {
        notes.push({
          pitch: pitch + i * 2,
          startTime: time + i * 0.1,
          endTime: time + i * 0.1 + 0.15,
          velocity: velocity,
          instrument: channel,
          program: program
        });
      }
    });
  }
  
  // 生成打击乐
  function generatePercussion(notes, duration) {
    // 添加基本的鼓点
    for (let time = 0; time < duration; time += 1) {
      // 底鼓 (每拍)
      notes.push({
        pitch: 36, // Bass Drum
        startTime: time,
        endTime: time + 0.1,
        velocity: 80,
        instrument: 9, // 打击乐通道
        program: 0
      });
      
      // 军鼓 (反拍)
      if (time % 2 === 1) {
        notes.push({
          pitch: 38, // Snare Drum
          startTime: time,
          endTime: time + 0.1,
          velocity: 70,
          instrument: 9,
          program: 0
        });
      }
      
      // 踩镲 (每半拍)
      if (Math.random() < 0.6) {
        notes.push({
          pitch: 42, // Closed Hi-hat
          startTime: time + 0.5,
          endTime: time + 0.6,
          velocity: 50,
          instrument: 9,
          program: 0
        });
      }
    }
  }
  
  // 添加动态变化
  function addDynamicChanges(notes, duration) {
    notes.forEach(note => {
      const timeRatio = note.startTime / duration;
      
      // 渐强渐弱
      if (timeRatio < 0.2) {
        // 开始部分渐强
        note.velocity = Math.floor(note.velocity * (0.5 + timeRatio * 2.5));
      } else if (timeRatio > 0.8) {
        // 结束部分渐弱
        note.velocity = Math.floor(note.velocity * (1 - (timeRatio - 0.8) * 2));
      }
      
      // 确保力度在合理范围内
      note.velocity = Math.max(20, Math.min(127, note.velocity));
    });
  }

  // 将增强函数暴露到全局
  window.enhanceMidiSequence = enhanceMidiSequence;
  window.createRichTestMusic = createRichTestMusic;

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
    // 使用不同的简单动机和随机根音，避免兜底时每次都一样
    const patterns = [
      [0, 4, 7, 12],   // 大三和弦分解 (C-E-G-C)
      [0, 3, 7, 10],   // 小调色彩
      [0, 5, 7, 12],   // sus4 色彩
      [0, 2, 4, 7],    // 级进片段
    ];
    const base = 48 + Math.floor(Math.random() * 24); // C3..B4
    const pat = patterns[Math.floor(Math.random() * patterns.length)];

    const seed = {
      ticksPerQuarter: 220,
      totalTime: 1.0,
      tempos: [{ time: 0, qpm }],
      notes: pat.map((p, i) => ({
        pitch: base + p,
        startTime: i * 0.25,
        endTime: (i + 1) * 0.25,
        velocity: 85 + Math.floor(Math.random() * 20),
      })),
    };
    return mm.sequences.quantizeNoteSequence(seed, spq);
  }
  
  // 便于调试
  Object.assign(window.gameApp, {
    initMusicRNN,
    buildFallbackSeed,
    MAGENTA,
  });