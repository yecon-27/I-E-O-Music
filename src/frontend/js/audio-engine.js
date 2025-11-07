// 轻量音效合成器：命中时播放一个柔和的双正弦音
(function () {
    class PopSynth {
      constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.7; // 全局音量
        this.master.connect(this.ctx.destination);
        this.startedAt = this.ctx.currentTime;
      }
      now() { return this.ctx.currentTime; }
      resume() { if (this.ctx.state !== 'running') return this.ctx.resume(); }
      
      setVolume(volume) {
        // 设置主音量，volume 应该是 0-1 之间的值
        this.master.gain.value = Math.max(0, Math.min(1, volume));
      }
  
      play(freq, { when = this.now(), vel = 0.9, dur = 0.22 } = {}) {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const g = this.ctx.createGain();
  
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(freq, when);
        osc2.frequency.setValueAtTime(freq * 1.005, when); // 轻微失谐更圆润
  
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(vel, when + 0.01);     // 快速起音
        g.gain.exponentialRampToValueAtTime(0.0001, when + dur); // 自然衰减
  
        osc1.connect(g); osc2.connect(g); g.connect(this.master);
        osc1.start(when); osc2.start(when);
        const stopAt = when + dur + 0.05;
        osc1.stop(stopAt); osc2.stop(stopAt);
      }
    }
  
    window.PopSynth = PopSynth;
  })();