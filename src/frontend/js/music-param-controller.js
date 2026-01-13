/**
 * 闊充箰鍙傛暟璋冩暣鎺у埗锟?
 * 鏀寔娴嬭瘯妯″紡鍜屾敹鏁涙ā寮忥紝鐢ㄤ簬涓撳璋冩暣闊充箰鍙傛暟骞舵敹鏁涘畨鍏ㄥ尯锟?
 */
class MusicParamController {
    constructor() {
        // 妯″紡: 'test' | 'converge'
        this.mode = 'test';
        
        // 榛樿瀹夊叏鍖洪棿瀹氫箟
        this.safeRanges = {
            tempo: { min: 60, max: 80, absMin: 40, absMax: 120, unit: 'BPM' },
            contrast: { min: 0, max: 20, absMin: 0, absMax: 50, unit: '%' },
            volume: { min: 60, max: 80, absMin: 0, absMax: 100, unit: '%' },
            density: { min: 30, max: 70, absMin: 0, absMax: 100, unit: '%' },
            duration: { min: 8, max: 20, absMin: 8, absMax: 20, unit: 's' },
        };
        
        // 瀹夊叏鍜屽０閫夐」
        this.safeHarmony = ['I-V'];
        this.allHarmonyOptions = ['I-V', 'I-IV', 'I-VI', 'I-IV-V', 'I-VI-IV-V'];
        
        // 褰撳墠鍙傛暟锟?
        this.currentParams = {
            tempo: 72,
            contrast: 10,
            volume: 70,
            harmony: 'I-V',
            instrument: 'piano',
            durationSec: 15,
            segmentStartSec: 0
        };
        
        // 鏀舵暃鍚庣殑鍙傛暟锛堢敤浜庢彁浜ゅ埌鏁版嵁搴擄級
        this.convergedParams = null;
        
        // 鍥炶皟
        this.onParamChange = null;
        this.onWarning = null;
        this.onSubmit = null;
        
        // 鎾斁鐘讹拷?
        this.isPlaying = false;
        
        this.initialized = false;
    }
    
    /**
     * 鍒濆鍖栨帶鍒跺櫒
     */
    init() {
        if (this.initialized) return;
        
        this.bindModeToggle();
        this.bindSliders();
        this.bindHarmonyOptions();
        this.bindInstrumentOptions();
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
        console.log('[MusicParamController] 鍒濆鍖栧畬锟?);
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

        // Labels with Safe Range (鐜板湪鍙湁4锟? Tempo, Contrast, Volume, Harmony)
        const labels = document.querySelectorAll('.music-params-grid label');
        if (labels.length >= 4) {
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

            // labels[1] = 鍔ㄦ€佸姣斿害
            const contrastLabel = labels[1];
            if (contrastLabel) {
                const span = contrastLabel.querySelector('span:first-child');
                if (span) {
                    span.innerHTML = `${this.t('expert.contrast')} <span class="param-safe-range">${this.t('expert.safeRange')}0-20%</span>`;
                }
                const warning = contrastLabel.querySelector('.param-warning-badge');
                if (warning) warning.textContent = this.t('expert.warning.unsafe');
            }

            // labels[2] = 闊抽噺
            const volumeLabel = labels[2];
            if (volumeLabel) {
                const span = volumeLabel.querySelector('span:first-child');
                if (span) {
                    span.innerHTML = `${this.t('expert.volume')} <span class="param-safe-range">${this.t('expert.safeRange')}60-80%</span>`;
                }
                const warning = volumeLabel.querySelector('.param-warning-badge');
                if (warning) warning.textContent = this.t('expert.warning.unsafe');
            }

            // labels[3] = 闊充箰
            const harmonyLabel = labels[3];
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
            if (!segCanvas) {
                console.warn('[Segment] Canvas not found');
                return;
            }
            const ctx = segCanvas.getContext('2d');
            
            // 鑾峰彇canvas鐨凜SS鏄剧ず灏哄
            const rect = segCanvas.getBoundingClientRect();
            let displayWidth = rect.width;
            let displayHeight = rect.height;
            
            // 濡傛灉灏哄锟?锛屼娇鐢ㄩ粯璁ゅ€煎苟绋嶅悗閲嶈瘯
            if (displayWidth < 10 || displayHeight < 10) {
                displayWidth = 500;
                displayHeight = 120;
                // 寤惰繜閲嶇粯
                setTimeout(() => drawSegment(), 100);
            }
            
            // 璁剧疆canvas鐨勫疄闄呭儚绱犲昂锟?
            segCanvas.width = Math.floor(displayWidth);
            segCanvas.height = Math.floor(displayHeight);
            
            const w = segCanvas.width;
            const h = segCanvas.height;
            const spectrumH = h - 28; // 棰戣氨鍥鹃珮搴︼紝鐣欏嚭搴曢儴鍒诲害绌洪棿
            
            // 鑳屾櫙
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, w, h);
            
            // 缁樺埗娉㈠舰锛堝崰浣嶆垨鐪熷疄鏁版嵁锟?
            const seq = window.lastGeneratedSequence;
            ctx.fillStyle = '#c7d2fe';
            
            if (seq && Array.isArray(seq.notes) && seq.notes.length) {
                const total = Math.max(seq.totalTime || 20, 20);
                const buckets = 80;
                const energy = new Array(buckets).fill(0);
                seq.notes.forEach(n => {
                    const startIdx = Math.floor((n.startTime / total) * buckets);
                    const endIdx = Math.floor((n.endTime / total) * buckets);
                    for (let i = startIdx; i <= endIdx && i < buckets; i++) {
                        energy[i] += (n.velocity || 80);
                    }
                });
                const barWidth = w / buckets;
                for (let i = 0; i < buckets; i++) {
                    const x = i * barWidth;
                    const barH = Math.min(spectrumH - 4, (energy[i] / 300) * (spectrumH - 4)) || 5;
                    ctx.fillRect(x, spectrumH - barH, barWidth - 2, barH);
                }
            } else {
                // 鍗犱綅娉㈠舰 - 妯℃嫙闊抽娉㈠舰
                const barCount = 60;
                const barWidth = w / barCount;
                for (let i = 0; i < barCount; i++) {
                    const x = i * barWidth;
                    // 浣跨敤澶氫釜姝ｅ鸡娉㈠彔鍔犳ā鎷熺湡瀹炴尝锟?
                    const noise = Math.sin(i * 0.3) * 0.3 + Math.sin(i * 0.7) * 0.2 + Math.sin(i * 0.1) * 0.4;
                    const barH = (noise * 0.5 + 0.5) * (spectrumH * 0.6) + 15;
                    ctx.fillRect(x + 1, spectrumH - barH, barWidth - 2, barH);
                }
            }
            
            // 閫変腑鐗囨楂樹寒
            const start = this.currentParams.segmentStartSec || 0;
            const end = this.currentParams.segmentEndSec || 15;
            const startX = (start / 20) * w;
            const endX = (end / 20) * w;
            
            ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
            ctx.fillRect(startX, 0, Math.max(2, endX - startX), spectrumH);
            
            // 杈圭晫锟?
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startX, 0);
            ctx.lineTo(startX, spectrumH);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(endX, 0);
            ctx.lineTo(endX, spectrumH);
            ctx.stroke();
            
            // 杈圭晫鎵嬫焺锛堜笁瑙掑舰锟?
            ctx.fillStyle = '#6366f1';
            const handleSize = 6;
            
            // 宸︽墜锟?
            ctx.beginPath();
            ctx.moveTo(startX, spectrumH);
            ctx.lineTo(startX - handleSize, spectrumH + handleSize + 2);
            ctx.lineTo(startX + handleSize, spectrumH + handleSize + 2);
            ctx.closePath();
            ctx.fill();
            
            // 鍙虫墜锟?
            ctx.beginPath();
            ctx.moveTo(endX, spectrumH);
            ctx.lineTo(endX - handleSize, spectrumH + handleSize + 2);
            ctx.lineTo(endX + handleSize, spectrumH + handleSize + 2);
            ctx.closePath();
            ctx.fill();
            
            // 鏃堕棿鍒诲害
            const rulerY = spectrumH + 16;
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, rulerY);
            ctx.lineTo(w, rulerY);
            ctx.stroke();
            
            ctx.fillStyle = '#9ca3af';
            ctx.font = '10px system-ui, sans-serif';
            ctx.textAlign = 'center';
            
            [0, 8, 12, 15, 20].forEach(t => {
                const tx = (t / 20) * w;
                ctx.strokeStyle = '#d1d5db';
                ctx.beginPath();
                ctx.moveTo(tx, rulerY - 3);
                ctx.lineTo(tx, rulerY + 3);
                ctx.stroke();
                ctx.fillText(`${t}s`, tx, rulerY + 14);
            });
            
            ctx.textAlign = 'left';
        };
        this.drawSegment = drawSegment;
        try {
            window.addEventListener('sequence:updated', () => this.drawSegment());
        } catch {}
        
        const updateComputedDuration = () => {
            const dur = Math.max(8, Math.min(20, this.currentParams.segmentEndSec - this.currentParams.segmentStartSec));
            this.currentParams.durationSec = dur;
            if (durValue) durValue.textContent = `${dur}s`;
        };
        
        const enforceBounds = (source) => {
            let start = this.currentParams.segmentStartSec;
            let end = this.currentParams.segmentEndSec;
            const durSafe = this.convergedParams?.duration || this.safeRanges?.duration || { min: 8, max: 20 };
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
        // 閲嶇疆鍙崇晫
        const segReset = document.getElementById('segment-reset-btn');
        if (segReset) {
            segReset.addEventListener('click', () => {
                const durSafe = this.convergedParams?.duration || this.safeRanges.duration;
                this.currentParams.segmentEndSec = Math.min(durSafe.max, 15);
                enforceBounds('end');
            });
        }
        // 鍒濆锟?
        const savedStart = parseFloat(localStorage.getItem('expert.segmentStartSec') || '0');
        const savedEnd = parseFloat(localStorage.getItem('expert.segmentEndSec') || '15');
        this.currentParams.segmentStartSec = Math.max(0, Math.min(20, savedStart));
        this.currentParams.segmentEndSec = Math.max(8, Math.min(20, savedEnd));
        enforceBounds('init');
        
        // 鏆撮湶drawSegment鍒板疄渚嬶紝浠ヤ究澶栭儴璋冪敤
        this.drawSegment = drawSegment;
        
        // 鍒濆缁樺埗
        drawSegment();
        
        // 寤惰繜閲嶇粯锛岀‘淇漜anvas鍙鍚庢纭粯锟?
        setTimeout(() => drawSegment(), 200);
        setTimeout(() => drawSegment(), 500);
        
        // ===== Canvas鎷栧姩浜や簰锛堟浛浠TML婊戝潡锟?=====
        if (segCanvas) {
            const canvasWrapper = segCanvas.closest('.segment-canvas-wrapper');
            let dragging = null; // 'start' | 'end' | null
            const handleHitRadius = 15; // 鎵嬫焺鐐瑰嚮妫€娴嬪崐锟?
            
            const getCanvasX = (e) => {
                const rect = segCanvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                return clientX - rect.left;
            };
            
            const xToTime = (x) => {
                const w = segCanvas.width;
                return Math.max(0, Math.min(20, (x / w) * 20));
            };
            
            const timeToX = (t) => {
                const w = segCanvas.width;
                return (t / 20) * w;
            };
            
            const getSpectrumHeight = () => {
                return segCanvas.height - 28;
            };
            
            // 妫€娴嬬偣鍑讳綅缃槸鍚﹀湪鎵嬫焺闄勮繎
            const hitTest = (x, y) => {
                const spectrumH = getSpectrumHeight();
                const startX = timeToX(this.currentParams.segmentStartSec || 0);
                const endX = timeToX(this.currentParams.segmentEndSec || 15);
                const handleY = spectrumH + 4; // 涓夎褰腑蹇僘浣嶇疆
                
                // 妫€娴嬫槸鍚︾偣鍑讳簡璧峰鎵嬫焺
                const distStart = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - handleY, 2));
                if (distStart < handleHitRadius) return 'start';
                
                // 妫€娴嬫槸鍚︾偣鍑讳簡缁撴潫鎵嬫焺
                const distEnd = Math.sqrt(Math.pow(x - endX, 2) + Math.pow(y - handleY, 2));
                if (distEnd < handleHitRadius) return 'end';
                
                return null;
            };
            
            // 鏇存柊鍏夋爣鏍峰紡
            const updateCursor = (x, y) => {
                if (dragging) {
                    segCanvas.style.cursor = 'ew-resize';
                    return;
                }
                const hit = hitTest(x, y);
                segCanvas.style.cursor = hit ? 'ew-resize' : 'default';
            };
            
            // 榧犳爣/瑙︽懜鎸変笅
            const onPointerDown = (e) => {
                const rect = segCanvas.getBoundingClientRect();
                const x = getCanvasX(e);
                const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
                
                dragging = hitTest(x, y);
                if (dragging && canvasWrapper) {
                    canvasWrapper.classList.add(`dragging-${dragging}`);
                    e.preventDefault();
                }
            };
            
            // 榧犳爣/瑙︽懜绉诲姩
            const onPointerMove = (e) => {
                const rect = segCanvas.getBoundingClientRect();
                const x = getCanvasX(e);
                const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
                
                if (dragging) {
                    const time = xToTime(x);
                    if (dragging === 'start') {
                        this.currentParams.segmentStartSec = Math.round(time * 2) / 2; // 0.5s姝ヨ繘
                        enforceBounds('start');
                        try { localStorage.setItem('expert.segmentStartSec', String(this.currentParams.segmentStartSec)); } catch {}
                    } else if (dragging === 'end') {
                        this.currentParams.segmentEndSec = Math.round(time * 2) / 2; // 0.5s姝ヨ繘
                        enforceBounds('end');
                        try { localStorage.setItem('expert.segmentEndSec', String(this.currentParams.segmentEndSec)); } catch {}
                    }
                    e.preventDefault();
                } else {
                    updateCursor(x, y);
                }
            };
            
            // 榧犳爣/瑙︽懜閲婃斁
            const onPointerUp = () => {
                if (dragging && canvasWrapper) {
                    canvasWrapper.classList.remove(`dragging-start`);
                    canvasWrapper.classList.remove(`dragging-end`);
                }
                dragging = null;
                segCanvas.style.cursor = 'default';
            };
            
            // 缁戝畾浜嬩欢
            segCanvas.addEventListener('mousedown', onPointerDown);
            segCanvas.addEventListener('mousemove', onPointerMove);
            segCanvas.addEventListener('mouseup', onPointerUp);
            segCanvas.addEventListener('mouseleave', onPointerUp);
            
            // 瑙︽懜鏀寔
            segCanvas.addEventListener('touchstart', onPointerDown, { passive: false });
            segCanvas.addEventListener('touchmove', onPointerMove, { passive: false });
            segCanvas.addEventListener('touchend', onPointerUp);
            segCanvas.addEventListener('touchcancel', onPointerUp);
            
            // 鍏ㄥ眬榧犳爣閲婃斁锛堥槻姝㈡嫋鍑篶anvas鍚庢棤娉曢噴鏀撅級
            document.addEventListener('mouseup', onPointerUp);
            document.addEventListener('touchend', onPointerUp);
        }
    }
    
    /**
     * 缁戝畾妯″紡鍒囨崲鎸夐挳
     */
    bindModeToggle() {
        const testBtn = document.getElementById('param-mode-test');
        const convergeBtn = document.getElementById('param-mode-converge');
        const spectrumBtn = document.getElementById('param-mode-spectrum');
        const convergeArea = document.getElementById('converge-submit-area');
        const spectrumArea = document.getElementById('spectrum-analysis-area');
        const paramsGrid = document.querySelector('.music-params-grid');
        const paramActions = document.querySelector('.param-actions');
        
        const setActiveMode = (mode) => {
            testBtn?.classList.toggle('active', mode === 'test');
            convergeBtn?.classList.toggle('active', mode === 'converge');
            spectrumBtn?.classList.toggle('active', mode === 'spectrum');
            
            convergeArea?.classList.toggle('hidden', mode !== 'converge');
            spectrumArea?.classList.toggle('hidden', mode !== 'spectrum');
            paramsGrid?.classList.toggle('hidden', mode !== 'test');
            paramActions?.classList.toggle('hidden', mode !== 'test');
            
            // 鐗囨閫夋嫨鍣ㄥ彧鍦ㄦ祴璇曟ā寮忔樉锟?
            document.querySelector('.segment-selector')?.classList.toggle('hidden', mode !== 'test');
            // 鏃堕暱鍙傛暟鍙湪鏀舵暃妯″紡鏄剧ず
            document.getElementById('duration-param-item')?.classList.toggle('hidden', mode !== 'converge');
        };
        
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.setMode('test');
                setActiveMode('test');
            });
        }
        
        if (convergeBtn) {
            convergeBtn.addEventListener('click', () => {
                this.setMode('converge');
                setActiveMode('converge');
                this.updateConvergeSummary();
                setTimeout(() => this.playConvergeAnimation(), 50);
                
                const selSlider = document.getElementById('converge-duration-selected');
                const selVal = document.getElementById('converge-duration-selected-val');
                const bounds = this.convergedParams?.duration || this.safeRanges.duration;
                if (selSlider) {
                    selSlider.min = String(bounds.min);
                    selSlider.max = String(bounds.max);
                    const initVal = Math.max(bounds.min, Math.min(bounds.max, this.selectedDuration || this.currentParams.durationSec || 15));
                    selSlider.value = String(initVal);
                    this.selectedDuration = initVal;
                    if (selVal) selVal.textContent = String(initVal);
                    if (!selSlider.__bound) {
                        selSlider.addEventListener('input', (e) => {
                            const v = parseInt(e.target.value, 10);
                            const clamped = Math.max(bounds.min, Math.min(bounds.max, v));
                            this.selectedDuration = clamped;
                            if (selVal) selVal.textContent = String(clamped);
                        });
                        selSlider.__bound = true;
                    }
                }
            });
        }
        
        if (spectrumBtn) {
            spectrumBtn.addEventListener('click', () => {
                this.setMode('spectrum');
                setActiveMode('spectrum');
            });
        }
    }
    
    
    /**
     * 缁戝畾婊戝姩鏉′簨浠?
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
                console.warn(`[MusicParamController] 婊戝姩锟?${id} 涓嶅瓨鍦╜);
                return;
            }
            
            if (!warningEl) {
                console.warn(`[MusicParamController] 璀﹀憡鍏冪礌 ${warningId} 涓嶅瓨鍦紝灏濊瘯鍒涘缓`);
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
            
            // 璁剧疆婊戝姩鏉＄殑瀹夊叏鍖洪棿鏁版嵁灞烇拷?
            const range = this.safeRanges[param];
            if (range) {
                slider.dataset.safeMin = range.min;
                slider.dataset.safeMax = range.max;
            }
            
            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.currentParams[param] = value;
                
                // 鏇存柊鏄剧ず锟?
                if (valueEl) {
                    valueEl.textContent = param === 'tempo' ? value : value + '%';
                }
                
                // 妫€鏌ユ槸鍚﹁秴鍑哄畨鍏ㄥ尯锟?
                const isUnsafe = this.isOutOfSafeRange(param, value);
                console.log(`[MusicParamController] ${param} = ${value}, 瓒呭嚭瀹夊叏鍖洪棿: ${isUnsafe}`);
                this.updateWarning(warningEl, isUnsafe);
                this.updateSliderStyle(slider, param, value);
                
                // 瑙﹀彂鍥炶皟
                this.onParamChange?.({ param, value, isUnsafe });
                
                // 濡傛灉鍦ㄦ敹鏁涙ā寮忥紝鏇存柊鎽樿
                if (this.mode === 'converge') {
                    this.updateConvergeSummary();
                }
            });
            
            // 鍒濆鍖栨牱锟?
            this.updateSliderStyle(slider, param, parseInt(slider.value));
            // 鍒濆鍖栬鍛婄姸锟?
            const initialValue = parseInt(slider.value);
            const isUnsafe = this.isOutOfSafeRange(param, initialValue);
            this.updateWarning(warningEl, isUnsafe);
            console.log(`[MusicParamController] 鍒濆锟?${param}: 锟?${initialValue}, 瓒呭嚭瀹夊叏鍖洪棿=${isUnsafe}, 璀﹀憡鍏冪礌瀛樺湪=${!!warningEl}`);
        });
    }

    /**
     * 缁戝畾鍜屽０閫夐」鎸夐挳
     */
    bindHarmonyOptions() {
        const container = document.getElementById('harmony-options');
        const warningEl = document.getElementById('harmony-warning');
        
        if (!container) return;
        
        const buttons = container.querySelectorAll('.harmony-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                // 绉婚櫎鍏朵粬鎸夐挳鐨刟ctive鐘讹拷?
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const value = btn.dataset.value;
                this.currentParams.harmony = value;
                
                // 妫€鏌ユ槸鍚︿负闈炲畨鍏ㄩ€夐」
                const isUnsafe = !this.safeHarmony.includes(value);
                this.updateWarning(warningEl, isUnsafe);
                
                // 瑙﹀彂鍥炶皟
                this.onParamChange?.({ param: 'harmony', value, isUnsafe });
                
                // 濡傛灉鍦ㄦ敹鏁涙ā寮忥紝鏇存柊鎽樿
                if (this.mode === 'converge') {
                    this.updateConvergeSummary();
                }
            });
        });
    }
    
    /**
     * 缁戝畾涔愬櫒閫夐」鎸夐挳
     */
    bindInstrumentOptions() {
        const container = document.getElementById('instrument-options');
        const warningEl = document.getElementById('instrument-warning');
        
        if (!container) return;
        
        const buttons = container.querySelectorAll('.instrument-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                // 绉婚櫎鍏朵粬鎸夐挳鐨刟ctive鐘讹拷?
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const value = btn.dataset.value;
                this.currentParams.instrument = value;
                
                // 瑙﹀彂鍥炶皟
                this.onParamChange?.({ param: 'instrument', value, isUnsafe: false });
                
                // 濡傛灉鍦ㄦ敹鏁涙ā寮忥紝鏇存柊鎽樿
                if (this.mode === 'converge') {
                    this.updateConvergeSummary();
                }
            });
        });
    }

    /**
     * 缁戝畾鎿嶄綔鎸夐挳
     */
    bindActionButtons() {
        // 棰勮鎸夐挳
        const previewBtn = document.getElementById('param-preview-btn');
        const stopBtn = document.getElementById('param-stop-btn');
        
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.previewMusic();
            });
        }
        
        // 鏆傚仠鎸夐挳
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopMusic();
            });
        }
        
        // 閲嶇疆鎸夐挳
        const resetBtn = document.getElementById('param-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetToDefaults();
            });
        }
        
        // 鎻愪氦鎸夐挳
        const submitBtn = document.getElementById('param-submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitConvergedParams();
            });
        }
        
        // 鏀舵暃妯″紡鍜屽０鎸夐挳锟?
        const harmonyBtnsContainer = document.getElementById('converge-harmony-btns');
        if (harmonyBtnsContainer) {
            const btns = harmonyBtnsContainer.querySelectorAll('.converge-harmony-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    btn.classList.toggle('selected');
                });
            });
        }

        // 鏀舵暃妯″紡涔愬櫒鎸夐挳锟?
        const instrumentBtnsContainer = document.getElementById('converge-instrument-btns');
        if (instrumentBtnsContainer) {
            const btns = instrumentBtnsContainer.querySelectorAll('.daw-instrument-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    btn.classList.toggle('selected');
                });
            });
        }
    }
    
    /**
     * 璁剧疆妯″紡
     */
    setMode(mode) {
        this.mode = mode;
        console.log(`[MusicParamController] 妯″紡鍒囨崲: ${mode}`);
        if (mode === 'converge') {
            // 灏嗘祴璇曟ā寮忕殑鐗囨涓庢椂闀胯寖鍥磋縼绉诲埌鏀舵暃妯″紡鐨勫弻婊戝潡
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
     * 妫€鏌ュ弬鏁版槸鍚﹁秴鍑哄畨鍏ㄥ尯锟?
     */
    isOutOfSafeRange(param, value) {
        const range = this.safeRanges[param];
        if (!range) return false;
        return value < range.min || value > range.max;
    }
    
    /**
     * 鏇存柊璀﹀憡鏄剧ず
     */
    updateWarning(warningEl, show) {
        if (!warningEl) {
            console.warn('[MusicParamController] 璀﹀憡鍏冪礌涓嶅瓨锟?);
            return;
        }
        if (show) {
            warningEl.classList.remove('hidden');
            // 寮哄埗鏄剧ず锛屼娇锟?cssText 瑕嗙洊 !important
            warningEl.style.cssText = 'display: inline-block !important;';
        } else {
            warningEl.classList.add('hidden');
            warningEl.style.cssText = '';
        }
    }
    
    /**
     * 鏇存柊婊戝姩鏉℃牱寮忥紙瀹夊叏鍖洪棿楂樹寒锟?
     */
    updateSliderStyle(slider, param, value) {
        const range = this.safeRanges[param];
        if (!range || !slider) return;
        
        const min = parseInt(slider.min);
        const max = parseInt(slider.max);
        const totalRange = max - min;
        
        // 璁＄畻瀹夊叏鍖洪棿鍦ㄦ粦鍔ㄦ潯涓婄殑浣嶇疆鐧惧垎锟?
        const safeStartPercent = ((range.min - min) / totalRange) * 100;
        const safeEndPercent = ((range.max - min) / totalRange) * 100;
        const currentPercent = ((value - min) / totalRange) * 100;
        
        // 浣跨敤CSS鍙橀噺璁剧疆娓愬彉鑳屾櫙
        slider.style.setProperty('--safe-start', safeStartPercent + '%');
        slider.style.setProperty('--safe-end', safeEndPercent + '%');
        slider.style.setProperty('--current', currentPercent + '%');
        
        // 娣诲姞/绉婚櫎unsafe锟?
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
     * 鏇存柊鎵€鏈夋粦鍔ㄦ潯鏍峰紡
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
     * 鏇存柊鏀舵暃鎽樿
     */
    updateConvergeSummary() {
        const tempoEl = document.getElementById('converge-tempo');
        const contrastEl = document.getElementById('converge-contrast');
        const volumeEl = document.getElementById('converge-volume');
        const harmonyEl = document.getElementById('converge-harmony');
        const durationMinEl = document.getElementById('converge-duration-min-val');
        const durationMaxEl = document.getElementById('converge-duration-max-val');
        const durationSelEl = document.getElementById('converge-duration-selected-val');
        
        if (tempoEl) tempoEl.textContent = this.currentParams.tempo;
        if (contrastEl) contrastEl.textContent = this.currentParams.contrast + '%';
        if (volumeEl) volumeEl.textContent = this.currentParams.volume + '%';
        if (harmonyEl) harmonyEl.textContent = this.currentParams.harmony;
        if (durationMinEl && this.convergedDuration) durationMinEl.textContent = this.convergedDuration.min;
        if (durationMaxEl && this.convergedDuration) durationMaxEl.textContent = this.convergedDuration.max;
        if (durationSelEl && this.selectedDuration) durationSelEl.textContent = this.selectedDuration;
    }
    
    /**
     * 棰勮闊充箰
     */
    previewMusic() {
        console.log('[MusicParamController] 棰勮闊充箰锛屽弬锟?', this.currentParams);
        if (this.mode !== 'test') {
            console.warn('[MusicParamController] 浠呮祴璇曟ā寮忓厑璁搁瑙堣寖鍥村唴鐨勯煶锟?);
            return;
        }
        
        // 鍏堝仠姝㈠綋鍓嶆挱锟?
        this.stopMusic();
        
        // 搴旂敤鍙傛暟鍒伴煶涔愮敓鎴愬櫒
        if (window.sessionConfig) {
            // 鏍囪涓轰笓瀹舵ā寮忥紝纭繚浣跨敤鎵嬪姩璁剧疆鐨勫弬锟?
            window.sessionConfig.expertMode = true;
            window.sessionConfig.expertOverride = true;
            
            window.sessionConfig.rewardBpm = this.currentParams.tempo;
            window.sessionConfig.dynamicContrast = this.currentParams.contrast / 100;
            window.sessionConfig.harmonyType = this.currentParams.harmony;
            window.sessionConfig.instrument = this.currentParams.instrument || 'piano'; // 榛樿閽㈢惔锛岄伩鍏嶉噰鏍锋湭鍔犺浇
            const baseDuration = Math.max(8, Math.min(20, (this.currentParams.segmentEndSec ?? 15) - (this.currentParams.segmentStartSec ?? 0)));
            const finalDuration = this.testDurationRange
                ? Math.max(this.testDurationRange.min, Math.min(this.testDurationRange.max, baseDuration))
                : baseDuration;
            window.sessionConfig.segmentStartSec = this.currentParams.segmentStartSec ?? 0;
            window.sessionConfig.segmentEndSec = this.currentParams.segmentEndSec ?? (window.sessionConfig.segmentStartSec + finalDuration);
            window.sessionConfig.rewardDurationSec = finalDuration;
            
            // 鏍规嵁闊抽噺鍊艰缃煶閲忕骇锟?
            if (this.currentParams.volume <= 50) {
                window.sessionConfig.volumeLevel = 'low';
            } else if (this.currentParams.volume <= 75) {
                window.sessionConfig.volumeLevel = 'medium';
            } else {
                window.sessionConfig.volumeLevel = 'high';
            }
        }
        
        // 濡傛灉锟?popSynth锛岀洿鎺ヨ缃煶锟?
        if (window.popSynth) {
            window.popSynth.setVolume(this.currentParams.volume / 100);
        }
        
        // 鎬绘槸鏍规嵁褰撳墠鍙傛暟閲嶆柊鐢熸垚闊充箰锛堣€屼笉鏄鐢ㄦ棫鐨勶級
        try {
            const session = window.game?.getLastSession?.() || { notes: [] };
            if (typeof window.createRichTestMusic === 'function') {
                window.lastGeneratedSequence = window.createRichTestMusic(session);
                console.log('[MusicParamController] 宸叉牴鎹祴璇曞弬鏁伴噸鏂扮敓鎴愰煶锟?', {
                    bpm: window.sessionConfig?.rewardBpm,
                    contrast: window.sessionConfig?.dynamicContrast,
                    harmony: window.sessionConfig?.harmonyType,
                    instrument: window.sessionConfig?.instrument,
                    segmentStart: window.sessionConfig?.segmentStartSec,
                    segmentEnd: window.sessionConfig?.segmentEndSec
                });
                try { 
                    window.dispatchEvent(new CustomEvent('sequence:updated', { detail: { sequence: window.lastGeneratedSequence } })); 
                } catch {}
            } else {
                console.warn('[MusicParamController] createRichTestMusic 鍑芥暟涓嶅瓨锟?);
            }
        } catch (err) {
            console.error('[MusicParamController] 鐢熸垚闊充箰澶辫触:', err);
        }
        
        // 寤惰繜鎾斁锛岀‘淇濅箣鍓嶇殑鎾斁宸插仠锟?
        setTimeout(() => {
            const playBtn = document.getElementById('play-music-btn');
            if (playBtn) playBtn.click();
            this.isPlaying = true;
        }, 100);
    }
    
    /**
     * 鏆傚仠闊充箰
     */
    stopMusic() {
        console.log('[MusicParamController] 鏆傚仠闊充箰');
        
        // 鍋滄 Magenta 鎾斁锟?(澶氱鍙兘鐨勫紩锟?
        const player = window.rewardPlayer || window.MAGENTA?.player || window.gameApp?.MAGENTA?.player;
        if (player) {
            try {
                player.stop();
            } catch (e) {
                console.warn('[stopMusic] 鍋滄 Magenta 鎾斁鍣ㄥけ锟?', e);
            }
        }
        
        // 鍋滄 popSynth
        if (window.popSynth?.stopAll) {
            try {
                window.popSynth.stopAll();
            } catch (e) {
                console.warn('[stopMusic] 鍋滄 popSynth 澶辫触:', e);
            }
        }
        
        // 灏濊瘯鍋滄 Tone.js
        if (window.Tone?.Transport) {
            try {
                window.Tone.Transport.stop();
            } catch (e) {
                console.warn('[stopMusic] 鍋滄 Tone.js 澶辫触:', e);
            }
        }
        
        this.isPlaying = false;
    }
    
    /**
     * 閲嶇疆鍒伴粯璁わ拷?
     */
    resetToDefaults() {
        this.currentParams = {
            tempo: 72,
            contrast: 10,
            volume: 70,
            harmony: 'I-V',
            instrument: 'piano',
            durationSec: 15,
            segmentStartSec: 0,
            segmentEndSec: 15
        };
        
        // 鏇存柊婊戝姩锟?
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
        
        // 閲嶇疆鍜屽０閫夐」
        const harmonyBtns = document.querySelectorAll('.harmony-btn');
        harmonyBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.value === 'I-V') {
                btn.classList.add('active');
            }
        });

        // 閲嶇疆涔愬櫒閫夐」
        const instrumentBtns = document.querySelectorAll('.instrument-btn');
        instrumentBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.value === 'piano') {
                btn.classList.add('active');
            }
        });
        
        // 闅愯棌鎵€鏈夎鍛婏紙浣跨敤 updateWarning 鏂规硶纭繚涓€鑷存€э級
        ['tempo-warning', 'contrast-warning', 'volume-warning', 'harmony-warning', 'instrument-warning'].forEach(id => {
            const el = document.getElementById(id);
            this.updateWarning(el, false);
        });
        
        // 鏇存柊鏀舵暃鎽樿
        if (this.mode === 'converge') {
            this.updateConvergeSummary();
        }
        
        console.log('[MusicParamController] 宸查噸缃埌榛樿锟?);
    }
    
    /**
     * 鎻愪氦鏀舵暃鍚庣殑鍙傛暟鍒版暟鎹簱
     */
    async submitConvergedParams() {
        // 鏀堕泦涓婁笅鐣屽弬锟?
        const tempoMin = parseInt(document.getElementById('converge-tempo-min')?.value) || 60;
        const tempoMax = parseInt(document.getElementById('converge-tempo-max')?.value) || 80;
        const contrastMin = parseInt(document.getElementById('converge-contrast-min')?.value) || 0;
        const contrastMax = parseInt(document.getElementById('converge-contrast-max')?.value) || 20;
        const volumeMin = parseInt(document.getElementById('converge-volume-min')?.value) || 60;
        const volumeMax = parseInt(document.getElementById('converge-volume-max')?.value) || 80;
        const durationMin = parseInt(document.getElementById('converge-duration-min')?.value) || 8;
        const durationMax = parseInt(document.getElementById('converge-duration-max')?.value) || 20;
        const durationSel = parseInt(document.getElementById('converge-duration-selected')?.value) || Math.max(durationMin, Math.min(durationMax, 15));
        
        // 鏀堕泦瀹夊叏鍜屽０閫夐」锛堜粠鎸夐挳缁勶級
        const harmonyBtnsContainer = document.getElementById('converge-harmony-btns');
        const safeHarmonies = harmonyBtnsContainer 
            ? Array.from(harmonyBtnsContainer.querySelectorAll('.converge-harmony-btn.selected')).map(btn => btn.dataset.value)
            : ['I-V'];

        // 鏀堕泦瀹夊叏涔愬櫒閫夐」锛堜粠鎸夐挳缁勶級
        const instrumentBtnsContainer = document.getElementById('converge-instrument-btns');
        const safeInstruments = instrumentBtnsContainer
            ? Array.from(instrumentBtnsContainer.querySelectorAll('.daw-instrument-btn.selected')).map(btn => btn.dataset.value)
            : ['piano'];
        
        this.convergedParams = {
            tempo: { min: tempoMin, max: tempoMax },
            contrast: { min: contrastMin, max: contrastMax },
            volume: { min: volumeMin, max: volumeMax },
            duration: { min: durationMin, max: durationMax, selected: durationSel },
            safeHarmonies,
            safeInstruments,
            timestamp: Date.now()
        };
        
        console.log('[MusicParamController] 鎻愪氦鏀舵暃鍙傛暟:', this.convergedParams);
        
        // 鏄剧ず鎻愪氦缁撴灉
        const submitBtn = document.getElementById('param-submit-btn');
        const originalText = submitBtn?.innerHTML;
        
        try {
            // TODO: 瀹為檯鐨勬暟鎹簱鎻愪氦閫昏緫
            // const response = await fetch('/api/converged-params', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(this.convergedParams)
            // });
            
            // 妯℃嫙鎻愪氦鎴愬姛
            if (submitBtn) {
                submitBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    ${this.t('expert.msg.saved')}
                `;
                submitBtn.classList.add('success');
            }
            
            // 瑙﹀彂鍥炶皟
            this.onSubmit?.({ params: this.convergedParams });
            
            // 3绉掑悗鎭㈠鎸夐挳
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
            console.error('[MusicParamController] 鎻愪氦澶辫触:', error);
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
     * 鑾峰彇褰撳墠鍙傛暟
     */
    getParams() {
        return { ...this.currentParams };
    }
    
    /**
     * 鑾峰彇鏀舵暃鍚庣殑鍙傛暟
     */
    getConvergedParams() {
        return this.convergedParams ? { ...this.convergedParams } : null;
    }
    
    /**
     * 缁戝畾DAW椋庢牸鍙屾粦锟?
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
                
                // 鏇存柊鏁板€兼樉锟?
                if (minValEl) minValEl.textContent = minVal;
                if (maxValEl) maxValEl.textContent = maxVal;
                
                // 璁板綍鑼冨洿
                if (param === 'duration') {
                    if (scope === 'converge') {
                        this.convergedDuration = { min: minVal, max: maxVal };
                    } else {
                        this.testDurationRange = { min: minVal, max: maxVal };
                    }
                }
            };
            
            // 纭繚min涓嶈秴杩噈ax
            minSlider.addEventListener('input', () => {
                const minVal = parseInt(minSlider.value);
                const maxVal = parseInt(maxSlider.value);
                if (minVal > maxVal) {
                    minSlider.value = maxVal;
                }
                updateTrackFill();
            });
            
            // 纭繚max涓嶅皬浜巑in
            maxSlider.addEventListener('input', () => {
                const minVal = parseInt(minSlider.value);
                const maxVal = parseInt(maxSlider.value);
                if (maxVal < minVal) {
                    maxSlider.value = minVal;
                }
                updateTrackFill();
            });
            
            // 鍒濆锟?
            updateTrackFill();
        });
        
        // 缁戝畾DAW鍜屽０鎸夐挳
        const harmonyBtns = document.querySelectorAll('.daw-harmony-btn');
        harmonyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('selected');
            });
        });
    }
    
    /**
     * 鎾斁鏀舵暃鍔ㄧ敾
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
            
            // 鑾峰彇瀹夊叏鍖洪棿
            const safeRange = this.safeRanges[param];
            if (!safeRange) return;
            
            const range = rangeMax - rangeMin;
            const targetLeft = ((safeRange.min - rangeMin) / range) * 100;
            const targetRight = 100 - ((safeRange.max - rangeMin) / range) * 100;
            
            // 璁剧疆CSS鍙橀噺鐢ㄤ簬鍔ㄧ敾
            trackFill.style.setProperty('--converge-left', targetLeft + '%');
            trackFill.style.setProperty('--converge-right', targetRight + '%');
            
            // 鍏堣缃负鍏ㄥ紑鐘讹拷?
            trackFill.style.left = '0%';
            trackFill.style.right = '0%';
            
            // 瑙﹀彂鍔ㄧ敾
            trackFill.classList.add('animating');
            
            // 鍔ㄧ敾缁撴潫鍚庢洿鏂版粦鍧椾綅锟?
            setTimeout(() => {
                trackFill.classList.remove('animating');
                minSlider.value = safeRange.min;
                maxSlider.value = safeRange.max;
                trackFill.style.left = targetLeft + '%';
                trackFill.style.right = targetRight + '%';
                
                // 鏇存柊鏁板€兼樉锟?
                const minValEl = document.getElementById(`converge-${param}-min-val`);
                const maxValEl = document.getElementById(`converge-${param}-max-val`);
                if (minValEl) minValEl.textContent = safeRange.min;
                if (maxValEl) maxValEl.textContent = safeRange.max;
            }, 400);
        });
    }
}

// 鍏ㄥ眬鍗曚緥
window.musicParamController = new MusicParamController();

// DOM鍔犺浇瀹屾垚鍚庡垵濮嬪寲
document.addEventListener('DOMContentLoaded', () => {
    // 寤惰繜鍒濆鍖栵紝纭繚鍏朵粬缁勪欢宸插姞锟?
    setTimeout(() => {
        window.musicParamController.init();
    }, 100);
});

console.log('馃帥锟?闊充箰鍙傛暟鎺у埗鍣ㄥ凡鍔犺浇');
