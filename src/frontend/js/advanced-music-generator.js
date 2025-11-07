/**
 * 高级音乐生成器
 * 基于游戏数据生成多样化的音乐，包含丰富的和弦进行、节奏模式和音乐风格
 */

class AdvancedMusicGenerator {
  constructor() {
    // 🎵 随机数生成器状态
    this.randomState = {
      seed: Date.now(),
      current: Date.now(),
    };

    // 🎵 大幅扩展音阶系统 - 包含世界各地音乐风格
    this.scales = {
      // 西方传统音阶
      major: [0, 2, 4, 5, 7, 9, 11], // 大调
      minor: [0, 2, 3, 5, 7, 8, 10], // 小调
      harmonic_minor: [0, 2, 3, 5, 7, 8, 11], // 和声小调
      melodic_minor: [0, 2, 3, 5, 7, 9, 11], // 旋律小调
      
      // 教会调式
      dorian: [0, 2, 3, 5, 7, 9, 10], // 多利亚调式
      phrygian: [0, 1, 3, 5, 7, 8, 10], // 弗里吉亚调式
      lydian: [0, 2, 4, 6, 7, 9, 11], // 利底亚调式
      mixolydian: [0, 2, 4, 5, 7, 9, 10], // 混合利底亚调式
      locrian: [0, 1, 3, 5, 6, 8, 10], // 洛克里亚调式
      
      // 五声音阶变体
      pentatonic: [0, 2, 4, 7, 9], // 大五声
      pentatonic_minor: [0, 3, 5, 7, 10], // 小五声
      egyptian: [0, 2, 5, 7, 10], // 埃及音阶
      hirajoshi: [0, 2, 3, 7, 8], // 日本平调子
      
      // 蓝调和爵士音阶
      blues: [0, 3, 5, 6, 7, 10], // 蓝调音阶
      blues_major: [0, 2, 3, 4, 7, 9], // 大调蓝调
      bebop_dominant: [0, 2, 4, 5, 7, 9, 10, 11], // 比波普属七
      bebop_major: [0, 2, 4, 5, 7, 8, 9, 11], // 比波普大调
      
      // 异域音阶
      arabic: [0, 1, 4, 5, 7, 8, 11], // 阿拉伯音阶
      persian: [0, 1, 4, 5, 6, 8, 11], // 波斯音阶
      hungarian: [0, 2, 3, 6, 7, 8, 11], // 匈牙利音阶
      gypsy: [0, 1, 4, 5, 7, 8, 10], // 吉普赛音阶
      spanish: [0, 1, 4, 5, 7, 8, 10], // 西班牙音阶
      
      // 现代和实验音阶
      whole_tone: [0, 2, 4, 6, 8, 10], // 全音阶
      diminished: [0, 2, 3, 5, 6, 8, 9, 11], // 减音阶
      augmented: [0, 3, 4, 7, 8, 11], // 增音阶
      prometheus: [0, 2, 4, 6, 9, 10], // 普罗米修斯音阶
      
      // 亚洲音阶
      chinese: [0, 2, 4, 7, 9], // 中国五声
      japanese_in: [0, 1, 5, 7, 8], // 日本阴音阶
      japanese_yo: [0, 2, 5, 7, 10], // 日本阳音阶
      balinese: [0, 1, 3, 7, 8], // 巴厘岛音阶
      
      // 印度音阶 (拉格)
      raga_bhairav: [0, 1, 4, 5, 7, 8, 11], // 巴伊拉夫拉格
      raga_yaman: [0, 2, 4, 6, 7, 9, 11], // 雅曼拉格
      raga_kafi: [0, 2, 3, 5, 7, 9, 10], // 卡菲拉格
      
      // 非洲音阶
      african_pentatonic: [0, 2, 3, 7, 9], // 非洲五声
      ethiopian: [0, 2, 4, 5, 7, 8, 11], // 埃塞俄比亚音阶
      
      // 拉丁美洲音阶
      flamenco: [0, 1, 4, 5, 7, 8, 11], // 弗拉门戈音阶
      brazilian: [0, 2, 4, 6, 7, 9, 10], // 巴西音阶
      
      // 微分音阶 (简化版)
      quarter_tone_major: [0, 1, 2, 4, 5, 7, 8, 9, 11], // 四分音大调
      chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // 半音阶
    };

    // 🎵 大幅扩展和弦进行库 - 包含各种音乐风格
    this.chordProgressions = {
      // 流行音乐进行
      pop: [
        [0, 5, 6, 4], // I-vi-IV-V (流行经典)
        [0, 4, 5, 0], // I-V-vi-I
        [6, 4, 0, 5], // vi-IV-I-V (轴心进行)
        [0, 6, 4, 5], // I-vi-IV-V
        [4, 5, 6, 4], // V-vi-IV-V (循环进行)
      ],
      
      // 爵士进行
      jazz: [
        [0, 6, 2, 5], // I-vi-ii-V (经典爵士)
        [0, 3, 6, 2, 5], // I-IV-vi-ii-V
        [6, 2, 5, 0], // vi-ii-V-I (转位)
        [0, 1, 2, 5], // I-bII-ii-V (三全音替代)
        [0, 7, 3, 6, 2, 5], // I-viiø7-iii7-vi7-ii7-V7
        [2, 5, 0, 6], // ii-V-I-vi (爵士标准)
      ],
      
      // 古典进行
      classical: [
        [0, 4, 0, 5, 0], // I-V-I-V-I (古典终止)
        [0, 2, 5, 0], // I-ii-V-I
        [0, 6, 4, 5], // I-vi-IV-V
        [0, 3, 4, 5, 0], // I-IV-V-vi-I
        [0, 5, 6, 3, 4, 0], // I-V-vi-iii-IV-I (序进)
        [6, 4, 0, 5, 0], // vi-IV-I-V-I (德彪西进行)
      ],
      
      // 环境音乐进行
      ambient: [
        [0, 2, 4, 6], // I-ii-iii-IV (上行)
        [0, 7, 4, 2], // I-vii-iii-ii
        [6, 0, 4, 2], // vi-I-iii-ii
        [4, 0, 5, 2], // iii-I-V-ii
        [0, 3, 6, 2], // I-IV-vi-ii (柔和)
        [5, 4, 3, 2], // vi-V-IV-iii (下行)
      ],
      
      // 电影配乐进行
      cinematic: [
        [0, 3, 6, 4, 5], // I-bIII-bVI-IV-V (史诗)
        [6, 3, 4, 0], // vi-bIII-IV-I
        [0, 2, 6, 5], // I-ii-vi-V
        [4, 6, 0, 5], // iii-vi-I-V
        [0, 1, 4, 3], // I-bII-V-IV (紧张)
        [6, 1, 4, 5], // vi-bII-V-vi (悬疑)
      ],
      
      // 蓝调进行
      blues: [
        [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4], // 12小节蓝调
        [0, 3, 0, 4], // I-IV-I-V (简化蓝调)
        [0, 6, 3, 4], // I-vi-IV-V (蓝调变体)
        [0, 2, 3, 4], // I-ii-IV-V
      ],
      
      // 摇滚进行
      rock: [
        [0, 6, 3, 4], // I-vi-IV-V (摇滚经典)
        [0, 2, 3, 0], // I-bIII-IV-I (力量和弦)
        [5, 3, 0, 4], // vi-IV-I-V (现代摇滚)
        [0, 4, 5, 3], // I-V-vi-IV (流行摇滚)
        [6, 3, 0, 4], // vi-IV-I-V (另类摇滚)
      ],
      
      // 民谣进行
      folk: [
        [0, 3, 4, 0], // I-IV-V-I (传统民谣)
        [0, 5, 3, 4], // I-vi-IV-V
        [6, 3, 0, 4], // vi-IV-I-V (现代民谣)
        [0, 2, 3, 0], // I-ii-IV-I
        [0, 6, 3, 0], // I-vi-IV-I
      ],
      
      // 拉丁进行
      latin: [
        [0, 4, 5, 0], // I-V-vi-I (博萨诺瓦)
        [6, 2, 5, 0], // vi-ii-V-I (拉丁爵士)
        [0, 3, 6, 4], // I-IV-vi-V (桑巴)
        [2, 5, 0, 6], // ii-V-I-vi (恰恰)
        [0, 1, 4, 5], // I-bII-V-vi (探戈)
      ],
      
      // 世界音乐进行
      world: [
        [0, 2, 4, 5], // I-ii-iii-vi (中东)
        [0, 6, 2, 4], // I-vi-ii-iii (印度)
        [5, 0, 3, 4], // vi-I-IV-V (凯尔特)
        [0, 3, 5, 2], // I-IV-vi-ii (非洲)
        [4, 0, 6, 2], // V-I-vi-ii (巴西)
      ],
      
      // 现代/实验进行
      modern: [
        [0, 1, 2, 3], // I-bII-bIII-III (半音)
        [0, 4, 8, 0], // I-V-bix-I (增三度)
        [0, 3, 6, 9], // I-IV-bVII-bx (减七)
        [0, 2, 5, 7], // I-ii-v-vii (全音)
        [6, 10, 2, 5], // vi-x-ii-v (复杂)
      ],
      
      // 电子音乐进行
      electronic: [
        [0, 4, 6, 2], // I-V-vi-ii (浩室)
        [6, 0, 4, 2], // vi-I-V-ii (出神)
        [0, 2, 4, 6], // I-ii-iii-IV (氛围)
        [4, 6, 0, 2], // V-vi-I-ii (鼓打贝斯)
        [0, 5, 3, 6], // I-vi-IV-vi (合成器流行)
      ],
      
      // 游戏音乐进行
      game: [
        [0, 4, 5, 3], // I-V-vi-IV (冒险)
        [6, 2, 4, 0], // vi-ii-iii-I (RPG)
        [0, 6, 2, 5], // I-vi-ii-V (8位)
        [4, 0, 6, 3], // V-I-vi-IV (动作)
        [0, 3, 4, 6], // I-IV-V-vi (平台)
      ]
    };

    // 🎵 大幅扩展和弦类型系统
    this.chordTypes = {
      // 基础三和弦
      triad: [0, 2, 4], // 三和弦
      triad_inv1: [2, 4, 7], // 第一转位
      triad_inv2: [4, 7, 9], // 第二转位
      
      // 七和弦家族
      seventh: [0, 2, 4, 6], // 七和弦
      maj7: [0, 2, 4, 6], // 大七和弦
      min7: [0, 2, 4, 6], // 小七和弦
      dom7: [0, 2, 4, 6], // 属七和弦
      min7b5: [0, 2, 3, 6], // 半减七和弦
      dim7: [0, 2, 3, 5], // 减七和弦
      maj7sharp11: [0, 2, 4, 6, 3], // 大七升11和弦
      
      // 九和弦家族
      ninth: [0, 2, 4, 6, 1], // 九和弦
      maj9: [0, 2, 4, 6, 1], // 大九和弦
      min9: [0, 2, 4, 6, 1], // 小九和弦
      dom9: [0, 2, 4, 6, 1], // 属九和弦
      add9: [0, 2, 4, 1], // 加九和弦
      
      // 十一和弦
      eleventh: [0, 2, 4, 6, 1, 3], // 十一和弦
      maj11: [0, 2, 4, 6, 1, 3], // 大十一和弦
      min11: [0, 2, 4, 6, 1, 3], // 小十一和弦
      
      // 十三和弦
      thirteenth: [0, 2, 4, 6, 1, 3, 5], // 十三和弦
      maj13: [0, 2, 4, 6, 1, 5], // 大十三和弦
      min13: [0, 2, 4, 6, 1, 5], // 小十三和弦
      
      // 挂留和弦
      sus2: [0, 1, 4], // 挂二和弦
      sus4: [0, 3, 4], // 挂四和弦
      sus2sus4: [0, 1, 3, 4], // 双挂留
      
      // 增减和弦
      aug: [0, 2, 5], // 增和弦
      dim: [0, 2, 3], // 减和弦
      aug7: [0, 2, 5, 6], // 增七和弦
      
      // 特殊和弦
      power: [0, 4], // 强力和弦 (五度)
      sixth: [0, 2, 4, 5], // 六和弦
      min6: [0, 2, 4, 5], // 小六和弦
      maj6_9: [0, 2, 4, 5, 1], // 大六九和弦
      
      // 现代和弦
      quartal: [0, 3, 6], // 四度和弦
      quintal: [0, 4, 8], // 五度和弦
      cluster: [0, 1, 2], // 音簇
      polychord: [0, 2, 4, 7, 9, 11], // 多调和弦
      
      // 爵士和弦
      altered: [0, 2, 3, 5, 6, 1], // 变化和弦
      lydian_dom: [0, 2, 4, 6, 3], // 利底亚属和弦
      phrygian_dom: [0, 1, 4, 6], // 弗里吉亚属和弦
      
      // 世界音乐和弦
      arabic_maqam: [0, 1, 4, 5], // 阿拉伯玛卡姆
      indian_raga: [0, 1, 3, 4, 7], // 印度拉格
      gamelan: [0, 1, 3, 7], // 甘美兰
      
      // 实验和弦
      microtonal: [0, 0.5, 2, 4.5], // 微分音和弦
      spectral: [0, 2.04, 3.86, 5.31], // 泛音列和弦
      atonal: [0, 1, 5, 6, 10], // 无调性和弦
    };

    // 🎵 大幅扩展节奏模式系统
    this.rhythmPatterns = {
      // 基础节奏
      steady: [1, 0, 1, 0, 1, 0, 1, 0], // 稳定节拍
      simple: [1, 0, 0, 0, 1, 0, 0, 0], // 简单节拍
      march: [1, 0, 1, 0, 1, 0, 1, 0], // 进行曲
      
      // 切分节奏
      syncopated: [1, 0, 0, 1, 0, 1, 0, 0], // 切分节奏
      offbeat: [0, 1, 0, 1, 0, 1, 0, 1], // 反拍
      polyrhythm: [1, 0, 1, 1, 0, 1, 0, 1], // 多重节奏
      
      // 三拍子系列
      waltz: [1, 0, 0, 1, 0, 0], // 华尔兹 3/4
      minuet: [1, 0, 1, 1, 0, 1], // 小步舞曲
      mazurka: [1, 0, 1, 0, 1, 0], // 玛祖卡
      
      // 拉丁节奏
      latin: [1, 0, 1, 0, 0, 1, 0, 1], // 拉丁节奏
      samba: [1, 0, 0, 1, 0, 1, 1, 0], // 桑巴
      bossa_nova: [1, 0, 0, 1, 0, 0, 1, 0], // 博萨诺瓦
      salsa: [1, 0, 1, 0, 1, 1, 0, 1], // 萨尔萨
      tango: [1, 0, 1, 1, 0, 1, 0, 0], // 探戈
      rumba: [1, 0, 0, 1, 1, 0, 1, 0], // 伦巴
      cha_cha: [1, 0, 1, 1, 1, 0, 1, 0], // 恰恰
      
      // 爵士节奏
      swing: [1, 0, 0, 1, 0, 0, 1, 0], // 摇摆节奏
      bebop: [1, 0, 1, 0, 1, 1, 0, 1], // 比波普
      cool_jazz: [1, 0, 0, 0, 1, 0, 1, 0], // 冷爵士
      fusion: [1, 1, 0, 1, 0, 1, 1, 0], // 融合爵士
      
      // 摇滚节奏
      rock: [1, 0, 1, 0, 1, 0, 1, 0], // 摇滚
      punk: [1, 1, 1, 1, 1, 1, 1, 1], // 朋克
      metal: [1, 0, 1, 1, 0, 1, 1, 0], // 金属
      grunge: [1, 0, 0, 1, 1, 0, 1, 0], // 垃圾摇滚
      progressive: [1, 0, 1, 0, 0, 1, 0, 1, 1, 0], // 前卫摇滚
      
      // 电子音乐节奏
      house: [1, 0, 0, 0, 1, 0, 0, 0], // 浩室
      techno: [1, 0, 1, 0, 1, 0, 1, 0], // 科技舞曲
      trance: [1, 0, 0, 1, 0, 0, 1, 0], // 出神
      dubstep: [1, 0, 0, 0, 1, 1, 0, 1], // 回响贝斯
      drum_and_bass: [1, 0, 1, 1, 0, 1, 0, 1], // 鼓打贝斯
      breakbeat: [1, 0, 1, 0, 1, 1, 0, 0], // 碎拍
      
      // 世界音乐节奏
      african: [1, 0, 1, 1, 0, 1, 0, 1], // 非洲节奏
      indian_tala: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0], // 印度塔拉
      middle_eastern: [1, 0, 1, 0, 0, 1, 1, 0], // 中东节奏
      celtic: [1, 0, 1, 1, 0, 1], // 凯尔特
      flamenco: [1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1], // 弗拉门戈
      
      // 复杂节奏
      complex: [1, 0, 1, 0, 0, 1, 0, 1, 0, 0], // 复杂节奏
      irregular: [1, 0, 1, 0, 0, 1, 1, 0, 1], // 不规则
      polymetric: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1], // 多重拍子
      additive: [1, 0, 1, 0, 1, 0, 0, 1, 0], // 加法节拍
      
      // 环境音乐节奏
      ambient: [1, 0, 0, 0, 1, 0, 0, 0], // 环境音乐节奏
      drone: [1, 0, 0, 0, 0, 0, 0, 0], // 持续音
      minimal: [1, 0, 0, 0, 0, 1, 0, 0], // 极简主义
      meditative: [1, 0, 0, 0, 0, 0, 1, 0], // 冥想
      
      // 高能节奏
      energetic: [1, 1, 0, 1, 1, 0, 1, 0], // 高能节奏
      frantic: [1, 1, 1, 0, 1, 1, 0, 1], // 狂热
      driving: [1, 0, 1, 1, 1, 0, 1, 1], // 驱动性
      explosive: [1, 1, 1, 1, 0, 1, 1, 1], // 爆炸性
      
      // 游戏音乐节奏
      chiptune: [1, 0, 1, 0, 1, 0, 1, 0], // 芯片音乐
      retro_game: [1, 1, 0, 1, 0, 1, 1, 0], // 复古游戏
      boss_battle: [1, 0, 1, 1, 0, 1, 0, 1], // Boss战
      exploration: [1, 0, 0, 1, 0, 0, 1, 0], // 探索
      victory: [1, 1, 1, 0, 1, 1, 1, 0], // 胜利
      
      // 实验节奏
      aleatoric: [1, 0, 1, 0, 1, 1, 0, 0, 1], // 偶然音乐
      metric_modulation: [1, 0, 1, 0, 1, 0, 0, 1, 0, 1], // 拍子调制
      cross_rhythm: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1], // 交叉节奏
    };

    // 乐器配置 - 增加更多对比鲜明的音色
    this.instruments = {
      // 钢琴类 - 清脆明亮
      piano: { program: 0, channel: 0, name: "Acoustic Grand Piano" },
      epiano: { program: 4, channel: 1, name: "Electric Piano" },
      harpsichord: { program: 6, channel: 2, name: "Harpsichord" },

      // 管风琴类 - 厚重饱满
      organ: { program: 16, channel: 3, name: "Hammond Organ" },
      church_organ: { program: 19, channel: 4, name: "Church Organ" },

      // 吉他类 - 温暖有质感
      guitar: { program: 24, channel: 5, name: "Acoustic Guitar" },
      eguitar_clean: { program: 27, channel: 6, name: "Electric Guitar Clean" },
      eguitar_distortion: {
        program: 29,
        channel: 7,
        name: "Electric Guitar Distortion",
      },

      // 低音类 - 深沉有力
      bass: { program: 32, channel: 8, name: "Acoustic Bass" },
      ebass: { program: 33, channel: 9, name: "Electric Bass" },
      synth_bass: { program: 38, channel: 10, name: "Synth Bass" },

      // 弦乐类 - 优雅抒情
      violin: { program: 40, channel: 11, name: "Violin" },
      viola: { program: 41, channel: 12, name: "Viola" },
      cello: { program: 42, channel: 13, name: "Cello" },
      strings: { program: 48, channel: 14, name: "String Ensemble" },

      // 管乐类 - 明亮穿透
      flute: { program: 73, channel: 15, name: "Flute" },
      oboe: { program: 68, channel: 16, name: "Oboe" },
      clarinet: { program: 71, channel: 17, name: "Clarinet" },
      saxophone: { program: 64, channel: 18, name: "Soprano Sax" },
      trumpet: { program: 56, channel: 19, name: "Trumpet" },
      trombone: { program: 57, channel: 20, name: "Trombone" },

      // 合成器类 - 现代电子
      synth_lead: { program: 80, channel: 21, name: "Synth Lead Square" },
      synth_saw: { program: 81, channel: 22, name: "Synth Lead Sawtooth" },
      synth_pad: { program: 88, channel: 23, name: "Synth Pad New Age" },
      synth_choir: { program: 91, channel: 24, name: "Synth Choir" },

      // 特色乐器 - 独特音色
      harp: { program: 46, channel: 25, name: "Harp" },
      xylophone: { program: 13, channel: 26, name: "Xylophone" },
      marimba: { program: 12, channel: 27, name: "Marimba" },
      music_box: { program: 10, channel: 28, name: "Music Box" },

      // 民族乐器 - 异域风情
      sitar: { program: 104, channel: 29, name: "Sitar" },
      banjo: { program: 105, channel: 30, name: "Banjo" },
      shamisen: { program: 106, channel: 31, name: "Shamisen" },
    };
  }

  /**
   * 初始化随机种子
   */
  initializeRandomSeed(seed) {
    this.randomState.seed = seed;
    this.randomState.current = seed;
  }

  /**
   * 生成可重现的随机数 (0-1)
   */
  seededRandom() {
    // 简单的线性同余生成器
    this.randomState.current =
      (this.randomState.current * 1664525 + 1013904223) % 4294967296;
    return this.randomState.current / 4294967296;
  }

  /**
   * 生成可重现的随机整数
   */
  seededRandomInt(min, max) {
    return Math.floor(this.seededRandom() * (max - min + 1)) + min;
  }

  /**
   * 深度分析游戏会话数据
   */
  analyzeGameSession(gameSession) {
    const bubbleCount = gameSession?.notes?.length || 0;
    const sessionDuration = gameSession?.durationSec || 60;
    const notes = gameSession?.notes || [];

    // 计算节奏特征
    const rhythmAnalysis = this.analyzeRhythm(notes);

    // 计算音高特征
    const pitchAnalysis = this.analyzePitch(notes);

    // 计算时间分布
    const timingAnalysis = this.analyzeTiming(notes, sessionDuration);

    // 计算整体表现
    const performance = bubbleCount / (sessionDuration / 60); // 每分钟泡泡数

    return {
      bubbleCount,
      sessionDuration,
      performance,
      rhythm: rhythmAnalysis,
      pitch: pitchAnalysis,
      timing: timingAnalysis,
      energy: this.calculateEnergyLevel(rhythmAnalysis, performance),
      complexity: this.calculateComplexity(pitchAnalysis, rhythmAnalysis),
      mood: this.determineMood(performance, timingAnalysis),
    };
  }

  /**
   * 分析节奏模式
   */
  analyzeRhythm(notes) {
    if (notes.length < 2)
      return { regularity: 0.5, avgInterval: 2000, variance: 1000 };

    const intervals = [];
    for (let i = 1; i < notes.length; i++) {
      intervals.push(notes[i].dt - notes[i - 1].dt);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce(
        (sum, interval) => sum + Math.pow(interval - avgInterval, 2),
        0
      ) / intervals.length;
    const regularity = Math.max(0, 1 - Math.sqrt(variance) / avgInterval);

    return { regularity, avgInterval, variance };
  }

  /**
   * 分析音高分布
   */
  analyzePitch(notes) {
    if (notes.length === 0)
      return { range: 12, avgPitch: 60, distribution: "even" };

    const pitches = notes.map((n) => n.midi || 60);
    const minPitch = Math.min(...pitches);
    const maxPitch = Math.max(...pitches);
    const range = maxPitch - minPitch;
    const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length;

    // 分析音高分布模式
    const pitchCounts = {};
    pitches.forEach((pitch) => {
      pitchCounts[pitch] = (pitchCounts[pitch] || 0) + 1;
    });

    const uniquePitches = Object.keys(pitchCounts).length;
    const distribution =
      uniquePitches / pitches.length > 0.7
        ? "scattered"
        : uniquePitches / pitches.length < 0.3
        ? "focused"
        : "balanced";

    return { range, avgPitch, distribution, uniquePitches };
  }

  /**
   * 分析时间分布
   */
  analyzeTiming(notes, sessionDuration) {
    if (notes.length === 0)
      return { consistency: 0.5, acceleration: 0, density: 0 };

    const sessionMs = sessionDuration * 1000;
    const firstHalf = notes.filter((n) => n.dt < sessionMs / 2).length;
    const secondHalf = notes.filter((n) => n.dt >= sessionMs / 2).length;

    const acceleration = (secondHalf - firstHalf) / notes.length; // -1到1，正值表示加速
    const density = notes.length / sessionDuration; // 每秒音符数

    // 计算一致性（时间分布的均匀程度）
    const timeSlots = 10;
    const slotSize = sessionMs / timeSlots;
    const slotCounts = new Array(timeSlots).fill(0);

    notes.forEach((note) => {
      const slotIndex = Math.min(Math.floor(note.dt / slotSize), timeSlots - 1);
      slotCounts[slotIndex]++;
    });

    const avgPerSlot = notes.length / timeSlots;
    const variance =
      slotCounts.reduce(
        (sum, count) => sum + Math.pow(count - avgPerSlot, 2),
        0
      ) / timeSlots;
    const consistency = Math.max(0, 1 - Math.sqrt(variance) / avgPerSlot);

    return { consistency, acceleration, density };
  }

  /**
   * 计算能量水平
   */
  calculateEnergyLevel(rhythmAnalysis, performance) {
    const rhythmEnergy = 1 - rhythmAnalysis.regularity; // 不规律 = 高能量
    const performanceEnergy = Math.min(1, performance / 30); // 30个/分钟为满能量
    return (rhythmEnergy + performanceEnergy) / 2;
  }

  /**
   * 计算复杂度
   */
  calculateComplexity(pitchAnalysis, rhythmAnalysis) {
    const pitchComplexity = Math.min(1, pitchAnalysis.range / 24); // 24个半音为满复杂度
    const rhythmComplexity = 1 - rhythmAnalysis.regularity;
    return (pitchComplexity + rhythmComplexity) / 2;
  }

  /**
   * 确定情绪
   */
  determineMood(performance, timingAnalysis) {
    if (performance > 20 && timingAnalysis.acceleration > 0.2) return "excited";
    if (performance > 15 && timingAnalysis.consistency > 0.7)
      return "confident";
    if (performance < 5 && timingAnalysis.acceleration < -0.2) return "relaxed";
    if (timingAnalysis.consistency < 0.3) return "chaotic";
    return "balanced";
  }

  /**
   * 根据游戏数据生成音乐
   */
  generateMusic(gameSession) {
    const bubbleCount = gameSession?.notes?.length || 0;
    const sessionDuration = gameSession?.durationSec || 60;

    // 🎵 增加随机种子，基于时间戳和游戏数据
    const randomSeed = Date.now() + bubbleCount * 1000 + sessionDuration * 100;
    this.initializeRandomSeed(randomSeed);

    // 🎵 深度分析游戏数据
    const gameAnalysis = this.analyzeGameSession(gameSession);
    console.log(`🎵 游戏分析:`, gameAnalysis);

    // 根据游戏表现选择音乐风格
    const musicStyle = this.selectMusicStyle(gameAnalysis);
    console.log(
      `🎵 选择音乐风格: ${musicStyle.name} (随机种子: ${randomSeed})`
    );

    // 生成音乐结构
    const musicStructure = this.createMusicStructure(musicStyle, gameAnalysis);

    // 生成所有音符
    const notes = this.generateAllNotes(musicStructure, gameAnalysis);

    // 创建最终序列
    return this.createMusicSequence(notes, musicStructure);
  }

  /**
   * 根据游戏分析选择音乐风格
   */
  selectMusicStyle(gameAnalysis) {
    const { performance, energy, complexity, mood, rhythm, pitch } =
      gameAnalysis;

    // 🎵 基于多维度数据选择风格，增加随机性
    const styleVariations = this.generateStyleVariations(gameAnalysis);
    const selectedStyle =
      styleVariations[this.seededRandomInt(0, styleVariations.length - 1)];

    // 🎵 根据游戏特征调整风格参数
    selectedStyle.tempo += this.seededRandomInt(-10, 10); // 随机调整节拍
    selectedStyle.tempo = Math.max(60, Math.min(180, selectedStyle.tempo));

    // 🎵 根据音高分析调整音阶
    if (pitch.distribution === "scattered") {
      selectedStyle.scale = this.seededRandom() < 0.5 ? "chromatic" : "blues";
    } else if (pitch.range > 20) {
      selectedStyle.scale = "major";
    }

    // 🎵 根据节奏分析调整节奏模式
    if (rhythm.regularity > 0.8) {
      selectedStyle.rhythm = "steady";
    } else if (rhythm.regularity < 0.3) {
      selectedStyle.rhythm =
        this.seededRandom() < 0.5 ? "syncopated" : "complex";
    }

    return selectedStyle;
  }

  /**
   * 生成风格变体
   */
  generateStyleVariations(gameAnalysis) {
    const { performance, energy, mood } = gameAnalysis;
    const variations = [];

    // 高性能风格组
    if (performance >= 25) {
      variations.push({
        name: "electronic_dance",
        scale: "minor",
        progression: "pop",
        rhythm: "energetic",
        tempo: 140,
        instruments: [
          "synth_lead",
          "synth_bass",
          "eguitar_distortion",
          "synth_pad",
        ],
        complexity: "high",
      });
      variations.push({
        name: "rock_anthem",
        scale: "mixolydian",
        progression: "pop",
        rhythm: "energetic",
        tempo: 130,
        instruments: ["eguitar_distortion", "ebass", "organ", "trumpet"],
        complexity: "high",
      });
    }

    // 中等性能风格组
    if (performance >= 10 && performance < 25) {
      variations.push({
        name: "jazz_fusion",
        scale: "dorian",
        progression: "jazz",
        rhythm: "swing",
        tempo: 115,
        instruments: ["epiano", "saxophone", "ebass", "violin"],
        complexity: "medium",
      });
      variations.push({
        name: "orchestral_pop",
        scale: "major",
        progression: "classical",
        rhythm: "steady",
        tempo: 105,
        instruments: ["piano", "strings", "flute", "harp"],
        complexity: "medium",
      });
      variations.push({
        name: "world_fusion",
        scale: "pentatonic",
        progression: "ambient",
        rhythm: "latin",
        tempo: 100,
        instruments: ["sitar", "flute", "strings", "marimba"],
        complexity: "medium",
      });
    }

    // 低性能/放松风格组
    if (performance < 15) {
      variations.push({
        name: "ambient_dream",
        scale: "pentatonic",
        progression: "ambient",
        rhythm: "ambient",
        tempo: 75,
        instruments: ["synth_pad", "harp", "synth_choir", "music_box"],
        complexity: "low",
      });
      variations.push({
        name: "classical_chamber",
        scale: "major",
        progression: "classical",
        rhythm: "waltz",
        tempo: 85,
        instruments: ["piano", "violin", "cello", "oboe"],
        complexity: "low",
      });
      variations.push({
        name: "folk_acoustic",
        scale: "dorian",
        progression: "pop",
        rhythm: "steady",
        tempo: 90,
        instruments: ["guitar", "flute", "strings", "harp"],
        complexity: "low",
      });
    }

    // 根据情绪添加特殊风格
    if (mood === "chaotic") {
      variations.push({
        name: "experimental",
        scale: "chromatic",
        progression: "jazz",
        rhythm: "complex",
        tempo: 95,
        instruments: ["synth_saw", "saxophone", "synth_bass", "xylophone"],
        complexity: "high",
      });
    }

    if (mood === "excited") {
      variations.push({
        name: "celebration",
        scale: "major",
        progression: "pop",
        rhythm: "latin",
        tempo: 125,
        instruments: ["trumpet", "piano", "ebass", "marimba"],
        complexity: "medium",
      });
    }

    // 确保至少有一个风格
    if (variations.length === 0) {
      variations.push({
        name: "balanced",
        scale: "major",
        progression: "pop",
        rhythm: "steady",
        tempo: 100,
        instruments: ["piano", "violin", "bass", "flute"],
        complexity: "medium",
      });
    }

    return variations;
  }

  /**
   * 创建音乐结构
   */
  createMusicStructure(style, gameAnalysis) {
    const targetDuration = Math.max(
      12,
      Math.min(45, gameAnalysis.sessionDuration * 0.8)
    );

    return {
      style: style,
      duration: targetDuration,
      sections: this.createSections(style, targetDuration),
      key: this.selectKey(),
      scale: this.scales[style.scale],
      chordProgression: this.selectChordProgression(style.progression),
      rhythmPattern: this.rhythmPatterns[style.rhythm],
      instruments: this.selectInstruments(style.instruments),
    };
  }

  /**
   * 创建音乐段落结构
   */
  createSections(style, duration) {
    const sections = [];
    let currentTime = 0;

    // 引子 (Intro)
    if (duration > 20) {
      sections.push({
        name: "intro",
        start: currentTime,
        duration: 4,
        intensity: 0.3,
        instruments: style.instruments.slice(0, 2),
      });
      currentTime += 4;
    }

    // 主题 A
    const mainDuration = Math.min(8, duration * 0.4);
    sections.push({
      name: "theme_a",
      start: currentTime,
      duration: mainDuration,
      intensity: 0.7,
      instruments: style.instruments.slice(0, 3),
    });
    currentTime += mainDuration;

    // 发展部 (如果时间充足)
    if (duration > 25) {
      sections.push({
        name: "development",
        start: currentTime,
        duration: 6,
        intensity: 0.9,
        instruments: style.instruments,
      });
      currentTime += 6;
    }

    // 主题 B 或变奏
    const themeBDuration = Math.min(8, duration - currentTime - 4);
    if (themeBDuration > 0) {
      sections.push({
        name: "theme_b",
        start: currentTime,
        duration: themeBDuration,
        intensity: 0.8,
        instruments: style.instruments.slice(1, 4),
      });
      currentTime += themeBDuration;
    }

    // 尾声
    const outroDuration = duration - currentTime;
    if (outroDuration > 0) {
      sections.push({
        name: "outro",
        start: currentTime,
        duration: outroDuration,
        intensity: 0.4,
        instruments: style.instruments.slice(0, 2),
      });
    }

    return sections;
  }

  /**
   * 选择调性
   */
  selectKey() {
    const keys = [60, 62, 64, 65, 67, 69, 71]; // C, D, E, F, G, A, B
    return keys[this.seededRandomInt(0, keys.length - 1)];
  }

  /**
   * 选择和弦进行
   */
  selectChordProgression(progressionType) {
    const progressions = this.chordProgressions[progressionType];
    return progressions[this.seededRandomInt(0, progressions.length - 1)];
  }

  /**
   * 选择乐器组合
   */
  selectInstruments(instrumentNames) {
    return instrumentNames.map((name) => this.instruments[name]);
  }

  /**
   * 生成所有音符
   */
  generateAllNotes(structure, gameAnalysis) {
    const notes = [];

    structure.sections.forEach((section) => {
      // 为每个段落生成不同类型的音符
      notes.push(
        ...this.generateSectionNotes(section, structure, gameAnalysis)
      );
    });

    return notes;
  }

  /**
   * 为特定段落生成音符
   */
  generateSectionNotes(section, structure, gameAnalysis) {
    const notes = [];

    // 生成和弦
    notes.push(...this.generateChords(section, structure));

    // 生成旋律
    notes.push(...this.generateMelody(section, structure, gameAnalysis));

    // 生成低音线
    notes.push(...this.generateBassLine(section, structure));

    // 根据段落类型添加特殊元素
    if (section.name === "development") {
      notes.push(
        ...this.generateCounterMelody(section, structure, gameAnalysis)
      );
    }

    if (section.name === "intro" || section.name === "outro") {
      notes.push(...this.generateAmbientTexture(section, structure));
    }

    return notes;
  }

  /**
   * 生成和弦
   */
  generateChords(section, structure) {
    const notes = [];
    const { start, duration } = section;
    const { key, scale, chordProgression, instruments } = structure;

    // 选择和弦乐器
    const chordInstrument =
      instruments.find((inst) =>
        ["piano", "epiano", "organ", "guitar"].includes(
          inst.name.toLowerCase().split(" ")[0]
        )
      ) || instruments[0];

    const chordDuration = 2; // 每个和弦持续2秒
    const numChords = Math.ceil(duration / chordDuration);

    for (let i = 0; i < numChords; i++) {
      const chordStart = start + i * chordDuration;
      const chordEnd = Math.min(
        chordStart + chordDuration * 0.9,
        start + duration
      );

      // 选择和弦
      const chordIndex = chordProgression[i % chordProgression.length];
      const rootNote = key + scale[chordIndex % scale.length];

      // 选择和弦类型
      const chordType = this.selectChordType(section.name, i);
      const chordNotes = this.buildChord(rootNote, chordType, scale);

      // 添加和弦音符
      chordNotes.forEach((pitch, noteIndex) => {
        notes.push({
          pitch: pitch,
          startTime: chordStart + noteIndex * 0.05, // 轻微琶音效果
          endTime: chordEnd,
          velocity: Math.floor(50 + section.intensity * 30),
          instrument: chordInstrument.channel,
          program: chordInstrument.program,
        });
      });
    }

    return notes;
  }

  /**
   * 选择和弦类型
   */
  selectChordType(sectionName, chordIndex) {
    if (sectionName === "intro" || sectionName === "outro") {
      return this.seededRandom() < 0.3 ? "sus2" : "triad";
    } else if (sectionName === "development") {
      const complexChords = ["seventh", "ninth", "add9"];
      return complexChords[this.seededRandomInt(0, complexChords.length - 1)];
    } else {
      // 主题部分使用多样化和弦，增加随机性
      const chordTypes = ["triad", "seventh", "sus4", "add9", "maj7", "min7"];
      const randomIndex =
        (chordIndex + this.seededRandomInt(0, 2)) % chordTypes.length;
      return chordTypes[randomIndex];
    }
  }

  /**
   * 构建和弦
   */
  buildChord(rootNote, chordType, scale) {
    const intervals = this.chordTypes[chordType];
    const chord = [];

    intervals.forEach((interval) => {
      const scaleIndex = interval % scale.length;
      const octaveOffset = Math.floor(interval / scale.length) * 12;
      chord.push(rootNote + scale[scaleIndex] + octaveOffset);
    });

    return chord;
  }

  /**
   * 生成旋律
   */
  generateMelody(section, structure, gameAnalysis) {
    const notes = [];
    const { start, duration, intensity } = section;
    const { key, scale, rhythmPattern } = structure;

    // 选择旋律乐器
    const melodyInstrument =
      structure.instruments.find((inst) =>
        ["violin", "flute", "clarinet", "sax", "synth"].includes(
          inst.name.toLowerCase().split(" ")[0]
        )
      ) ||
      structure.instruments[1] ||
      structure.instruments[0];

    const noteLength = 0.5;
    let currentTime = start;
    let rhythmIndex = 0;

    // 🎵 基于游戏分析的旋律特征
    const melodyRange = Math.min(
      2,
      Math.max(0.5, gameAnalysis.pitch.range / 12)
    ); // 基于音高范围

    while (currentTime < start + duration) {
      const shouldPlay = rhythmPattern[rhythmIndex % rhythmPattern.length];

      if (shouldPlay) {
        // 🎵 基于游戏数据的智能音高选择
        const scaleIndex = this.seededRandomInt(0, scale.length - 1);
        const octaveVariation = this.seededRandomInt(-melodyRange, melodyRange);
        const pitch = key + scale[scaleIndex] + 12 + octaveVariation * 12;

        // 🎵 基于游戏节奏的音符长度变化
        const rhythmFactor = gameAnalysis.rhythm.regularity;
        const lengthVariation = rhythmFactor > 0.7 ? 0.2 : 0.8; // 规律节奏用短音符，不规律用长音符
        const noteDuration =
          noteLength * (0.5 + this.seededRandom() * lengthVariation);

        // 🎵 基于游戏能量的力度变化
        const energyBoost = gameAnalysis.energy * 30;
        const velocityVariation = this.seededRandomInt(-15, 15);

        notes.push({
          pitch: Math.max(48, Math.min(96, pitch)), // 限制音域
          startTime: currentTime,
          endTime: currentTime + noteDuration,
          velocity: Math.floor(
            60 + intensity * 40 + energyBoost + velocityVariation
          ),
          instrument: melodyInstrument.channel,
          program: melodyInstrument.program,
        });
      }

      currentTime += noteLength;
      rhythmIndex++;
    }

    return notes;
  }

  /**
   * 生成低音线
   */
  generateBassLine(section, structure) {
    const notes = [];
    const { start, duration } = section;
    const { key, scale, chordProgression } = structure;

    // 选择低音乐器
    const bassInstrument = structure.instruments.find((inst) =>
      ["bass", "ebass", "cello"].includes(inst.name.toLowerCase().split(" ")[0])
    );

    if (!bassInstrument) return notes;

    const bassDuration = 1; // 低音音符较长
    let currentTime = start;
    let chordIndex = 0;

    while (currentTime < start + duration) {
      const chordRoot = chordProgression[chordIndex % chordProgression.length];
      const bassNote = key + scale[chordRoot % scale.length] - 24; // 低两个八度

      notes.push({
        pitch: Math.max(24, bassNote),
        startTime: currentTime,
        endTime: currentTime + bassDuration * 0.8,
        velocity: Math.floor(60 + section.intensity * 20),
        instrument: bassInstrument.channel,
        program: bassInstrument.program,
      });

      currentTime += bassDuration;
      chordIndex++;
    }

    return notes;
  }

  /**
   * 生成对位旋律
   */
  generateCounterMelody(section, structure, gameAnalysis) {
    const notes = [];
    const { start, duration } = section;
    const { key, scale } = structure;

    const counterInstrument =
      structure.instruments[2] || structure.instruments[0];

    let currentTime = start + 0.25; // 错开主旋律
    const noteLength = 0.75;

    while (currentTime < start + duration) {
      // 🎵 基于游戏复杂度调整播放概率
      const playProbability = 0.5 + gameAnalysis.complexity * 0.4;
      if (this.seededRandom() < playProbability) {
        const scaleIndex = this.seededRandomInt(0, scale.length - 1);
        const pitch = key + scale[scaleIndex] + 6; // 中音域

        notes.push({
          pitch: pitch,
          startTime: currentTime,
          endTime: currentTime + noteLength * 0.6,
          velocity: Math.floor(45 + section.intensity * 25),
          instrument: counterInstrument.channel,
          program: counterInstrument.program,
        });
      }

      currentTime += noteLength;
    }

    return notes;
  }

  /**
   * 生成环境音效纹理
   */
  generateAmbientTexture(section, structure) {
    const notes = [];
    const { start, duration } = section;
    const { key, scale } = structure;

    const padInstrument =
      structure.instruments.find((inst) =>
        inst.name.toLowerCase().includes("pad")
      ) || structure.instruments[structure.instruments.length - 1];

    // 长音符营造氛围
    const numLayers = 3;
    for (let layer = 0; layer < numLayers; layer++) {
      const layerStart = start + layer * 1.5;
      const layerDuration = duration - layer * 1.5;

      if (layerDuration > 0) {
        const scaleIndex = (layer * 2) % scale.length;
        const pitch = key + scale[scaleIndex] + 12;

        notes.push({
          pitch: pitch,
          startTime: layerStart,
          endTime: layerStart + layerDuration,
          velocity: Math.floor(30 + section.intensity * 15),
          instrument: padInstrument.channel,
          program: padInstrument.program,
        });
      }
    }

    return notes;
  }

  /**
   * 创建最终音乐序列
   */
  createMusicSequence(notes, structure) {
    // 按时间排序
    notes.sort((a, b) => a.startTime - b.startTime);

    // 🎵 音色强化：为不同乐器添加特色控制变化
    const enhancedNotes = this.enhanceInstrumentCharacteristics(
      notes,
      structure
    );

    // 计算总时长
    const totalTime = Math.max(...enhancedNotes.map((n) => n.endTime)) + 1;

    // 创建乐器信息
    const instrumentInfos = structure.instruments.map((inst) => ({
      instrument: inst.channel,
      program: inst.program,
      isDrum: false,
      name: inst.name,
    }));

    // 🎵 添加音色控制变化
    const controlChanges = this.generateInstrumentControls(structure);

    return {
      ticksPerQuarter: 220,
      totalTime: totalTime,
      tempos: [{ time: 0, qpm: structure.style.tempo }],
      notes: enhancedNotes,
      instrumentInfos: instrumentInfos,
      keySignatures: [{ time: 0, key: 0, scale: 0 }],
      timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }],
      controlChanges: controlChanges,
      // 添加元数据
      metadata: {
        style: structure.style.name,
        key: structure.key,
        scale: structure.style.scale,
        progression: structure.style.progression,
        instrumentCount: instrumentInfos.length,
        noteCount: enhancedNotes.length,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * 增强乐器特色
   */
  enhanceInstrumentCharacteristics(notes, structure) {
    return notes.map((note) => {
      const instrument = structure.instruments.find(
        (inst) => inst.channel === note.instrument
      );
      if (!instrument) return note;

      const enhancedNote = { ...note };

      // 根据乐器类型调整音符特性
      const instrumentName = instrument.name.toLowerCase();

      if (instrumentName.includes("synth")) {
        // 合成器：更强的力度变化
        enhancedNote.velocity = Math.min(127, note.velocity + 10);
      } else if (instrumentName.includes("guitar")) {
        // 吉他：轻微的音高弯曲效果
        enhancedNote.velocity = Math.max(40, note.velocity - 5);
      } else if (
        instrumentName.includes("flute") ||
        instrumentName.includes("oboe")
      ) {
        // 管乐：更柔和的力度
        enhancedNote.velocity = Math.min(100, Math.max(30, note.velocity - 10));
      } else if (
        instrumentName.includes("trumpet") ||
        instrumentName.includes("trombone")
      ) {
        // 铜管：更强劲的力度
        enhancedNote.velocity = Math.min(127, note.velocity + 15);
      } else if (
        instrumentName.includes("harp") ||
        instrumentName.includes("music box")
      ) {
        // 特色乐器：独特的力度曲线
        enhancedNote.velocity = Math.max(20, Math.min(80, note.velocity - 20));
      }

      return enhancedNote;
    });
  }

  /**
   * 生成乐器控制变化
   */
  generateInstrumentControls(structure) {
    const controls = [];

    structure.instruments.forEach((instrument) => {
      const instrumentName = instrument.name.toLowerCase();

      // 为不同乐器添加特色控制
      if (instrumentName.includes("synth")) {
        // 合成器：滤波器扫频
        controls.push({
          time: 0,
          channel: instrument.channel,
          controllerType: 74, // Filter Cutoff
          value: 64,
        });
        controls.push({
          time: structure.duration / 2,
          channel: instrument.channel,
          controllerType: 74,
          value: 100,
        });
      } else if (instrumentName.includes("guitar")) {
        // 吉他：表情控制
        controls.push({
          time: 0,
          channel: instrument.channel,
          controllerType: 11, // Expression
          value: 80,
        });
      } else if (instrumentName.includes("strings")) {
        // 弦乐：渐强渐弱
        controls.push({
          time: 0,
          channel: instrument.channel,
          controllerType: 7, // Volume
          value: 60,
        });
        controls.push({
          time: structure.duration / 3,
          channel: instrument.channel,
          controllerType: 7,
          value: 100,
        });
        controls.push({
          time: (structure.duration * 2) / 3,
          channel: instrument.channel,
          controllerType: 7,
          value: 80,
        });
      }

      // 为所有乐器添加立体声定位
      const panValue = 32 + (instrument.channel % 3) * 32; // 分散立体声
      controls.push({
        time: 0,
        channel: instrument.channel,
        controllerType: 10, // Pan
        value: panValue,
      });
    });

    return controls;
  }
}

// 导出到全局
window.AdvancedMusicGenerator = AdvancedMusicGenerator;

// 替换原有的createRichTestMusic函数
window.createRichTestMusic = function (gameSession) {
  const generator = new AdvancedMusicGenerator();
  return generator.generateMusic(gameSession);
};

console.log("🎵 高级音乐生成器已加载");
