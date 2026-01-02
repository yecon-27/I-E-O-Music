/**
 * 游戏结果管理器
 * 负责收集游戏数据并在60秒结束时显示结果窗口
 */
class GameResultManager {
  constructor() {
    this.gameData = {
      startTime: null,
      endTime: null,
      bubblesPopped: 0,
      totalAttempts: 0,
      maxConsecutive: 0,
      currentConsecutive: 0,
      sessionDuration: 60, // 60秒
      popTimes: [], // 记录每次戳泡泡的时间
      handStats: {
        leftHand: 0, // 左手戳破次数
        rightHand: 0, // 右手戳破次数
        unknown: 0, // 未知手部（鼠标等）
      },
    };

    this.isActive = false;
    this.resultOverlay = null;

    this.initializeUI();
  }

  /**
   * 初始化UI元素
   */
  initializeUI() {
    this.resultOverlay = document.getElementById("game-result-overlay");

    // 绑定按钮事件
    const playAgainBtn = document.getElementById("play-again-btn");
    const finishGameBtn = document.getElementById("finish-game-btn");
    const playMusicBtn = document.getElementById("play-music-btn");
    const openRewardControlsBtn = document.getElementById("open-reward-controls-btn");

    if (playAgainBtn) {
      playAgainBtn.addEventListener("click", () => {
        this.startNewGame();
      });
    }

    if (finishGameBtn) {
      finishGameBtn.addEventListener("click", () => {
        this.hideResultWindow();
      });
    }

    if (playMusicBtn) {
      playMusicBtn.addEventListener("click", () => {
        this.playGeneratedMusic();
      });
    }

    if (openRewardControlsBtn) {
      openRewardControlsBtn.addEventListener("click", () => {
        if (window.sessionUI?.open) {
          window.sessionUI.open();
          return;
        }
        const modal = document.getElementById("session-settings-modal");
        if (modal) modal.classList.remove("hidden");
      });
    }
  }

  /**
   * 开始新游戏
   */
  startGame() {
    this.gameData = {
      startTime: Date.now(),
      endTime: null,
      bubblesPopped: 0,
      totalAttempts: 0,
      maxConsecutive: 0,
      currentConsecutive: 0,
      sessionDuration: 60,
      popTimes: [],
      handStats: {
        leftHand: 0,
        rightHand: 0,
        unknown: 0,
      },
    };

    this.isActive = true;
    console.log("🎮 游戏数据收集开始");
  }

  /**
   * 记录成功戳泡泡
   * @param {string} handType - 使用的手部类型: 'leftHand', 'rightHand', 'unknown'
   */
  recordBubblePop(handType = "unknown") {
    if (!this.isActive) {
      console.warn("⚠️ 游戏未激活，无法记录泡泡戳破");
      return;
    }

    const now = Date.now();
    this.gameData.bubblesPopped++;
    this.gameData.currentConsecutive++;
    this.gameData.popTimes.push(now);

    // 记录手部使用统计
    console.log(
      "📊 记录手部统计 - 类型:",
      handType,
      "记录前:",
      this.gameData.handStats
    );
    if (this.gameData.handStats[handType] !== undefined) {
      this.gameData.handStats[handType]++;
    } else {
      this.gameData.handStats.unknown++;
    }
    console.log("📊 记录手部统计 - 记录后:", this.gameData.handStats);

    // 更新最高连击
    if (this.gameData.currentConsecutive > this.gameData.maxConsecutive) {
      this.gameData.maxConsecutive = this.gameData.currentConsecutive;
    }

    console.log(
      "🎯 记录泡泡戳破，总数:",
      this.gameData.bubblesPopped,
      "尝试次数:",
      this.gameData.totalAttempts
    );
  }

  /**
   * 记录尝试（包括失败）
   */
  recordAttempt() {
    if (!this.isActive) {
      console.warn("⚠️ 游戏未激活，无法记录尝试");
      return;
    }

    this.gameData.totalAttempts++;
    console.log("📊 记录尝试，总尝试次数:", this.gameData.totalAttempts);
  }

  /**
   * 重置连击计数
   */
  resetConsecutive() {
    if (!this.isActive) return;

    this.gameData.currentConsecutive = 0;
  }

  /**
   * 游戏结束
   */
  endGame() {
    if (!this.isActive) return;

    this.gameData.endTime = Date.now();
    this.isActive = false;

    console.log("🎮 游戏结束，显示结果");
    this.showResultWindow();
  }

  /**
   * 显示结果窗口
   */
  showResultWindow() {
    const stats = this.calculateStats();
    this.updateResultDisplay(stats);

    // 暂停手部检测，避免在结果界面产生音效
    if (window.gameApp?.poseDetector) {
      this.pausePoseDetection();
    }

    if (this.resultOverlay) {
      this.resultOverlay.classList.remove("hidden");
    }
  }

  /**
   * 隐藏结果窗口
   */
  hideResultWindow() {
    // 恢复手部检测
    if (window.gameApp?.poseDetector) {
      this.resumePoseDetection();
    }

    if (this.resultOverlay) {
      this.resultOverlay.classList.add("hidden");
    }
  }

  /**
   * 计算游戏统计数据
   */
  calculateStats() {
    const totalTime = this.gameData.endTime - this.gameData.startTime;
    const actualDuration = Math.min(
      totalTime / 1000,
      this.gameData.sessionDuration
    );

    // 计算平均速度（秒/个）
    const avgSpeed =
      this.gameData.bubblesPopped > 0
        ? actualDuration / this.gameData.bubblesPopped
        : 0;

    // 计算手部偏好
    const handPreference = this.calculateHandPreference();

    return {
      bubblesPopped: this.gameData.bubblesPopped,
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      maxConsecutive: this.gameData.maxConsecutive,
      handPreference: handPreference,
      totalTime: actualDuration,
      encouragement: this.generateEncouragement(this.gameData.bubblesPopped),
    };
  }

  /**
   * 计算手部偏好统计
   */
  calculateHandPreference() {
    const { leftHand, rightHand, unknown } = this.gameData.handStats;
    const total = leftHand + rightHand + unknown;

    console.log("📊 计算手部偏好 - 原始数据:", {
      leftHand,
      rightHand,
      unknown,
      total,
    });

    if (total === 0) {
      console.log("📊 没有手部数据，返回none");
      return {
        preferredHand: "none",
        leftPercentage: 0,
        rightPercentage: 0,
        suggestion: "开始戳破泡泡来看看你更喜欢用哪只手！",
      };
    }

    const leftPercentage = Math.round((leftHand / total) * 100);
    const rightPercentage = Math.round((rightHand / total) * 100);

    let preferredHand = "balanced";
    let suggestion = "";

    if (leftHand > rightHand && leftPercentage > 60) {
      preferredHand = "left";
      suggestion = "你更喜欢用左手！下次试试右手，平衡使用双手更有益 🤚";
    } else if (rightHand > leftHand && rightPercentage > 60) {
      preferredHand = "right";
      suggestion = "你更喜欢用右手！下次试试左手，平衡使用双手更有益 🤚";
    } else {
      preferredHand = "balanced";
      suggestion = "很棒！你平衡使用了双手，对运动技能发展很好 👏";
    }

    return {
      preferredHand,
      leftPercentage,
      rightPercentage,
      leftCount: leftHand,
      rightCount: rightHand,
      suggestion,
    };
  }

  /**
   * 生成鼓励消息
   */
  generateEncouragement(bubbles, accuracy) {
    const messages = {
      excellent: [
        "🌟 太棒了！你是真正的泡泡大师！",
        "🎉 完美的表现！你的协调性令人惊叹！",
        "🏆 出色！你已经掌握了游戏的精髓！",
      ],
      great: [
        "👏 很棒的表现！继续保持这个节奏！",
        "🎯 做得很好！你的技巧在不断提升！",
        "⭐ 优秀！你的专注力很强！",
      ],
      good: [
        "👍 不错的开始！多练习会更好！",
        "🌈 很好！每一次尝试都是进步！",
        "💪 加油！你正在稳步提升！",
      ],
      encouraging: [
        "🌱 很好的尝试！游戏就是要享受过程！",
        "😊 没关系，放松心情最重要！",
        "🎮 继续努力！每个人都有自己的节奏！",
      ],
    };

    let category;
    if (bubbles >= 25 && accuracy >= 80) {
      category = "excellent";
    } else if (bubbles >= 15 && accuracy >= 60) {
      category = "great";
    } else if (bubbles >= 8 && accuracy >= 40) {
      category = "good";
    } else {
      category = "encouraging";
    }

    const categoryMessages = messages[category];
    return categoryMessages[
      Math.floor(Math.random() * categoryMessages.length)
    ];
  }

  /**
   * 更新结果显示
   */
  updateResultDisplay(stats) {
    // 更新数值
    const elements = {
      bubbles: document.getElementById("result-bubbles"),
      speed: document.getElementById("result-speed"),
      combo: document.getElementById("result-combo"),
      handPreference: document.getElementById("result-hand-preference"),
      encouragement: document.getElementById("result-encouragement"),
    };

    if (elements.bubbles) elements.bubbles.textContent = stats.bubblesPopped;
    if (elements.speed) elements.speed.textContent = stats.avgSpeed;
    if (elements.combo) elements.combo.textContent = stats.maxConsecutive;
    if (elements.handPreference) {
      // 显示手部偏好 - 只显示偏好类型，不包含"偏好"等词汇
      const handPref = stats.handPreference;
      console.log("🖥️ 更新手部偏好显示:", handPref);

      if (handPref.preferredHand === "left") {
        elements.handPreference.textContent = "左手";
      } else if (handPref.preferredHand === "right") {
        elements.handPreference.textContent = "右手";
      } else if (handPref.preferredHand === "balanced") {
        elements.handPreference.textContent = "双手";
      } else if (handPref.preferredHand === "none") {
        // 改为更直观的文本
        elements.handPreference.textContent = "未检测";
      } else {
        elements.handPreference.textContent = "未知";
      }
    }
    if (elements.encouragement) {
      // 组合原有鼓励消息和手部建议
      const encouragementText = stats.encouragement;
      const handSuggestion = stats.handPreference.suggestion;

      // 如果有手部建议，显示更简洁的格式
      if (
        handSuggestion &&
        handSuggestion !== "开始戳破泡泡来看看你更喜欢用哪只手！"
      ) {
        elements.encouragement.innerHTML = `${encouragementText}<br>💡 ${handSuggestion}`;
      } else {
        elements.encouragement.textContent = encouragementText;
      }
    }

    // 添加数字动画效果
    this.animateNumbers();

    // 更新 Debug Panel
    this.updateDebugPanel();
  }

  formatPatternType(type) {
    switch (type) {
      case "sequential_pentatonic":
        return "顺序型（CDEGA 上行）";
      case "repetitive":
        return "重复型（高重复）";
      case "exploratory":
        return "探索型（高多样）";
      case "sparse":
        return "稀疏型（低密度）";
      case "dense":
        return "密集型（高密度）";
      case "mixed":
        return "混合型";
      default:
        return "未知";
    }
  }

  formatStyleType(type) {
    switch (type) {
      case "sequential":
        return "顺序型";
      case "repetitive":
        return "重复型";
      case "exploratory":
        return "探索型";
      case "disabled":
        return "Reward 已关闭";
      default:
        return "混合/默认";
    }
  }

  fillDebugList(listEl, items) {
    if (!listEl) return;
    listEl.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      listEl.appendChild(li);
    });
  }

  updateDebugPanel() {
    const patternList = document.getElementById("debug-pattern-list");
    const ruleList = document.getElementById("debug-rule-list");
    const structureList = document.getElementById("debug-structure-list");

    if (!patternList || !ruleList || !structureList) return;

    const sequence = window.lastGeneratedSequence;
    const payload = sequence?.debugPayload;

    if (!payload) {
      this.fillDebugList(patternList, ["暂无 reward 或 debugPayload"]);
      this.fillDebugList(ruleList, ["请先完成一局以生成分析"]);
      this.fillDebugList(structureList, ["等待生成结构摘要"]);
      return;
    }

    const patternSummary = payload.patternSummary || {};
    const melodySpec = payload.melodySpec || {};
    const sessionConfig = payload.sessionConfig || {};

    const motifs = Array.isArray(patternSummary.detectedMotifs)
      ? patternSummary.detectedMotifs.map((m) => m.join("-"))
      : [];

    const patternItems = [
      `Pattern type: ${this.formatPatternType(patternSummary.patternType)}`,
      `N clicks: ${patternSummary.totalClicks || 0}`,
      `Dominant note: ${patternSummary.dominantNote || "-"}`,
      `Dominant lane ratio: ${Number(patternSummary.dominantLaneRatio || 0).toFixed(2)} (Lane ${patternSummary.dominantLaneId || "-"})`,
      `Run-length: avg ${Number(patternSummary.avgRunLen || 0).toFixed(2)}, max ${patternSummary.maxRunLen || 0}`,
      `Lane diversity: ${patternSummary.laneDiversity || 0} / 5`,
      `Transition entropy H: ${Number(patternSummary.transitionEntropy || 0).toFixed(2)}`,
      `Strict-hit(CDEGA): ${patternSummary.hitStrict || 0}, coverage ${(Number(patternSummary.coverage || 0) * 100).toFixed(0)}%`,
      `Hits/sec: ${Number(patternSummary.hitsPerSec || 0).toFixed(2)}`,
      `Detected motifs: ${motifs.length ? motifs.join(", ") : "无"}`,
    ];
    this.fillDebugList(patternList, patternItems);

    const ruleItems = [];
    const seqPass =
      (patternSummary.hitStrict || 0) >= 2 &&
      (patternSummary.coverage || 0) >= 0.25 &&
      (patternSummary.laneDiversity || 0) >= 4;
    const repPass =
      (patternSummary.dominantLaneRatio || 0) >= 0.6 &&
      ((patternSummary.maxRunLen || 0) >= 4 || (patternSummary.avgRunLen || 0) >= 2.2) &&
      (patternSummary.transitionEntropy || 0) <= 0.4;
    const expPass =
      (patternSummary.laneDiversity || 0) >= 5 &&
      (patternSummary.transitionEntropy || 0) >= 0.6 &&
      (patternSummary.dominantLaneRatio || 0) <= 0.45;

    if (patternSummary.patternType === "sequential_pentatonic") {
      ruleItems.push("Sequential 条件：hit_strict ≥ 2 且 coverage ≥ 0.25 且 div ≥ 4");
      ruleItems.push("CDEGA strict-hit：窗口 ≤ 7，且相邻点击间隔 ≤ 1.2s");
    } else if (patternSummary.patternType === "repetitive") {
      ruleItems.push("Repetitive 条件：r_dom ≥ 0.60 且 run-length 明显 且 H ≤ 0.40");
    } else if (patternSummary.patternType === "exploratory") {
      ruleItems.push("Exploratory 条件：div = 5 且 H ≥ 0.60 且 r_dom ≤ 0.45");
      ruleItems.push("且不满足 Sequential / Repetitive");
    } else {
      ruleItems.push("Mixed：最大分数 < 0.6 或第一/第二差距 < 0.15");
    }

    const seqScore = Number(patternSummary.seqScore || 0).toFixed(2);
    const repScore = Number(patternSummary.repScore || 0).toFixed(2);
    const expScore = Number(patternSummary.expScore || 0).toFixed(2);
    const scores = [
      { label: "S_seq", score: Number(patternSummary.seqScore || 0) },
      { label: "S_rep", score: Number(patternSummary.repScore || 0) },
      { label: "S_exp", score: Number(patternSummary.expScore || 0) },
    ].sort((a, b) => b.score - a.score);
    const gap = (scores[0].score - scores[1].score).toFixed(2);
    ruleItems.push(`Scores: S_seq=${seqScore}, S_rep=${repScore}, S_exp=${expScore}, gap=${gap}`);

    const density = melodySpec.rhythmDensity || sessionConfig.rhythmDensity || "normal";
    const densityDesc = density === "sparse" ? "每 2 拍 1 音" : "每拍 1 音 / 少量八分";
    ruleItems.push(`节奏密度: ${density}（${densityDesc}）`);

    const timbre = melodySpec.timbre || sessionConfig.timbre || "soft";
    ruleItems.push(`音色: ${timbre}（soft 更柔和 / bright 更明亮）`);

    ruleItems.push(
      `安全约束: ${melodySpec.scale || "C pentatonic"} / BPM ${Math.round(melodySpec.bpm || 72)} / 和声 I-V`
    );
    this.fillDebugList(ruleList, ruleItems);

    const phrase = melodySpec.phrases?.[0] || {};
    const phraseNotes = Array.isArray(phrase.notes) ? phrase.notes.length : 0;
    const chordBars = Array.isArray(melodySpec.chordTrack) ? melodySpec.chordTrack.length : 0;
    const totalTime = typeof sequence?.totalTime === "number" ? sequence.totalTime.toFixed(1) : "0";

    const structureItems = [
      `结构风格: ${this.formatStyleType(melodySpec.styleType)}`,
      `主旋律: ${phrase.label || "-"}，音符数 ${phraseNotes}`,
      `时长: ${totalTime}s，BPM ${Math.round(melodySpec.bpm || 72)}`,
      `左手和弦: I/V 长音（${chordBars} 小节）`,
      `Reward 开关: ${sessionConfig.rewardEnabled === false ? "Off" : "On"}`,
    ];
    this.fillDebugList(structureList, structureItems);
  }

  /**
   * 数字动画效果
   */
  animateNumbers() {
    const numberElements = document.querySelectorAll(".stat-value");

    numberElements.forEach((element, index) => {
      const text = element.textContent;
      // 仅当内容是数字时才执行动画，避免把“左手/右手/双手”替换成 0
      const numeric = !isNaN(Number(text));
      if (!numeric) return;

      const finalValue = Number(text);
      element.textContent = "0";

      // 延迟动画，让数字依次出现
      setTimeout(() => {
        this.animateNumber(element, 0, finalValue, 1000);
      }, index * 200);
    });
  }

  /**
   * 单个数字的动画
   */
  animateNumber(element, start, end, duration) {
    const startTime = Date.now();
    const isFloat = end % 1 !== 0;

    const updateNumber = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 使用缓动函数
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easeOut;

      if (isFloat) {
        element.textContent = current.toFixed(1);
      } else {
        element.textContent = Math.round(current);
      }

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      } else {
        element.textContent = isFloat ? end.toFixed(1) : end;
      }
    };

    requestAnimationFrame(updateNumber);
  }

  /**
   * 开始新一轮游戏
   */
  startNewGame() {
    console.log("🔄 开始新一轮游戏");
    this.hideResultWindow();

    // 清除上一轮的音乐数据
    window.lastGeneratedSequence = null;
    console.log("🎵 已清除上一轮音乐数据");

    // 重置游戏引擎
    if (window.game) {
      // 停止当前游戏
      window.game.stop();

      // 重置游戏状态
      window.game.reset();

      // 刷新画面，清掉上一帧残影
      window.game.clearCanvas?.();
      window.game.drawBackground?.();

      // 重置成就系统
      if (window.autismFeatures) {
        window.autismFeatures.resetAchievements();
      }

      // 开始新的数据收集
      this.startGame();

      // 延迟启动新游戏
      setTimeout(() => {
        window.game.start();
        window.game.startRound(60, {
          clearHistory: true,
          onEnd: async (session) => {
            try {
              console.log("新一轮游戏结束:", session);
              window.game.stop();

              // 触发游戏结果管理器结束游戏并显示结果
              if (window.gameResultManager) {
                window.gameResultManager.endGame();
                console.log("📊 游戏结果已显示");
              }

              // 为新一轮生成新的音乐
              const enableMusicGeneration = window.enableAIMusic || false;

              if (enableMusicGeneration) {
                setTimeout(async () => {
                  try {
                    await generateMelodyFromSession(session, {
                      primerBars: 2,
                      continueSteps: 64,
                      temperature: 1.0,
                      downloadMidi: false,
                    });
                  } catch (musicError) {
                    console.warn(
                      "🎵 音乐生成失败，但不影响游戏结果:",
                      musicError
                    );
                  }
                }, 100);
              } else {
                // 为新一轮创建新的丰富测试音乐
                window.lastGeneratedSequence = createRichTestMusic(session);
                console.log("🎵 新一轮音乐已生成");
                window.gameResultManager?.updateDebugPanel?.();
              }
            } catch (err) {
              console.error("[AI] submit failed:", err);
            }
          },
        });
        console.log("✅ 新一轮游戏已启动");
      }, 500);
    } else {
      console.error("❌ 游戏引擎未找到");
    }
  }

  /**
   * 播放生成的音乐
   */
  async playGeneratedMusic() {
    console.log("🎵 尝试播放生成的音乐");

    try {
      // 检查是否有最后生成的音乐序列
      if (!window.lastGeneratedSequence) {
        console.warn("⚠️ 没有找到生成的音乐序列");
        this.showMusicError("没有找到生成的音乐，请先完成一局游戏");
        return;
      }

      // 兜底获取播放器
      const player = window.MAGENTA?.player || window.gameApp?.MAGENTA?.player;
      if (!player) {
        console.warn("⚠️ Magenta播放器未准备好");
        this.showMusicError("音乐播放器未准备好，请稍后再试");
        return;
      }

      // 停止当前播放的音乐
      player.stop();

      // 恢复音频上下文（如果需要）
      try {
        await window.mm.Player.tone?.context?.resume?.();
      } catch (e) {
        console.log("音频上下文恢复失败，但继续播放:", e);
      }

      // 播放音乐
      player.start(window.lastGeneratedSequence);

      // 显示播放提示
      this.showMusicMessage("🎵 正在播放你创作的音乐！");

      // 更新按钮状态并添加下载选项
      const playMusicBtn = document.getElementById("play-music-btn");
      if (playMusicBtn) {
        const originalText = playMusicBtn.textContent;
        playMusicBtn.textContent = "🎵 正在播放...";
        playMusicBtn.disabled = true;

        // 3秒后恢复按钮状态并添加下载选项
        setTimeout(() => {
          playMusicBtn.textContent = "💾 下载音乐文件";
          playMusicBtn.disabled = false;

          // 更改点击事件为下载
          playMusicBtn.onclick = () => this.downloadGeneratedMusic();
        }, 3000);
      }
    } catch (error) {
      console.error("❌ 播放音乐时出错:", error);
      this.showMusicError("播放音乐时出现错误，请重试");
    }
  }

  /**
   * 下载生成的音乐
   */
  downloadGeneratedMusic() {
    console.log("💾 尝试下载生成的音乐");

    try {
      if (!window.lastGeneratedSequence) {
        console.log("🎵 没有生成的音乐，创建测试序列...");
        window.lastGeneratedSequence = this.createTestMusicSequence();
      }

      let enhancedSequence = window.enhanceMidiSequence
        ? window.enhanceMidiSequence(window.lastGeneratedSequence)
        : window.lastGeneratedSequence;

      // 兜底：确保 Magenta 可能读取的数组字段均存在
      if (!Array.isArray(enhancedSequence.notes)) {
        enhancedSequence.notes = [];
      }
      enhancedSequence.tempos =
        Array.isArray(enhancedSequence.tempos) &&
        enhancedSequence.tempos.length > 0
          ? enhancedSequence.tempos
          : [{ time: 0, qpm: window.gameApp?.MAGENTA?.qpm || 120 }];

      enhancedSequence.timeSignatures =
        Array.isArray(enhancedSequence.timeSignatures) &&
        enhancedSequence.timeSignatures.length > 0
          ? enhancedSequence.timeSignatures
          : [{ time: 0, numerator: 4, denominator: 4 }];

      enhancedSequence.keySignatures = Array.isArray(
        enhancedSequence.keySignatures
      )
        ? enhancedSequence.keySignatures
        : [{ time: 0, key: 0, scale: 0 }];

      enhancedSequence.controlChanges = Array.isArray(
        enhancedSequence.controlChanges
      )
        ? enhancedSequence.controlChanges
        : [];

      enhancedSequence.instrumentInfos = Array.isArray(
        enhancedSequence.instrumentInfos
      )
        ? enhancedSequence.instrumentInfos
        : [];

      enhancedSequence.ticksPerQuarter ||= 220;
      enhancedSequence.totalTime ||=
        enhancedSequence.notes.length > 0
          ? Math.max(...enhancedSequence.notes.map((n) => n.endTime)) + 0.5
          : 2.0;

      // 优先使用 Magenta 的 MIDI 转换；若失败，自动降级为 JSON
      if (window.mm && typeof window.mm.sequenceProtoToMidi === "function") {
        let midi;
        try {
          midi = window.mm.sequenceProtoToMidi(enhancedSequence);
        } catch (convErr) {
          console.warn("⚠️ MIDI转换失败，降级为JSON保存:", convErr);
          this.downloadMusicAsJson(enhancedSequence);
          return;
        }

        if (!midi || typeof midi.length === "undefined") {
          console.warn("⚠️ MIDI数据无效，降级为JSON保存");
          this.downloadMusicAsJson(enhancedSequence);
          return;
        }

        const blob = new Blob([midi], { type: "audio/midi" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `my_bubble_music_${Date.now()}.mid`;
        a.click();
        URL.revokeObjectURL(url);

        this.showMusicMessage("💾 MIDI音乐文件已下载！");
        console.log(
          "✅ MIDI文件下载成功，包含",
          enhancedSequence.notes.length,
          "个音符"
        );
      } else {
        console.warn("⚠️ Magenta MIDI转换不可用，改用JSON保存");
        this.downloadMusicAsJson(enhancedSequence);
      }
    } catch (error) {
      console.error("❌ 下载音乐时出错:", error);
      this.showMusicError("下载音乐时出现错误：" + error.message);
    }
  }

  /**
   * 创建测试音乐序列
   */
  createTestMusicSequence() {
    return {
      ticksPerQuarter: 220,
      totalTime: 8.0,
      tempos: [{ time: 0, qpm: 120 }],
      notes: [
        // C大调音阶上行
        { pitch: 60, startTime: 0.0, endTime: 0.5, velocity: 80 }, // C4
        { pitch: 62, startTime: 0.5, endTime: 1.0, velocity: 80 }, // D4
        { pitch: 64, startTime: 1.0, endTime: 1.5, velocity: 80 }, // E4
        { pitch: 65, startTime: 1.5, endTime: 2.0, velocity: 80 }, // F4
        { pitch: 67, startTime: 2.0, endTime: 2.5, velocity: 80 }, // G4
        { pitch: 69, startTime: 2.5, endTime: 3.0, velocity: 80 }, // A4
        { pitch: 71, startTime: 3.0, endTime: 3.5, velocity: 80 }, // B4
        { pitch: 72, startTime: 3.5, endTime: 4.0, velocity: 80 }, // C5

        // 简单的和弦
        { pitch: 60, startTime: 4.0, endTime: 6.0, velocity: 70 }, // C4
        { pitch: 64, startTime: 4.0, endTime: 6.0, velocity: 70 }, // E4
        { pitch: 67, startTime: 4.0, endTime: 6.0, velocity: 70 }, // G4

        // 结束音
        { pitch: 72, startTime: 6.0, endTime: 8.0, velocity: 90 }, // C5
      ],
      instrumentInfos: [{ instrument: 0, program: 0, isDrum: false }],
    };
  }

  /**
   * 显示音乐相关消息
   */
  showMusicMessage(message) {
    // 创建临时消息元素
    const messageEl = document.createElement("div");
    messageEl.className = "music-message";
    messageEl.textContent = message;
    messageEl.style.cssText = `
            position: fixed;
            top: 120px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #FF6B6B, #FF8E53);
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
            z-index: 2001;
            animation: fadeInOut 3s ease-in-out;
        `;

    document.body.appendChild(messageEl);

    // 3秒后移除消息
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 3000);
  }

  /**
   * 显示音乐错误消息
   */
  showMusicError(message) {
    // 创建临时错误消息元素
    const messageEl = document.createElement("div");
    messageEl.className = "music-error";
    messageEl.textContent = message;
    messageEl.style.cssText = `
            position: fixed;
            top: 120px;
            left: 50%;
            transform: translateX(-50%);
            background: #FF5252;
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(255, 82, 82, 0.3);
            z-index: 2001;
            animation: fadeInOut 4s ease-in-out;
        `;

    document.body.appendChild(messageEl);

    // 4秒后移除消息
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 4000);
  }

  /**
   * 辅助：降级为 JSON 方式保存
   */
  downloadMusicAsJson(sequence) {
    try {
      const jsonData = JSON.stringify(sequence, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my_bubble_music_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      this.showMusicMessage("💾 音乐数据已下载（JSON格式）！");
      console.log(
        "✅ JSON文件下载成功，包含",
        Array.isArray(sequence.notes) ? sequence.notes.length : 0,
        "个音符"
      );
    } catch (e) {
      console.error("❌ JSON下载失败:", e);
      this.showMusicError("下载音乐的降级方案也失败：" + e.message);
    }
  }

  /**
   * 获取游戏数据（用于调试或导出）
   */
  getGameData() {
    return {
      ...this.gameData,
      stats: this.calculateStats(),
    };
  }
}

// 导出类
window.GameResultManager = GameResultManager;

if (!window.gameResultManager) {
  window.gameResultManager = new GameResultManager();
}
