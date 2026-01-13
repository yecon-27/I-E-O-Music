/**
 * Sidebar Controller - 右侧实时监控面板控制器
 * 管理实时数据更新、Lane 分布可视化
 */

(function() {
    'use strict';

    class SidebarController {
        constructor() {
            this.updateInterval = null;
            this.laneStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            this.totalAttempts = 0;  // 总尝试次数（包括未命中）
            this.successfulClicks = 0;  // 成功命中次数
            this.recentClicks = [];
            this.maxRecentClicks = 12;  // 显示最近12个点击
            this.prevPatternProbs = { seq: 0.33, rep: 0.33, exp: 0.33 };
            
            this.elements = {};
            this.init();
        }

        init() {
            // 等待 DOM 加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        setup() {
            this.cacheElements();
            this.bindEvents();
            this.startUpdates();
            
            // Initial static text update
            this.updateStaticTexts();

            // Subscribe to language changes
            if (window.i18n) {
                window.i18n.subscribe(() => {
                    this.updateDisplay();
                    this.updateStaticTexts();
                });
            }

            console.log('[Sidebar] Controller initialized');
        }

        cacheElements() {
            this.elements = {
                sidebar: document.getElementById('game-sidebar'),
                toggleBtn: document.getElementById('sidebar-toggle-btn'),
                rtClicks: document.getElementById('rt-clicks'),
                // rtAccuracy & rtBpm removed
                rtDominant: document.getElementById('rt-dominant'),
                rtLaneBars: document.getElementById('rt-lane-bars'),
                rtPattern: document.getElementById('rt-pattern'),
                rtRecentClicks: document.getElementById('rt-recent-clicks'),
                
                // Static label containers (using querySelector within sidebar)
                sidebarTitle: document.querySelector('.sidebar-title'),
                // Section titles
                sectionTitles: document.querySelectorAll('.section-title'),
                // Mini stat labels
                miniLabels: document.querySelectorAll('.mini-stat .mini-label')
            };
        }

        updateStaticTexts() {
            if (!this.elements.sidebar) return;

            // Sidebar Title
            if (this.elements.sidebarTitle) {
                this.elements.sidebarTitle.textContent = this.t('sidebar.title');
            }

            // Section Titles (Need to preserve SVG icons)
            // 1. Real-time Data
            const rtDataTitle = this.elements.sectionTitles[0];
            if (rtDataTitle) {
                const icon = rtDataTitle.querySelector('svg');
                rtDataTitle.innerHTML = '';
                if (icon) rtDataTitle.appendChild(icon.cloneNode(true));
                rtDataTitle.appendChild(document.createTextNode(' ' + this.t('sidebar.realtimeData')));
            }

            // 2. Lane Dist
            const laneDistTitle = this.elements.sectionTitles[1];
            if (laneDistTitle) {
                const icon = laneDistTitle.querySelector('svg');
                laneDistTitle.innerHTML = '';
                if (icon) laneDistTitle.appendChild(icon.cloneNode(true));
                laneDistTitle.appendChild(document.createTextNode(' ' + this.t('sidebar.laneDist')));
            }

            // 3. Pattern Predict
            const patternTitle = this.elements.sectionTitles[2];
            if (patternTitle) {
                const icon = patternTitle.querySelector('svg');
                const tooltipTrigger = patternTitle.querySelector('.bubble-tooltip-trigger');
                patternTitle.innerHTML = '';
                if (icon) patternTitle.appendChild(icon.cloneNode(true));
                patternTitle.appendChild(document.createTextNode(' ' + this.t('sidebar.patternPredict') + ' '));
                if (tooltipTrigger) patternTitle.appendChild(tooltipTrigger.cloneNode(true));
            }

            // 4. Recent Clicks
            const recentClicksTitle = this.elements.sectionTitles[3];
            if (recentClicksTitle) {
                const icon = recentClicksTitle.querySelector('svg');
                recentClicksTitle.innerHTML = '';
                if (icon) recentClicksTitle.appendChild(icon.cloneNode(true));
                recentClicksTitle.appendChild(document.createTextNode(' ' + this.t('sidebar.recentClicks')));
            }

            // Mini Stat Labels
            const miniLabels = this.elements.miniLabels;
            if (miniLabels && miniLabels.length >= 2) {
                miniLabels[0].textContent = this.t('sidebar.clickCount');
                miniLabels[1].textContent = this.t('sidebar.dominant');
            }
        }

        bindEvents() {
            // 侧边栏折叠/展开
            if (this.elements.toggleBtn) {
                this.elements.toggleBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleSidebar();
                });
            }

            // 监听泡泡戳破事件（成功命中）
            window.addEventListener('bubble:popped', (e) => this.onBubblePopped(e.detail));
            
            // 监听点击尝试事件（包括未命中）
            window.addEventListener('click:attempt', (e) => this.onClickAttempt(e.detail));
            
            // 监听游戏回合事件
            window.addEventListener('round:started', () => this.resetStats());
            window.addEventListener('round:ended', () => this.onRoundEnded());
        }

        toggleSidebar() {
            if (this.elements.sidebar) {
                const isCollapsed = this.elements.sidebar.classList.toggle('collapsed');
                console.log('[Sidebar] Toggle:', isCollapsed ? 'collapsed' : 'expanded');
            }
        }

        resetStats() {
            this.laneStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            this.totalAttempts = 0;
            this.successfulClicks = 0;
            this.recentClicks = [];
            this.updateDisplay();
        }

        onBubblePopped(bubble) {
            if (!bubble) return;

            this.successfulClicks++;
            this.totalAttempts++;

            // 更新 Lane 统计
            if (bubble.laneId && this.laneStats[bubble.laneId] !== undefined) {
                this.laneStats[bubble.laneId]++;
            }

            // 记录最近点击
            this.recentClicks.unshift({
                laneId: bubble.laneId,
                note: bubble.note?.name || '?',
                time: Date.now(),
                success: true
            });
            if (this.recentClicks.length > this.maxRecentClicks) {
                this.recentClicks.pop();
            }
        }

        onClickAttempt(detail) {
            // 记录未命中的点击尝试
            if (detail && !detail.success) {
                this.totalAttempts++;
            }
        }

        onRoundEnded() {
            console.log('[Sidebar] Round ended, final stats:', this.laneStats);
        }

        startUpdates() {
            this.updateInterval = setInterval(() => this.updateDisplay(), 500);
        }

        t(key, params) {
            return window.i18n ? window.i18n.t(key, params) : key;
        }

        updateDisplay() {
            this.updateStats();
            this.updateLaneBars();
            this.updatePatternPrediction();
            this.updateRecentClicks();
        }

        updateStats() {
            // 点击数（成功命中）
            if (this.elements.rtClicks) {
                this.elements.rtClicks.textContent = this.successfulClicks;
            }

            // Accuracy and BPM display removed as requested

            // 主导 Lane
            if (this.elements.rtDominant) {
                const dominant = this.getDominantLane();
                if (dominant) {
                    const laneNames = { 1: 'C', 2: 'D', 3: 'E', 4: 'G', 5: 'A' };
                    this.elements.rtDominant.textContent = `${laneNames[dominant.lane]} (${dominant.percent}%)`;
                } else {
                    this.elements.rtDominant.textContent = '-';
                }
            }
        }

        updateLaneBars() {
            if (!this.elements.rtLaneBars) return;

            const bars = this.elements.rtLaneBars.querySelectorAll('.lane-bar');
            const total = Object.values(this.laneStats).reduce((a, b) => a + b, 0);
            const maxCount = Math.max(...Object.values(this.laneStats), 1);

            bars.forEach((bar) => {
                const laneId = parseInt(bar.dataset.lane);
                const count = this.laneStats[laneId] || 0;
                const height = total > 0 ? (count / maxCount) * 100 : 10;
                
                bar.style.height = Math.max(height, 10) + '%';
                bar.classList.toggle('active', count > 0);
            });
        }

        updatePatternPrediction() {
            if (!this.elements.rtPattern) return;

            const pattern = this.detectPattern();
            const patternEl = this.elements.rtPattern;

            if (pattern.type === 'unknown') {
                patternEl.innerHTML = `<span class="pattern-label">${this.t('sidebar.waitingForData')}</span>`;
            } else {
                const typeLabels = {
                    sequential: this.t('sidebar.pattern.sequential'),
                    repetitive: this.t('sidebar.pattern.repetitive'),
                    exploratory: this.t('sidebar.pattern.exploratory'),
                    mixed: this.t('sidebar.pattern.mixed')
                };
                patternEl.innerHTML = `
                    <span class="pattern-type">${typeLabels[pattern.type] || pattern.type}</span>
                    <span class="pattern-confidence">${Math.round(pattern.confidence * 100)}%</span>
                `;
            }
        }

        updateRecentClicks() {
            if (!this.elements.rtRecentClicks) return;

            if (this.recentClicks.length === 0) {
                this.elements.rtRecentClicks.innerHTML = `<span class="no-data">${this.t('sidebar.noData')}</span>`;
                return;
            }

            const laneColors = {
                1: '#F87171', 2: '#FB923C', 3: '#FBBF24',
                4: '#60A5FA', 5: '#A78BFA'
            };

            // 显示最多12个
            const html = this.recentClicks.slice(0, 12).map(click => {
                const color = laneColors[click.laneId] || '#999';
                return `<span class="click-item" style="background: ${color};">${click.note}</span>`;
            }).join('');

            this.elements.rtRecentClicks.innerHTML = html;
        }

        estimateBPM() {
            if (this.recentClicks.length < 3) return 0;

            const intervals = [];
            for (let i = 1; i < Math.min(this.recentClicks.length, 6); i++) {
                const interval = this.recentClicks[i - 1].time - this.recentClicks[i].time;
                if (interval > 0 && interval < 3000) {
                    intervals.push(interval);
                }
            }

            if (intervals.length === 0) return 0;

            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            return (60 * 1000) / avgInterval;
        }

        getDominantLane() {
            const total = Object.values(this.laneStats).reduce((a, b) => a + b, 0);
            if (total === 0) return null;

            let maxLane = 1;
            let maxCount = 0;

            for (const [lane, count] of Object.entries(this.laneStats)) {
                if (count > maxCount) {
                    maxCount = count;
                    maxLane = parseInt(lane);
                }
            }

            return {
                lane: maxLane,
                count: maxCount,
                percent: Math.round((maxCount / total) * 100)
            };
        }

        detectPattern() {
            if (this.recentClicks.length < 5) {
                return { type: 'unknown', confidence: 0 };
            }

            const lanes = this.recentClicks.slice(0, 10).map(c => c.laneId);
            
            // 检测顺序模式
            let seqScore = 0;
            for (let i = 1; i < lanes.length; i++) {
                if (lanes[i] === lanes[i-1] + 1 || lanes[i] === lanes[i-1] - 1) {
                    seqScore++;
                }
            }
            const seqRatio = seqScore / (lanes.length - 1);

            // 检测重复模式
            const laneCounts = {};
            lanes.forEach(l => laneCounts[l] = (laneCounts[l] || 0) + 1);
            const maxRepeat = Math.max(...Object.values(laneCounts));
            const repRatio = maxRepeat / lanes.length;

            // 检测探索模式
            // 降低阈值：从 5 降低到 4 (只要用到 4 种音符就算探索)
            const uniqueLanes = new Set(lanes).size;
            const expRatio = uniqueLanes / 5;

            // 归一化分数（与报告面板一致）
            // 调整权重，提高探索型的相对得分
            const seqRaw = Math.min(1, (seqRatio / 0.4) * 0.6 + (uniqueLanes / 5) * 0.4);
            const repRaw = Math.min(1, repRatio / 0.6);
            // 提高 laneDiversity 权重 (0.6 -> 0.7) 降低 repRatio 惩罚 (0.4 -> 0.3)
            const expRaw = Math.min(1, (uniqueLanes / 5) * 0.7 + (1 - repRatio) * 0.3);
            
            const total = seqRaw + repRaw + expRaw || 1;
            let probs = {
                seq: seqRaw / total,
                rep: repRaw / total,
                exp: expRaw / total,
            };
            
            // 调整 EMA 平滑系数，让显示响应更快 (0.5 -> 0.3)
            const alpha = 0.3;
            probs = {
                seq: alpha * this.prevPatternProbs.seq + (1 - alpha) * probs.seq,
                rep: alpha * this.prevPatternProbs.rep + (1 - alpha) * probs.rep,
                exp: alpha * this.prevPatternProbs.exp + (1 - alpha) * probs.exp,
            };
            this.prevPatternProbs = { ...probs };
            
            const entries = Object.entries(probs).sort((a, b) => b[1] - a[1]);
            const [topKey, topProb] = entries[0];
            const typeMap = { seq: 'sequential', rep: 'repetitive', exp: 'exploratory' };
            // 降低阈值，让模式更容易显示 (0.4 -> 0.35)
            const type = topProb >= 0.35 ? typeMap[topKey] : 'mixed';
            return { type, confidence: topProb };
        }
    }

    window.sidebarController = new SidebarController();

})();
