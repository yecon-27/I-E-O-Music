

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
    
    
    setupEventListeners() {
        const sensoryToggle = document.getElementById('sensory-panel-toggle');
        const sensoryPanel = document.getElementById('sensory-panel');
        
        if (sensoryToggle && sensoryPanel) {
            sensoryToggle.addEventListener('click', () => {
                sensoryPanel.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                if (!sensoryToggle.contains(e.target) && !sensoryPanel.contains(e.target)) {
                    sensoryPanel.classList.add('hidden');
                }
            });
        }
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
        
        const colorMode = document.getElementById('color-mode');
        if (colorMode) {
            colorMode.addEventListener('change', (e) => {
                this.settings.colorMode = e.target.value;
                this.applyColorMode();
                this.saveSettings();
            });
        }
        const predictableMode = document.getElementById('predictable-mode');
        if (predictableMode) {
            predictableMode.addEventListener('change', (e) => {
                this.settings.predictableMode = e.target.checked;
                this.applyPredictableMode();
                this.saveSettings();
            });
        }
    }
    
    
    applySoundVolume() {
        const isMuted = window.__panicMute === true;
        const volume = isMuted ? 0 : this.settings.soundVolume / 100;
        if (window.popSynth && typeof window.popSynth.setVolume === 'function') {
            window.popSynth.setVolume(volume);
            console.log(`[Audio] 音效音量已设置为: ${this.settings.soundVolume}%`);
        } else {
            console.log('[Audio] PopSynth未就绪，将在初始化后应用音量设置');
            setTimeout(() => {
                if (window.popSynth && typeof window.popSynth.setVolume === 'function') {
                    window.popSynth.setVolume(volume);
                    console.log(`[Audio] 延迟应用音效音量: ${this.settings.soundVolume}%`);
                }
            }, 1000);
        }
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
        try {
            const audioElements = document.querySelectorAll('audio');
            audioElements.forEach(audio => {
                audio.volume = volume;
            });
        } catch (e) {
            console.log('HTML音频元素音量调节失败:', e);
        }
    }
    
    
    applyAnimationIntensity() {
        document.body.classList.remove('low-animation', 'high-animation');
        
        if (this.settings.animationIntensity <= 2) {
            document.body.classList.add('low-animation');
        } else if (this.settings.animationIntensity >= 4) {
            document.body.classList.add('high-animation');
        }
    }
    
    
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
    
    
    applyPredictableMode() {
        const existingIndicator = document.querySelector('.predictable-mode-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        if (this.settings.predictableMode) {
            const indicator = document.createElement('div');
            indicator.className = 'predictable-mode-indicator';
            indicator.textContent = '🔄 规律模式：泡泡按固定位置出现';
            document.body.appendChild(indicator);
            if (window.game && window.game.bubbleManager) {
                window.game.bubbleManager.setPredictableMode(true);
            }
        } else {
            if (window.game && window.game.bubbleManager) {
                window.game.bubbleManager.setPredictableMode(false);
            }
        }
    }
    
    
    applySettings() {
        this.applySoundVolume();
        this.applyAnimationIntensity();
        this.applyColorMode();
        this.applyPredictableMode();
        this.updateUIValues();
    }
    
    
    onAudioSystemReady() {
        console.log('🔊 音频系统就绪，重新应用音量设置');
        this.applySoundVolume();
    }
    
    
    updateUIValues() {
        const soundVolume = document.getElementById('sound-volume');
        const soundVolumeValue = document.getElementById('sound-volume-value');
        if (soundVolume && soundVolumeValue) {
            soundVolume.value = this.settings.soundVolume;
            soundVolumeValue.textContent = `${this.settings.soundVolume}%`;
        }
        
        const colorMode = document.getElementById('color-mode');
        if (colorMode) {
            colorMode.value = this.settings.colorMode;
        }
        
        const predictableMode = document.getElementById('predictable-mode');
        if (predictableMode) {
            predictableMode.checked = this.settings.predictableMode;
        }
    }
    
    
    updateProgress(remainingMs, totalMs) {
        const countdownDisplay = document.getElementById('countdown-display');
        const progressFill = document.getElementById('progress-fill');
        const gameCountdownDisplay = document.getElementById('game-countdown-display');
        const gameProgressFill = document.getElementById('game-progress-fill');
        const gameProgressIndicator = document.getElementById('game-progress-indicator');
        
        const seconds = Math.ceil(remainingMs / 1000);
        const progress = ((totalMs - remainingMs) / totalMs) * 100;
        const progressWidth = `${Math.max(0, Math.min(100, 100 - progress))}%`;
        if (countdownDisplay) {
            countdownDisplay.textContent = `${seconds}s`;
        }
        
        if (progressFill) {
            progressFill.style.width = progressWidth;
        }
        if (gameCountdownDisplay) {
            gameCountdownDisplay.textContent = seconds;
        }
        
        if (gameProgressFill) {
            gameProgressFill.style.width = progressWidth;
        }
        if (gameProgressIndicator) {
            gameProgressIndicator.classList.remove('warning', 'danger');
            if (seconds <= 10) {
                gameProgressIndicator.classList.add('danger');
            } else if (seconds <= 20) {
                gameProgressIndicator.classList.add('warning');
            }
        }
    }
    
    
    showAchievement(message, type = 'success') {
        return;
    }
    
    
    recordMovement(x, y, timestamp = Date.now()) {
        this.sessionData.movements.push({ x, y, timestamp });
        if (this.sessionData.movements.length > 1000) {
            this.sessionData.movements.shift();
        }
    }
    
    
    recordMiss() {
        const now = Date.now();
        if (now - this.sessionData.lastSuccessTime > 5000) {
            if (this.sessionData.consecutiveCount > 0) {
                console.log(`连续成功中断，之前连续 ${this.sessionData.consecutiveCount} 个`);
                this.sessionData.consecutiveCount = 0;
            }
        }
    }
    
    
    recordSuccess(bubbleData) {
        const now = Date.now();
        this.sessionData.successes.push({
            ...bubbleData,
            timestamp: now
        });
        if (now - this.sessionData.lastSuccessTime < 3000) { // 3秒内算连续
            this.sessionData.consecutiveCount++;
        } else {
            this.sessionData.consecutiveCount = 1; // 重新开始计数
        }
        this.sessionData.lastSuccessTime = now;
        const totalCount = this.sessionData.successes.length;
        console.log(`[Success] 成功记录: 总数=${totalCount}, 连续=${this.sessionData.consecutiveCount}`);
        this.showSimpleFeedback();
        this.checkAchievements();
    }
    
    
    showSimpleFeedback() {
        return;
    }
    
    
    checkAchievements() {
        const successes = this.sessionData.successes;
        const totalCount = successes.length;
        const consecutiveCount = this.sessionData.consecutiveCount;
        console.log(`[Achievement] 检查成就: 总数=${totalCount}, 连续=${consecutiveCount}, 标志=`, this.achievementFlags);
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
    
    
    startSessionTracking() {
        this.sessionData.startTime = Date.now();
    }
    
    
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
        this.sessionData.consecutiveCount = 0;
        this.sessionData.lastSuccessTime = 0;
        this.sessionData.successes = []; // 清空成功记录数组
        this.sessionData.movements = []; // 清空移动记录数组
        this.sessionData.attempts = []; // 清空尝试记录数组
        this.achievements = []; // 清空成就记录
        this.startSessionTracking();
        
        console.log('🏆 成就系统已完全重置，泡泡计数归零');
    }
    
    
    getSessionReport() {
        const duration = Date.now() - this.sessionData.startTime;
        const movements = this.sessionData.movements;
        const successes = this.sessionData.successes;
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
    
    
    saveSettings() {
        localStorage.setItem('autismFriendlySettings', JSON.stringify(this.settings));
    }
    
    
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
window.autismFeatures = new AutismFriendlyFeatures();
