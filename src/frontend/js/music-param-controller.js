/**
 * 音乐参数调整控制器
 * 支持测试模式和收敛模式，用于专家调整音乐参数并收敛安全区间
 */
class MusicParamController {
    constructor() {
        // 模式: 'test' | 'converge'
        this.mode = 'test';
        
        // 默认安全区间定义
        this.safeRanges = {
            tempo: { min: 60, max: 80, absMin: 40, absMax: 120, unit: 'BPM' },
            contrast: { min: 0, max: 20, absMin: 0, absMax: 50, unit: '%' },
            volume: { min: 60, max: 80, absMin: 0, absMax: 100, unit: '%' },
        };
        
        // 安全和声选项
        this.safeHarmony = ['I-V'];
        this.allHarmonyOptions = ['I-V', 'I-IV', 'I-vi', 'I-IV-V', 'I-vi-IV-V'];
        
        // 当前参数值
        this.currentParams = {
            tempo: 72,
            contrast: 10,
            volume: 70,
            harmony: 'I-V'
        };
        
        // 收敛后的参数（用于提交到数据库）
        this.convergedParams = null;
        
        // 回调
        this.onParamChange = null;
        this.onWarning = null;
        this.onSubmit = null;
        
        // 播放状态
        this.isPlaying = false;
        
        this.initialized = false;
    }
    
    /**
     * 初始化控制器
     */
    init() {
        if (this.initialized) return;
        
        this.bindModeToggle();
        this.bindSliders();
        this.bindHarmonyOptions();
        this.bindActionButtons();
        this.updateAllSliderStyles();
        
        this.initialized = true;
        console.log('[MusicParamController] 初始化完成');
    }
    
    /**
     * 绑定模式切换按钮
     */
    bindModeToggle() {
        const testBtn = document.getElementById('param-mode-test');
        const convergeBtn = document.getElementById('param-mode-converge');
        const convergeArea = document.getElementById('converge-submit-area');
        
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.setMode('test');
                testBtn.classList.add('active');
                convergeBtn?.classList.remove('active');
                convergeArea?.classList.add('hidden');
            });
        }
        
        if (convergeBtn) {
            convergeBtn.addEventListener('click', () => {
                this.setMode('converge');
                convergeBtn.classList.add('active');
                testBtn?.classList.remove('active');
                convergeArea?.classList.remove('hidden');
                this.updateConvergeSummary();
            });
        }
    }
    
    /**
     * 绑定滑动条事件
     */
    bindSliders() {
        const sliders = [
            { id: 'report-param-tempo', param: 'tempo', valueId: 'report-param-tempo-value', warningId: 'tempo-warning' },
            { id: 'report-param-contrast', param: 'contrast', valueId: 'report-param-contrast-value', warningId: 'contrast-warning' },
            { id: 'report-param-volume', param: 'volume', valueId: 'report-param-volume-value', warningId: 'volume-warning' }
        ];
        
        sliders.forEach(({ id, param, valueId, warningId }) => {
            const slider = document.getElementById(id);
            const valueEl = document.getElementById(valueId);
            const warningEl = document.getElementById(warningId);
            
            if (!slider) return;
            
            // 设置滑动条的安全区间数据属性
            const range = this.safeRanges[param];
            if (range) {
                slider.dataset.safeMin = range.min;
                slider.dataset.safeMax = range.max;
            }
            
            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.currentParams[param] = value;
                
                // 更新显示值
                if (valueEl) {
                    valueEl.textContent = param === 'tempo' ? value : value + '%';
                }
                
                // 检查是否超出安全区间
                const isUnsafe = this.isOutOfSafeRange(param, value);
                this.updateWarning(warningEl, isUnsafe);
                this.updateSliderStyle(slider, param, value);
                
                // 触发回调
                this.onParamChange?.({ param, value, isUnsafe });
                
                // 如果在收敛模式，更新摘要
                if (this.mode === 'converge') {
                    this.updateConvergeSummary();
                }
            });
            
            // 初始化样式
            this.updateSliderStyle(slider, param, parseInt(slider.value));
        });
    }

    /**
     * 绑定和声选项按钮
     */
    bindHarmonyOptions() {
        const container = document.getElementById('harmony-options');
        const warningEl = document.getElementById('harmony-warning');
        
        if (!container) return;
        
        const buttons = container.querySelectorAll('.harmony-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                // 移除其他按钮的active状态
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const value = btn.dataset.value;
                this.currentParams.harmony = value;
                
                // 检查是否为非安全选项
                const isUnsafe = !this.safeHarmony.includes(value);
                this.updateWarning(warningEl, isUnsafe);
                
                // 触发回调
                this.onParamChange?.({ param: 'harmony', value, isUnsafe });
                
                // 如果在收敛模式，更新摘要
                if (this.mode === 'converge') {
                    this.updateConvergeSummary();
                }
            });
        });
    }
    
    /**
     * 绑定操作按钮
     */
    bindActionButtons() {
        // 预览按钮
        const previewBtn = document.getElementById('param-preview-btn');
        const stopBtn = document.getElementById('param-stop-btn');
        
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.previewMusic();
                // 显示暂停按钮
                if (stopBtn) {
                    stopBtn.classList.remove('hidden');
                    previewBtn.classList.add('hidden');
                }
            });
        }
        
        // 暂停按钮
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopMusic();
                // 显示预览按钮
                stopBtn.classList.add('hidden');
                if (previewBtn) {
                    previewBtn.classList.remove('hidden');
                }
            });
        }
        
        // 重置按钮
        const resetBtn = document.getElementById('param-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetToDefaults();
            });
        }
        
        // 提交按钮
        const submitBtn = document.getElementById('param-submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitConvergedParams();
            });
        }
    }
    
    /**
     * 设置模式
     */
    setMode(mode) {
        this.mode = mode;
        console.log(`[MusicParamController] 模式切换: ${mode}`);
    }
    
    /**
     * 检查参数是否超出安全区间
     */
    isOutOfSafeRange(param, value) {
        const range = this.safeRanges[param];
        if (!range) return false;
        return value < range.min || value > range.max;
    }
    
    /**
     * 更新警告显示
     */
    updateWarning(warningEl, show) {
        if (!warningEl) return;
        if (show) {
            warningEl.classList.remove('hidden');
        } else {
            warningEl.classList.add('hidden');
        }
    }
    
    /**
     * 更新滑动条样式（安全区间高亮）
     */
    updateSliderStyle(slider, param, value) {
        const range = this.safeRanges[param];
        if (!range || !slider) return;
        
        const min = parseInt(slider.min);
        const max = parseInt(slider.max);
        const totalRange = max - min;
        
        // 计算安全区间在滑动条上的位置百分比
        const safeStartPercent = ((range.min - min) / totalRange) * 100;
        const safeEndPercent = ((range.max - min) / totalRange) * 100;
        const currentPercent = ((value - min) / totalRange) * 100;
        
        // 使用CSS变量设置渐变背景
        slider.style.setProperty('--safe-start', safeStartPercent + '%');
        slider.style.setProperty('--safe-end', safeEndPercent + '%');
        slider.style.setProperty('--current', currentPercent + '%');
        
        // 添加/移除unsafe类
        if (this.isOutOfSafeRange(param, value)) {
            slider.classList.add('unsafe');
        } else {
            slider.classList.remove('unsafe');
        }
    }
    
    /**
     * 更新所有滑动条样式
     */
    updateAllSliderStyles() {
        const sliders = [
            { id: 'report-param-tempo', param: 'tempo' },
            { id: 'report-param-contrast', param: 'contrast' },
            { id: 'report-param-volume', param: 'volume' }
        ];
        
        sliders.forEach(({ id, param }) => {
            const slider = document.getElementById(id);
            if (slider) {
                this.updateSliderStyle(slider, param, parseInt(slider.value));
            }
        });
    }
    
    /**
     * 更新收敛摘要
     */
    updateConvergeSummary() {
        const tempoEl = document.getElementById('converge-tempo');
        const contrastEl = document.getElementById('converge-contrast');
        const volumeEl = document.getElementById('converge-volume');
        const harmonyEl = document.getElementById('converge-harmony');
        
        if (tempoEl) tempoEl.textContent = this.currentParams.tempo;
        if (contrastEl) contrastEl.textContent = this.currentParams.contrast + '%';
        if (volumeEl) volumeEl.textContent = this.currentParams.volume + '%';
        if (harmonyEl) harmonyEl.textContent = this.currentParams.harmony;
    }
    
    /**
     * 预览音乐
     */
    previewMusic() {
        console.log('[MusicParamController] 预览音乐，参数:', this.currentParams);
        
        // 应用参数到音乐生成器
        if (window.sessionConfig) {
            window.sessionConfig.rewardBpm = this.currentParams.tempo;
            window.sessionConfig.dynamicContrast = this.currentParams.contrast / 100;
            window.sessionConfig.harmonyType = this.currentParams.harmony;
            
            // 根据音量值设置音量级别
            if (this.currentParams.volume <= 50) {
                window.sessionConfig.volumeLevel = 'low';
            } else if (this.currentParams.volume <= 75) {
                window.sessionConfig.volumeLevel = 'medium';
            } else {
                window.sessionConfig.volumeLevel = 'high';
            }
        }
        
        // 如果有 popSynth，直接设置音量
        if (window.popSynth) {
            window.popSynth.setVolume(this.currentParams.volume / 100);
        }
        
        // 触发音乐播放
        const playBtn = document.getElementById('play-music-btn');
        if (playBtn) {
            playBtn.click();
        }
        
        this.isPlaying = true;
    }
    
    /**
     * 暂停音乐
     */
    stopMusic() {
        console.log('[MusicParamController] 暂停音乐');
        
        // 停止 Magenta 播放器
        if (window.rewardPlayer) {
            window.rewardPlayer.stop();
        }
        
        // 停止 popSynth
        if (window.popSynth?.stopAll) {
            window.popSynth.stopAll();
        }
        
        // 尝试停止其他可能的音频源
        if (window.Tone?.Transport) {
            window.Tone.Transport.stop();
        }
        
        this.isPlaying = false;
    }
    
    /**
     * 重置到默认值
     */
    resetToDefaults() {
        this.currentParams = {
            tempo: 72,
            contrast: 10,
            volume: 70,
            harmony: 'I-V'
        };
        
        // 更新滑动条
        const tempoSlider = document.getElementById('report-param-tempo');
        const contrastSlider = document.getElementById('report-param-contrast');
        const volumeSlider = document.getElementById('report-param-volume');
        
        if (tempoSlider) {
            tempoSlider.value = 72;
            document.getElementById('report-param-tempo-value').textContent = '72';
            this.updateSliderStyle(tempoSlider, 'tempo', 72);
        }
        
        if (contrastSlider) {
            contrastSlider.value = 10;
            document.getElementById('report-param-contrast-value').textContent = '10%';
            this.updateSliderStyle(contrastSlider, 'contrast', 10);
        }
        
        if (volumeSlider) {
            volumeSlider.value = 70;
            document.getElementById('report-param-volume-value').textContent = '70%';
            this.updateSliderStyle(volumeSlider, 'volume', 70);
        }
        
        // 重置和声选项
        const harmonyBtns = document.querySelectorAll('.harmony-btn');
        harmonyBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.value === 'I-V') {
                btn.classList.add('active');
            }
        });
        
        // 隐藏所有警告
        ['tempo-warning', 'contrast-warning', 'volume-warning', 'harmony-warning'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        
        // 更新收敛摘要
        if (this.mode === 'converge') {
            this.updateConvergeSummary();
        }
        
        console.log('[MusicParamController] 已重置到默认值');
    }
    
    /**
     * 提交收敛后的参数到数据库
     */
    async submitConvergedParams() {
        this.convergedParams = { ...this.currentParams, timestamp: Date.now() };
        
        console.log('[MusicParamController] 提交收敛参数:', this.convergedParams);
        
        // 检查是否有任何参数超出安全区间
        const warnings = [];
        if (this.isOutOfSafeRange('tempo', this.currentParams.tempo)) {
            warnings.push(`BPM (${this.currentParams.tempo}) 超出安全区间 60-80`);
        }
        if (this.isOutOfSafeRange('contrast', this.currentParams.contrast)) {
            warnings.push(`动态对比度 (${this.currentParams.contrast}%) 超出安全区间 0-20%`);
        }
        if (this.isOutOfSafeRange('volume', this.currentParams.volume)) {
            warnings.push(`音量 (${this.currentParams.volume}%) 超出安全区间 60-80%`);
        }
        if (!this.safeHarmony.includes(this.currentParams.harmony)) {
            warnings.push(`和声 (${this.currentParams.harmony}) 不在安全选项内`);
        }
        
        // 显示提交结果
        const submitBtn = document.getElementById('param-submit-btn');
        const originalText = submitBtn?.innerHTML;
        
        try {
            // TODO: 实际的数据库提交逻辑
            // const response = await fetch('/api/converged-params', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(this.convergedParams)
            // });
            
            // 模拟提交成功
            if (submitBtn) {
                submitBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    已保存（本地）
                `;
                submitBtn.classList.add('success');
            }
            
            // 触发回调
            this.onSubmit?.({ params: this.convergedParams, warnings });
            
            // 3秒后恢复按钮
            setTimeout(() => {
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.classList.remove('success');
                }
            }, 3000);
            
        } catch (error) {
            console.error('[MusicParamController] 提交失败:', error);
            if (submitBtn) {
                submitBtn.innerHTML = '提交失败';
                submitBtn.classList.add('error');
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.classList.remove('error');
                }, 3000);
            }
        }
    }
    
    /**
     * 获取当前参数
     */
    getParams() {
        return { ...this.currentParams };
    }
    
    /**
     * 获取收敛后的参数
     */
    getConvergedParams() {
        return this.convergedParams ? { ...this.convergedParams } : null;
    }
}

// 全局单例
window.musicParamController = new MusicParamController();

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保其他组件已加载
    setTimeout(() => {
        window.musicParamController.init();
    }, 100);
});

console.log('🎛️ 音乐参数控制器已加载');
