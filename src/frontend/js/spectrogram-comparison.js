/**
 * Spectrogram Comparison Tool
 * 用于生成 unconstrained vs constrained 音乐的声纹图对比
 * 支持 log-mel spectrogram 和 loudness contour 可视化
 */

class SpectrogramComparison {
  constructor() {
    this.sampleRate = 44100;
    this.fftSize = 2048;
    this.hopSize = 512;
    this.numMelBins = 128;
    this.minFreq = 20;
    this.maxFreq = 8000;
    
    // 固定随机种子，确保可重现
    this.fixedSeed = 42;
    
    // 安全包络边界（用于标注）
    this.envelopeBounds = {
      loudnessMax: -14, // LUFS
      loudnessMin: -30,
      lraMax: 7, // LU
    };
  }

  /**
   * 生成对比数据
   * @param {Object} session - 游戏会话数据
   * @returns {Object} 包含两个版本的音频数据和分析结果
   */
  async generateComparisonData(session) {
    if (!session || !session.notes || session.notes.length < 2) {
      throw new Error('需要有效的游戏会话数据');
    }

    const generator = new window.AdvancedMusicGenerator();
    
    // 设置固定种子
    if (window.sessionConfig) {
      generator.setSessionConfig({ ...window.sessionConfig, randomSeed: this.fixedSeed });
    }

    const actions = generator.buildActionTraceFromSession(session);

    // 生成无约束版本
    const unconstrainedResult = generator.generateReward(actions, generator.getSessionConfig(), { skipEnvelope: true });
    
    // 生成约束版本
    const constrainedResult = generator.generateReward(actions, generator.getSessionConfig(), { skipEnvelope: false });

    // 渲染为音频
    const unconstrainedAudio = await this.renderToAudioBuffer(unconstrainedResult.sequence);
    const constrainedAudio = await this.renderToAudioBuffer(constrainedResult.sequence);

    // 计算频谱图
    const unconstrainedSpec = this.computeLogMelSpectrogram(unconstrainedAudio);
    const constrainedSpec = this.computeLogMelSpectrogram(constrainedAudio);

    // 计算响度轮廓
    const unconstrainedLoudness = this.computeLoudnessContour(unconstrainedAudio);
    const constrainedLoudness = this.computeLoudnessContour(constrainedAudio);

    // 计算 LRA (Loudness Range)
    const unconstrainedLRA = this.computeLRA(unconstrainedLoudness);
    const constrainedLRA = this.computeLRA(constrainedLoudness);

    return {
      actionTrace: actions,
      seed: this.fixedSeed,
      unconstrained: {
        sequence: unconstrainedResult.sequence,
        rawParams: unconstrainedResult.rawParams,
        audio: unconstrainedAudio,
        spectrogram: unconstrainedSpec,
        loudness: unconstrainedLoudness,
        lra: unconstrainedLRA,
        metrics: this.computeMetrics(unconstrainedAudio, unconstrainedLoudness),
      },
      constrained: {
        sequence: constrainedResult.sequence,
        clampLog: constrainedResult.clampLog,
        audio: constrainedAudio,
        spectrogram: constrainedSpec,
        loudness: constrainedLoudness,
        lra: constrainedLRA,
        metrics: this.computeMetrics(constrainedAudio, constrainedLoudness),
      },
      envelopeBounds: this.envelopeBounds,
    };
  }

  /**
   * 将音乐序列渲染为 AudioBuffer
   */
  async renderToAudioBuffer(sequence) {
    const duration = (sequence.totalTime || 20) + 1;
    const numSamples = Math.ceil(this.sampleRate * duration);
    
    const offlineCtx = new OfflineAudioContext(1, numSamples, this.sampleRate);
    
    for (const note of sequence.notes) {
      const freq = 440 * Math.pow(2, (note.pitch - 69) / 12);
      const velocity = (note.velocity || 80) / 127;
      const startTime = note.startTime;
      const endTime = Math.min(note.endTime, duration - 0.1);
      
      if (startTime >= duration || endTime <= startTime) continue;
      
      const osc = offlineCtx.createOscillator();
      const gainNode = offlineCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(offlineCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // ADSR 包络
      const attackTime = 0.01;
      const decayTime = 0.1;
      const sustainLevel = 0.7;
      const releaseTime = 0.15;
      
      const peakGain = velocity * 0.4;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(peakGain, startTime + attackTime);
      gainNode.gain.linearRampToValueAtTime(peakGain * sustainLevel, startTime + attackTime + decayTime);
      
      const releaseStart = Math.max(startTime + attackTime + decayTime, endTime - releaseTime);
      gainNode.gain.setValueAtTime(peakGain * sustainLevel, releaseStart);
      gainNode.gain.linearRampToValueAtTime(0, endTime);
      
      osc.start(startTime);
      osc.stop(endTime + 0.01);
    }
    
    return await offlineCtx.startRendering();
  }

  /**
   * 计算 Log-Mel Spectrogram
   */
  computeLogMelSpectrogram(audioBuffer) {
    const data = audioBuffer.getChannelData(0);
    const numFrames = Math.floor((data.length - this.fftSize) / this.hopSize) + 1;
    
    // 创建 Mel 滤波器组
    const melFilters = this.createMelFilterbank();
    
    const spectrogram = [];
    const window = this.createHannWindow(this.fftSize);
    
    for (let i = 0; i < numFrames; i++) {
      const start = i * this.hopSize;
      const frame = new Float32Array(this.fftSize);
      
      // 应用窗函数
      for (let j = 0; j < this.fftSize && start + j < data.length; j++) {
        frame[j] = data[start + j] * window[j];
      }
      
      // 计算 FFT 幅度谱
      const magnitudes = this.computeFFTMagnitude(frame);
      
      // 应用 Mel 滤波器
      const melSpec = new Float32Array(this.numMelBins);
      for (let m = 0; m < this.numMelBins; m++) {
        let sum = 0;
        for (let k = 0; k < magnitudes.length; k++) {
          sum += magnitudes[k] * melFilters[m][k];
        }
        // 转换为 dB
        melSpec[m] = 10 * Math.log10(Math.max(sum, 1e-10));
      }
      
      spectrogram.push(melSpec);
    }
    
    return {
      data: spectrogram,
      numFrames,
      numMelBins: this.numMelBins,
      hopSize: this.hopSize,
      sampleRate: this.sampleRate,
    };
  }

  /**
   * 创建 Hann 窗
   */
  createHannWindow(size) {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
    }
    return window;
  }

  /**
   * 创建 Mel 滤波器组
   */
  createMelFilterbank() {
    const melMin = this.hzToMel(this.minFreq);
    const melMax = this.hzToMel(this.maxFreq);
    const melPoints = new Float32Array(this.numMelBins + 2);
    
    for (let i = 0; i < this.numMelBins + 2; i++) {
      melPoints[i] = melMin + (melMax - melMin) * i / (this.numMelBins + 1);
    }
    
    const hzPoints = melPoints.map(m => this.melToHz(m));
    const binPoints = hzPoints.map(hz => Math.floor((this.fftSize + 1) * hz / this.sampleRate));
    
    const filters = [];
    const numBins = this.fftSize / 2 + 1;
    
    for (let m = 0; m < this.numMelBins; m++) {
      const filter = new Float32Array(numBins);
      const left = binPoints[m];
      const center = binPoints[m + 1];
      const right = binPoints[m + 2];
      
      for (let k = left; k < center && k < numBins; k++) {
        filter[k] = (k - left) / (center - left);
      }
      for (let k = center; k < right && k < numBins; k++) {
        filter[k] = (right - k) / (right - center);
      }
      
      filters.push(filter);
    }
    
    return filters;
  }

  hzToMel(hz) {
    return 2595 * Math.log10(1 + hz / 700);
  }

  melToHz(mel) {
    return 700 * (Math.pow(10, mel / 2595) - 1);
  }

  /**
   * 简化的 FFT 幅度计算（使用 DFT）
   */
  computeFFTMagnitude(frame) {
    const N = frame.length;
    const numBins = N / 2 + 1;
    const magnitudes = new Float32Array(numBins);
    
    for (let k = 0; k < numBins; k++) {
      let real = 0, imag = 0;
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += frame[n] * Math.cos(angle);
        imag += frame[n] * Math.sin(angle);
      }
      magnitudes[k] = Math.sqrt(real * real + imag * imag) / N;
    }
    
    return magnitudes;
  }

  /**
   * 计算响度轮廓 (简化的 LUFS 近似)
   */
  computeLoudnessContour(audioBuffer) {
    const data = audioBuffer.getChannelData(0);
    const windowSize = Math.floor(this.sampleRate * 0.4); // 400ms 窗口
    const hopSize = Math.floor(this.sampleRate * 0.1); // 100ms 步进
    
    const loudness = [];
    const times = [];
    
    for (let i = 0; i + windowSize <= data.length; i += hopSize) {
      let sumSquares = 0;
      for (let j = 0; j < windowSize; j++) {
        sumSquares += data[i + j] * data[i + j];
      }
      const rms = Math.sqrt(sumSquares / windowSize);
      // 转换为近似 LUFS (简化计算)
      const lufs = 20 * Math.log10(Math.max(rms, 1e-10)) - 0.691;
      
      loudness.push(lufs);
      times.push(i / this.sampleRate);
    }
    
    return { values: loudness, times };
  }

  /**
   * 计算 LRA (Loudness Range)
   */
  computeLRA(loudnessContour) {
    const values = loudnessContour.values.filter(v => v > -70); // 过滤静音
    if (values.length < 2) return 0;
    
    values.sort((a, b) => a - b);
    
    // LRA = 95th percentile - 10th percentile
    const p10 = values[Math.floor(values.length * 0.1)];
    const p95 = values[Math.floor(values.length * 0.95)];
    
    return p95 - p10;
  }

  /**
   * 计算其他指标
   */
  computeMetrics(audioBuffer, loudnessContour) {
    const data = audioBuffer.getChannelData(0);
    
    // 峰值
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      peak = Math.max(peak, Math.abs(data[i]));
    }
    const peakDb = 20 * Math.log10(Math.max(peak, 1e-10));
    
    // 平均响度
    const avgLoudness = loudnessContour.values.reduce((a, b) => a + b, 0) / loudnessContour.values.length;
    
    // 响度标准差
    const loudnessStd = Math.sqrt(
      loudnessContour.values.reduce((sum, v) => sum + Math.pow(v - avgLoudness, 2), 0) / loudnessContour.values.length
    );
    
    // 能量变化率
    let energyChangeRate = 0;
    for (let i = 1; i < loudnessContour.values.length; i++) {
      energyChangeRate += Math.abs(loudnessContour.values[i] - loudnessContour.values[i - 1]);
    }
    energyChangeRate /= (loudnessContour.values.length - 1);
    
    return {
      peakDb,
      avgLoudness,
      loudnessStd,
      energyChangeRate,
    };
  }

  /**
   * 绘制对比图
   */
  drawComparison(canvas, comparisonData) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // 清空画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    const halfWidth = width / 2;
    const specHeight = height * 0.55;
    const loudnessHeight = height * 0.35;
    const padding = 10;
    const labelHeight = 30;
    
    // 绘制标题
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Unconstrained Baseline', halfWidth / 2, 20);
    ctx.fillText('Constraint-First Output', halfWidth + halfWidth / 2, 20);
    
    // 计算统一的 dB 范围
    const allSpecData = [
      ...comparisonData.unconstrained.spectrogram.data.flat(),
      ...comparisonData.constrained.spectrogram.data.flat()
    ];
    const minDb = Math.min(...allSpecData);
    const maxDb = Math.max(...allSpecData);
    
    // 绘制频谱图
    this.drawSpectrogram(ctx, comparisonData.unconstrained.spectrogram, 
      padding, labelHeight, halfWidth - padding * 2, specHeight - labelHeight, minDb, maxDb);
    this.drawSpectrogram(ctx, comparisonData.constrained.spectrogram,
      halfWidth + padding, labelHeight, halfWidth - padding * 2, specHeight - labelHeight, minDb, maxDb);
    
    // 绘制响度轮廓
    const loudnessY = specHeight + 20;
    this.drawLoudnessContour(ctx, comparisonData.unconstrained.loudness,
      padding, loudnessY, halfWidth - padding * 2, loudnessHeight, comparisonData.envelopeBounds, false);
    this.drawLoudnessContour(ctx, comparisonData.constrained.loudness,
      halfWidth + padding, loudnessY, halfWidth - padding * 2, loudnessHeight, comparisonData.envelopeBounds, true);
    
    // 绘制 LRA 数值
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    
    const metricsY = height - 15;
    const uncMetrics = comparisonData.unconstrained.metrics;
    const conMetrics = comparisonData.constrained.metrics;
    
    ctx.fillText(`LRA: ${comparisonData.unconstrained.lra.toFixed(1)} LU | Avg: ${uncMetrics.avgLoudness.toFixed(1)} LUFS | ΔE: ${uncMetrics.energyChangeRate.toFixed(2)}`, padding, metricsY);
    ctx.fillText(`LRA: ${comparisonData.constrained.lra.toFixed(1)} LU | Avg: ${conMetrics.avgLoudness.toFixed(1)} LUFS | ΔE: ${conMetrics.energyChangeRate.toFixed(2)}`, halfWidth + padding, metricsY);
    
    // 绘制分隔线
    ctx.strokeStyle = '#4a4a6a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(halfWidth, 0);
    ctx.lineTo(halfWidth, height);
    ctx.stroke();
  }

  /**
   * 绘制频谱图
   */
  drawSpectrogram(ctx, specData, x, y, width, height, minDb, maxDb) {
    const { data, numFrames, numMelBins } = specData;
    
    const cellWidth = width / numFrames;
    const cellHeight = height / numMelBins;
    
    for (let i = 0; i < numFrames; i++) {
      for (let j = 0; j < numMelBins; j++) {
        const value = data[i][j];
        const normalized = (value - minDb) / (maxDb - minDb);
        const color = this.viridisColormap(Math.max(0, Math.min(1, normalized)));
        
        ctx.fillStyle = color;
        ctx.fillRect(
          x + i * cellWidth,
          y + height - (j + 1) * cellHeight,
          Math.ceil(cellWidth),
          Math.ceil(cellHeight)
        );
      }
    }
    
    // 绘制标签
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('Log-Mel Spectrogram (dB)', x, y - 5);
  }

  /**
   * 绘制响度轮廓
   */
  drawLoudnessContour(ctx, loudnessData, x, y, width, height, bounds, showBounds) {
    const { values, times } = loudnessData;
    
    // 绘制背景
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(x, y, width, height);
    
    // 计算范围
    const minLoudness = Math.min(...values, bounds.loudnessMin);
    const maxLoudness = Math.max(...values, bounds.loudnessMax);
    const range = maxLoudness - minLoudness;
    
    // 绘制包络边界（虚线）
    if (showBounds) {
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      // 上边界
      const upperY = y + height - ((bounds.loudnessMax - minLoudness) / range) * height;
      ctx.beginPath();
      ctx.moveTo(x, upperY);
      ctx.lineTo(x + width, upperY);
      ctx.stroke();
      
      // 下边界
      const lowerY = y + height - ((bounds.loudnessMin - minLoudness) / range) * height;
      ctx.beginPath();
      ctx.moveTo(x, lowerY);
      ctx.lineTo(x + width, lowerY);
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // 标注
      ctx.fillStyle = '#ff6b6b';
      ctx.font = '9px system-ui';
      ctx.fillText(`${bounds.loudnessMax} LUFS`, x + width - 50, upperY - 3);
      ctx.fillText(`${bounds.loudnessMin} LUFS`, x + width - 50, lowerY + 10);
    }
    
    // 绘制响度曲线
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < values.length; i++) {
      const px = x + (i / (values.length - 1)) * width;
      const py = y + height - ((values[i] - minLoudness) / range) * height;
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    
    // 绘制标签
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('Loudness Contour (LUFS)', x, y - 5);
  }

  /**
   * Viridis 色图
   */
  viridisColormap(t) {
    const colors = [
      [68, 1, 84],
      [72, 40, 120],
      [62, 74, 137],
      [49, 104, 142],
      [38, 130, 142],
      [31, 158, 137],
      [53, 183, 121],
      [109, 205, 89],
      [180, 222, 44],
      [253, 231, 37]
    ];
    
    const idx = t * (colors.length - 1);
    const i = Math.floor(idx);
    const f = idx - i;
    
    if (i >= colors.length - 1) return `rgb(${colors[colors.length - 1].join(',')})`;
    
    const c1 = colors[i];
    const c2 = colors[i + 1];
    
    const r = Math.round(c1[0] + f * (c2[0] - c1[0]));
    const g = Math.round(c1[1] + f * (c2[1] - c1[1]));
    const b = Math.round(c1[2] + f * (c2[2] - c1[2]));
    
    return `rgb(${r},${g},${b})`;
  }

  /**
   * 导出对比图为 PNG
   */
  exportAsPNG(canvas, filename = 'spectrogram_comparison.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  /**
   * 导出数据为 JSON（用于进一步分析）
   */
  exportDataAsJSON(comparisonData, filename = 'comparison_data.json') {
    const exportData = {
      seed: comparisonData.seed,
      actionTraceLength: comparisonData.actionTrace.length,
      envelopeBounds: comparisonData.envelopeBounds,
      unconstrained: {
        rawParams: comparisonData.unconstrained.rawParams,
        lra: comparisonData.unconstrained.lra,
        metrics: comparisonData.unconstrained.metrics,
        noteCount: comparisonData.unconstrained.sequence.notes.length,
        bpm: comparisonData.unconstrained.sequence.tempos?.[0]?.qpm,
      },
      constrained: {
        clampLog: comparisonData.constrained.clampLog,
        lra: comparisonData.constrained.lra,
        metrics: comparisonData.constrained.metrics,
        noteCount: comparisonData.constrained.sequence.notes.length,
        bpm: comparisonData.constrained.sequence.tempos?.[0]?.qpm,
      },
      comparison: {
        lraDiff: comparisonData.unconstrained.lra - comparisonData.constrained.lra,
        avgLoudnessDiff: comparisonData.unconstrained.metrics.avgLoudness - comparisonData.constrained.metrics.avgLoudness,
        energyChangeRateDiff: comparisonData.unconstrained.metrics.energyChangeRate - comparisonData.constrained.metrics.energyChangeRate,
      },
      generatedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// 导出到全局
window.SpectrogramComparison = SpectrogramComparison;

console.log('📊 Spectrogram Comparison Tool 已加载');
