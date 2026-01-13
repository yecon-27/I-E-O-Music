/**
 * SafetyEnvelope - 安全熔断逻辑层
 * 所有音乐生成参数必须经过此层校验
 */
class SafetyEnvelope {
    constructor() {
        // 安全模式开关
        this.unsafeMode = false;
        this.unsafeConfirmed = false;
        
        // 预览模式（允许越界参数临时播放）
        this.previewMode = false;
        
        // 静音节点状态
        this.muted = true; // 默认静音，需要专家手动 Preview
        
        // 安全范围定义
        this.safeRanges = {
            tempo: { min: 120, max: 130, unsafeMin: 100, unsafeMax: 140 },
            volume: { min: 0.3, max: 0.8, unsafeMin: 0, unsafeMax: 1.0 },
            density: { min: 0.5, max: 2.0, unsafeMin: 0.1, unsafeMax: 5.0 },
            noteRange: { min: 48, max: 84, unsafeMin: 24, unsafeMax: 108 }, // MIDI
        };
        
        // 当前参数值
        this.currentParams = {
            tempo: 130,
            volume: 0.7,
            density: 1.0,
            noteRangeLow: 60,
            noteRangeHigh: 72,
        };
        
        // 拦截回调
        this.onIntercept = null;
        this.onParamChange = null;
        this.onWarning = null;
        
        // 订阅者列表 (Pub/Sub)
        this.subscribers = new Map();
    }
    
    /**
     * 启用/禁用不安全模式
     */
    setUnsafeMode(enabled, confirmed = false) {
        if (enabled && !confirmed) {
            // 需要二次确认
            this.onWarning?.({
                type: 'unsafe_mode_request',
                message: '启用不安全模式需要二次确认',
            });
            return false;
        }
        
        this.unsafeMode = enabled;
        this.unsafeConfirmed = confirmed;
        
        if (!enabled) {
            // 关闭不安全模式时，重新 clamp 所有参数
            this.revalidateAllParams();
        }
        
        this.publish('unsafeModeChanged', { enabled, confirmed });
        console.log(`[SafetyEnvelope] 不安全模式: ${enabled ? '开启' : '关闭'}`);
        return true;
    }
    
    /**
     * 设置预览模式
     */
    setPreviewMode(enabled) {
        this.previewMode = enabled;
        this.muted = !enabled;
        this.publish('previewModeChanged', { enabled, muted: this.muted });
    }
    
    /**
     * 设置参数（带安全校验）
     */
    setParam(name, value) {
        const range = this.safeRanges[name];
        if (!range) {
            console.warn(`[SafetyEnvelope] 未知参数: ${name}`);
            return value;
        }
        
        const oldValue = this.currentParams[name];
        let newValue = value;
        let intercepted = false;
        let clampedValue = value;
        
        // 确定有效范围
        const effectiveMin = this.unsafeMode && this.unsafeConfirmed ? range.unsafeMin : range.min;
        const effectiveMax = this.unsafeMode && this.unsafeConfirmed ? range.unsafeMax : range.max;
        
        // Clamp 到有效范围
        if (value < effectiveMin || value > effectiveMax) {
            clampedValue = Math.max(effectiveMin, Math.min(effectiveMax, value));
            intercepted = true;
            
            // 记录拦截
            const rule = `${name}_range_[${effectiveMin}, ${effectiveMax}]`;
            window.sessionLogger?.recordInterception(name, value, clampedValue, rule);
            
            this.onIntercept?.({
                param: name,
                original: value,
                clamped: clampedValue,
                rule,
            });
        }
        
        newValue = clampedValue;
        this.currentParams[name] = newValue;
        
        // 记录参数变动
        if (oldValue !== newValue) {
            window.sessionLogger?.recordParamChange(name, oldValue, newValue, intercepted ? 'safety' : 'user');
            this.onParamChange?.({ name, oldValue, newValue, intercepted });
            this.publish('paramChanged', { name, oldValue, newValue, intercepted });
        }
        
        return newValue;
    }
    
    /**
     * 获取参数（返回安全值）
     */
    getParam(name) {
        return this.currentParams[name];
    }
    
    /**
     * 获取参数的有效范围
     */
    getParamRange(name) {
        const range = this.safeRanges[name];
        if (!range) return null;
        
        return {
            min: this.unsafeMode && this.unsafeConfirmed ? range.unsafeMin : range.min,
            max: this.unsafeMode && this.unsafeConfirmed ? range.unsafeMax : range.max,
            safeMin: range.min,
            safeMax: range.max,
            unsafeMin: range.unsafeMin,
            unsafeMax: range.unsafeMax,
        };
    }
    
    /**
     * 重新校验所有参数
     */
    revalidateAllParams() {
        for (const name of Object.keys(this.currentParams)) {
            if (this.safeRanges[name]) {
                this.setParam(name, this.currentParams[name]);
            }
        }
    }
    
    /**
     * 检查音符是否在安全范围内
     */
    validateNote(midi, velocity = 80) {
        const noteRange = this.getParamRange('noteRange');
        const volumeRange = this.getParamRange('volume');
        
        let validMidi = midi;
        let validVelocity = velocity;
        let intercepted = false;
        
        // 检查音高
        if (midi < noteRange.min || midi > noteRange.max) {
            validMidi = Math.max(noteRange.min, Math.min(noteRange.max, midi));
            intercepted = true;
        }
        
        // 检查力度
        const normalizedVel = velocity / 127;
        if (normalizedVel < volumeRange.min || normalizedVel > volumeRange.max) {
            validVelocity = Math.round(Math.max(volumeRange.min, Math.min(volumeRange.max, normalizedVel)) * 127);
            intercepted = true;
        }
        
        if (intercepted) {
            window.sessionLogger?.recordInterception('note', { midi, velocity }, { midi: validMidi, velocity: validVelocity }, 'note_validation');
        }
        
        return {
            midi: validMidi,
            velocity: validVelocity,
            intercepted,
            muted: this.muted && !this.previewMode,
        };
    }
    
    /**
     * 订阅参数变化 (Pub/Sub)
     */
    subscribe(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, new Set());
        }
        this.subscribers.get(event).add(callback);
        
        return () => this.unsubscribe(event, callback);
    }
    
    unsubscribe(event, callback) {
        this.subscribers.get(event)?.delete(callback);
    }
    
    publish(event, data) {
        this.subscribers.get(event)?.forEach(cb => {
            try {
                cb(data);
            } catch (e) {
                console.error('[SafetyEnvelope] 订阅回调错误:', e);
            }
        });
    }
    
    /**
     * 获取当前状态摘要
     */
    getStatus() {
        return {
            unsafeMode: this.unsafeMode,
            unsafeConfirmed: this.unsafeConfirmed,
            previewMode: this.previewMode,
            muted: this.muted,
            params: { ...this.currentParams },
        };
    }
}

// 全局单例
window.safetyEnvelope = new SafetyEnvelope();
window.SafetyEnvelope = SafetyEnvelope;
