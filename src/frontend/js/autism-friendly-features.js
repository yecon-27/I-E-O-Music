/**
 * 自闭症友好功能模块
 * 提供感官调节、可预测性增强和个性化支持
 */

class AutismFriendlyFeatures {
    constructor() {
        this.settings = {
            soundVolume: 70,
            animationIntensity: 3,
            colorMode: 'normal',
            predictableMode: false,
            showProgress: true,
            gentleTransitions: true
        };
        
        this.achievements = [];
        this.achievementFlags = {
            consecutive5: false,
            consecutive10: false,
            consecutive15: false,
            total10: false,
            total25: false,
            total50: false,
            total100: false
        };
        this.sessionData = {
            startTime: null,
            movements: [],
            successes: [],
            attempts: [],
            consecutiveCount: 0,
            lastSuccessTime: 0
        };
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.applySettings();
        this.startSessionTracking();
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 感官设置面板切换
        const sensoryToggle = document.getElementById('sensory-panel-toggle');
        const sensoryPanel = document.getElementById('sensory-panel');
        
        if (sensoryToggle && sensoryPanel) {
            sensoryToggle.addEventListener('click', () => {
                sensoryPanel.classList.toggle('hidden');
            });
            
            // 点击外部关闭面板
            document.addEventListener('click', (e) => {
                if (!sensoryToggle.contains(e.target) && !sensoryPanel.contains(e.target)) {
                    sensoryPanel.classList.add('hidden');
                }
            });
        }
        
        // 音量控制
        const soundVolume = document.getElementById('sound-volume');
        const soundVolumeValue = document.getElementById('sound-volume-value');
        if (soundVolume && soundVolumeValue) {
            soundVolume.addEventListener('input', (e) => {
                this.settings.soundVolume = parseInt(e.target.value);
                soundVolumeValue.textContent = `${this.settings.soundVolume}%`;
                this.applySoundVolume();
                this.saveSettings();
            });
        }
        
        // 动画强度由游戏速度控制，移除重复功能
        
        // 色彩模式切换
        const colorMode = document.getElementById('color-mode');
        if (colorMode) {
            colorMode.addEventListener('change', (e) => {
                this.settings.colorMode = e.target.value;
                this.applyColorMode();
                this.saveSettings();
            });
        }
        
        // 可预测模式
        const predictableMode = document.getElementById('predictable-mode');
        if (predictableMode) {
            predictableMode.addEventListener('change', (e) => {
                this.settings.predictableMode = e.target.checked;
                this.applyPredictableMode();
                this.saveSettings();
            });
        }
    }
    
    /**
     * 应用音量设置
     */
    applySoundVolume() {
        const isMuted = window.__panicMute === true;
        const volume = isMuted ? 0 : this.settings.soundVolume / 100;
        
        // 应用到PopSynth音效
        if (window.popSynth && typeof window.popSynth.setVolume === 'function') {
            window.popSynth.setVolume(volume);
            console.log(`[Audio] 音效音量已设置为: ${this.settings.soundVolume}%`);
        } else {
            // 如果popSynth还没初始化，延迟应用
            console.log('[Audio] PopSynth未就绪，将在初始化后应用音量设置');
            setTimeout(() => {
                if (window.popSynth && typeof window.popSynth.setVolume === 'function') {
                    window.popSynth.setVolume(volume);
                    console.log(`[Audio] 延迟应用音效音量: ${this.settings.soundVolume}%`);
                }
            }, 1000);
        }
        
        // 应用到Magenta背景音乐
        if (window.MAGENTA && window.MAGENTA.player) {
            try {
                if (window.mm && window.mm.Player && window.mm.Player.tone) {
                    window.mm.Player.tone.Master.volume.value = 
                        20 * Math.log10(Math.max(0.01, volume));
                    console.log(`🎵 背景音乐音量已设置为: ${this.settings.soundVolume}%`);
                }
            } catch (e) {
                console.log('背景音乐音量调节失败:', e);
            }
        }
        
        // 应用到其他可能的音频源
        try {
            // 如果有其他音频元素，也应用音量设置
            const audioElements = document.querySelectorAll('audio');
            audioElements.forEach(audio => {
                audio.volume = volume;
            });
        } catch (e) {
            console.log('HTML音频元素音量调节失败:', e);
        }
    }
    
    /**
     * 应用动画强度设置
     */
    applyAnimationIntensity() {
        document.body.classList.remove('low-animation', 'high-animation');
        
        if (this.settings.animationIntensity <= 2) {
            document.body.classList.add('low-animation');
        } else if (this.settings.animationIntensity >= 4) {
            document.body.classList.add('high-animation');
        }
    }
    
    /**
     * 应用色彩模式
     */
    applyColorMode() {
        document.body.classList.remove('high-contrast', 'soft-colors');
        
        switch (this.settings.colorMode) {
            case 'high-contrast':
                document.body.classList.add('high-contrast');
                break;
            case 'soft':
                document.body.classList.add('soft-colors');
                break;
        }
    }
    
    /**
     * 应用可预测模式
     */
    applyPredictableMode() {
        // 移除现有指示器
        const existingIndicator = document.querySelector('.predictable-mode-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        if (this.settings.predictableMode) {
            // 添加规律模式指示器
            const indicator = document.createElement('div');
            indicator.className = 'predictable-mode-indicator';
            indicator.textContent = '🔄 规律模式：泡泡按固定位置出现';
            document.body.appendChild(indicator);
            
            // 通知游戏引擎启用规律模式
            if (window.game && window.game.bubbleManager) {
                window.game.bubbleManager.setPredictableMode(true);
            }
        } else {
            // 通知游戏引擎禁用规律模式
            if (window.game && window.game.bubbleManager) {
                window.game.bubbleManager.setPredictableMode(false);
            }
        }
    }
    
    /**
     * 应用所有设置
     */
    applySettings() {
        this.applySoundVolume();
        this.applyAnimationIntensity();
        this.applyColorMode();
        this.applyPredictableMode();
        
        // 更新UI显示
        this.updateUIValues();
    }
    
    /**
     * 当音频系统初始化完成后调用此方法
     * 确保音量设置能正确应用
     */
    onAudioSystemReady() {
        console.log('🔊 音频系统就绪，重新应用音量设置');
        this.applySoundVolume();
    }
    
    /**
     * 更新UI显示值
     */
    updateUIValues() {
        const soundVolume = document.getElementById('sound-volume');
        const soundVolumeValue = document.getElementById('sound-volume-value');
        if (soundVolume && soundVolumeValue) {
            soundVolume.value = this.settings.soundVolume;
            soundVolumeValue.textContent = `${this.settings.soundVolume}%`;
        }
        
        // 动画强度UI已移除
        
        const colorMode = document.getElementById('color-mode');
        if (colorMode) {
            colorMode.value = this.settings.colorMode;
        }
        
        const predictableMode = document.getElementById('predictable-mode');
        if (predictableMode) {
            predictableMode.checked = this.settings.predictableMode;
        }
    }
    
    /**
     * 更新进度显示
     */
    updateProgress(remainingMs, totalMs) {
        const countdownDisplay = document.getElementById('countdown-display');
        const progressFill = document.getElementById('progress-fill');
        
        // 新的游戏进度指示器元素
        const gameCountdownDisplay = document.getElementById('game-countdown-display');
        const gameProgressFill = document.getElementById('game-progress-fill');
        const gameProgressIndicator = document.getElementById('game-progress-indicator');
        
        const seconds = Math.ceil(remainingMs / 1000);
        const progress = ((totalMs - remainingMs) / totalMs) * 100;
        const progressWidth = `${Math.max(0, Math.min(100, 100 - progress))}%`;
        
        // 更新顶部小进度条
        if (countdownDisplay) {
            countdownDisplay.textContent = `${seconds}s`;
        }
        
        if (progressFill) {
            progressFill.style.width = progressWidth;
        }
        
        // 更新底部大进度指示器
        if (gameCountdownDisplay) {
            gameCountdownDisplay.textContent = seconds;
        }
        
        if (gameProgressFill) {
            gameProgressFill.style.width = progressWidth;
        }
        
        // 根据剩余时间更新进度条颜色
        if (gameProgressIndicator) {
            gameProgressIndicator.classList.remove('warning', 'danger');
            if (seconds <= 10) {
                gameProgressIndicator.classList.add('danger');
            } else if (seconds <= 20) {
                gameProgressIndicator.classList.add('warning');
            }
        }
    }
    
    /**
     * 显示成就提示
     */
    showAchievement(message, type = 'success') {
        // 用户已禁用成就弹窗，直接返回
        return;
    }
    
    /**
     * 记录用户动作（用于分析协调性进步）
     */
    recordMovement(x, y, timestamp = Date.now()) {
        this.sessionData.movements.push({ x, y, timestamp });
        
        // 保持最近1000个动作记录
        if (this.sessionData.movements.length > 1000) {
            this.sessionData.movements.shift();
        }
    }
    
    /**
     * 记录失败事件（泡泡消失未被戳中）
     */
    recordMiss() {
        const now = Date.now();
        
        // 如果距离上次成功超过5秒，重置连续计数
        if (now - this.sessionData.lastSuccessTime > 5000) {
            if (this.sessionData.consecutiveCount > 0) {
                console.log(`连续成功中断，之前连续 ${this.sessionData.consecutiveCount} 个`);
                this.sessionData.consecutiveCount = 0;
            }
        }
    }
    
    /**
     * 记录成功事件
     */
    recordSuccess(bubbleData) {
        const now = Date.now();
        this.sessionData.successes.push({
            ...bubbleData,
            timestamp: now
        });
        
        // 更新连续成功计数
        if (now - this.sessionData.lastSuccessTime < 3000) { // 3秒内算连续
            this.sessionData.consecutiveCount++;
        } else {
            this.sessionData.consecutiveCount = 1; // 重新开始计数
        }
        this.sessionData.lastSuccessTime = now;
        
        // 调试信息 - 帮助诊断25个泡泡后的问题
        const totalCount = this.sessionData.successes.length;
        console.log(`[Success] 成功记录: 总数=${totalCount}, 连续=${this.sessionData.consecutiveCount}`);
        
        // 显示简单的即时反馈（不与成就冲突）
        this.showSimpleFeedback();
        
        // 检查是否达成成就
        this.checkAchievements();
    }
    
    /**
     * 显示简单的即时反馈
     */
    showSimpleFeedback() {
        // 用户已禁用即时反馈，直接返回
        return;
    }
    
    /**
     * 检查成就
     */
    checkAchievements() {
        const successes = this.sessionData.successes;
        const totalCount = successes.length;
        const consecutiveCount = this.sessionData.consecutiveCount;
        
        // 调试信息
        console.log(`[Achievement] 检查成就: 总数=${totalCount}, 连续=${consecutiveCount}, 标志=`, this.achievementFlags);
        
        // 连续成功成就 - 只在重要里程碑时触发，避免过度反馈
        if (consecutiveCount === 5 && !this.achievementFlags.consecutive5) {
            this.achievementFlags.consecutive5 = true;
            this.showAchievement('太棒了！连续戳中5个泡泡！', 'success');
        } else if (consecutiveCount === 10 && !this.achievementFlags.consecutive10) {
            this.achievementFlags.consecutive10 = true;
            this.showAchievement('连击高手！连续戳中10个泡泡！', 'success');
        } else if (consecutiveCount === 15 && !this.achievementFlags.consecutive15) {
            this.achievementFlags.consecutive15 = true;
            this.showAchievement('超级连击！连续戳中15个泡泡！', 'success');
        }
        
        // 总数成就 - 只在刚达到时触发
        if (totalCount === 10 && !this.achievementFlags.total10) {
            this.achievementFlags.total10 = true;
            this.showAchievement('第一个里程碑！戳中10个泡泡！', 'milestone');
        } else if (totalCount === 25 && !this.achievementFlags.total25) {
            this.achievementFlags.total25 = true;
            this.showAchievement('进步神速！戳中25个泡泡！', 'milestone');
        } else if (totalCount === 50 && !this.achievementFlags.total50) {
            this.achievementFlags.total50 = true;
            this.showAchievement('协调大师！戳中50个泡泡！', 'milestone');
        } else if (totalCount === 100 && !this.achievementFlags.total100) {
            this.achievementFlags.total100 = true;
            this.showAchievement('传奇玩家！戳中100个泡泡！', 'milestone');
        }
    }
    
    /**
     * 开始会话追踪
     */
    startSessionTracking() {
        this.sessionData.startTime = Date.now();
    }
    
    /**
     * 重置成就标志（新游戏时调用）
     */
    resetAchievements() {
        this.achievementFlags = {
            consecutive5: false,
            consecutive10: false,
            consecutive15: false,
            total10: false,
            total25: false,
            total50: false,
            total100: false
        };
        
        // 🔥 关键修复：重置会话数据，包括泡泡总数
        this.sessionData.consecutiveCount = 0;
        this.sessionData.lastSuccessTime = 0;
        this.sessionData.successes = []; // 清空成功记录数组
        this.sessionData.movements = []; // 清空移动记录数组
        this.sessionData.attempts = []; // 清空尝试记录数组
        this.achievements = []; // 清空成就记录
        
        // 重新开始会话追踪
        this.startSessionTracking();
        
        console.log('🏆 成就系统已完全重置，泡泡计数归零');
    }
    
    /**
     * 获取会话报告
     */
    getSessionReport() {
        const duration = Date.now() - this.sessionData.startTime;
        const movements = this.sessionData.movements;
        const successes = this.sessionData.successes;
        
        // 计算协调性指标
        let totalDistance = 0;
        let smoothness = 0;
        
        if (movements.length > 1) {
            for (let i = 1; i < movements.length; i++) {
                const prev = movements[i - 1];
                const curr = movements[i];
                const distance = Math.sqrt(
                    Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
                );
                totalDistance += distance;
            }
            
            // 平滑度 = 平均移动距离的倒数（越小越平滑）
            smoothness = movements.length / totalDistance;
        }
        
        return {
            duration,
            totalMovements: movements.length,
            totalSuccesses: successes.length,
            successRate: movements.length > 0 ? successes.length / movements.length : 0,
            averageMovementDistance: movements.length > 1 ? totalDistance / (movements.length - 1) : 0,
            smoothness,
            achievements: this.achievements.length
        };
    }
    
    /**
     * 保存设置到本地存储
     */
    saveSettings() {
        localStorage.setItem('autismFriendlySettings', JSON.stringify(this.settings));
    }
    
    /**
     * 从本地存储加载设置
     */
    loadSettings() {
        const saved = localStorage.getItem('autismFriendlySettings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.log('设置加载失败，使用默认设置');
            }
        }
    }
}

// 全局实例
window.autismFeatures = new AutismFriendlyFeatures();
