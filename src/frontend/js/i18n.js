/**
 * Internationalization (i18n) Module
 * Centralizes all text resources for the application
 */

const TRANSLATIONS = {
    zh: {
        // Header & Footer
        'header.mute': '静音',
        'header.unmute': '取消静音',
        'header.settings': '参数',
        'header.pause': '暂停',
        'ui.mute': '静音',
        'ui.unmute': '取消静音',
        'speed.slow': '慢速',
        'speed.normal': '正常',
        'speed.fast': '快速',
        'footer.instruction': '移动光标戳泡泡',
        'footer.inputMode': '输入方式: ',
        'footer.bubbleCount': '泡泡数: ',

        // Settings Modal
        'set.title': '游戏设置',
        'set.subtitle': '调整感官体验，让游戏更适合你',
        'set.volume': '音量',
        'set.timbre': '音色',
        'set.latency': '延迟',
        'set.feedback': '反馈音效',
        'set.reset': '恢复默认',
        'set.start': '开始游戏',
        'set.close': '关闭',
        
        'opt.low': '柔和',
        'opt.medium': '标准',
        'opt.high': '响亮',
        'opt.soft': '柔和',
        'opt.bright': '明亮',
        'opt.piano': '钢琴',
        'opt.epiano': '电钢',
        'opt.guitar': '吉他',
        'opt.strings': '弦乐',
        'opt.immediate': '即时',
        'opt.delay': '稍慢',
        'opt.full': '开启',
        'opt.visual': '仅视觉',
        'opt.off': '关闭',
        'opt.on': '开启',

        // Sidebar
        'sidebar.title': '实时监控',
        'sidebar.realtimeData': '实时数据',
        'sidebar.laneDist': 'Lane 分布',
        'sidebar.patternPredict': '模式预测',
        'sidebar.recentClicks': '最近点击',
        'sidebar.clickCount': '点击数',
        'sidebar.hitRate': '命中率',
        'sidebar.dominant': '主导Lane',
        'sidebar.tooltip.pattern': '顺序型: 顺序命中率>40% 且 lane≥4\n重复型: 主导lane占比>60%\n探索型: lane≥4 且 主导≤60%',

        'sidebar.waitingForData': '等待更多数据...',
        'sidebar.noData': '暂无',
        'sidebar.pattern.sequential': '顺序型 (CDEGA)',
        'sidebar.pattern.repetitive': '重复型',
        'sidebar.pattern.exploratory': '探索型',
        'sidebar.pattern.mixed': '混合型',

        // Report
        'report.title': '游戏报告',
        'report.behaviorPattern': '行为模式',
        'report.clickTrail': '点击轨迹与 Lane 分布',
        'report.musicParams': '音乐参数调整',
        'report.score.sequential': '顺序型',
        'report.score.repetitive': '重复型',
        'report.score.exploratory': '探索型',
        'report.tooltip.sequential': '顺序命中率 > 40% 且 lane覆盖 ≥ 4\n按 C→D→E→G→A 顺序点击的比例',
        'report.tooltip.repetitive': '主导lane占比 > 60%\n偏好重复点击同一个音符',
        'report.tooltip.exploratory': 'lane覆盖 ≥ 4 且 主导占比 ≤ 60%\n积极探索不同音符，分布均匀',

        // Expert Drawer
        'expert.titleTooltip': '专家模式 (Ctrl+Shift+E)',
        'expert.title': '🎵 音乐参数调整',
        'expert.close': '关闭',
        'expert.tempo': 'Tempo (BPM)',
        'expert.audioParams': '音效参数',
        'expert.volume': 'Gain',
        'expert.contrast': 'Accent ratio',
        'expert.density': '密度',
        'expert.warning.unsafe': '可能有感官过载风险',
        'expert.duration': '奖励时长',
        'expert.segment': '片段选择',
        'expert.segment.tip': '拖动滑块设置起始/结束位置',
        'expert.exit': '退出专家模式',
        'expert.behavior': '行为模式分析',
        'expert.clickTrail': '点击轨迹',
        'expert.patternRecognition': '模式识别',
        'expert.gameStats': '游戏统计',
        'expert.refresh': '导出会话报告',
        'pat.rule.sequential': '顺序命中率 {ratio}% > 40% 且 lane覆盖 {diversity} ≥ 4',
        'pat.rule.repetitive': '主导lane占比 {ratio}% > 60%（{lane}音）',
        'pat.rule.exploratory': 'lane覆盖 {diversity} ≥ 4 且 主导占比 {ratio}% ≤ 60%',
        'pat.rule.mixed': '未满足任何主导模式特征',
        'expert.mode.test': '测试模式',
        'expert.mode.converge': '收敛模式',
        'expert.btn.preview': '预览',
        'expert.btn.stop': '暂停',
        'expert.btn.reset': '重置',
        'expert.btn.save': '保存',
        'expert.msg.saved': '已保存（本地）',
        'expert.msg.failed': '提交失败',
        'expert.safeRange': '安全: ',
        'expert.harmony': '音乐',
        'expert.setSafeRange': '设定安全区间',
        'expert.dbNotConfigured': '数据库未配置',
        
        // Report
        'report.behaviorPattern': '行为模式',
        'report.clickTrail': '点击轨迹与 Lane 分布',

        // Game Engine
        'game.ready': '游戏准备就绪！',
        'game.paused': '已暂停',
        'game.samplingStarted': '开始采样：{seconds}s',
        'game.samplingCompleted': '采样完成，共 {count} 个音符',

        // UI Labels
        'ui.realtimeData': '实时数据',
        'ui.laneDist': 'Lane 分布',
        'ui.patternPredict': '模式预测',
        'ui.recentClicks': '最近点击',
        'ui.expertMode': '专家模式',
        'ui.gameOver': '游戏结束',
        'ui.play': '播放',
        'ui.playAgain': '重玩',
        'ui.finish': '结束',
        'ui.report': '游戏报告',
        'ui.inputMode': '输入方式: ',
        'ui.bubbleCount': '泡泡数: ',
        'ui.timeRemaining': '时间: ',
        'ui.gamePaused': '游戏暂停',
        'ui.clickContinue': '点击恢复按钮继续',
        'ui.resume': '继续',
        'ui.analyzing': '分析中...',
        'ui.waitingData': '等待数据...',
        'ui.saveSettings': '保存设置',

        // Settings Modal
        'settings.title': '游戏设置',
        'settings.subtitle': '调整感官体验，让游戏更适合你',
        'settings.volume': '音量大小',
        'settings.density': '泡泡数量',
        'settings.timbre': '乐器音色',
        'settings.latency': '声音延迟',
        'settings.feedback': '点击反馈',
        'settings.reward': '结束音乐',
        'settings.reset': '恢复默认',
        'settings.start': '开始游戏',
        'settings.close': '关闭',
        
        // Options
        'opt.low': '柔和',
        'opt.medium': '标准',
        'opt.high': '响亮',
        'opt.sparse': '少一点',
        'opt.normal': '正常',
        'opt.soft': '柔和钢琴',
        'opt.bright': '明亮小提琴',
        'opt.immediate': '即时',
        'opt.delay': '稍慢',
        'opt.full': '声音+视觉',
        'opt.visual': '仅视觉',
        'opt.off': '关闭',
        'opt.on': '开启',

        // Messages
        'msg.paused': '休息一下！',
        'msg.resume': '继续加油！',
        'msg.slow': '慢慢来，很好！',
        'msg.normal': '节奏刚好！',
        'msg.fast': '快速挑战！',
        'msg.welcome': '欢迎！移动鼠标戳泡泡！',
        'msg.saved': '设置已保存，将在下一轮生效',
        'msg.reward': 'Reward 已生成，点击“播放”欣赏音乐🎵',
        'msg.error': 'AI 生成失败：查看控制台错误',
        'msg.musicPlaying': '正在播放你创作的音乐！',
        'msg.musicError': '播放音乐时出现错误，请重试',
        'msg.downloadMidi': 'MIDI音乐文件已下载！',
        'msg.downloadJson': '音乐数据已下载（JSON格式）！',

        // Achievements & Autism Friendly
        'ach.consecutive5': '太棒了！连续戳中5个泡泡！',
        'ach.consecutive10': '连击高手！连续戳中10个泡泡！',
        'ach.consecutive15': '超级连击！连续戳中15个泡泡！',
        'ach.total10': '第一个里程碑！戳中10个泡泡！',
        'ach.total25': '进步神速！戳中25个泡泡！',
        'ach.total50': '协调大师！戳中50个泡泡！',
        'ach.total100': '传奇玩家！戳中100个泡泡！',
        'af.predictableMode': '规律模式：泡泡按固定位置出现',

        // Game Results & Stats
        'res.success': '成功击破',
        'res.speed': '平均速度',
        'res.combo': '最高连击',
        'res.unitBubbles': '个泡泡',
        'res.unitSpeed': '秒/个',
        'res.unitCombo': '连续',
        
        // Encouragement
        'enc.excellent': ['太棒了！你是真正的泡泡大师！', '完美的表现！你的协调性令人惊叹！', '出色！你已经掌握了游戏的精髓！'],
        'enc.great': ['很棒的表现！继续保持这个节奏！', '做得很好！你的技巧在不断提升！', '优秀！你的专注力很强！'],
        'enc.good': ['不错的开始！多练习会更好！', '很好！每一次尝试都是进步！', '加油！你正在稳步提升！'],
        'enc.encouraging': ['很好的尝试！游戏就是要享受过程！', '没关系，放松心情最重要！', '继续努力！每个人都有自己的节奏！'],

        // Patterns & Analysis
        'pat.sequential': '顺序型',
        'pat.repetitive': '重复型',
        'pat.exploratory': '探索型',
        'pat.mixed': '混合型',
        'pat.sparse': '稀疏型',
        'pat.dense': '密集型',
        'pat.desc.sequential': '顺序型（CDEGA 上下行）',
        'pat.desc.repetitive': '重复型（高重复）',
        'pat.desc.exploratory': '探索型（高多样）',
        'pat.desc.sparse': '稀疏型（低密度）',
        'pat.desc.dense': '密集型（高密度）',
        'pat.desc.mixed': '混合型',
        'pat.rule.sequential': '顺序命中率 {ratio}% > 40% 且 lane覆盖 {diversity} ≥ 4',
        'pat.rule.repetitive': '主导lane占比 {ratio}% > 60%（{lane}音）',
        'pat.rule.exploratory': 'lane覆盖 {diversity} ≥ 4 且 主导占比 {ratio}% ≤ 60%',
        'pat.rule.mixed': '未满足任一主导模式条件',

        // Pattern Rules (Dynamic)
        'pat.rule.sequential': '顺序命中率 {ratio}% > 40% 且 lane覆盖 {diversity} ≥ 4',
        'pat.rule.repetitive': '主导lane占比 {ratio}% > 60% ({lane})',
        'pat.rule.exploratory': 'lane覆盖 {diversity} ≥ 4 且 主导占比 {ratio}% ≤ 60%',
        'pat.rule.mixed': '未满足任何主导模式特征',

        // Hand Preference
        'hand.left': '你更喜欢用左手！下次试试右手，平衡使用双手更有益。',
        'hand.right': '你更喜欢用右手！下次试试左手，平衡使用双手更有益。',
        'hand.balanced': '很棒！你平衡使用了双手，对运动技能发展很好。',
        'hand.none': '开始戳破泡泡来看看你更喜欢用哪只手！',

        // Debug / Expert
        'debug.unsafe': '不安全模式',
        'debug.preview': '预览模式',
        'debug.clickRate': '点击率',
        'debug.successRate': '成功率',
        'debug.intercepts': '拦截数',
        'debug.safe': 'Safe（0 违规）',
        'debug.attention': 'Needs attention（{count} 违规）',
        'debug.rewardOff': 'Reward Off（仅即时反馈）',
        'debug.noData': '请先完成一局以生成分析',
        'debug.waiting': '等待 reward 生成',
        
        // Music Player
        'music.playing': ' 正在播放...',
        'music.download': ' 下载音乐文件',
        'music.error': '没有找到生成的音乐，请先完成一局游戏',
        'music.muted': '当前为静音状态，请先点击“恢复声音”',
        'music.playerNotReady': '音乐播放器未准备好，请稍后再试',
        'music.loadingSamples': '正在加载乐器采样...',
        'spectro.title.left': '无约束基线',
        'spectro.title.right': '约束优先输出',
        'spectro.label.spec': 'Log-Mel 频谱图 (dB)',
        'spectro.label.loudness': '响度轮廓 (LUFS)',
        'spectro.label.silence': '静音 / 无数据',
        'spectro.metrics.line': 'LRA: {lra} LU | Avg: {avg} LUFS | ΔE: {dE}'
        ,
        'spectro.summary.lra': '响度范围 (LRA): {raw} → {safe} LU (×{factor} 降幅)'
        ,
        'spectro.rawParams': '原始参数（行为派生）',
        'spectro.safeParams': '约束后参数',
        'ui.bpm': 'BPM',
        'ui.contrast': '对比度',
        'spectro.loading.title': '正在生成声纹对比图...',
        'spectro.loading.sub': '这可能需要几秒钟',
        'spectro.fail.title': '生成失败',
        'spectro.btn.generate': '生成对比',
        'spectro.btn.exportPng': '导出 PNG',
        'spectro.btn.exportJson': '导出 JSON',
        'spectro.msg.exportPngDone': '对比图已导出为 PNG'
    },
    en: {
        // Main UI (Restored)
        'ui.expertMode': 'Expert Mode',
        'ui.gameOver': 'Game Over',
        'ui.play': 'Play',
        'ui.playAgain': 'Play Again',
        'ui.finish': 'Finish',
        'ui.report': 'Game Report',
        'ui.analyzing': 'Analyzing...',
        'ui.waitingData': 'Waiting for data...',
        'ui.saveSettings': 'Save Settings',
        'ui.realtimeData': 'Real-time',
        'ui.laneDist': 'Lane Dist',
        'ui.patternPredict': 'Prediction',
        'ui.recentClicks': 'Recent Clicks',
        'ui.inputMode': 'Input: ',
        'ui.bubbleCount': 'Bubbles: ',
        'ui.timeRemaining': 'Time: ',
        'ui.gamePaused': 'Game Paused',
        'ui.clickContinue': 'Click resume button to continue',
        'ui.resume': 'Resume',

        // Header & Footer
        'header.mute': 'Mute',
        'header.unmute': 'Unmute',
        'header.settings': 'Params',
        'header.pause': 'Pause',
        'ui.mute': 'Mute',
        'ui.unmute': 'Unmute',
        'speed.slow': 'Slow',
        'speed.normal': 'Normal',
        'speed.fast': 'Fast',
        'footer.instruction': 'Move cursor to pop bubbles!',
        'footer.inputMode': 'Input: ',
        'footer.bubbleCount': 'Bubbles: ',

        // Settings Modal
        'set.title': 'Game Settings',
        'set.subtitle': 'Adjust sensory experience for your comfort',
        'set.volume': 'Volume',
        'set.timbre': 'Timbre',
        'set.latency': 'Latency',
        'set.feedback': 'Feedback',
        'set.reset': 'Reset',
        'set.start': 'Start Game',
        'set.close': 'Close',

        'opt.low': 'Soft',
        'opt.medium': 'Standard',
        'opt.high': 'Loud',
        'opt.soft': 'Soft',
        'opt.bright': 'Bright',
        'opt.piano': 'Piano',
        'opt.epiano': 'Electric Piano',
        'opt.guitar': 'Guitar',
        'opt.strings': 'Strings',
        'opt.immediate': 'Immediate',
        'opt.delay': 'Slow',
        'opt.full': 'On',
        'opt.visual': 'Visual Only',
        'opt.off': 'Off',
        'opt.on': 'On',

        // Sidebar
        'sidebar.title': 'Real-time Monitor',
        'sidebar.realtimeData': 'Real-time',
        'sidebar.laneDist': 'Lane Dist',
        'sidebar.patternPredict': 'Prediction',
        'sidebar.recentClicks': 'Recent Clicks',
        'sidebar.clickCount': 'Clicks',
        'sidebar.hitRate': 'Accuracy',
        'sidebar.dominant': 'Dominant',
        'sidebar.tooltip.pattern': 'Sequential: Seq Ratio > 40% & Lane ≥ 4\nRepetitive: Dominant Lane > 60%\nExploratory: Lane ≥ 4 & Dominant ≤ 60%',

        'sidebar.waitingForData': 'Waiting for data...',
        'sidebar.noData': 'No Data',
        'sidebar.pattern.sequential': 'Sequential (CDEGA)',
        'sidebar.pattern.repetitive': 'Repetitive',
        'sidebar.pattern.exploratory': 'Exploratory',
        'sidebar.pattern.mixed': 'Mixed',

        // Report
        'report.title': 'Game Report',
        'report.behaviorPattern': 'Behavior Pattern',
        'report.clickTrail': 'Click Trail & Lane Dist',
        'report.musicParams': 'Music Parameters',
        'report.score.sequential': 'Sequential',
        'report.score.repetitive': 'Repetitive',
        'report.score.exploratory': 'Exploratory',
        'report.tooltip.sequential': 'Seq Ratio > 40% & Lane Coverage ≥ 4\nProportion of C→D→E→G→A sequences',
        'report.tooltip.repetitive': 'Dominant Lane Ratio > 60%\nPreference for repeating same note',
        'report.tooltip.exploratory': 'Lane Coverage ≥ 4 & Dominant Ratio ≤ 60%\nActive exploration of different notes',

        // Expert Drawer
        'expert.titleTooltip': 'Expert Mode (Ctrl+Shift+E)',
        'expert.title': '🎵 Music Parameters',
        'expert.close': 'Close',
        'expert.tempo': 'Tempo (BPM)',
        'expert.audioParams': 'Audio Parameters',
        'expert.volume': 'Gain',
        'expert.contrast': 'Accent ratio',
        'expert.density': 'Density',
        'expert.warning.unsafe': 'Risk of sensory overload',
        'expert.duration': 'Reward Duration',
        'expert.segment': 'Segment Select',
        'expert.segment.tip': 'Drag handles to set start/end',
        'expert.exit': 'Exit Expert Mode',
        'expert.behavior': 'Behavior Analysis',
        'expert.clickTrail': 'Click Trail',
        'expert.patternRecognition': 'Pattern Recognition',
        'expert.gameStats': 'Game Stats',
        'expert.refresh': 'Export Session Report',
        'pat.rule.sequential': 'Seq Ratio {ratio}% > 40% & Lane Coverage {diversity} ≥ 4',
        'pat.rule.repetitive': 'Dominant Lane Ratio {ratio}% > 60% ({lane})',
        'pat.rule.exploratory': 'Lane Coverage {diversity} ≥ 4 & Dominant Ratio {ratio}% ≤ 60%',
        'pat.rule.mixed': 'No dominant pattern detected',
        'expert.mode.test': 'Test Mode',
        'expert.mode.converge': 'Converge Mode',
        'expert.btn.preview': 'Preview',
        'expert.btn.stop': 'Pause',
        'expert.btn.reset': 'Reset',
        'expert.btn.save': 'Save',
        'expert.msg.saved': 'Saved (Local)',
        'expert.msg.failed': 'Submit Failed',
        'expert.safeRange': 'Safe: ',
        'expert.harmony': 'Harmony',
        'expert.setSafeRange': 'Set Safe Range',
        'expert.dbNotConfigured': 'Database not configured',

        // Game Engine
        'game.ready': 'Game Ready!',
        'game.paused': 'Paused',
        'game.samplingStarted': 'Sampling Started: {seconds}s',
        'game.samplingCompleted': 'Sampling Completed, {count} notes',

        // Messages
        'msg.paused': 'Take a break!',
        'msg.resume': 'Keep going!',
        'msg.slow': 'Take your time!',
        'msg.normal': 'Good pace!',
        'msg.fast': 'Fast challenge!',
        'msg.welcome': 'Welcome! Move cursor to pop bubbles!',
        'msg.saved': 'Settings saved, will apply next round',
        'msg.reward': 'Reward generated, click "Play" to listen🎵',
        'msg.error': 'AI Generation Failed: Check Console',
        'msg.musicPlaying': 'Playing your created music!',
        'msg.musicError': 'Error playing music, please try again',
        'msg.downloadMidi': 'MIDI file downloaded!',
        'msg.downloadJson': 'Music data downloaded (JSON)!',

        // Achievements
        'ach.consecutive5': 'Great job! 5 bubbles in a row!',
        'ach.consecutive10': 'Combo Master! 10 bubbles in a row!',
        'ach.consecutive15': 'Super Combo! 15 bubbles in a row!',
        'ach.total10': 'First Milestone! 10 bubbles popped!',
        'ach.total25': 'Rapid Progress! 25 bubbles popped!',
        'ach.total50': 'Coordination Master! 50 bubbles popped!',
        'ach.total100': 'Legendary Player! 100 bubbles popped!',
        'af.predictableMode': 'Predictable Mode: Bubbles appear in fixed spots',

        // Game Results & Stats
        'res.success': 'Bubbles Popped',
        'res.speed': 'Avg Speed',
        'res.combo': 'Max Combo',
        'res.unitBubbles': 'bubbles',
        'res.unitSpeed': 'sec/bubble',
        'res.unitCombo': 'streak',
        
        // Encouragement
        'enc.excellent': ['Amazing! You are a true Bubble Master!', 'Perfect performance! Your coordination is incredible!', 'Outstanding! You mastered the game!'],
        'enc.great': ['Great job! Keep up the good rhythm!', 'Well done! Your skills are improving!', 'Excellent! Great focus!'],
        'enc.good': ['Good start! Practice makes perfect!', 'Good job! Every attempt counts!', 'Keep going! You are improving steadily!'],
        'enc.encouraging': ['Nice try! Enjoy the process!', 'Relax and have fun!', 'Keep trying! Everyone has their own pace!'],

        // Patterns & Analysis (Legacy keys if needed, or update usage)
        'pat.sequential': 'Sequential',
        'pat.repetitive': 'Repetitive',
        'pat.exploratory': 'Exploratory',
        'pat.mixed': 'Mixed',
        'pat.desc.sequential': 'Sequential (CDEGA Asc/Desc)',
        'pat.desc.repetitive': 'Repetitive (High Repetition)',
        'pat.desc.exploratory': 'Exploratory (High Diversity)',
        'pat.desc.mixed': 'Mixed Type',
        
        // Hand Preference
        'hand.left': 'You prefer your left hand! Try using your right hand next time for balance.',
        'hand.right': 'You prefer your right hand! Try using your left hand next time for balance.',
        'hand.balanced': 'Great! You are using both hands equally, which is good for motor skills.',
        'hand.none': 'Pop some bubbles to see which hand you prefer!',

        // Debug / Expert
        'debug.unsafe': 'Unsafe Mode',
        'debug.preview': 'Preview Mode',
        'debug.clickRate': 'Click Rate',
        'debug.successRate': 'Success Rate',
        'debug.intercepts': 'Intercepts',
        'debug.safe': 'Safe (0 violations)',
        'debug.attention': 'Needs attention ({count} violations)',
        'debug.rewardOff': 'Reward Off (Instant feedback only)',
        'debug.noData': 'Complete a round to see analysis',
        'debug.waiting': 'Waiting for reward generation',
        
        // Music Player
        'music.playing': ' Playing...',
        'music.download': ' Download Music',
        'music.error': 'No music generated, please finish a game first',
        'music.muted': 'Currently muted, please click "Unmute"',
        'music.playerNotReady': 'Music player not ready, please try again later',
        'music.loadingSamples': 'Loading instrument samples...',
        'spectro.title.left': 'Unconstrained Baseline',
        'spectro.title.right': 'Constraint-First Output',
        'spectro.label.spec': 'Log-Mel Spectrogram (dB)',
        'spectro.label.loudness': 'Loudness Contour (LUFS)',
        'spectro.label.silence': 'Silence / No Data',
        'spectro.metrics.line': 'LRA: {lra} LU | Avg: {avg} LUFS | ΔE: {dE}'
        ,
        'spectro.summary.lra': 'Loudness Range (LRA): {raw} → {safe} LU (×{factor} reduction)'
        ,
        'spectro.rawParams': 'Raw Params (behavior-derived)',
        'spectro.safeParams': 'Constrained Params',
        'ui.bpm': 'BPM',
        'ui.contrast': 'Contrast',
        'spectro.loading.title': 'Generating spectrogram comparison...',
        'spectro.loading.sub': 'This may take a few seconds',
        'spectro.fail.title': 'Generation failed',
        'spectro.btn.generate': 'Generate Comparison',
        'spectro.btn.exportPng': 'Export PNG',
        'spectro.btn.exportJson': 'Export JSON',
        'spectro.msg.exportPngDone': 'Comparison exported as PNG'
    }
};

class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('gameLanguage') || 'zh';
        this.listeners = [];
        console.log('[I18n] Initialized with language:', this.currentLang);
    }

    /**
     * Get translated string
     * @param {string} key - Translation key (e.g., 'ui.pause')
     * @param {object} params - Parameters to replace in string (e.g., {ratio: 50})
     * @returns {string|string[]} Translated string or array (for random selection)
     */
    t(key, params = {}) {
        const value = TRANSLATIONS[this.currentLang][key];
        
        if (value === undefined) {
            console.warn(`[I18n] Missing translation for key: ${key} in ${this.currentLang}`);
            return key;
        }

        // Handle array (return random item)
        if (Array.isArray(value)) {
            const randomItem = value[Math.floor(Math.random() * value.length)];
            return this.processParams(randomItem, params);
        }

        return this.processParams(value, params);
    }

    /**
     * Process parameter replacement
     */
    processParams(text, params) {
        if (!params || Object.keys(params).length === 0) return text;
        
        return text.replace(/\{(\w+)\}/g, (match, p1) => {
            return params[p1] !== undefined ? params[p1] : match;
        });
    }

    /**
     * Set current language
     * @param {string} lang - 'zh' or 'en'
     */
    setLanguage(lang) {
        if (lang !== 'zh' && lang !== 'en') {
            console.error('[I18n] Unsupported language:', lang);
            return;
        }
        
        if (this.currentLang === lang) return;

        this.currentLang = lang;
        localStorage.setItem('gameLanguage', lang);
        console.log('[I18n] Language set to:', lang);
        
        this.notifyListeners();
        this.updateDocumentTitle();
    }

    /**
     * Toggle between zh and en
     */
    toggleLanguage() {
        const newLang = this.currentLang === 'zh' ? 'en' : 'zh';
        this.setLanguage(newLang);
        return newLang;
    }

    /**
     * Subscribe to language changes
     */
    subscribe(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    /**
     * Notify all listeners
     */
    notifyListeners() {
        this.listeners.forEach(cb => {
            try {
                cb(this.currentLang);
            } catch (e) {
                console.error('[I18n] Error in listener:', e);
            }
        });
        
        // Dispatch global event
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { lang: this.currentLang } 
        }));
    }

    /**
     * Update document title based on language
     */
    updateDocumentTitle() {
        document.title = this.currentLang === 'zh' 
            ? '泡泡戳戳乐 - 自闭症友好音乐游戏' 
            : 'Bubble Popping Game - Autism Friendly Music';
    }
}

// Create global instance
window.i18n = new I18n();
