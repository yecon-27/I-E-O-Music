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
    sessionSettingsBtn: null,
    sessionModal: null,
    sessionStartBtn: null,
    sessionCloseBtn: null,
    sessionResetBtn: null,
    sessionVolume: null,
    sessionDensity: null,
    sessionTimbre: null,
    sessionLatency: null,
    sessionImmediate: null,
    sessionReward: null,
    sessionModeSafe: null,
    sessionModeExpert: null,
    sessionModeNote: null,
    sessionBpm: null,
    sessionBpmValue: null,
    sessionDuration: null,
    sessionDurationValue: null,
    sessionResetButtons: [],
    sessionPreset: null,
    panicMuteBtn: null,
    resultMuteBtn: null,
    };

const SESSION_DEFAULTS = {
    volumeLevel: 'medium',
    rhythmDensity: 'normal',
    timbre: 'soft',
    feedbackLatencyMs: 0,
    immediateToneMode: 'full',
    rewardEnabled: true,
    rewardBpm: 72,
    rewardDurationSec: 20,
    expertMode: false,
};

const SESSION_ENVELOPE = {
    rewardBpm: { min: 65, max: 75 },
    rewardDurationSec: { min: 10, max: 20 },
};

let statusUpdatesStarted = false;
let pausedBySettings = false;
let lastExpertDraft = null;
let panicMuted = false;

function clampValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

window.SESSION_DEFAULTS = SESSION_DEFAULTS;
window.SESSION_ENVELOPE = SESSION_ENVELOPE;

function syncSessionElements() {
    elements.sessionSettingsBtn = document.getElementById('session-settings-btn');
    elements.sessionModal = document.getElementById('session-settings-modal');
    elements.sessionStartBtn = document.getElementById('session-start-btn');
    elements.sessionCloseBtn = document.getElementById('session-close-btn');
    elements.sessionResetBtn = document.getElementById('session-reset-btn');
    elements.sessionVolume = document.getElementById('session-volume');
    elements.sessionDensity = document.getElementById('session-density');
    elements.sessionTimbre = document.getElementById('session-timbre');
    elements.sessionLatency = document.getElementById('session-latency');
    elements.sessionImmediate = document.getElementById('session-immediate');
    elements.sessionReward = document.getElementById('session-reward');
    elements.sessionModeSafe = document.getElementById('session-mode-safe');
    elements.sessionModeExpert = document.getElementById('session-mode-expert');
    elements.sessionModeNote = document.getElementById('session-mode-note');
    elements.sessionBpm = document.getElementById('session-bpm');
    elements.sessionBpmValue = document.getElementById('session-bpm-value');
    elements.sessionDuration = document.getElementById('session-duration');
    elements.sessionDurationValue = document.getElementById('session-duration-value');
    elements.sessionResetButtons = Array.from(document.querySelectorAll('[data-reset-field]'));
    elements.sessionPreset = document.getElementById('session-preset');
    elements.panicMuteBtn = document.getElementById('panic-mute-btn');
    elements.resultMuteBtn = document.getElementById('result-mute-btn');
}

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
    elements.inputMode = document.getElementById('input-mode');
    elements.bubbleCount = document.getElementById('bubble-count');
    syncSessionElements();

    // 如果缺少设置 UI，尝试注入
    ensureSessionSettingsUI();
    syncSessionElements();
    refreshPanicButtons();
    
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

function ensureSessionSettingsUI() {
    let controls = document.querySelector('.controls');
    if (!controls) {
        const header = document.querySelector('.game-header');
        if (header) {
            controls = document.createElement('div');
            controls.className = 'controls';
            header.appendChild(controls);
            console.warn('[SettingsUI] .controls 不存在，已创建回退容器');
        }
    }
    if (!controls) {
        console.warn('[SettingsUI] 未找到控件容器，跳过 UI 注入');
        return;
    }
    if (controls && !document.getElementById('session-settings-btn')) {
        const btn = document.createElement('button');
        btn.id = 'session-settings-btn';
        btn.className = 'control-btn';
        btn.textContent = '⚙️ 参数';
        controls.insertBefore(btn, controls.querySelector('.speed-controls') || null);
    }
    if (controls && !document.getElementById('panic-mute-btn')) {
        const btn = document.createElement('button');
        btn.id = 'panic-mute-btn';
        btn.className = 'control-btn panic-btn';
        btn.textContent = '🔇 停止/静音';
        controls.insertBefore(btn, controls.querySelector('.speed-controls') || null);
    }
    if (controls && !document.getElementById('session-preset')) {
        const preset = document.createElement('div');
        preset.id = 'session-preset';
        preset.className = 'session-preset';
        preset.textContent = 'Preset: medium / normal / soft';
        controls.appendChild(preset);
    }
    if (!document.getElementById('session-settings-modal')) {
        const modal = document.createElement('div');
        modal.id = 'session-settings-modal';
      modal.className = 'settings-modal hidden';
      modal.innerHTML = `
          <div class="settings-panel">
            <h2>Session Settings</h2>
            <p class="settings-subtitle">当前设置会用于本轮 / 下一轮</p>
            <div class="settings-mode">
              <div class="settings-mode-toggle" role="group" aria-label="Session mode">
                <button type="button" id="session-mode-safe" class="mode-btn active">默认/安全</button>
                <button type="button" id="session-mode-expert" class="mode-btn">专家/调参</button>
              </div>
              <div id="session-mode-note" class="settings-mode-note">默认/安全模式：使用保守默认值（只读）。</div>
            </div>
            <div class="settings-disclaimer">
              保守默认值 + 可调包络（用于专家校准，不是临床验证阈值）。
            </div>
            <div class="settings-grid">
              <div class="settings-field">
                <label for="session-volume">音量</label>
                <select id="session-volume">
                  <option value="low">low</option>
                  <option value="medium" selected>medium</option>
                  <option value="high">high</option>
                </select>
                <div class="settings-field-meta">
                  <span>默认: medium | 可调: low/medium/high | 风险: 过高可能刺激</span>
                  <button class="settings-reset" type="button" data-reset-field="volumeLevel">恢复默认</button>
                </div>
              </div>
              <div class="settings-field">
                <label for="session-density">节奏密度</label>
                <select id="session-density">
                  <option value="sparse">sparse</option>
                  <option value="normal" selected>normal</option>
                </select>
                <div class="settings-field-meta">
                  <span>默认: normal | 可调: sparse/normal | 风险: 过密增加负荷</span>
                  <button class="settings-reset" type="button" data-reset-field="rhythmDensity">恢复默认</button>
                </div>
              </div>
              <div class="settings-field">
                <label for="session-timbre">音色</label>
                <select id="session-timbre">
                  <option value="soft" selected>soft</option>
                  <option value="bright">bright</option>
                </select>
                <div class="settings-field-meta">
                  <span>默认: soft | 可调: soft/bright | 风险: bright 更刺激</span>
                  <button class="settings-reset" type="button" data-reset-field="timbre">恢复默认</button>
                </div>
              </div>
              <div class="settings-field">
                <label for="session-latency">反馈延迟</label>
                <select id="session-latency">
                  <option value="0" selected>Immediate</option>
                  <option value="500">0.5s Delay</option>
                </select>
                <div class="settings-field-meta">
                  <span>默认: Immediate | 可调: 0/0.5s | 风险: 延迟影响因果感</span>
                  <button class="settings-reset" type="button" data-reset-field="feedbackLatencyMs">恢复默认</button>
                </div>
              </div>
              <div class="settings-field">
                <label for="session-immediate">即时音模式</label>
                <select id="session-immediate">
                  <option value="full" selected>Full</option>
                  <option value="visual">Visual-only</option>
                  <option value="off">Off</option>
                </select>
                <div class="settings-field-meta">
                  <span>默认: Full | 可调: full/visual/off | 风险: 反馈过强</span>
                  <button class="settings-reset" type="button" data-reset-field="immediateToneMode">恢复默认</button>
                </div>
              </div>
              <div class="settings-field">
                <label for="session-reward">Reward 音乐</label>
                <select id="session-reward">
                  <option value="on" selected>On</option>
                  <option value="off">Off</option>
                </select>
                <div class="settings-field-meta">
                  <span>默认: On | 可调: On/Off | 风险: Off 仅保留即时反馈</span>
                  <button class="settings-reset" type="button" data-reset-field="rewardEnabled">恢复默认</button>
                </div>
              </div>
              <div class="settings-field full">
                <label for="session-bpm">Reward BPM</label>
                <div class="settings-slider">
                  <input type="range" id="session-bpm" min="65" max="75" step="1" value="72">
                  <span id="session-bpm-value" class="settings-slider-value">72 BPM</span>
                </div>
                <div class="settings-field-meta">
                  <span>默认: 72 | 可调: 65–75 | 风险: 过快难预测</span>
                  <button class="settings-reset" type="button" data-reset-field="rewardBpm">恢复默认</button>
                </div>
              </div>
              <div class="settings-field full">
                <label for="session-duration">Reward 时长</label>
                <div class="settings-slider">
                  <input type="range" id="session-duration" min="10" max="20" step="1" value="20">
                  <span id="session-duration-value" class="settings-slider-value">20s</span>
                </div>
                <div class="settings-field-meta">
                  <span>默认: 20s | 可调: 10–20s | 风险: 过长可能过载</span>
                  <button class="settings-reset" type="button" data-reset-field="rewardDurationSec">恢复默认</button>
                </div>
              </div>
            </div>
            <div class="settings-actions">
              <button id="session-reset-btn" class="result-btn secondary">恢复默认</button>
              <button id="session-start-btn" class="result-btn primary">开始本轮</button>
              <button id="session-close-btn" class="result-btn secondary">关闭</button>
            </div>
          </div>
        `;
      document.body.appendChild(modal);
    }
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

      // 默认弹出设置窗口，等待专家点击“开始本轮”
      openSessionSettingsModal();
  
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

    // Session settings
    if (elements.sessionSettingsBtn && elements.sessionStartBtn && elements.sessionCloseBtn) {
        elements.sessionSettingsBtn.addEventListener('click', () => openSessionSettingsModal());
        elements.sessionStartBtn.addEventListener('click', () => handleStartRound());
        elements.sessionCloseBtn.addEventListener('click', () => closeSessionSettingsModal());

        if (elements.sessionModeSafe) {
            elements.sessionModeSafe.addEventListener('click', () => handleModeToggle(false));
        }
        if (elements.sessionModeExpert) {
            elements.sessionModeExpert.addEventListener('click', () => handleModeToggle(true));
        }
        if (elements.sessionBpm) {
            elements.sessionBpm.addEventListener('input', (e) => {
                const value = clampValue(parseInt(e.target.value, 10), SESSION_ENVELOPE.rewardBpm.min, SESSION_ENVELOPE.rewardBpm.max);
                updateBpmDisplay(value);
            });
        }
        if (elements.sessionDuration) {
            elements.sessionDuration.addEventListener('input', (e) => {
                const value = clampValue(parseInt(e.target.value, 10), SESSION_ENVELOPE.rewardDurationSec.min, SESSION_ENVELOPE.rewardDurationSec.max);
                updateDurationDisplay(value);
            });
        }
        if (elements.sessionResetButtons?.length) {
            elements.sessionResetButtons.forEach((btn) => {
                btn.addEventListener('click', () => {
                    const field = btn.dataset.resetField;
                    if (field) resetSessionField(field);
                });
            });
        }
        if (elements.sessionResetBtn) {
            elements.sessionResetBtn.addEventListener('click', () => resetSessionForm());
        }
    } else {
        console.warn('[SettingsUI] 设置控件未就绪，跳过绑定');
    }

    if (elements.panicMuteBtn) {
        elements.panicMuteBtn.addEventListener('click', () => setPanicMuted(!panicMuted));
    }
    if (elements.resultMuteBtn) {
        elements.resultMuteBtn.addEventListener('click', () => setPanicMuted(!panicMuted));
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardInput);
    
    // Window resize handling
    window.addEventListener('resize', handleWindowResize);
    
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
  
        if (elements.inputMode) {
          elements.inputMode.textContent = '鼠标';
        }
      }
    }, 500);
  }

function normalizeSessionConfig(config = {}) {
    const merged = { ...SESSION_DEFAULTS, ...config };
    merged.rewardBpm = clampValue(
        Number(merged.rewardBpm || SESSION_DEFAULTS.rewardBpm),
        SESSION_ENVELOPE.rewardBpm.min,
        SESSION_ENVELOPE.rewardBpm.max
    );
    merged.rewardDurationSec = clampValue(
        Number(merged.rewardDurationSec || SESSION_DEFAULTS.rewardDurationSec),
        SESSION_ENVELOPE.rewardDurationSec.min,
        SESSION_ENVELOPE.rewardDurationSec.max
    );
    merged.expertMode = Boolean(merged.expertMode);
    return merged;
}

function getCurrentSessionConfig() {
    return normalizeSessionConfig(window.sessionConfig || game?.sessionConfig || {});
}

function updateSessionPresetLabel(config) {
    if (!elements.sessionPreset) return;
    const modeLabel = config.expertMode ? "Expert" : "Safe";
    elements.sessionPreset.textContent = `Preset: ${config.volumeLevel} / ${config.rhythmDensity} / ${config.timbre} | BPM ${config.rewardBpm} | ${config.rewardDurationSec}s | ${modeLabel}`;
}

function updateBpmDisplay(value) {
    if (elements.sessionBpmValue) {
        elements.sessionBpmValue.textContent = `${value} BPM`;
    }
}

function updateDurationDisplay(value) {
    if (elements.sessionDurationValue) {
        elements.sessionDurationValue.textContent = `${value}s`;
    }
}

function setSettingsDisabled(disabled) {
    const fields = [
        elements.sessionVolume,
        elements.sessionDensity,
        elements.sessionTimbre,
        elements.sessionLatency,
        elements.sessionImmediate,
        elements.sessionReward,
        elements.sessionBpm,
        elements.sessionDuration,
    ];
    fields.forEach((field) => {
        if (!field) return;
        field.disabled = disabled;
        const wrapper = field.closest('.settings-field');
        if (wrapper) {
            wrapper.classList.toggle('is-disabled', disabled);
        }
    });
    if (elements.sessionResetButtons?.length) {
        elements.sessionResetButtons.forEach((btn) => {
            btn.disabled = disabled;
        });
    }
}

function setModeUI(isExpert) {
    if (elements.sessionModeSafe) {
        elements.sessionModeSafe.classList.toggle('active', !isExpert);
    }
    if (elements.sessionModeExpert) {
        elements.sessionModeExpert.classList.toggle('active', isExpert);
    }
    if (elements.sessionModeNote) {
        elements.sessionModeNote.textContent = isExpert
            ? '专家/调参模式：仅在可调包络内微调参数。'
            : '默认/安全模式：使用保守默认值（只读）。';
    }
    setSettingsDisabled(!isExpert);
}

function loadSessionSettingsForm(config) {
    if (!elements.sessionModal) return;
    const normalized = normalizeSessionConfig(config);
    elements.sessionVolume.value = normalized.volumeLevel || 'medium';
    elements.sessionDensity.value = normalized.rhythmDensity || 'normal';
    elements.sessionTimbre.value = normalized.timbre || 'soft';
    elements.sessionLatency.value = String(normalized.feedbackLatencyMs ?? 0);
    elements.sessionImmediate.value = normalized.immediateToneMode || 'full';
    elements.sessionReward.value = normalized.rewardEnabled ? 'on' : 'off';
    if (elements.sessionBpm) {
        elements.sessionBpm.min = SESSION_ENVELOPE.rewardBpm.min;
        elements.sessionBpm.max = SESSION_ENVELOPE.rewardBpm.max;
        elements.sessionBpm.value = normalized.rewardBpm;
        updateBpmDisplay(normalized.rewardBpm);
    }
    if (elements.sessionDuration) {
        elements.sessionDuration.min = SESSION_ENVELOPE.rewardDurationSec.min;
        elements.sessionDuration.max = SESSION_ENVELOPE.rewardDurationSec.max;
        elements.sessionDuration.value = normalized.rewardDurationSec;
        updateDurationDisplay(normalized.rewardDurationSec);
    }
    setModeUI(normalized.expertMode);
    updateSessionPresetLabel(normalized);
}

function readSessionSettingsForm() {
    const expertMode = Boolean(elements.sessionModeExpert?.classList.contains('active'));
    const rewardBpm = clampValue(
        parseInt(elements.sessionBpm?.value || SESSION_DEFAULTS.rewardBpm, 10) || SESSION_DEFAULTS.rewardBpm,
        SESSION_ENVELOPE.rewardBpm.min,
        SESSION_ENVELOPE.rewardBpm.max
    );
    const rewardDurationSec = clampValue(
        parseInt(elements.sessionDuration?.value || SESSION_DEFAULTS.rewardDurationSec, 10) || SESSION_DEFAULTS.rewardDurationSec,
        SESSION_ENVELOPE.rewardDurationSec.min,
        SESSION_ENVELOPE.rewardDurationSec.max
    );
    return normalizeSessionConfig({
        volumeLevel: elements.sessionVolume.value,
        rhythmDensity: elements.sessionDensity.value,
        timbre: elements.sessionTimbre.value,
        feedbackLatencyMs: parseInt(elements.sessionLatency.value, 10) || 0,
        immediateToneMode: elements.sessionImmediate.value,
        rewardEnabled: elements.sessionReward.value === 'on',
        rewardBpm,
        rewardDurationSec,
        expertMode,
    });
}

function resetSessionField(field) {
    const defaults = SESSION_DEFAULTS;
    switch (field) {
        case 'volumeLevel':
            elements.sessionVolume.value = defaults.volumeLevel;
            break;
        case 'rhythmDensity':
            elements.sessionDensity.value = defaults.rhythmDensity;
            break;
        case 'timbre':
            elements.sessionTimbre.value = defaults.timbre;
            break;
        case 'feedbackLatencyMs':
            elements.sessionLatency.value = String(defaults.feedbackLatencyMs);
            break;
        case 'immediateToneMode':
            elements.sessionImmediate.value = defaults.immediateToneMode;
            break;
        case 'rewardEnabled':
            elements.sessionReward.value = defaults.rewardEnabled ? 'on' : 'off';
            break;
        case 'rewardBpm':
            if (elements.sessionBpm) {
                elements.sessionBpm.value = defaults.rewardBpm;
                updateBpmDisplay(defaults.rewardBpm);
            }
            break;
        case 'rewardDurationSec':
            if (elements.sessionDuration) {
                elements.sessionDuration.value = defaults.rewardDurationSec;
                updateDurationDisplay(defaults.rewardDurationSec);
            }
            break;
        default:
            break;
    }
}

function handleModeToggle(isExpert) {
    if (isExpert) {
        const restore = lastExpertDraft || getCurrentSessionConfig();
        loadSessionSettingsForm({ ...restore, expertMode: true });
        return;
    }
    lastExpertDraft = readSessionSettingsForm();
    loadSessionSettingsForm({ ...SESSION_DEFAULTS, expertMode: false });
}

function resetSessionForm() {
    loadSessionSettingsForm({ ...SESSION_DEFAULTS, expertMode: Boolean(elements.sessionModeExpert?.classList.contains('active')) });
}

function syncPanicButton(btn, isMuted) {
    if (!btn) return;
    btn.classList.toggle('is-muted', isMuted);
    btn.textContent = isMuted ? '🔊 恢复声音' : '🔇 停止/静音';
}

function refreshPanicButtons() {
    const muted = window.__panicMute === true;
    syncPanicButton(elements.panicMuteBtn, muted);
    syncPanicButton(elements.resultMuteBtn, muted);
}

function setPanicMuted(isMuted) {
    const nextMuted = Boolean(isMuted);
    if (panicMuted === nextMuted) {
        refreshPanicButtons();
        return;
    }
    panicMuted = nextMuted;
    window.__panicMute = panicMuted;
    refreshPanicButtons();
    if (window.MAGENTA?.player) {
        window.MAGENTA.player.stop();
    }
    if (window.autismFeatures?.applySoundVolume) {
        window.autismFeatures.applySoundVolume();
        window.autismFeatures.updateUIValues?.();
    } else if (window.popSynth?.setVolume) {
        window.popSynth.setVolume(panicMuted ? 0 : 0.7);
    }
}

function openSessionSettingsModal() {
    if (!elements.sessionModal) {
        ensureSessionSettingsUI();
        syncSessionElements();
    }
    if (!elements.sessionModal) {
        console.warn('[SettingsUI] session-settings-modal 缺失，请确认加载了最新 index.html');
        return;
    }
    const config = getCurrentSessionConfig();
    loadSessionSettingsForm(config);
    if (elements.sessionStartBtn) {
        elements.sessionStartBtn.textContent = game?.roundActive ? '保存设置' : '开始本轮';
    }
    if (game?.roundActive && !game.isPaused) {
        game.togglePause();
        pausedBySettings = true;
    }
    elements.sessionModal.classList.remove('hidden');
}

function closeSessionSettingsModal() {
    elements.sessionModal.classList.add('hidden');
    if (pausedBySettings && game?.isPaused) {
        game.togglePause();
    }
    pausedBySettings = false;
}

function handleStartRound() {
    const config = readSessionSettingsForm();
    window.sessionConfig = { ...config };
    game?.setSessionConfig?.(config);
    updateSessionPresetLabel(config);

    if (game?.roundActive) {
        showEncouragementMessage('设置已保存，将在下一轮生效', 1200);
        closeSessionSettingsModal();
        return;
    }

    if (!game?.isRunning) {
        game.start();
    }

    if (!statusUpdatesStarted) {
        startStatusUpdates();
        statusUpdatesStarted = true;
    }

    // 重置成就与结果统计
    if (window.autismFeatures) {
        window.autismFeatures.resetAchievements();
    }
    if (window.gameResultManager) {
        window.gameResultManager.startGame();
    }

    game.startRound(60, {
        clearHistory: true,
        onEnd: async (session) => {
            try {
                console.log('Round ended:', session);
                game.stop();

                if (window.gameResultManager) {
                    window.gameResultManager.endGame();
                    console.log('📊 游戏结果已显示');
                }

                const enableMusicGeneration = window.enableAIMusic || false;
                if (enableMusicGeneration) {
                    setTimeout(async () => {
                        try {
                            await generateMelodyFromSession(session, {
                                primerBars: 2,
                                continueSteps: 64,
                                temperature: 1.0,
                                downloadMidi: false,
                            });
                        } catch (musicError) {
                            console.warn('🎵 音乐生成失败，但不影响游戏结果:', musicError);
                        }
                    }, 100);
                } else {
                    window.lastGeneratedSequence = createRichTestMusic(session);
                    console.log('🎵 音乐生成已禁用，使用丰富测试序列');
                    window.gameResultManager?.updateDebugPanel?.();
                }
            } catch (err) {
                console.error('[AI] submit failed:', err);
                showEncouragementMessage('AI 生成失败：查看控制台错误', 1500);
            }
        },
    });

    showEncouragementMessage('欢迎！移动鼠标戳泡泡！');
    closeSessionSettingsModal();
}

// Export functions for global access
window.gameApp = {
    updateScoreDisplay,
    showEncouragementMessage,
    getGameState,
    getBubbleManager,
    getHandTracker,
    startStatusUpdates,
    setPanicMuted,
    refreshPanicButtons
};

window.sessionUI = {
    open: openSessionSettingsModal,
    close: closeSessionSettingsModal
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
  
    // 仅生成，不自动播放（由用户点击播放）
    window.lastGeneratedSequence = full;
    window.gameResultManager?.updateDebugPanel?.();
    
    window.gameApp?.showEncouragementMessage?.('Reward 已生成，点击“享受你创作的音乐”播放 🎵', 1800);
  
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
   * 改为调用安全的儿歌风格生成器（AdvancedMusicGenerator）
   */
  function createRichTestMusic(session) {
    try {
      if (typeof AdvancedMusicGenerator !== 'function') {
        console.warn('AdvancedMusicGenerator not ready, returning empty sequence');
        return { notes: [], tempos: [{ time: 0, qpm: 72 }], totalTime: 0 };
      }
      const generator = new AdvancedMusicGenerator();
      if (window.sessionConfig) {
        generator.setSessionConfig(window.sessionConfig);
      }
      const actions = generator.buildActionTraceFromSession(session);
      const { sequence } = generator.generateReward(actions, generator.getSessionConfig());
      return sequence;
    } catch (e) {
      console.warn('Fallback createRichTestMusic failed:', e);
      return { notes: [], tempos: [{ time: 0, qpm: 72 }], totalTime: 0 };
    }
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
