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
            density: { min: 30, max: 70, absMin: 0, absMax: 100, unit: '%' },
            duration: { min: 8, max: 20, absMin: 8, absMax: 20, unit: 's' },
        };
        
        // 安全和声选项
        this.safeHarmony = ['I-V'];
        this.allHarmonyOptions = ['I-V', 'I-IV', 'I-VI', 'I-IV-V', 'I-VI-IV-V'];
        
        // 当前参数值
        this.currentParams = {
            tempo: 72,
            contrast: 10,
            volume: 70,
            harmony: 'I-V',
            durationSec: 15,
            segmentStartSec: 0
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
        this.bindDurationAndSegment();
        this.bindActionButtons();
        this.bindDawDualSliders();
        this.updateAllSliderStyles();
        
        // Initial text update
        this.updateTexts();

        // Subscribe to language changes
        if (window.i18n) {
            window.i18n.subscribe(() => {
                this.updateTexts();
            });
        }
        
        this.initialized = true;
        console.log('[MusicParamController] 初始化完成');
    }

    t(key) {
        return window.i18n ? window.i18n.t(key) : key;
    }

     updateTexts() {
         // Mode Buttons
         const testBtn = document.getElementById('param-mode-test');
         const convergeBtn = document.getElementById('param-mode-converge');
         if (testBtn) testBtn.textContent = this.t('expert.mode.test');
         if (convergeBtn) convergeBtn.textContent = this.t('expert.mode.converge');
 
         // Expert Right panel title
         const rightPanelTitle = document.querySelector('.expert-right .expert-panel-title');
         if (rightPanelTitle) rightPanelTitle.textContent = window.i18n ? window.i18n.t('report.musicParams') : 'Music Parameters';

        // Labels with Safe Range
        const labels = document.querySelectorAll('.music-params-grid label');
        if (labels.length >= 5) {
            // labels[0] = Tempo (BPM)
            const tempoLabel = labels[0];
            if (tempoLabel) {
                const span = tempoLabel.querySelector('span:first-child');
                if (span) {
                    span.innerHTML = `${this.t('expert.tempo')} <span class="param-safe-range">${this.t('expert.safeRange')}60-80</span>`;
                }
                const warning = tempoLabel.querySelector('.param-warning-badge');
                if (warning) warning.textContent = this.t('expert.warning.unsafe');
            }

            // labels[1] = 动态对比度
            const contrastLabel = labels[1];
            if (contrastLabel) {
                const span = contrastLabel.querySelector('span:first-child');
                if (span) {
                    span.innerHTML = `${this.t('expert.contrast')} <span class="param-safe-range">${this.t('expert.safeRange')}0-20%</span>`;
                }
                const warning = contrastLabel.querySelector('.param-warning-badge');
                if (warning) warning.textContent = this.t('expert.warning.unsafe');
            }

            // labels[2] = 音量
            const volumeLabel = labels[2];
            if (volumeLabel) {
                const span = volumeLabel.querySelector('span:first-child');
                if (span) {
                    span.innerHTML = `${this.t('expert.volume')} <span class="param-safe-range">${this.t('expert.safeRange')}60-80%</span>`;
                }
                const warning = volumeLabel.querySelector('.param-warning-badge');
                if (warning) warning.textContent = this.t('expert.warning.unsafe');
            }
            
            // labels[3] = 奖励时长
            const durationLabel = labels[3];
            if (durationLabel) {
                const span = durationLabel.querySelector('span:first-child');
                if (span) {
                    span.innerHTML = `${this.t('expert.duration')} <span class="param-safe-range">${this.t('expert.safeRange')}8-20s</span>`;
                }
            }

            // labels[4] = 音乐
            const harmonyLabel = labels[4];
            if (harmonyLabel) {
                const span = harmonyLabel.querySelector('span:first-child');
                if (span) {
                    span.textContent = this.t('expert.harmony');
                }
                const warning = harmonyLabel.querySelector('.param-warning-badge');
                if (warning) warning.textContent = this.t('expert.warning.unsafe');
            }
        }

        // Action Buttons
        const previewBtn = document.getElementById('param-preview-btn');
        if (previewBtn) {
            const icon = previewBtn.querySelector('svg');
            previewBtn.innerHTML = '';
            if (icon) previewBtn.appendChild(icon.cloneNode(true));
            previewBtn.appendChild(document.createTextNode(' ' + this.t('expert.btn.preview')));
        }

        const stopBtn = document.getElementById('param-stop-btn');
        if (stopBtn) {
            const icon = stopBtn.querySelector('svg');
            stopBtn.innerHTML = '';
            if (icon) stopBtn.appendChild(icon.cloneNode(true));
            stopBtn.appendChild(document.createTextNode(' ' + this.t('expert.btn.stop')));
        }

        const resetBtn = document.getElementById('param-reset-btn');
        if (resetBtn) {
            const icon = resetBtn.querySelector('svg');
            resetBtn.innerHTML = '';
            if (icon) resetBtn.appendChild(icon.cloneNode(true));
            resetBtn.appendChild(document.createTextNode(' ' + this.t('expert.btn.reset')));
        }

        // Converge Section
        const convergeTitle = document.querySelector('.converge-title');
        if (convergeTitle) {
            const icon = convergeTitle.querySelector('svg');
            convergeTitle.innerHTML = '';
            if (icon) convergeTitle.appendChild(icon.cloneNode(true));
            convergeTitle.appendChild(document.createTextNode(' ' + this.t('expert.setSafeRange')));
        }

        // Converge Labels
        const convergeHeaders = document.querySelectorAll('.daw-range-header label');
        if (convergeHeaders.length >= 4) {
            convergeHeaders[0].textContent = 'BPM'; // Usually standard
            convergeHeaders[1].textContent = this.t('expert.contrast').replace('Dynamic ', ''); // Shorten
            convergeHeaders[2].textContent = this.t('expert.volume');
            convergeHeaders[3].textContent = this.t('expert.harmony').split(' ')[0]; // Shorten
        }

        // Save Button (only if not in success/error state)
        const submitBtn = document.getElementById('param-submit-btn');
        if (submitBtn && !submitBtn.classList.contains('success') && !submitBtn.classList.contains('error')) {
            const icon = submitBtn.querySelector('svg');
            submitBtn.innerHTML = '';
            if (icon) submitBtn.appendChild(icon.cloneNode(true));
            submitBtn.appendChild(document.createTextNode('\n                                                    ' + this.t('expert.btn.save') + '\n                                                '));
        }

        // Submit Note
        const submitNote = document.querySelector('.submit-note');
        if (submitNote) {
            submitNote.textContent = this.t('expert.dbNotConfigured');
        }
        
        // Segment labels
        const segLabel = document.getElementById('segment-label');
        const segTip = document.querySelector('.segment-tip');
        const durationWarning = document.getElementById('duration-warning');
        if (segLabel) segLabel.textContent = this.t('expert.segment');
        if (segTip) segTip.textContent = this.t('expert.segment.tip');
    }
    
    bindDurationAndSegment() {
        const durValue = document.getElementById('report-param-duration-value');
        const segStartSlider = document.getElementById('segment-start-slider');
        const segEndSlider = document.getElementById('segment-end-slider');
        const segStartValue = document.getElementById('segment-start-value');
        const segEndValue = document.getElementById('segment-end-value');
        const segCanvas = document.getElementById('segment-canvas');
        const segLabel = document.getElementById('segment-label');
        const segTip = document.querySelector('.segment-tip');
        if (segLabel) segLabel.textContent = this.t('expert.segment');
        if (segTip) segTip.textContent = this.t('expert.segment.tip');
        
        const drawSegment = () => {
            if (!segCanvas) return;
            const ctx = segCanvas.getContext('2d');
            const w = segCanvas.width;
            const h = segCanvas.height;
            const spectrumH = h - 28; // 频谱图高度，留出底部刻度空间
            
            ctx.clearRect(0, 0, w, h);
            
            // 背景
            ctx.fillStyle = '#fafbfc';
            ctx.fillRect(0, 0, w, h);
            
            // 简单波形（根据 lastGeneratedSequence 画力度条，否则画占位）
            const seq = window.lastGeneratedSequence;
            if (seq && Array.isArray(seq.notes) && seq.notes.length) {
                ctx.fillStyle = '#c7d2fe';
                const total = Math.max(seq.totalTime || 0, 20);
                const buckets = 100;
                const energy = new Array(buckets).fill(0);
                seq.notes.forEach(n => {
                    const startIdx = Math.floor((n.startTime / total) * buckets);
                    const endIdx = Math.floor((n.endTime / total) * buckets);
                    for (let i = startIdx; i <= endIdx && i < buckets; i++) {
                        energy[i] += (n.velocity || 80);
                    }
                });
                for (let i = 0; i < buckets; i++) {
                    const x = (i / buckets) * w;
                    const barH = Math.min(spectrumH - 4, (energy[i] / 400) * (spectrumH - 4));
                    ctx.fillRect(x, spectrumH - barH, w / buckets - 1, barH);
                }
            } else {
                ctx.fillStyle = '#e0e7ff';
                for (let i = 0; i < 100; i++) {
                    const x = (i / 100) * w;
                    const barH = (Math.sin(i * 0.2) * 0.5 + 0.5) * (spectrumH * 0.6) + 10;
                    ctx.fillRect(x, spectrumH - barH, w / 100 - 1, barH);
                }
            }
            
            // 选中片段高亮
            const start = this.currentParams.segmentStartSec;
            const end = this.currentParams.segmentEndSec;
            const startX = (start / 20) * w;
            const endX = (end / 20) * w;
            ctx.fillStyle = 'rgba(99,102,241,0.15)';
            ctx.fillRect(startX, 0, Math.max(2, endX - startX), spectrumH);
            
            // 边界线（主题色渐变，紧贴频谱图）
            const gradient = ctx.createLinearGradient(0, 0, 0, spectrumH);
            gradient.addColorStop(0, '#818cf8');
            gradient.addColorStop(1, '#6366f1');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(startX, 0);
            ctx.lineTo(startX, spectrumH);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(endX, 0);
            ctx.lineTo(endX, spectrumH);
            ctx.stroke();
            
            // 边界手柄（主题色三角形，紧贴频谱图底部）
            const handleY = spectrumH;
            const handleSize = 8;
            
            // 左边界手柄
            ctx.fillStyle = '#6366f1';
            ctx.beginPath();
            ctx.moveTo(startX, handleY);
            ctx.lineTo(startX - handleSize, handleY + handleSize + 2);
            ctx.lineTo(startX + handleSize, handleY + handleSize + 2);
            ctx.closePath();
            ctx.fill();
            
            // 右边界手柄
            ctx.beginPath();
            ctx.moveTo(endX, handleY);
            ctx.lineTo(endX - handleSize, handleY + handleSize + 2);
            ctx.lineTo(endX + handleSize, handleY + handleSize + 2);
            ctx.closePath();
            ctx.fill();
            
            // 时间刻度线（在频谱图底部）
            const rulerY = spectrumH + 12;
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, rulerY);
            ctx.lineTo(w, rulerY);
            ctx.stroke();
            
            // 时间刻度标签（8s, 12s, 15s, 20s）
            ctx.fillStyle = '#6b7280';
            ctx.font = '11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            
            const keyTimes = [0, 8, 12, 15, 20];
            keyTimes.forEach(t => {
                const tx = (t / 20) * w;
                // 刻度线
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(tx, rulerY - 3);
                ctx.lineTo(tx, rulerY + 3);
                ctx.stroke();
                // 刻度文字
                ctx.fillText(`${t}s`, tx, rulerY + 14);
            });
            
            ctx.textAlign = 'left'; // 重置
        };
        
        const updateComputedDuration = () => {
            const dur = Math.max(8, Math.min(20, this.currentParams.segmentEndSec - this.currentParams.segmentStartSec));
            this.currentParams.durationSec = dur;
            if (durValue) durValue.textContent = `${dur}s`;
        };
        
        const enforceBounds = (source) => {
            let start = this.currentParams.segmentStartSec;
            let end = this.currentParams.segmentEndSec;
            const durSafe = this.convergedParams?.duration || this.safeRanges.duration;
            if (end - start < 8) {
                if (source === 'start') {
                    end = Math.min(20, start + 8);
                } else {
                    start = Math.max(0, end - 8);
                }
            }
            start = Math.max(0, Math.min(start, 20));
            end = Math.max(durSafe.min, Math.min(end, durSafe.max));
            if (start >= end) {
                end = Math.min(20, start + 8);
            }
            this.currentParams.segmentStartSec = start;
            this.currentParams.segmentEndSec = end;
            if (segStartSlider) segStartSlider.max = String(Math.max(0, end - 8));
            if (segEndSlider) {
                segEndSlider.min = String(Math.min(durSafe.max, Math.max(durSafe.min, start + 8)));
                segEndSlider.max = String(durSafe.max);
            }
            if (segStartSlider) segStartSlider.value = String(start);
            if (segEndSlider) segEndSlider.value = String(end);
            if (segStartValue) segStartValue.textContent = `${start.toFixed(1)}s`;
            if (segEndValue) segEndValue.textContent = `${end.toFixed(1)}s`;
            const isUnsafe = end > durSafe.max || end < durSafe.min;
            const selector = document.querySelector('.segment-selector');
            if (isUnsafe) {
                selector?.classList.add('unsafe');
                durationWarning?.classList.remove('hidden');
                durationWarning && (durationWarning.style.cssText = 'display:inline-block !important;');
            } else {
                selector?.classList.remove('unsafe');
                durationWarning?.classList.add('hidden');
                durationWarning && (durationWarning.style.cssText = '');
            }
            updateComputedDuration();
            drawSegment();
        };
        
        if (segStartSlider && segStartValue) {
            segStartSlider.addEventListener('input', (e) => {
                const v = parseFloat(e.target.value);
                this.currentParams.segmentStartSec = Math.max(0, Math.min(20, v));
                enforceBounds('start');
                try { localStorage.setItem('expert.segmentStartSec', String(this.currentParams.segmentStartSec)); } catch {}
            });
        }
        if (segEndSlider && segEndValue) {
            segEndSlider.addEventListener('input', (e) => {
                const v = parseFloat(e.target.value);
                this.currentParams.segmentEndSec = Math.max(8, Math.min(20, v));
                enforceBounds('end');
                try { localStorage.setItem('expert.segmentEndSec', String(this.currentParams.segmentEndSec)); } catch {}
            });
        }
        // 重置右界
        const segReset = document.getElementById('segment-reset-btn');
        if (segReset) {
            segReset.addEventListener('click', () => {
                const durSafe = this.convergedParams?.duration || this.safeRanges.duration;
                this.currentParams.segmentEndSec = Math.min(durSafe.max, 15);
                enforceBounds('end');
            });
        }
        // 初始化
        const savedStart = parseFloat(localStorage.getItem('expert.segmentStartSec') || '0');
        const savedEnd = parseFloat(localStorage.getItem('expert.segmentEndSec') || '15');
        this.currentParams.segmentStartSec = Math.max(0, Math.min(20, savedStart));
        this.currentParams.segmentEndSec = Math.max(8, Math.min(20, savedEnd));
        enforceBounds('init');
        
        drawSegment();
    }
    
    /**
     * 绑定模式切换按钮
     */
    bindModeToggle() {
        const testBtn = document.getElementById('param-mode-test');
        const convergeBtn = document.getElementById('param-mode-converge');
        const convergeArea = document.getElementById('converge-submit-area');
        const paramsGrid = document.querySelector('.music-params-grid');
        const paramActions = document.querySelector('.param-actions');
        
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.setMode('test');
                testBtn.classList.add('active');
                convergeBtn?.classList.remove('active');
                convergeArea?.classList.add('hidden');
                // 显示测试模式的滑动条和操作按钮
                paramsGrid?.classList.remove('hidden');
                paramActions?.classList.remove('hidden');
                // 隐藏测试模式的奖励时长 label 栏
                document.getElementById('duration-param-item')?.classList.add('hidden');
            });
        }
        
        if (convergeBtn) {
            convergeBtn.addEventListener('click', () => {
                this.setMode('converge');
                convergeBtn.classList.add('active');
                testBtn?.classList.remove('active');
                convergeArea?.classList.remove('hidden');
                // 隐藏测试模式的滑动条和操作按钮
                paramsGrid?.classList.add('hidden');
                paramActions?.classList.add('hidden');
                // 收敛模式保留奖励时长 label 栏
                document.getElementById('duration-param-item')?.classList.remove('hidden');
                this.updateConvergeSummary();
                // 播放收敛动画
                setTimeout(() => this.playConvergeAnimation(), 50);
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
            { id: 'report-param-volume', param: 'volume', valueId: 'report-param-volume-value', warningId: 'volume-warning' },
            { id: 'report-param-density', param: 'density', valueId: 'report-param-density-value', warningId: 'density-warning' }
        ];
        
        sliders.forEach(({ id, param, valueId, warningId }) => {
            const slider = document.getElementById(id);
            const valueEl = document.getElementById(valueId);
            let warningEl = document.getElementById(warningId);
            
            if (!slider) {
                console.warn(`[MusicParamController] 滑动条 ${id} 不存在`);
                return;
            }
            
            if (!warningEl) {
                console.warn(`[MusicParamController] 警告元素 ${warningId} 不存在，尝试创建`);
                const item = slider.closest('.param-item');
                const labelEl = item?.querySelector('label');
                if (labelEl) {
                    warningEl = document.createElement('span');
                    warningEl.id = warningId;
                    warningEl.className = 'param-warning-badge hidden';
                    warningEl.textContent = this.t('expert.warning.unsafe');
                    labelEl.appendChild(warningEl);
                }
            }
            
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
                console.log(`[MusicParamController] ${param} = ${value}, 超出安全区间: ${isUnsafe}`);
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
            // 初始化警告状态
            const initialValue = parseInt(slider.value);
            const isUnsafe = this.isOutOfSafeRange(param, initialValue);
            this.updateWarning(warningEl, isUnsafe);
            console.log(`[MusicParamController] 初始化 ${param}: 值=${initialValue}, 超出安全区间=${isUnsafe}, 警告元素存在=${!!warningEl}`);
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
            });
        }
        
        // 暂停按钮
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopMusic();
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
        
        // 收敛模式和声按钮组
        const harmonyBtnsContainer = document.getElementById('converge-harmony-btns');
        if (harmonyBtnsContainer) {
            const btns = harmonyBtnsContainer.querySelectorAll('.converge-harmony-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    btn.classList.toggle('selected');
                });
            });
        }
    }
    
    /**
     * 设置模式
     */
    setMode(mode) {
        this.mode = mode;
        console.log(`[MusicParamController] 模式切换: ${mode}`);
        if (mode === 'converge') {
            // 将测试模式的片段与时长范围迁移到收敛模式的双滑块
            const durRange = this.testDurationRange || { min: Math.max(8, this.currentParams.durationSec - 2), max: Math.min(20, this.currentParams.durationSec + 2) };
            const durMinSlider = document.getElementById('converge-duration-min');
            const durMaxSlider = document.getElementById('converge-duration-max');
            const durTrackFill = document.querySelector('.daw-dual-slider[data-param="duration"][data-scope="converge"] .daw-track-fill');
            if (durMinSlider && durMaxSlider && durTrackFill) {
                durMinSlider.value = String(durRange.min);
                durMaxSlider.value = String(durRange.max);
                const rangeMin = 8, rangeMax = 20, range = rangeMax - rangeMin;
                durTrackFill.style.left = (((durRange.min - rangeMin) / range) * 100) + '%';
                durTrackFill.style.right = (100 - ((durRange.max - rangeMin) / range) * 100) + '%';
                const minValEl = document.getElementById('converge-duration-min-val');
                const maxValEl = document.getElementById('converge-duration-max-val');
                if (minValEl) minValEl.textContent = durRange.min;
                if (maxValEl) maxValEl.textContent = durRange.max;
                this.convergedDuration = { ...durRange };
            }
            this.updateConvergeSummary();
        }
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
        if (!warningEl) {
            console.warn('[MusicParamController] 警告元素不存在');
            return;
        }
        if (show) {
            warningEl.classList.remove('hidden');
            // 强制显示，使用 cssText 覆盖 !important
            warningEl.style.cssText = 'display: inline-block !important;';
        } else {
            warningEl.classList.add('hidden');
            warningEl.style.cssText = '';
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
        const isUnsafe = this.isOutOfSafeRange(param, value);
        const item = slider.closest('.param-item');
        if (isUnsafe) {
            slider.classList.add('unsafe');
            if (item) item.classList.add('unsafe');
        } else {
            slider.classList.remove('unsafe');
            if (item) item.classList.remove('unsafe');
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
        const durationMinEl = document.getElementById('converge-duration-min-val');
        const durationMaxEl = document.getElementById('converge-duration-max-val');
        
        if (tempoEl) tempoEl.textContent = this.currentParams.tempo;
        if (contrastEl) contrastEl.textContent = this.currentParams.contrast + '%';
        if (volumeEl) volumeEl.textContent = this.currentParams.volume + '%';
        if (harmonyEl) harmonyEl.textContent = this.currentParams.harmony;
        if (durationMinEl && this.convergedDuration) durationMinEl.textContent = this.convergedDuration.min;
        if (durationMaxEl && this.convergedDuration) durationMaxEl.textContent = this.convergedDuration.max;
    }
    
    /**
     * 预览音乐
     */
    previewMusic() {
        console.log('[MusicParamController] 预览音乐，参数:', this.currentParams);
        if (this.mode !== 'test') {
            console.warn('[MusicParamController] 仅测试模式允许预览范围内的音乐');
            return;
        }
        
        // 应用参数到音乐生成器
        if (window.sessionConfig) {
            window.sessionConfig.rewardBpm = this.currentParams.tempo;
            window.sessionConfig.dynamicContrast = this.currentParams.contrast / 100;
            window.sessionConfig.harmonyType = this.currentParams.harmony;
            const baseDuration = Math.max(8, Math.min(20, (this.currentParams.segmentEndSec ?? 15) - (this.currentParams.segmentStartSec ?? 0)));
            const finalDuration = this.testDurationRange
                ? Math.max(this.testDurationRange.min, Math.min(this.testDurationRange.max, baseDuration))
                : baseDuration;
            window.sessionConfig.segmentStartSec = this.currentParams.segmentStartSec ?? 0;
            window.sessionConfig.segmentEndSec = this.currentParams.segmentEndSec ?? (window.sessionConfig.segmentStartSec + finalDuration);
            window.sessionConfig.rewardDurationSec = finalDuration;
            
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
            harmony: 'I-V',
            durationSec: 15,
            segmentStartSec: 0,
            segmentEndSec: 15
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
        
        // 隐藏所有警告（使用 updateWarning 方法确保一致性）
        ['tempo-warning', 'contrast-warning', 'volume-warning', 'harmony-warning'].forEach(id => {
            const el = document.getElementById(id);
            this.updateWarning(el, false);
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
        // 收集上下界参数
        const tempoMin = parseInt(document.getElementById('converge-tempo-min')?.value) || 60;
        const tempoMax = parseInt(document.getElementById('converge-tempo-max')?.value) || 80;
        const contrastMin = parseInt(document.getElementById('converge-contrast-min')?.value) || 0;
        const contrastMax = parseInt(document.getElementById('converge-contrast-max')?.value) || 20;
        const volumeMin = parseInt(document.getElementById('converge-volume-min')?.value) || 60;
        const volumeMax = parseInt(document.getElementById('converge-volume-max')?.value) || 80;
        const durationMin = parseInt(document.getElementById('converge-duration-min')?.value) || 8;
        const durationMax = parseInt(document.getElementById('converge-duration-max')?.value) || 20;
        
        // 收集安全和声选项（从按钮组）
        const harmonyBtnsContainer = document.getElementById('converge-harmony-btns');
        const safeHarmonies = harmonyBtnsContainer 
            ? Array.from(harmonyBtnsContainer.querySelectorAll('.converge-harmony-btn.selected')).map(btn => btn.dataset.value)
            : ['I-V'];
        
        this.convergedParams = {
            tempo: { min: tempoMin, max: tempoMax },
            contrast: { min: contrastMin, max: contrastMax },
            volume: { min: volumeMin, max: volumeMax },
            duration: { min: durationMin, max: durationMax },
            safeHarmonies,
            timestamp: Date.now()
        };
        
        console.log('[MusicParamController] 提交收敛参数:', this.convergedParams);
        
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
                    ${this.t('expert.msg.saved')}
                `;
                submitBtn.classList.add('success');
            }
            
            // 触发回调
            this.onSubmit?.({ params: this.convergedParams });
            
            // 3秒后恢复按钮
            setTimeout(() => {
                if (submitBtn) {
                    const icon = submitBtn.querySelector('svg'); // Re-query or reuse? Better to rebuild or use originalText if it was just text.
                    // But originalText was captured. However, updateTexts might have changed it if language changed.
                    // Safest is to call updateTexts() or restore a generic state. 
                    // Let's rely on updateTexts() being called or just restore icon + text.
                    // Actually originalText might be stale if language changed during the 3s.
                    // Let's just set the class and let the next updateTexts handle it or manually reset.
                    submitBtn.classList.remove('success');
                    
                    // Manually restore to "Save" state
                    submitBtn.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline></svg>
                        ${this.t('expert.btn.save')}
                    `;
                }
            }, 3000);
            
        } catch (error) {
            console.error('[MusicParamController] 提交失败:', error);
            if (submitBtn) {
                submitBtn.innerHTML = this.t('expert.msg.failed');
                submitBtn.classList.add('error');
                setTimeout(() => {
                    submitBtn.classList.remove('error');
                    submitBtn.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline></svg>
                        ${this.t('expert.btn.save')}
                    `;
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
    
    /**
     * 绑定DAW风格双滑块
     */
    bindDawDualSliders() {
        const sliders = document.querySelectorAll('.daw-dual-slider');
        
        sliders.forEach(container => {
            const minSlider = container.querySelector('.daw-thumb-min');
            const maxSlider = container.querySelector('.daw-thumb-max');
            const trackFill = container.querySelector('.daw-track-fill');
            const param = container.dataset.param;
            const scope = container.dataset.scope || 'converge';
            const rangeMin = parseInt(container.dataset.min);
            const rangeMax = parseInt(container.dataset.max);
            
            if (!minSlider || !maxSlider || !trackFill) return;
            
            const minValEl = document.getElementById(`converge-${param}-min-val`);
            const maxValEl = document.getElementById(`converge-${param}-max-val`);
            
            const updateTrackFill = () => {
                const minVal = parseInt(minSlider.value);
                const maxVal = parseInt(maxSlider.value);
                const range = rangeMax - rangeMin;
                
                const leftPercent = ((minVal - rangeMin) / range) * 100;
                const rightPercent = 100 - ((maxVal - rangeMin) / range) * 100;
                
                trackFill.style.left = leftPercent + '%';
                trackFill.style.right = rightPercent + '%';
                
                // 更新数值显示
                if (minValEl) minValEl.textContent = minVal;
                if (maxValEl) maxValEl.textContent = maxVal;
                
                // 记录范围
                if (param === 'duration') {
                    if (scope === 'converge') {
                        this.convergedDuration = { min: minVal, max: maxVal };
                    } else {
                        this.testDurationRange = { min: minVal, max: maxVal };
                    }
                }
            };
            
            // 确保min不超过max
            minSlider.addEventListener('input', () => {
                const minVal = parseInt(minSlider.value);
                const maxVal = parseInt(maxSlider.value);
                if (minVal > maxVal) {
                    minSlider.value = maxVal;
                }
                updateTrackFill();
            });
            
            // 确保max不小于min
            maxSlider.addEventListener('input', () => {
                const minVal = parseInt(minSlider.value);
                const maxVal = parseInt(maxSlider.value);
                if (maxVal < minVal) {
                    maxSlider.value = minVal;
                }
                updateTrackFill();
            });
            
            // 初始化
            updateTrackFill();
        });
        
        // 绑定DAW和声按钮
        const harmonyBtns = document.querySelectorAll('.daw-harmony-btn');
        harmonyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('selected');
            });
        });
    }
    
    /**
     * 播放收敛动画
     */
    playConvergeAnimation() {
        const sliders = document.querySelectorAll('.daw-dual-slider');
        
        sliders.forEach(container => {
            const trackFill = container.querySelector('.daw-track-fill');
            const minSlider = container.querySelector('.daw-thumb-min');
            const maxSlider = container.querySelector('.daw-thumb-max');
            const param = container.dataset.param;
            const rangeMin = parseInt(container.dataset.min);
            const rangeMax = parseInt(container.dataset.max);
            
            if (!trackFill || !minSlider || !maxSlider) return;
            
            // 获取安全区间
            const safeRange = this.safeRanges[param];
            if (!safeRange) return;
            
            const range = rangeMax - rangeMin;
            const targetLeft = ((safeRange.min - rangeMin) / range) * 100;
            const targetRight = 100 - ((safeRange.max - rangeMin) / range) * 100;
            
            // 设置CSS变量用于动画
            trackFill.style.setProperty('--converge-left', targetLeft + '%');
            trackFill.style.setProperty('--converge-right', targetRight + '%');
            
            // 先设置为全开状态
            trackFill.style.left = '0%';
            trackFill.style.right = '0%';
            
            // 触发动画
            trackFill.classList.add('animating');
            
            // 动画结束后更新滑块位置
            setTimeout(() => {
                trackFill.classList.remove('animating');
                minSlider.value = safeRange.min;
                maxSlider.value = safeRange.max;
                trackFill.style.left = targetLeft + '%';
                trackFill.style.right = targetRight + '%';
                
                // 更新数值显示
                const minValEl = document.getElementById(`converge-${param}-min-val`);
                const maxValEl = document.getElementById(`converge-${param}-max-val`);
                if (minValEl) minValEl.textContent = safeRange.min;
                if (maxValEl) maxValEl.textContent = safeRange.max;
            }, 400);
        });
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
