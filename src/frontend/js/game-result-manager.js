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
    const debugHelpToggleBtn = document.getElementById("debug-help-toggle");
    const debugHelp = document.getElementById("debug-help");
    const postSessionBtn = document.getElementById("post-session-btn");
    const debugPanel = document.getElementById("debug-panel");
    const expertModeCheckbox = document.getElementById("expert-mode-checkbox");
    const debugRefreshBtn = document.getElementById("debug-refresh-btn");

    // Expert Mode按钮 - 切换debug panel显示
    if (postSessionBtn && debugPanel) {
      console.log("[GameResult] Expert Mode Button & Debug Panel found");
      postSessionBtn.addEventListener("click", () => {
        console.log("[GameResult] Expert Mode Button clicked");
        const isHidden = debugPanel.classList.toggle("hidden");
        console.log("Debug Panel hidden:", isHidden);
        
        // 更新按钮文本（使用SVG图标）
        const eyeIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
        if (isHidden) {
          postSessionBtn.innerHTML = eyeIcon + '<span style="margin-left:4px">专家模式</span>';
        } else {
          postSessionBtn.innerHTML = eyeIcon + '<span style="margin-left:4px">隐藏专家</span>';
        }
        
        // 如果展开了面板，强制刷新一次数据以确保显示最新状态
        if (!isHidden) {
          this.updateDebugPanel();
        }
      });
      console.log("[GameResult] Event listener attached to Expert Mode Button");
    } else {
      console.error("[GameResult] Expert Mode Button or Debug Panel not found in DOM", {
        postSessionBtn: !!postSessionBtn,
        debugPanel: !!debugPanel
      });
    }

    // Debug刷新按钮 - 手动刷新debug panel数据
    if (debugRefreshBtn) {
      const refreshIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>';
      const checkIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      debugRefreshBtn.addEventListener("click", () => {
        console.log("[GameResult] Debug Refresh Button clicked");
        this.updateDebugPanel();
        
        // 添加视觉反馈
        debugRefreshBtn.innerHTML = checkIcon + ' 已刷新';
        debugRefreshBtn.disabled = true;
        
        setTimeout(() => {
          debugRefreshBtn.innerHTML = refreshIcon + ' 刷新';
          debugRefreshBtn.disabled = false;
        }, 1000);
      });
      console.log("[GameResult] Event listener attached to Debug Refresh Button");
    }

    if (expertModeCheckbox) {
      expertModeCheckbox.addEventListener("change", (e) => {
        console.log("[Settings] Expert Mode toggled:", e.target.checked);
        if (window.lastGeneratedSequence && window.lastGeneratedSequence.debugPayload) {
          if (!window.lastGeneratedSequence.debugPayload.sessionConfig) {
            window.lastGeneratedSequence.debugPayload.sessionConfig = {};
          }
          window.lastGeneratedSequence.debugPayload.sessionConfig.expertMode = e.target.checked;
          this.updateDebugPanel();
        }
      });
    }

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

    if (debugHelpToggleBtn && debugHelp) {
      debugHelpToggleBtn.addEventListener("click", () => {
        const isHidden = debugHelp.classList.toggle("hidden");
        debugHelpToggleBtn.textContent = isHidden ? "How to read" : "Hide help";
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
    console.log("[Game] 游戏数据收集开始");
  }

  /**
   * 记录成功戳泡泡
   * @param {string} handType - 使用的手部类型: 'leftHand', 'rightHand', 'unknown'
   */
  recordBubblePop(handType = "unknown") {
    if (!this.isActive) {
      console.warn("[Game] 游戏未激活，无法记录泡泡戳破");
      return;
    }

    const now = Date.now();
    this.gameData.bubblesPopped++;
    this.gameData.currentConsecutive++;
    this.gameData.popTimes.push(now);

    // 记录手部使用统计
    console.log(
      "[Stats] 记录手部统计 - 类型:",
      handType,
      "记录前:",
      this.gameData.handStats
    );
    if (this.gameData.handStats[handType] !== undefined) {
      this.gameData.handStats[handType]++;
    } else {
      this.gameData.handStats.unknown++;
    }
    console.log("[Stats] 记录手部统计 - 记录后:", this.gameData.handStats);

    // 更新最高连击
    if (this.gameData.currentConsecutive > this.gameData.maxConsecutive) {
      this.gameData.maxConsecutive = this.gameData.currentConsecutive;
    }

    console.log(
      "[Game] 记录泡泡戳破，总数:",
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
      console.warn("[Game] 游戏未激活，无法记录尝试");
      return;
    }

    this.gameData.totalAttempts++;
    console.log("[Stats] 记录尝试，总尝试次数:", this.gameData.totalAttempts);
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

    console.log("[Game] 游戏结束，显示结果");
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

    return {
      bubblesPopped: this.gameData.bubblesPopped,
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      maxConsecutive: this.gameData.maxConsecutive,
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

    console.log("[Stats] 计算手部偏好 - 原始数据:", {
      leftHand,
      rightHand,
      unknown,
      total,
    });

    if (total === 0) {
      console.log("[Stats] 没有手部数据，返回none");
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
      suggestion = "你更喜欢用左手！下次试试右手，平衡使用双手更有益。";
    } else if (rightHand > leftHand && rightPercentage > 60) {
      preferredHand = "right";
      suggestion = "你更喜欢用右手！下次试试左手，平衡使用双手更有益。";
    } else {
      preferredHand = "balanced";
      suggestion = "很棒！你平衡使用了双手，对运动技能发展很好。";
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
        "太棒了！你是真正的泡泡大师！",
        "完美的表现！你的协调性令人惊叹！",
        "出色！你已经掌握了游戏的精髓！",
      ],
      great: [
        "很棒的表现！继续保持这个节奏！",
        "做得很好！你的技巧在不断提升！",
        "优秀！你的专注力很强！",
      ],
      good: [
        "不错的开始！多练习会更好！",
        "很好！每一次尝试都是进步！",
        "加油！你正在稳步提升！",
      ],
      encouraging: [
        "很好的尝试！游戏就是要享受过程！",
        "没关系，放松心情最重要！",
        "继续努力！每个人都有自己的节奏！",
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
      encouragement: document.getElementById("result-encouragement"),
    };

    if (elements.bubbles) elements.bubbles.textContent = stats.bubblesPopped;
    if (elements.speed) elements.speed.textContent = stats.avgSpeed;
    if (elements.combo) elements.combo.textContent = stats.maxConsecutive;
    if (elements.encouragement) {
      elements.encouragement.textContent = stats.encouragement;
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
        return "顺序型（CDEGA 上下行）";
      case "repetitive":
        return "重复型（loop）";
      case "exploratory":
        return "探索型（走动）";
      case "disabled":
        return "Reward 已关闭";
      default:
        return "混合型";
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
    const decisionEl = document.getElementById("debug-summary-decision");
    const confidenceEl = document.getElementById("debug-summary-confidence");
    const safetyEl = document.getElementById("debug-summary-safety");
    const rewardEl = document.getElementById("debug-summary-reward");
    const reasonEl = document.getElementById("debug-summary-reason");
    const whatList = document.getElementById("debug-what-list");
    const whyList = document.getElementById("debug-why-list");
    const whyDetailsList = document.getElementById("debug-why-details-list");
    const structureList = document.getElementById("debug-structure-list");
    const signalList = document.getElementById("debug-signal-list");
    const counterfactualList = document.getElementById("debug-counterfactual-list");
    const constraintList = document.getElementById("debug-constraint-list");
    const configList = document.getElementById("debug-config-list");
    const timelineCanvas = document.getElementById("debug-timeline");
    const laneBars = document.getElementById("debug-lane-bars");

    if (!decisionEl || !confidenceEl || !safetyEl || !rewardEl || !whatList || !whyList || !signalList) {
      return;
    }

    const sequence = window.lastGeneratedSequence;
    const payload = sequence?.debugPayload;

    if (!payload) {
      decisionEl.textContent = "-";
      confidenceEl.textContent = "-";
      safetyEl.textContent = "-";
      rewardEl.textContent = "-";
      if (reasonEl) reasonEl.textContent = "-";
      this.fillDebugList(whatList, ["请先完成一局以生成分析"]);
      this.fillDebugList(whyList, ["暂无判定规则"]);
      if (whyDetailsList) {
        this.fillDebugList(whyDetailsList, []);
      }
      if (structureList) {
        this.fillDebugList(structureList, ["等待 reward 生成"]);
      }
      this.fillDebugList(signalList, ["暂无信号强度"]);
      if (counterfactualList) {
        this.fillDebugList(counterfactualList, ["暂无反事实解释"]);
      }
      if (constraintList) {
        this.fillDebugList(constraintList, ["等待 reward 生成后进行审计"]);
      }
      if (configList) {
        this.fillDebugList(configList, ["暂无配置记录"]);
      }
      if (timelineCanvas) {
        this.drawEmptyTimeline(timelineCanvas);
      }
      if (laneBars) {
        laneBars.innerHTML = "";
      }
      return;
    }

    const patternSummary = payload.patternSummary || {};
    const melodySpec = payload.melodySpec || {};
    const sessionConfig = payload.sessionConfig || {};
    const actionTrace = Array.isArray(payload.actionTrace) ? payload.actionTrace : [];
    const envelope = window.SESSION_ENVELOPE || {};
    const bpmEnvelope = envelope.rewardBpm || {};
    const durationEnvelope = envelope.rewardDurationSec || {};
    const bpmMin = Number.isFinite(bpmEnvelope.min) ? bpmEnvelope.min : 65;
    const bpmMax = Number.isFinite(bpmEnvelope.max) ? bpmEnvelope.max : 75;
    const durationMin = Number.isFinite(durationEnvelope.min) ? durationEnvelope.min : 10;
    const durationMax = Number.isFinite(durationEnvelope.max) ? durationEnvelope.max : 20;
    const rewardEnabled = sessionConfig.rewardEnabled !== false;

    const seqScore = Number(patternSummary.seqScore || 0);
    const repScore = Number(patternSummary.repScore || 0);
    const expScore = Number(patternSummary.expScore || 0);
    const scorePairs = [
      { label: "sequential_pentatonic", score: seqScore },
      { label: "repetitive", score: repScore },
      { label: "exploratory", score: expScore },
    ].sort((a, b) => b.score - a.score);
    const maxScore = scorePairs[0]?.score || 0;
    const gap = (scorePairs[0]?.score || 0) - (scorePairs[1]?.score || 0);

    const decisionMap = {
      sequential_pentatonic: "Sequential / 顺序型",
      repetitive: "Repetitive / 重复型",
      exploratory: "Exploratory / 探索型",
      mixed: "Mixed / 混合型",
      sparse: "Sparse / 稀疏",
      dense: "Dense / 密集",
    };
    const primaryLabel =
      decisionMap[patternSummary.patternType] ||
      decisionMap[scorePairs[0]?.label] ||
      "Mixed / 混合型";
    const secondaryLabel =
      scorePairs[1] && scorePairs[1].score >= 0.4
        ? decisionMap[scorePairs[1].label] || null
        : null;
    decisionEl.textContent = secondaryLabel
      ? `${primaryLabel}（次：${secondaryLabel}）`
      : primaryLabel;

    let confidence = "低";
    if (maxScore >= 0.75 && gap >= 0.2) confidence = "高";
    else if (maxScore >= 0.6 && gap >= 0.15) confidence = "中";
    confidenceEl.textContent = confidence;

    const bpm = melodySpec.bpm || sequence?.tempos?.[0]?.qpm || 0;
    const bpmOk = bpm >= bpmMin && bpm <= bpmMax;
    const bpmBorderline = bpmOk && (bpm - bpmMin < 1.5 || bpmMax - bpm < 1.5);

    const pitchClassSet = new Set([0, 2, 4, 7, 9]); // C D E G A
    const notes = Array.isArray(sequence?.notes) ? sequence.notes : [];
    let inScaleCount = 0;
    notes.forEach((n) => {
      if (pitchClassSet.has((n.pitch || 0) % 12)) {
        inScaleCount += 1;
      }
    });
    const notesInScale = notes.length === 0 ? true : inScaleCount === notes.length;
    const outOfScaleCount = notes.length === 0 ? 0 : Math.max(0, notes.length - inScaleCount);

    const beatSec = bpm ? 60 / bpm : 0.8;
    const melodyNotes = notes
      .filter((n) => n && typeof n.startTime === "number" && typeof n.endTime === "number")
      .filter((n) => n.endTime - n.startTime <= beatSec * 1.2)
      .sort((a, b) => a.startTime - b.startTime);
    let maxJump = 0;
    for (let i = 1; i < melodyNotes.length; i++) {
      const prev = melodyNotes[i - 1].velocity || 0;
      const curr = melodyNotes[i].velocity || 0;
      const denom = Math.max(prev, curr, 1);
      const jump = Math.abs(curr - prev) / denom;
      if (jump > maxJump) maxJump = jump;
    }
    const dynamicOk = melodyNotes.length < 2 ? true : maxJump <= 0.15;
    const dynamicBorderline = dynamicOk && maxJump >= 0.12;

    const chordTrack = Array.isArray(melodySpec.chordTrack)
      ? melodySpec.chordTrack
      : [];
    const badChordCount = chordTrack.filter((c) => c.chordType !== "I" && c.chordType !== "V").length;
    const harmonyOk = chordTrack.length === 0 ? true : badChordCount === 0;

    const durationSec = Number.isFinite(melodySpec.durationSec)
      ? melodySpec.durationSec
      : typeof sequence?.totalTime === "number"
      ? sequence.totalTime
      : 0;
    const durationOk = rewardEnabled
      ? durationSec >= durationMin && durationSec <= durationMax
      : true;
    const durationBorderline =
      rewardEnabled &&
      durationOk &&
      (durationSec - durationMin < 1 || durationMax - durationSec < 1);

    const safe = notesInScale && bpmOk && dynamicOk && harmonyOk && durationOk;
    const violationCount = [notesInScale, bpmOk, dynamicOk, harmonyOk, durationOk].filter((v) => !v).length;
    safetyEl.textContent = safe
      ? `Safe（0 违规）${bpmBorderline || dynamicBorderline || durationBorderline ? " ⚠️" : ""}`
      : `Needs attention（${violationCount} 违规）`;

    const density = melodySpec.rhythmDensity || sessionConfig.rhythmDensity || "normal";
    const densityLabel = density === "sparse" ? "稀疏" : "正常";
    const totalTime = durationSec ? durationSec.toFixed(1) : "0.0";
    rewardEl.textContent = rewardEnabled
      ? `BPM ${Math.round(bpm)} | ${melodySpec.scale || "C pentatonic"} | 和声 I/V | 时长 ${totalTime}s | 密度 ${densityLabel}`
      : "Reward Off（仅即时反馈）";

    if (reasonEl) {
      const coverage = Number(patternSummary.coverage || 0).toFixed(2);
      const rDom = Number(patternSummary.dominantLaneRatio || 0).toFixed(2);
      const entropy = Number(patternSummary.transitionEntropy || 0).toFixed(2);
      const reasonMap = {
        sequential_pentatonic: `CDEGA 严格命中 ${patternSummary.hitStrict || 0} 次，覆盖率 ${coverage} → 顺序型`,
        repetitive: `单 lane 占比 ${rDom}，连续重复明显 → 重复型`,
        exploratory: `lane 覆盖 ${patternSummary.laneDiversity || 0}，跳转不确定性 ${entropy} → 探索型`,
        mixed: `得分接近（gap ${gap.toFixed(2)}）→ 混合型`,
        sparse: "点击稀疏 → 稀疏型",
        dense: "点击密集 → 密集型",
      };
      reasonEl.textContent = reasonMap[patternSummary.patternType] || "判定依据不足，默认混合型";
    }

    const motifs = Array.isArray(patternSummary.detectedMotifs)
      ? patternSummary.detectedMotifs.map((m) => m.join("-"))
      : [];
    const rate = Number(patternSummary.hitsPerSec || 0);
    const rateLabel = rate < 0.8 ? "慢" : rate < 1.6 ? "中" : "快";

    const whatItems = [
      `Pattern type: ${this.formatPatternType(patternSummary.patternType)}`,
      `点击数: ${patternSummary.totalClicks || 0}`,
      `Dominant note: ${patternSummary.dominantNote || "-"}`,
      `点击速度: ${rateLabel}（${rate.toFixed(2)} /s）`,
      `Lane 覆盖: ${patternSummary.laneDiversity || 0} / 5`,
      `主导 lane: Lane ${patternSummary.dominantLaneId || "-"}（${(Number(patternSummary.dominantLaneRatio || 0) * 100).toFixed(0)}%）`,
      `CDEGA 严格命中: ${patternSummary.hitStrict || 0}（覆盖 ${(Number(patternSummary.coverage || 0) * 100).toFixed(0)}%）`,
      `常见 motifs: ${motifs.length ? motifs.join(", ") : "无"}`,
    ];
    this.fillDebugList(whatList, whatItems);

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
      (patternSummary.dominantLaneRatio || 0) <= 0.45 &&
      !seqPass &&
      !repPass;

    const ruleLine = (label, value, threshold, comparator = ">=") => {
      const useInt = Number.isInteger(threshold) && Number.isInteger(value);
      const valueText = useInt ? value.toFixed(0) : value.toFixed(2);
      const thresholdText = useInt ? threshold.toFixed(0) : threshold.toFixed(2);
      const delta = value - threshold;
      const deltaText = `${delta >= 0 ? "+" : ""}${useInt ? delta.toFixed(0) : delta.toFixed(2)}`;
      const pass = comparator === "<=" ? value <= threshold : value >= threshold;
      return `${pass ? "✅" : "❌"} ${label}: ${valueText} ${comparator} ${thresholdText} (${deltaText})`;
    };

    const topRules = [];
    if (patternSummary.patternType === "sequential_pentatonic") {
      topRules.push(
        ruleLine("CDEGA 严格命中", Number(patternSummary.hitStrict || 0), 2, ">="),
        ruleLine("顺序覆盖率", Number(patternSummary.coverage || 0), 0.25, ">="),
        ruleLine("lane 多样性", Number(patternSummary.laneDiversity || 0), 4, ">=")
      );
    } else if (patternSummary.patternType === "repetitive") {
      const maxRun = Number(patternSummary.maxRunLen || 0);
      const avgRun = Number(patternSummary.avgRunLen || 0);
      const runValue = Math.max(maxRun, avgRun);
      const runLabel = maxRun >= 4 ? "最大连续长度" : "平均连续长度";
      const runThreshold = maxRun >= 4 ? 4 : 2.2;
      topRules.push(
        ruleLine("单 lane 占比", Number(patternSummary.dominantLaneRatio || 0), 0.6, ">="),
        ruleLine(runLabel, runValue, runThreshold, ">="),
        ruleLine("跳转不确定性 H", Number(patternSummary.transitionEntropy || 0), 0.4, "<=")
      );
    } else if (patternSummary.patternType === "exploratory") {
      topRules.push(
        ruleLine("lane 覆盖", Number(patternSummary.laneDiversity || 0), 5, ">="),
        ruleLine("跳转不确定性 H", Number(patternSummary.transitionEntropy || 0), 0.6, ">="),
        ruleLine("单 lane 占比", Number(patternSummary.dominantLaneRatio || 0), 0.45, "<=")
      );
    } else {
      topRules.push(
        `得分差距不足（gap ${gap.toFixed(2)} < 0.15）`,
        `顺序性 ${seqScore.toFixed(2)} / 重复性 ${repScore.toFixed(2)} / 探索性 ${expScore.toFixed(2)}`,
        "建议：提高某一类的关键阈值命中，再观察判定变化"
      );
    }
    this.fillDebugList(whyList, topRules);

    const check = (label, pass, detail) =>
      `${pass ? "✅" : "❌"} ${label}${detail ? `（${detail}）` : ""}`;

    const fullRules = [
      check(
        "Sequential: 严格序列 ≥2",
        (patternSummary.hitStrict || 0) >= 2,
        `hit_strict ${patternSummary.hitStrict || 0}`
      ),
      check(
        "Sequential: 覆盖率 ≥25%",
        (patternSummary.coverage || 0) >= 0.25,
        `cov ${(Number(patternSummary.coverage || 0) * 100).toFixed(0)}%`
      ),
      check(
        "Sequential: lane 多样性 ≥4",
        (patternSummary.laneDiversity || 0) >= 4,
        `div ${patternSummary.laneDiversity || 0}`
      ),
      check(
        "Sequential: 相邻点击间隔 ≤1.2s",
        (patternSummary.hitStrict || 0) >= 1,
        "strict-hit 内置"
      ),
      check(
        "Repetitive: 单 lane 占比 ≥60%",
        (patternSummary.dominantLaneRatio || 0) >= 0.6,
        `r_dom ${(Number(patternSummary.dominantLaneRatio || 0) * 100).toFixed(0)}%`
      ),
      check(
        "Repetitive: run-length 明显",
        (patternSummary.maxRunLen || 0) >= 4 || (patternSummary.avgRunLen || 0) >= 2.2,
        `max ${patternSummary.maxRunLen || 0}, avg ${Number(patternSummary.avgRunLen || 0).toFixed(2)}`
      ),
      check(
        "Repetitive: 跳转不确定性 ≤0.40",
        (patternSummary.transitionEntropy || 0) <= 0.4,
        `H ${Number(patternSummary.transitionEntropy || 0).toFixed(2)}`
      ),
      check(
        "Exploratory: lane 覆盖 =5",
        (patternSummary.laneDiversity || 0) >= 5,
        `div ${patternSummary.laneDiversity || 0}`
      ),
      check(
        "Exploratory: 跳转不确定性 ≥0.60",
        (patternSummary.transitionEntropy || 0) >= 0.6,
        `H ${Number(patternSummary.transitionEntropy || 0).toFixed(2)}`
      ),
      check(
        "Exploratory: 单 lane 占比 ≤45%",
        (patternSummary.dominantLaneRatio || 0) <= 0.45,
        `r_dom ${(Number(patternSummary.dominantLaneRatio || 0) * 100).toFixed(0)}%`
      ),
      `最终选择：${decisionMap[patternSummary.patternType] || "Mixed / 混合型"}（最高分 ${maxScore.toFixed(2)}，差距 ${gap.toFixed(2)}）`,
    ];
    if (whyDetailsList) {
      this.fillDebugList(whyDetailsList, fullRules);
    }

    if (structureList) {
      const phraseNotes = Array.isArray(melodySpec.phrases?.[0]?.notes)
        ? melodySpec.phrases[0].notes
        : [];
      const noteCount = phraseNotes.length;
      const previewNotes = noteCount
        ? phraseNotes.slice(0, 8).join("-")
        : "-";
      const motifPreview = noteCount > 8 ? `${previewNotes}…` : previewNotes;
      const timbreLabel = (sessionConfig.timbre || melodySpec.timbre || "soft") === "bright"
        ? "bright（明亮）"
        : "soft（柔和）";
      const volumeLabel = sessionConfig.volumeLevel || "medium";
      const latencyLabel = Number(sessionConfig.feedbackLatencyMs || 0) > 0 ? "0.5s Delay" : "Immediate";
      const modeLabel = sessionConfig.expertMode ? "专家/调参" : "默认/安全";

      const structureItems = [
        `模式: ${modeLabel}`,
        `结构风格: ${this.formatStyleType(melodySpec.styleType)}`,
        `主旋律: ${motifPreview}（${noteCount} 音）`,
        `时长: ${totalTime}s | BPM ${Math.round(bpm)}`,
        `左手和弦: ${chordTrack.length ? "I/V 长音" : "无"}`,
        `音色/密度: ${timbreLabel} / ${densityLabel}`,
        `配置: 音量 ${volumeLabel} | 延迟 ${latencyLabel} | Reward ${rewardEnabled ? "On" : "Off"}`,
      ];
      this.fillDebugList(structureList, structureItems);
    }

    const signalItems = [
      `顺序证据: ${this.renderSignalBar(seqScore)} ${this.scoreLabel(seqScore)} (${Math.round(seqScore * 100)}%)`,
      `重复证据: ${this.renderSignalBar(repScore)} ${this.scoreLabel(repScore)} (${Math.round(repScore * 100)}%)`,
      `探索证据: ${this.renderSignalBar(expScore)} ${this.scoreLabel(expScore)} (${Math.round(expScore * 100)}%)`,
    ];
    this.fillDebugList(signalList, signalItems);

    if (counterfactualList) {
      const cfItems = [];
      if (patternSummary.patternType === "sequential_pentatonic") {
        cfItems.push(
          `若 strict-hit < 2（当前 ${patternSummary.hitStrict || 0}）或 coverage < 0.25（当前 ${(Number(patternSummary.coverage || 0)).toFixed(2)}），则不判顺序型`,
          `若 r_dom ≥ 0.60（当前 ${(Number(patternSummary.dominantLaneRatio || 0)).toFixed(2)}），更可能转为重复型`,
          `若 H ≥ 0.60 且 lane 覆盖=5（当前 ${patternSummary.laneDiversity || 0}），更可能转为探索型`
        );
      } else if (patternSummary.patternType === "repetitive") {
        cfItems.push(
          `若 r_dom < 0.60（当前 ${(Number(patternSummary.dominantLaneRatio || 0)).toFixed(2)}），则不判重复型`,
          `若连续重复减弱（max<4 且 avg<2.2），则重复证据不足`,
          `若 H ≥ 0.60 且 lane 覆盖高，可能转为探索型`
        );
      } else if (patternSummary.patternType === "exploratory") {
        cfItems.push(
          `若 lane 覆盖 < 5（当前 ${patternSummary.laneDiversity || 0}），则不判探索型`,
          `若 H < 0.60（当前 ${(Number(patternSummary.transitionEntropy || 0)).toFixed(2)}），探索证据不足`,
          `若 r_dom ≥ 0.60，则更可能判为重复型`
        );
      } else {
        const primary = scorePairs[0];
        const secondary = scorePairs[1];
        cfItems.push(
          `若 ${decisionMap[primary?.label] || "某类"} 得分 > 0.60 且领先 > 0.15，则不再混合`,
          `当前差距 ${gap.toFixed(2)}，提高主类证据或降低次类证据可改变判定`
        );
        if (secondary) {
          cfItems.push(
            `次高分为 ${decisionMap[secondary.label] || "其他"}（${secondary.score.toFixed(2)}）`
          );
        }
      }
      this.fillDebugList(counterfactualList, cfItems);
    }

    if (timelineCanvas) {
      const { indices } = this.detectStrictSequenceIndices(actionTrace, {
        maxWindow: 7,
        maxGapSec: 1.2,
      });
      this.drawActionTimeline(timelineCanvas, actionTrace, indices);
    }
    if (laneBars) {
      this.renderLaneBars(laneBars, actionTrace);
    }

    if (constraintList) {
      const durationLabel = rewardEnabled
        ? `${durationMin}–${durationMax}s（当前 ${totalTime}s）`
        : "Reward Off（未生成）";
      const checks = [
        `${notesInScale ? "✅" : "❌"} 音阶限制：${inScaleCount}/${notes.length} 在 C-D-E-G-A${outOfScaleCount ? `（超出 ${outOfScaleCount}）` : ""}`,
        `${bpmOk ? "✅" : "❌"} 速度限制：${bpmMin}–${bpmMax} BPM（当前 ${Math.round(bpm)})`,
        `${rewardEnabled ? (durationOk ? "✅" : "❌") : "⏸️"} 时长限制：${durationLabel}`,
        `${dynamicOk ? "✅" : "❌"} 动态跳变：最大 ${(maxJump * 100).toFixed(0)}%（阈值 15%）`,
        `${harmonyOk ? "✅" : "❌"} 和声限制：${badChordCount ? `超出 ${badChordCount}` : "仅 I-V"}`,
      ];
      this.fillDebugList(constraintList, checks);
    }

    if (configList) {
      const defaults = window.SESSION_DEFAULTS || {};
      const configItems = [];
      const modeLabel = sessionConfig.expertMode ? "专家/调参" : "默认/安全";
      const diffItems = [];
      const formatBool = (value) => (value ? "On" : "Off");
      const formatLatency = (value) =>
        Number(value || 0) > 0 ? "0.5s Delay" : "Immediate";
      const addDiff = (key, label, formatValue = (v) => v) => {
        if (!(key in defaults) || !(key in sessionConfig)) return;
        const base = defaults[key];
        const current = sessionConfig[key];
        const same = typeof base === "number"
          ? Number(base) === Number(current)
          : typeof base === "boolean"
          ? Boolean(base) === Boolean(current)
          : base === current;
        if (!same) {
          diffItems.push(`${label}: ${formatValue(base)} → ${formatValue(current)}`);
        }
      };

      addDiff("volumeLevel", "音量");
      addDiff("rhythmDensity", "密度");
      addDiff("timbre", "音色");
      addDiff("feedbackLatencyMs", "反馈延迟", formatLatency);
      addDiff("immediateToneMode", "即时音模式");
      addDiff("rewardEnabled", "Reward", formatBool);
      addDiff("rewardBpm", "Reward BPM", (v) => `${Math.round(Number(v))}`);
      addDiff("rewardDurationSec", "Reward 时长", (v) => `${Math.round(Number(v))}s`);

      configItems.push(`模式: ${modeLabel}`);
      if (diffItems.length) {
        configItems.push(`调整项: ${diffItems.length} 项`);
        diffItems.forEach((item) => configItems.push(item));
      } else {
        configItems.push("未调整（保守默认值）");
      }
      this.fillDebugList(configList, configItems);
    }
  }

  renderSignalBar(score) {
    const filled = Math.max(0, Math.min(5, Math.round(score * 5)));
    const empty = 5 - filled;
    return `[${"■".repeat(filled)}${"□".repeat(empty)}]`;
  }

  scoreLabel(score) {
    if (score >= 0.75) return "高";
    if (score >= 0.55) return "中";
    return "低";
  }

  detectStrictSequenceIndices(actions, { maxWindow = 7, maxGapSec = 1.2 } = {}) {
    const indices = new Set();
    if (!Array.isArray(actions) || actions.length < 5) {
      return { indices };
    }
    const ordered = [...actions].sort(
      (a, b) => (a.timeOffset || 0) - (b.timeOffset || 0)
    );
    const target = ["C", "D", "E", "G", "A"];
    const letters = ordered.map((a) => (a.note || "C")[0]);
    for (let i = 0; i < ordered.length; i++) {
      if (letters[i] !== "C") continue;
      const windowEnd = i + maxWindow - 1;
      let lastIdx = i;
      let lastTime = ordered[i].timeOffset || 0;
      const local = [i];
      let ok = true;
      for (let t = 1; t < target.length; t++) {
        let foundIdx = -1;
        for (let j = lastIdx + 1; j < ordered.length && j <= windowEnd; j++) {
          if (letters[j] !== target[t]) continue;
          const dt = (ordered[j].timeOffset || 0) - lastTime;
          if (dt <= maxGapSec) {
            foundIdx = j;
            break;
          }
          break;
        }
        if (foundIdx < 0) {
          ok = false;
          break;
        }
        local.push(foundIdx);
        lastIdx = foundIdx;
        lastTime = ordered[foundIdx].timeOffset || lastTime;
      }
      if (ok) {
        local.forEach((idx) => indices.add(idx));
      }
    }
    return { indices, ordered };
  }

  getLanePalette() {
    if (Array.isArray(window.BUBBLE_LANES) && window.BUBBLE_LANES.length) {
      return {
        colors: window.BUBBLE_LANES.map((lane) => lane.color),
        labels: window.BUBBLE_LANES.map((lane) => lane.note?.name?.[0] || "C"),
      };
    }
    return {
      colors: ["#e34f4f", "#f28c28", "#f2c14f", "#3e7ab8", "#4b4ba8"],
      labels: ["C", "D", "E", "G", "A"],
    };
  }

  drawEmptyTimeline(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f5f3f0";
    ctx.fillRect(0, 0, width, height);
  }

  drawActionTimeline(canvas, actions, highlightIndices = new Set()) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    const padding = 10;
    const laneCount = 5;
    const laneHeight = (height - padding * 2) / (laneCount - 1 || 1);
    const duration = 60;
    const palette = this.getLanePalette();

    ctx.strokeStyle = "#e8dcc6";
    ctx.lineWidth = 1;
    for (let i = 0; i < laneCount; i++) {
      const y = padding + i * laneHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#8b7355";
    ctx.font = "10px sans-serif";
    palette.labels.forEach((label, idx) => {
      const y = padding + idx * laneHeight + 3;
      ctx.fillText(label, 2, y);
    });

    if (!Array.isArray(actions) || actions.length === 0) {
      return;
    }

    const ordered = [...actions].sort(
      (a, b) => (a.timeOffset || 0) - (b.timeOffset || 0)
    );
    ordered.forEach((action, idx) => {
      const x = padding + ((action.timeOffset || 0) / duration) * (width - padding * 2);
      const laneIndex = Math.max(0, Math.min(laneCount - 1, (action.laneId || 1) - 1));
      const y = padding + laneIndex * laneHeight;
      ctx.beginPath();
      ctx.fillStyle = palette.colors[laneIndex] || "#888";
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      if (highlightIndices.has(idx)) {
        ctx.strokeStyle = "#5d4e37";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  renderLaneBars(container, actions) {
    const palette = this.getLanePalette();
    const counts = Array(5).fill(0);
    actions.forEach((action) => {
      const idx = (action.laneId || 1) - 1;
      if (idx >= 0 && idx < counts.length) {
        counts[idx] += 1;
      }
    });
    const maxCount = Math.max(...counts, 1);
    container.innerHTML = "";
    counts.forEach((count, idx) => {
      const row = document.createElement("div");
      row.className = "lane-bar-row";
      const label = document.createElement("div");
      label.className = "lane-bar-label";
      label.textContent = palette.labels[idx] || `L${idx + 1}`;
      const track = document.createElement("div");
      track.className = "lane-bar-track";
      const fill = document.createElement("div");
      fill.className = "lane-bar-fill";
      fill.style.width = `${(count / maxCount) * 100}%`;
      fill.style.background = palette.colors[idx] || "#bbb";
      track.appendChild(fill);
      const value = document.createElement("div");
      value.className = "lane-bar-value";
      value.textContent = count;
      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(value);
      container.appendChild(row);
    });
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
    console.log("[Game] 开始新一轮游戏");
    this.hideResultWindow();

    // 清除上一轮的音乐数据
    window.lastGeneratedSequence = null;
    console.log("[Music] 已清除上一轮音乐数据");

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
                console.log("[Game] 游戏结果已显示");
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
                      "[Music] 音乐生成失败，但不影响游戏结果:",
                      musicError
                    );
                  }
                }, 100);
              } else {
                // 为新一轮创建新的丰富测试音乐
                window.lastGeneratedSequence = createRichTestMusic(session);
                console.log("[Music] 新一轮音乐已生成");
                window.gameResultManager?.updateDebugPanel?.();
              }
            } catch (err) {
              console.error("[AI] submit failed:", err);
            }
          },
        });
        console.log("[Game] 新一轮游戏已启动");
      }, 500);
    } else {
      console.error("[Game] 游戏引擎未找到");
    }
  }

  /**
   * 播放生成的音乐
   */
  async playGeneratedMusic() {
    console.log("[Music] 尝试播放生成的音乐");

    try {
      if (window.__panicMute) {
        this.showMusicError("当前为静音状态，请先点击“恢复声音”");
        return;
      }
      // 检查是否有最后生成的音乐序列
      if (!window.lastGeneratedSequence) {
        console.warn("[Music] 没有找到生成的音乐序列");
        this.showMusicError("没有找到生成的音乐，请先完成一局游戏");
        return;
      }

      // 兜底获取播放器
      const player = window.MAGENTA?.player || window.gameApp?.MAGENTA?.player;
      if (!player) {
        console.warn("[Music] Magenta播放器未准备好");
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
      this.showMusicMessage("正在播放你创作的音乐！");

      // 更新按钮状态并添加下载选项
      const playMusicBtn = document.getElementById("play-music-btn");
      const musicIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';
      const downloadIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
      if (playMusicBtn) {
        const originalText = playMusicBtn.textContent;
        playMusicBtn.innerHTML = musicIcon + ' 正在播放...';
        playMusicBtn.disabled = true;

        // 3秒后恢复按钮状态并添加下载选项
        setTimeout(() => {
          playMusicBtn.innerHTML = downloadIcon + ' 下载音乐文件';
          playMusicBtn.disabled = false;

          // 更改点击事件为下载
          playMusicBtn.onclick = () => this.downloadGeneratedMusic();
        }, 3000);
      }
    } catch (error) {
      console.error("[Music] 播放音乐时出错:", error);
      this.showMusicError("播放音乐时出现错误，请重试");
    }
  }

  /**
   * 下载生成的音乐
   */
  downloadGeneratedMusic() {
    console.log("[Music] 尝试下载生成的音乐");

    try {
      if (!window.lastGeneratedSequence) {
        console.log("[Music] 没有生成的音乐，创建测试序列...");
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
          console.warn("[Music] MIDI转换失败，降级为JSON保存:", convErr);
          this.downloadMusicAsJson(enhancedSequence);
          return;
        }

        if (!midi || typeof midi.length === "undefined") {
          console.warn("[Music] MIDI数据无效，降级为JSON保存");
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

        this.showMusicMessage("MIDI音乐文件已下载！");
        console.log(
          "[Music] MIDI文件下载成功，包含",
          enhancedSequence.notes.length,
          "个音符"
        );
      } else {
        console.warn("[Music] Magenta MIDI转换不可用，改用JSON保存");
        this.downloadMusicAsJson(enhancedSequence);
      }
    } catch (error) {
      console.error("[Music] 下载音乐时出错:", error);
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

      this.showMusicMessage("音乐数据已下载（JSON格式）！");
      console.log(
        "[Music] JSON文件下载成功，包含",
        Array.isArray(sequence.notes) ? sequence.notes.length : 0,
        "个音符"
      );
    } catch (e) {
      console.error("[Music] JSON下载失败:", e);
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
