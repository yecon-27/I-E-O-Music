
class SafetyEnvelope {
    constructor() {
        this.unsafeMode = false;
        this.unsafeConfirmed = false;
        this.previewMode = false;
        this.muted = true; // 默认静音，需要专家手动 Preview
        this.safeRanges = {
            tempo: { min: 120, max: 130, unsafeMin: 100, unsafeMax: 140 },
            volume: { min: 0.3, max: 0.8, unsafeMin: 0, unsafeMax: 1.0 },
            density: { min: 0.5, max: 2.0, unsafeMin: 0.1, unsafeMax: 5.0 },
            noteRange: { min: 48, max: 84, unsafeMin: 24, unsafeMax: 108 }, // MIDI
        };
        this.currentParams = {
            tempo: 125,
            volume: 0.7,
            density: 1.0,
            noteRangeLow: 60,
            noteRangeHigh: 72,
        };
        this.onIntercept = null;
        this.onParamChange = null;
        this.onWarning = null;
        this.subscribers = new Map();
    }
    
    
    setUnsafeMode(enabled, confirmed = false) {
        if (enabled && !confirmed) {
            this.onWarning?.({
                type: 'unsafe_mode_request',
                message: '启用不安全模式需要二次确认',
            });
            return false;
        }
        
        this.unsafeMode = enabled;
        this.unsafeConfirmed = confirmed;
        
        if (!enabled) {
            this.revalidateAllParams();
        }
        
        this.publish('unsafeModeChanged', { enabled, confirmed });
        console.log(`[SafetyEnvelope] 不安全模式: ${enabled ? '开启' : '关闭'}`);
        return true;
    }
    
    
    setPreviewMode(enabled) {
        this.previewMode = enabled;
        this.muted = !enabled;
        this.publish('previewModeChanged', { enabled, muted: this.muted });
    }
    
    
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
        const effectiveMin = this.unsafeMode && this.unsafeConfirmed ? range.unsafeMin : range.min;
        const effectiveMax = this.unsafeMode && this.unsafeConfirmed ? range.unsafeMax : range.max;
        if (value < effectiveMin || value > effectiveMax) {
            clampedValue = Math.max(effectiveMin, Math.min(effectiveMax, value));
            intercepted = true;
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
        if (oldValue !== newValue) {
            window.sessionLogger?.recordParamChange(name, oldValue, newValue, intercepted ? 'safety' : 'user');
            this.onParamChange?.({ name, oldValue, newValue, intercepted });
            this.publish('paramChanged', { name, oldValue, newValue, intercepted });
        }
        
        return newValue;
    }
    
    
    getParam(name) {
        return this.currentParams[name];
    }
    
    
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
    
    
    revalidateAllParams() {
        for (const name of Object.keys(this.currentParams)) {
            if (this.safeRanges[name]) {
                this.setParam(name, this.currentParams[name]);
            }
        }
    }
    
    
    validateNote(midi, velocity = 80) {
        const noteRange = this.getParamRange('noteRange');
        const volumeRange = this.getParamRange('volume');
        
        let validMidi = midi;
        let validVelocity = velocity;
        let intercepted = false;
        if (midi < noteRange.min || midi > noteRange.max) {
            validMidi = Math.max(noteRange.min, Math.min(noteRange.max, midi));
            intercepted = true;
        }
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
window.safetyEnvelope = new SafetyEnvelope();
window.SafetyEnvelope = SafetyEnvelope;
