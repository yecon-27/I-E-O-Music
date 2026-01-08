// 轻量音效合成器：命中时播放音效，支持柔和/明亮两种音色
(function () {
    class PopSynth {
      constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.7; // 全局音量
        this.master.connect(this.ctx.destination);
        this.startedAt = this.ctx.currentTime;
        
        // 音色设置: 'soft' = 柔和钢琴, 'bright' = 明亮小提琴
        this.timbre = 'soft';
      }
      
      now() { return this.ctx.currentTime; }
      resume() { if (this.ctx.state !== 'running') return this.ctx.resume(); }
      
      setVolume(volume) {
        // 设置主音量，volume 应该是 0-1 之间的值
        this.master.gain.value = Math.max(0, Math.min(1, volume));
      }
      
      /**
       * 设置音色
       * @param {'soft' | 'bright'} timbre
       */
      setTimbre(timbre) {
        this.timbre = timbre === 'bright' ? 'bright' : 'soft';
        console.log('🎵 音色切换:', this.timbre === 'bright' ? '明亮' : '柔和');
      }
  
      play(freq, { when = this.now(), vel = 0.9, dur = 0.22 } = {}) {
        if (this.timbre === 'bright') {
          this._playBright(freq, { when, vel, dur });
        } else {
          this._playSoft(freq, { when, vel, dur });
        }
      }
      
      /**
       * 柔和音色 - 双正弦波，类似钢琴的柔和音色
       */
      _playSoft(freq, { when, vel, dur }) {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const g = this.ctx.createGain();
  
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(freq, when);
        osc2.frequency.setValueAtTime(freq * 1.005, when); // 轻微失谐更圆润
  
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(vel * 0.8, when + 0.01);     // 快速起音
        g.gain.exponentialRampToValueAtTime(0.0001, when + dur); // 自然衰减
  
        osc1.connect(g); osc2.connect(g); g.connect(this.master);
        osc1.start(when); osc2.start(when);
        const stopAt = when + dur + 0.05;
        osc1.stop(stopAt); osc2.stop(stopAt);
      }
      
      /**
       * 明亮音色 - 锯齿波+泛音，类似小提琴的明亮音色
       */
      _playBright(freq, { when, vel, dur }) {
        // 主振荡器 - 锯齿波
        const osc1 = this.ctx.createOscillator();
        // 泛音振荡器 - 增加明亮感
        const osc2 = this.ctx.createOscillator();
        const osc3 = this.ctx.createOscillator();
        
        const g = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        // 锯齿波主音
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, when);
        
        // 高八度泛音
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, when);
        
        // 轻微失谐增加丰富度
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(freq * 1.002, when);
        
        // 低通滤波器柔化锯齿波的刺耳感
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 4, when);
        filter.Q.setValueAtTime(1, when);
        
        // 包络 - 更快的起音，模拟弓弦
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(vel * 0.6, when + 0.005);  // 非常快的起音
        g.gain.setValueAtTime(vel * 0.5, when + 0.02);            // 轻微衰减
        g.gain.exponentialRampToValueAtTime(0.0001, when + dur);  // 自然衰减
        
        // 连接
        const mixer = this.ctx.createGain();
        mixer.gain.value = 0.5;
        
        osc1.connect(filter);
        filter.connect(mixer);
        osc2.connect(mixer);
        osc3.connect(mixer);
        mixer.connect(g);
        g.connect(this.master);
        
        osc1.start(when); osc2.start(when); osc3.start(when);
        const stopAt = when + dur + 0.05;
        osc1.stop(stopAt); osc2.stop(stopAt); osc3.stop(stopAt);
      }
    }
  
    window.PopSynth = PopSynth;
  })();
