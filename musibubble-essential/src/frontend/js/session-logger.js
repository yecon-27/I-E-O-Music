/**
 * SessionLogger - 专家审计模式的数据埋点系统
 * 记录游戏过程中的所有参数变动、用户行为和安全拦截事件
 */
class SessionLogger {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = null;
        this.isRecording = false;
        
        // 时间轴数据
        this.timeline = {
            // 因果对齐数据：每秒记录 (System_BPM, User_Click_Frequency)
            causalAlignment: [],
            // 参数变动记录
            paramChanges: [],
            // 用户点击事件
            userClicks: [],
            // 安全拦截日志
            interceptedEvents: [],
            // 泡泡戳破事件
            bubblePops: [],
        };
        
        // 安全检查结果
        this.safetyChecks = {
            scaleCheck: { passed: true, details: [] },
            densityCheck: { passed: true, details: [] },
            tempoCheck: { passed: true, details: [] },
            volumeCheck: { passed: true, details: [] },
        };
        
        // 统计数据
        this.stats = {
            totalClicks: 0,
            successfulPops: 0,
            missedClicks: 0,
            interceptedNotes: 0,
            paramAdjustments: 0,
        };
        
        // 每秒采样定时器
        this.samplingInterval = null;
        this.lastClickCount = 0;
        this.clicksThisSecond = 0;
    }
    
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 开始记录
     */
    startRecording() {
        this.sessionId = this.generateSessionId();
        this.startTime = performance.now();
        this.isRecording = true;
        
        // 重置数据
        this.timeline = {
            causalAlignment: [],
            paramChanges: [],
            userClicks: [],
            interceptedEvents: [],
            bubblePops: [],
        };
        this.stats = {
            totalClicks: 0,
            successfulPops: 0,
            missedClicks: 0,
            interceptedNotes: 0,
            paramAdjustments: 0,
        };
        
        // 开始每秒采样
        this.startSampling();
        
        console.log('[SessionLogger] 开始记录, sessionId:', this.sessionId);
    }
    
    /**
     * 停止记录
     */
    stopRecording() {
        this.isRecording = false;
        this.stopSampling();
        
        const duration = (performance.now() - this.startTime) / 1000;
        console.log(`[SessionLogger] 停止记录, 时长: ${duration.toFixed(1)}s`);
        
        return this.exportSession();
    }
    
    /**
     * 开始每秒采样
     */
    startSampling() {
        this.samplingInterval = setInterval(() => {
            if (!this.isRecording) return;
            
            const elapsed = (performance.now() - this.startTime) / 1000;
            const currentBPM = window.sessionConfig?.rewardBpm || 125;
            const clickFrequency = this.clicksThisSecond;
            
            this.timeline.causalAlignment.push({
                t: elapsed,
                systemBPM: currentBPM,
                userClickFreq: clickFrequency,
                gameSpeed: window.game?.gameSpeed || 1.0,
            });
            
            // 重置本秒点击计数
            this.clicksThisSecond = 0;
        }, 1000);
    }
    
    stopSampling() {
        if (this.samplingInterval) {
            clearInterval(this.samplingInterval);
            this.samplingInterval = null;
        }
    }
    
    /**
     * 记录用户点击
     */
    recordClick(x, y, hit = false) {
        if (!this.isRecording) return;
        
        const elapsed = (performance.now() - this.startTime) / 1000;
        this.timeline.userClicks.push({
            t: elapsed,
            x, y,
            hit,
        });
        
        this.stats.totalClicks++;
        this.clicksThisSecond++;
        
        if (hit) {
            this.stats.successfulPops++;
        } else {
            this.stats.missedClicks++;
        }
    }
    
    /**
     * 记录泡泡戳破
     */
    recordBubblePop(bubble) {
        if (!this.isRecording) return;
        
        const elapsed = (performance.now() - this.startTime) / 1000;
        this.timeline.bubblePops.push({
            t: elapsed,
            bubbleId: bubble.id,
            laneId: bubble.laneId,
            note: bubble.note?.name,
            midi: bubble.note?.midi,
        });
    }
    
    /**
     * 记录参数变动
     */
    recordParamChange(paramName, oldValue, newValue, source = 'user') {
        if (!this.isRecording) return;
        
        const elapsed = (performance.now() - this.startTime) / 1000;
        this.timeline.paramChanges.push({
            t: elapsed,
            param: paramName,
            from: oldValue,
            to: newValue,
            source, // 'user' | 'system' | 'safety'
        });
        
        this.stats.paramAdjustments++;
    }
    
    /**
     * 记录安全拦截事件
     */
    recordInterception(eventType, originalValue, clampedValue, rule) {
        if (!this.isRecording) return;
        
        const elapsed = (performance.now() - this.startTime) / 1000;
        this.timeline.interceptedEvents.push({
            t: elapsed,
            type: eventType,
            original: originalValue,
            clamped: clampedValue,
            rule: rule,
        });
        
        this.stats.interceptedNotes++;
        
        // 更新安全检查状态
        if (rule.includes('tempo')) {
            this.safetyChecks.tempoCheck.passed = false;
            this.safetyChecks.tempoCheck.details.push({ t: elapsed, value: originalValue });
        }
    }
    
    /**
     * 运行安全检查
     */
    runSafetyChecks(melodySpec) {
        const checks = {
            scaleCheck: this.checkScale(melodySpec),
            densityCheck: this.checkDensity(melodySpec),
            tempoCheck: this.checkTempo(melodySpec),
            volumeCheck: this.checkVolume(melodySpec),
        };
        
        this.safetyChecks = checks;
        return checks;
    }
    
    checkScale(spec) {
        const pentatonic = ['C', 'D', 'E', 'G', 'A'];
        const notes = spec?.phrases?.flatMap(p => p.notes?.map(n => n.pitch?.[0])) || [];
        const violations = notes.filter(n => n && !pentatonic.includes(n));
        
        return {
            passed: violations.length === 0,
            details: violations.length > 0 ? [`${violations.length} 个音符超出五声音阶`] : [],
        };
    }
    
    checkDensity(spec) {
        const noteCount = spec?.phrases?.reduce((sum, p) => sum + (p.notes?.length || 0), 0) || 0;
        const duration = spec?.durationSec || 60;
        const density = noteCount / duration;
        
        const maxDensity = 2; // 每秒最多2个音符
        return {
            passed: density <= maxDensity,
            details: density > maxDensity ? [`密度 ${density.toFixed(2)}/s 超过阈值 ${maxDensity}/s`] : [],
        };
    }
    
    checkTempo(spec) {
        const bpm = spec?.bpm || window.sessionConfig?.rewardBpm || 125;
        const safeRange = { min: 120, max: 130 };
        
        return {
            passed: bpm >= safeRange.min && bpm <= safeRange.max,
            details: (bpm < safeRange.min || bpm > safeRange.max) 
                ? [`BPM ${bpm} 超出安全范围 [${safeRange.min}, ${safeRange.max}]`] 
                : [],
        };
    }
    
    checkVolume(spec) {
        const volume = window.sessionConfig?.volumeLevel || 'medium';
        const velocities = spec?.phrases?.flatMap(p => p.notes?.map(n => n.velocity)) || [];
        const maxVel = Math.max(...velocities, 0);
        
        return {
            passed: maxVel <= 100,
            details: maxVel > 100 ? [`最大力度 ${maxVel} 超过阈值 100`] : [],
        };
    }
    
    /**
     * 导出会话数据
     */
    exportSession() {
        const endTime = performance.now();
        
        return {
            sessionId: this.sessionId,
            startTime: this.startTime,
            endTime: endTime,
            durationSec: (endTime - this.startTime) / 1000,
            timeline: this.timeline,
            safetyChecks: this.safetyChecks,
            stats: this.stats,
            config: { ...window.sessionConfig },
            exportedAt: new Date().toISOString(),
        };
    }
    
    /**
     * 下载会话 JSON
     */
    downloadJSON(filename) {
        const data = this.exportSession();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `audit_${this.sessionId}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// 全局单例
window.sessionLogger = new SessionLogger();
window.SessionLogger = SessionLogger;
