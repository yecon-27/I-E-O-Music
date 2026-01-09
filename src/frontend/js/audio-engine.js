// 轻量音效合成器：命中时播放音效，支持多种乐器音色
(function () {
    class PopSynth {
      constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.7; // 全局音量
        this.master.connect(this.ctx.destination);
        this.startedAt = this.ctx.currentTime;
        
        // 音色设置: 'piano' | 'epiano' | 'guitar' | 'strings'
        // 兼容旧值: 'soft' -> 'piano', 'bright' -> 'strings'
        this.timbre = 'piano';
      }
      
      now() { return this.ctx.currentTime; }
      resume() { if (this.ctx.state !== 'running') return this.ctx.resume(); }
      
      setVolume(volume) {
        // 设置主音量，volume 应该是 0-1 之间的值
        this.master.gain.value = Math.max(0, Math.min(1, volume));
      }
      
      /**
       * 设置音色
       * @param {string} timbre
       */
      setTimbre(timbre) {
        if (timbre === 'soft') timbre = 'piano';
        if (timbre === 'bright') timbre = 'strings';
        
        const validTimbres = ['piano', 'epiano', 'guitar', 'strings'];
        if (validTimbres.includes(timbre)) {
            this.timbre = timbre;
        } else {
            this.timbre = 'piano';
        }
        console.log('🎵 即时反馈音色切换:', this.timbre);
      }
  
      play(freq, { when = this.now(), vel = 0.9, dur = 0.22 } = {}) {
        switch (this.timbre) {
            case 'epiano':
                this._playEPiano(freq, { when, vel, dur });
                break;
            case 'guitar':
                this._playGuitar(freq, { when, vel, dur });
                break;
            case 'strings':
                this._playStrings(freq, { when, vel, dur });
                break;
            case 'piano':
            default:
                this._playPiano(freq, { when, vel, dur });
                break;
        }
      }
      
      /**
       * 钢琴音色 (原 Soft) - 双正弦波，温暖
       */
      _playPiano(freq, { when, vel, dur }) {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const g = this.ctx.createGain();
  
        osc1.type = 'sine';
        osc2.type = 'triangle'; // 混合一点三角波增加质感
        osc1.frequency.setValueAtTime(freq, when);
        osc2.frequency.setValueAtTime(freq * 1.005, when);
  
        // 包络：快速打击感 + 自然衰减
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(vel * 0.8, when + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, when + dur + 0.1);
  
        // 混合比例
        const mix = this.ctx.createGain();
        mix.gain.value = 0.8; 
        
        osc1.connect(g);
        osc2.connect(mix); mix.connect(g);
        g.connect(this.master);
  
        osc1.start(when); osc2.start(when);
        const stopAt = when + dur + 0.2;
        osc1.stop(stopAt); osc2.stop(stopAt);
      }

      /**
       * 电钢音色 (Rhodes-ish) - FM 合成
       */
      _playEPiano(freq, { when, vel, dur }) {
        const carrier = this.ctx.createOscillator();
        const modulator = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const masterGain = this.ctx.createGain();

        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(freq, when);

        modulator.type = 'sine';
        modulator.frequency.setValueAtTime(freq * 4, when); // 调制频率比

        // 调制指数包络
        modGain.gain.setValueAtTime(freq * 0.5, when); // 初始调制深度
        modGain.gain.exponentialRampToValueAtTime(1, when + dur); // 随时间减少调制，声音变纯

        // 振幅包络
        masterGain.gain.setValueAtTime(0, when);
        masterGain.gain.linearRampToValueAtTime(vel * 0.7, when + 0.02);
        masterGain.gain.exponentialRampToValueAtTime(0.001, when + dur + 0.3);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(masterGain);
        masterGain.connect(this.master);

        carrier.start(when);
        modulator.start(when);
        const stopAt = when + dur + 0.4;
        carrier.stop(stopAt);
        modulator.stop(stopAt);
      }

      /**
       * 吉他音色 (Nylon) - 拨弦感，快速衰减
       */
      _playGuitar(freq, { when, vel, dur }) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, when);

        // 低通滤波器模拟尼龙弦的温暖
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 3, when);
        filter.Q.value = 0.5;

        // 拨弦包络：极快起音，指数衰减
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(vel, when + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, when + Math.min(dur, 0.4)); // 吉他单音衰减较快

        osc.connect(filter);
        filter.connect(g);
        g.connect(this.master);

        osc.start(when);
        const stopAt = when + dur + 0.1;
        osc.stop(stopAt);
      }
      
      /**
       * 弦乐音色 (Strings) - 慢起音，锯齿波
       */
      _playStrings(freq, { when, vel, dur }) {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, when);
        
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq * 1.003, when); // 失谐合唱效果
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 2, when);
        
        // 弦乐包络：慢起音 (Legato)
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(vel * 0.5, when + 0.1); 
        g.gain.setValueAtTime(vel * 0.4, when + dur * 0.5);
        g.gain.linearRampToValueAtTime(0, when + dur + 0.2); // 慢释放
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(g);
        g.connect(this.master);
        
        osc1.start(when); osc2.start(when);
        const stopAt = when + dur + 0.3;
        osc1.stop(stopAt); osc2.stop(stopAt);
      }
    }
  
    window.PopSynth = PopSynth;
  })();
