/**
 * 《小花园》游戏核心逻辑
 * Little Garden Game Core
 */

// ============================================================
// 游戏配置
// ============================================================
const CONFIG = {
  // 画布
  CANVAS_WIDTH: 720,
  CANVAS_HEIGHT: 1280,

  // 物理
  GRAVITY: 0.5,
  FRICTION: 0.98,

  // 动画
  DEFAULT_FPS: 60,
  FIXED_TIMESTEP: 1000 / 60,

  // 存储键名
  STORAGE_KEY: 'little_garden_save',
  LEARNING_PROGRESS_KEY: 'little_garden_learning_progress',
};

// ============================================================
// 游戏状态枚举
// ============================================================
const GameState = {
  LOADING: 'loading',
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  SHOP: 'shop',
  INVENTORY: 'inventory',
  SETTINGS: 'settings',
  GAME_OVER: 'game_over',
};

// ============================================================
// 场景枚举
// ============================================================
const SceneType = {
  BOOT: 'boot',
  MAIN_MENU: 'main_menu',
  GARDEN: 'garden',
  SHOP: 'shop',
  INVENTORY: 'inventory',
  SETTINGS: 'settings',
  MATH_GARDEN: 'math_garden',
  CHINESE_GARDEN: 'chinese_garden',
  ENGLISH_GARDEN: 'english_garden',
  LOGIC_GARDEN: 'logic_garden',
  LEARNING: 'learning',
};

// ============================================================
// 音频管理器
// ============================================================
class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = true;
    this._init();
  }

  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Audio not supported:', e);
    }
  }

  _resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration, type = 'sine', volume = 0.3) {
    if (!this.enabled || !this.ctx) return;
    this._resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playSFX(type) {
    if (!this.enabled) return;
    this._resume();

    switch (type) {
      case 'click':
        this.playTone(800, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(1000, 0.1, 'sine', 0.2), 50);
        break;
      case 'success':
        this.playTone(523, 0.15, 'sine', 0.3);
        setTimeout(() => this.playTone(659, 0.15, 'sine', 0.3), 100);
        setTimeout(() => this.playTone(784, 0.2, 'sine', 0.3), 200);
        break;
      case 'error':
        this.playTone(200, 0.2, 'square', 0.15);
        setTimeout(() => this.playTone(150, 0.3, 'square', 0.15), 150);
        break;
      case 'coin':
        this.playTone(988, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(1319, 0.15, 'sine', 0.2), 80);
        break;
      case 'water':
        // 模拟水流
        if (this.ctx) {
          const bufferSize = this.ctx.sampleRate * 0.3;
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.1;
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
          noise.connect(gain);
          gain.connect(this.masterGain);
          noise.start();
        }
        break;
    }
  }
}

// ============================================================
// 工具函数
// ============================================================
const Utils = {
  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },
  
  lerp(a, b, t) {
    return a + (b - a) * t;
  },
  
  random(min, max) {
    return Math.random() * (max - min) + min;
  },
  
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  randomBool(probability = 0.5) {
    return Math.random() < probability;
  },
  
  distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  },
  
  angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  },
  
  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },
  
  easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  },
  
  easeIn(t) {
    return t * t * t;
  },
  
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  },
  
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },
  
  uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
};

// ============================================================
// 数据持久化
// ============================================================
const Storage = {
  data: {},
  
  init() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (saved) {
        this.data = JSON.parse(saved);
      } else {
        this.data = this.getDefaultData();
      }
    } catch (e) {
      console.warn('Storage init failed:', e);
      this.data = this.getDefaultData();
    }
  },
  
  getDefaultData() {
    return {
      version: '1.0.0',
      player: {
        name: '园丁',
        coins: 100,
        gems: 10,
        level: 1,
        exp: 0,
      },
      garden: {
        plots: 6,
        unlockedPlots: 1,
        plants: [],
      },
      inventory: {
        seeds: [
          { id: 'seed_sunflower', name: '向日葵种子', count: 5, price: 10 },
          { id: 'seed_rose', name: '玫瑰种子', count: 3, price: 20 },
          { id: 'seed_tulip', name: '郁金香种子', count: 2, price: 30 },
        ],
        items: [],
      },
      pet: {
        name: '小白',
        type: 'dog',
        hunger: 80,
        happiness: 80,
        health: 100,
        lastFed: Date.now(),
        lastPlayed: Date.now(),
      },
      statistics: {
        totalPlayed: 0,
        plantsGrown: 0,
        coinsEarned: 0,
        visits: 0,
      },
      settings: {
        music: 0.8,
        sfx: 1.0,
        vibration: true,
        quality: 'high',
      },
    };
  },
  
  save() {
    try {
      this.data.statistics.totalPlayed += 1;
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.data));
      return true;
    } catch (e) {
      console.warn('Storage save failed:', e);
      return false;
    }
  },
  
  load() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (saved) {
        this.data = JSON.parse(saved);
        return true;
      }
    } catch (e) {
      console.warn('Storage load failed:', e);
    }
    return false;
  },
  
  reset() {
    this.data = this.getDefaultData();
    this.save();
  },
  
  get(path) {
    const keys = path.split('.');
    let val = this.data;
    for (const key of keys) {
      if (val && typeof val === 'object' && key in val) {
        val = val[key];
      } else {
        return undefined;
      }
    }
    return val;
  },
  
  set(path, value) {
    const keys = path.split('.');
    let obj = this.data;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in obj) || typeof obj[key] !== 'object') {
        obj[key] = {};
      }
      obj = obj[key];
    }
    obj[keys[keys.length - 1]] = value;
  }
};

// ============================================================
// 学习进度管理器
// ============================================================
const LearningProgress = {
  data: {},

  init() {
    try {
      const saved = localStorage.getItem(CONFIG.LEARNING_PROGRESS_KEY);
      if (saved) {
        this.data = JSON.parse(saved);
      } else {
        this.data = this.getDefaultData();
      }
    } catch (e) {
      console.warn('LearningProgress init failed:', e);
      this.data = this.getDefaultData();
    }
  },

  getDefaultData() {
    return {
      levels: {},
      totalStars: 0,
    };
  },

  save() {
    try {
      localStorage.setItem(CONFIG.LEARNING_PROGRESS_KEY, JSON.stringify(this.data));
      return true;
    } catch (e) {
      console.warn('LearningProgress save failed:', e);
      return false;
    }
  },

  setLevelStars(subject, level, stars) {
    const key = `${subject}_${level}`;
    const existing = this.data.levels[key] || 0;
    if (stars > existing) {
      this.data.levels[key] = stars;
      this.save();
    }
  },

  getLevelStars(subject, level) {
    const key = `${subject}_${level}`;
    return this.data.levels[key] || 0;
  },

  isLevelUnlocked(subject, level) {
    // Level 1 is always unlocked, or previous level has at least 1 star
    if (level === 1) return true;
    return this.getLevelStars(subject, level - 1) > 0;
  },

  getTotalStars() {
    let total = 0;
    for (const key in this.data.levels) {
      total += this.data.levels[key];
    }
    return total;
  },
};

// ============================================================
// 题目数据
// ============================================================
const QuestionData = {
  // 数学题目
  math: {
    // 数数
    counting_1: {
      name: '数数 L1',
      type: 'counting',
      difficulty: 1,
      questions: [
        { question: '数一数有几个苹果', display: 'image', correct: 3, options: [2, 3, 4, 5], imageType: 'apple', imageCount: 3 },
        { question: '数一数有几朵花', display: 'image', correct: 2, options: [1, 2, 3, 4], imageType: 'flower', imageCount: 2 },
        { question: '数一数有几个星星', display: 'image', correct: 5, options: [3, 4, 5, 6], imageType: 'star', imageCount: 5 },
        { question: '数一数有几个气球', display: 'image', correct: 4, options: [2, 3, 4, 5], imageType: 'balloon', imageCount: 4 },
        { question: '数一数有几只小鸟', display: 'image', correct: 1, options: [1, 2, 3, 4], imageType: 'bird', imageCount: 1 },
      ]
    },
    counting_2: {
      name: '数数 L2',
      type: 'counting',
      difficulty: 2,
      questions: [
        { question: '数一数有几个水果', display: 'image', correct: 7, options: [5, 6, 7, 8], imageType: 'mixed', imageCount: 7 },
        { question: '数一数有几颗糖果', display: 'image', correct: 9, options: [7, 8, 9, 10], imageType: 'candy', imageCount: 9 },
        { question: '数一数有几片树叶', display: 'image', correct: 6, options: [4, 5, 6, 7], imageType: 'leaf', imageCount: 6 },
        { question: '数一数有几只蝴蝶', display: 'image', correct: 8, options: [6, 7, 8, 9], imageType: 'butterfly', imageCount: 8 },
        { question: '数一数有几个球', display: 'image', correct: 10, options: [8, 9, 10, 11], imageType: 'ball', imageCount: 10 },
      ]
    },
    counting_3: {
      name: '数数 L3',
      type: 'counting',
      difficulty: 3,
      questions: [
        { question: '数一数有多少个物品', display: 'image', correct: 15, options: [12, 14, 15, 18], imageType: 'mixed', imageCount: 15 },
        { question: '数一数有多少颗星星', display: 'image', correct: 18, options: [15, 17, 18, 20], imageType: 'star', imageCount: 18 },
        { question: '数一数有多少个圆圈', display: 'image', correct: 12, options: [10, 11, 12, 13], imageType: 'circle', imageCount: 12 },
        { question: '数一数有多少个方形', display: 'image', correct: 20, options: [18, 19, 20, 21], imageType: 'square', imageCount: 20 },
        { question: '数一数有多少个三角形', display: 'image', correct: 16, options: [14, 15, 16, 17], imageType: 'triangle', imageCount: 16 },
      ]
    },
    // 加法
    addition_1: {
      name: '加法 L1',
      type: 'arithmetic',
      difficulty: 1,
      questions: [
        { question: '1 + 1 = ?', display: 'text', correct: 2, options: [1, 2, 3, 4] },
        { question: '2 + 1 = ?', display: 'text', correct: 3, options: [2, 3, 4, 5] },
        { question: '1 + 3 = ?', display: 'text', correct: 4, options: [2, 3, 4, 5] },
        { question: '2 + 2 = ?', display: 'text', correct: 4, options: [3, 4, 5, 6] },
        { question: '3 + 1 = ?', display: 'text', correct: 4, options: [3, 4, 5, 6] },
      ]
    },
    addition_2: {
      name: '加法 L2',
      type: 'arithmetic',
      difficulty: 2,
      questions: [
        { question: '5 + 3 = ?', display: 'text', correct: 8, options: [6, 7, 8, 9] },
        { question: '4 + 4 = ?', display: 'text', correct: 8, options: [6, 7, 8, 9] },
        { question: '6 + 2 = ?', display: 'text', correct: 8, options: [6, 7, 8, 9] },
        { question: '7 + 3 = ?', display: 'text', correct: 10, options: [8, 9, 10, 11] },
        { question: '9 + 1 = ?', display: 'text', correct: 10, options: [8, 9, 10, 11] },
      ]
    },
    addition_3: {
      name: '加法 L3',
      type: 'arithmetic',
      difficulty: 3,
      questions: [
        { question: '12 + 8 = ?', display: 'text', correct: 20, options: [18, 19, 20, 21] },
        { question: '15 + 7 = ?', display: 'text', correct: 22, options: [20, 21, 22, 23] },
        { question: '25 + 15 = ?', display: 'text', correct: 40, options: [38, 39, 40, 41] },
        { question: '33 + 12 = ?', display: 'text', correct: 45, options: [43, 44, 45, 46] },
        { question: '48 + 22 = ?', display: 'text', correct: 70, options: [68, 69, 70, 71] },
      ]
    },
    // 减法
    subtraction_1: {
      name: '减法 L1',
      type: 'arithmetic',
      difficulty: 1,
      questions: [
        { question: '3 - 1 = ?', display: 'text', correct: 2, options: [1, 2, 3, 4] },
        { question: '4 - 2 = ?', display: 'text', correct: 2, options: [1, 2, 3, 4] },
        { question: '5 - 1 = ?', display: 'text', correct: 4, options: [2, 3, 4, 5] },
        { question: '2 - 1 = ?', display: 'text', correct: 1, options: [0, 1, 2, 3] },
        { question: '4 - 3 = ?', display: 'text', correct: 1, options: [0, 1, 2, 3] },
      ]
    },
    subtraction_2: {
      name: '减法 L2',
      type: 'arithmetic',
      difficulty: 2,
      questions: [
        { question: '8 - 3 = ?', display: 'text', correct: 5, options: [3, 4, 5, 6] },
        { question: '9 - 4 = ?', display: 'text', correct: 5, options: [3, 4, 5, 6] },
        { question: '10 - 5 = ?', display: 'text', correct: 5, options: [3, 4, 5, 6] },
        { question: '7 - 2 = ?', display: 'text', correct: 5, options: [3, 4, 5, 6] },
        { question: '6 - 1 = ?', display: 'text', correct: 5, options: [3, 4, 5, 6] },
      ]
    },
    subtraction_3: {
      name: '减法 L3',
      type: 'arithmetic',
      difficulty: 3,
      questions: [
        { question: '20 - 8 = ?', display: 'text', correct: 12, options: [10, 11, 12, 13] },
        { question: '35 - 15 = ?', display: 'text', correct: 20, options: [18, 19, 20, 21] },
        { question: '50 - 25 = ?', display: 'text', correct: 25, options: [23, 24, 25, 26] },
        { question: '48 - 19 = ?', display: 'text', correct: 29, options: [27, 28, 29, 30] },
        { question: '73 - 38 = ?', display: 'text', correct: 35, options: [33, 34, 35, 36] },
      ]
    },
    // 形状
    shape_1: {
      name: '形状 L1',
      type: 'shape',
      difficulty: 1,
      questions: [
        { question: '这是什么形状？', display: 'image', correct: 0, options: ['圆形', '方形'], imageType: 'circle' },
        { question: '这是什么形状？', display: 'image', correct: 1, options: ['圆形', '方形'], imageType: 'square' },
        { question: '找出圆形', display: 'image', correct: 0, options: ['圆形', '方形'], imageType: 'circle' },
        { question: '找出方形', display: 'image', correct: 1, options: ['圆形', '方形'], imageType: 'square' },
        { question: '哪个是圆形？', display: 'image', correct: 0, options: ['圆形', '方形'], imageType: 'circle' },
      ]
    },
    shape_2: {
      name: '形状 L2',
      type: 'shape',
      difficulty: 2,
      questions: [
        { question: '这是什么形状？', display: 'image', correct: 2, options: ['圆形', '方形', '三角形'], imageType: 'triangle' },
        { question: '找出三角形', display: 'image', correct: 2, options: ['圆形', '方形', '三角形'], imageType: 'triangle' },
        { question: '这是什么形状？', display: 'image', correct: 0, options: ['圆形', '方形', '三角形'], imageType: 'circle' },
        { question: '哪个不是圆形？', display: 'image', correct: 1, options: ['圆形', '方形', '三角形'], imageType: 'square' },
        { question: '这是什么形状？', display: 'image', correct: 1, options: ['圆形', '方形', '三角形'], imageType: 'square' },
      ]
    },
    shape_3: {
      name: '形状 L3',
      type: 'shape',
      difficulty: 3,
      questions: [
        { question: '这是什么形状？', display: 'image', correct: 3, options: ['五边形', '六边形', '七边形', '八边形'], imageType: 'hexagon' },
        { question: '数一数有多少条边？', display: 'image', correct: 6, options: [4, 5, 6, 7], imageType: 'hexagon' },
        { question: '这是什么形状？', display: 'image', correct: 4, options: ['三角形', '四边形', '五边形', '六边形'], imageType: 'pentagon' },
        { question: '找出八边形', display: 'image', correct: 3, options: ['六边形', '七边形', '八边形', '五边形'], imageType: 'octagon' },
        { question: '这是什么形状？', display: 'image', correct: 5, options: ['四边形', '五边形', '六边形', '七边形'], imageType: 'heptagon' },
      ]
    },
  },

  // 语文题目
  chinese: {
    // 汉字认知
    char_1: {
      name: '汉字 L1',
      type: 'chinese_char',
      difficulty: 1,
      questions: [
        { question: '哪个是"人"字？', display: 'text', correct: 0, options: ['人', '口', '日', '月'] },
        { question: '哪个是"口"字？', display: 'text', correct: 1, options: ['人', '口', '日', '月'] },
        { question: '哪个是"手"字？', display: 'text', correct: 0, options: ['手', '足', '目', '耳'] },
        { question: '哪个是"日"字？', display: 'text', correct: 2, options: ['人', '口', '日', '月'] },
        { question: '哪个是"月"字？', display: 'text', correct: 3, options: ['人', '口', '日', '月'] },
      ]
    },
    char_2: {
      name: '汉字 L2',
      type: 'chinese_char',
      difficulty: 2,
      questions: [
        { question: '哪个是"山"字？', display: 'text', correct: 0, options: ['山', '水', '火', '木'] },
        { question: '哪个是"水"字？', display: 'text', correct: 1, options: ['山', '水', '火', '木'] },
        { question: '哪个是"火"字？', display: 'text', correct: 2, options: ['山', '水', '火', '木'] },
        { question: '哪个是"木"字？', display: 'text', correct: 3, options: ['山', '水', '火', '木'] },
        { question: '哪个是"土"字？', display: 'text', correct: 0, options: ['土', '田', '石', '玉'] },
      ]
    },
    char_3: {
      name: '汉字 L3',
      type: 'chinese_char',
      difficulty: 3,
      questions: [
        { question: '哪个是"天"字？', display: 'text', correct: 0, options: ['天', '地', '人', '和'] },
        { question: '哪个是"地"字？', display: 'text', correct: 1, options: ['天', '地', '人', '和'] },
        { question: '哪个是"人"字？', display: 'text', correct: 2, options: ['天', '地', '人', '和'] },
        { question: '哪个是"和"字？', display: 'text', correct: 3, options: ['天', '地', '人', '和'] },
        { question: '哪个是"春"字？', display: 'text', correct: 0, options: ['春', '夏', '秋', '冬'] },
      ]
    },
    // 拼音
    pinyin_1: {
      name: '拼音 L1',
      type: 'pinyin',
      difficulty: 1,
      questions: [
        { question: '哪个是"a"的读音？', display: 'text', correct: 0, options: ['a', 'o', 'e', 'i'] },
        { question: '哪个是"o"的读音？', display: 'text', correct: 1, options: ['a', 'o', 'e', 'i'] },
        { question: '哪个是"e"的读音？', display: 'text', correct: 2, options: ['a', 'o', 'e', 'i'] },
        { question: '哪个是"i"的读音？', display: 'text', correct: 3, options: ['a', 'o', 'e', 'i'] },
        { question: '哪个是"u"的读音？', display: 'text', correct: 0, options: ['u', 'ü', 'ai', 'ei'] },
      ]
    },
    pinyin_2: {
      name: '拼音 L2',
      type: 'pinyin',
      difficulty: 2,
      questions: [
        { question: '哪个是"b"的读音？', display: 'text', correct: 0, options: ['b', 'p', 'm', 'f'] },
        { question: '哪个是"p"的读音？', display: 'text', correct: 1, options: ['b', 'p', 'm', 'f'] },
        { question: '哪个是"m"的读音？', display: 'text', correct: 2, options: ['b', 'p', 'm', 'f'] },
        { question: '哪个是"f"的读音？', display: 'text', correct: 3, options: ['b', 'p', 'm', 'f'] },
        { question: '哪个是"d"的读音？', display: 'text', correct: 0, options: ['d', 't', 'n', 'l'] },
      ]
    },
    pinyin_3: {
      name: '拼音 L3',
      type: 'pinyin',
      difficulty: 3,
      questions: [
        { question: '"ma"怎么读？', display: 'text', correct: 0, options: ['妈', '马', '吗', '骂'] },
        { question: '"ba"怎么读？', display: 'text', correct: 1, options: ['吧', '把', '爸', '罢'] },
        { question: '"wu"怎么读？', display: 'text', correct: 2, options: ['屋', '无', '五', '物'] },
        { question: '"yi"怎么读？', display: 'text', correct: 3, options: ['呀', '衣', '一', '易'] },
        { question: '"yu"怎么读？', display: 'text', correct: 0, options: ['鱼', '雨', '玉', '欲'] },
      ]
    },
    // 看图识词
    vocab_noun: {
      name: '看图 L1',
      type: 'vocab',
      difficulty: 1,
      questions: [
        { question: '这是什么？', display: 'image', correct: 0, options: ['苹果', '香蕉', '橘子', '葡萄'], imageType: 'apple' },
        { question: '这是什么？', display: 'image', correct: 1, options: ['苹果', '香蕉', '橘子', '葡萄'], imageType: 'banana' },
        { question: '这是什么？', display: 'image', correct: 2, options: ['苹果', '香蕉', '橘子', '葡萄'], imageType: 'orange' },
        { question: '这是什么？', display: 'image', correct: 3, options: ['苹果', '香蕉', '橘子', '葡萄'], imageType: 'grape' },
        { question: '这是什么？', display: 'image', correct: 0, options: ['汽车', '飞机', '火车', '轮船'], imageType: 'car' },
      ]
    },
    vocab_verb: {
      name: '看图 L2',
      type: 'vocab',
      difficulty: 2,
      questions: [
        { question: '小朋友在做什么？', display: 'image', correct: 0, options: ['跑步', '游泳', '跳舞', '唱歌'], imageType: 'run' },
        { question: '小朋友在做什么？', display: 'image', correct: 1, options: ['跑步', '游泳', '跳舞', '唱歌'], imageType: 'swim' },
        { question: '小朋友在做什么？', display: 'image', correct: 2, options: ['跑步', '游泳', '跳舞', '唱歌'], imageType: 'dance' },
        { question: '小朋友在做什么？', display: 'image', correct: 3, options: ['跑步', '游泳', '跳舞', '唱歌'], imageType: 'sing' },
        { question: '小朋友在做什么？', display: 'image', correct: 0, options: ['吃饭', '睡觉', '看书', '画画'], imageType: 'eat' },
      ]
    },
    vocab_adj: {
      name: '看图 L3',
      type: 'vocab',
      difficulty: 3,
      questions: [
        { question: '这个苹果是什么颜色？', display: 'image', correct: 0, options: ['红色', '绿色', '黄色', '蓝色'], imageType: 'red_apple' },
        { question: '这朵花是什么颜色？', display: 'image', correct: 1, options: ['红色', '绿色', '黄色', '蓝色'], imageType: 'yellow_flower' },
        { question: '天空是什么颜色？', display: 'image', correct: 2, options: ['红色', '绿色', '黄色', '蓝色'], imageType: 'blue_sky' },
        { question: '草是什么颜色？', display: 'image', correct: 3, options: ['红色', '绿色', '黄色', '蓝色'], imageType: 'green_grass' },
        { question: '太阳是什么颜色？', display: 'image', correct: 0, options: ['红色', '绿色', '黄色', '蓝色'], imageType: 'yellow_sun' },
      ]
    },
    // 阅读理解
    reading_1: {
      name: '阅读 L1',
      type: 'reading',
      difficulty: 1,
      questions: [
        { question: '图片里有什么？', display: 'image', correct: 0, options: ['一个小女孩', '一个小男孩', '一只小狗', '一只小猫'], imageType: 'girl' },
        { question: '图片里有什么？', display: 'image', correct: 1, options: ['一个小女孩', '一个小男孩', '一只小狗', '一只小猫'], imageType: 'boy' },
        { question: '图片里有什么？', display: 'image', correct: 2, options: ['一个小女孩', '一个小男孩', '一只小狗', '一只小猫'], imageType: 'puppy' },
        { question: '图片里有什么？', display: 'image', correct: 3, options: ['一个小女孩', '一个小男孩', '一只小狗', '一只小猫'], imageType: 'kitten' },
        { question: '图片里有什么？', display: 'image', correct: 0, options: ['一棵树', '一朵花', '一片云', '一条鱼'], imageType: 'tree' },
      ]
    },
    reading_2: {
      name: '阅读 L2',
      type: 'reading',
      difficulty: 2,
      questions: [
        { question: '小朋友在哪里？', display: 'image', correct: 0, options: ['在家里', '在学校', '在公园', '在超市'], imageType: 'home' },
        { question: '小朋友在哪里？', display: 'image', correct: 1, options: ['在家里', '在学校', '在公园', '在超市'], imageType: 'school' },
        { question: '小朋友在哪里？', display: 'image', correct: 2, options: ['在家里', '在学校', '在公园', '在超市'], imageType: 'park' },
        { question: '小朋友在哪里？', display: 'image', correct: 3, options: ['在家里', '在学校', '在公园', '在超市'], imageType: 'store' },
        { question: '这是什么地方？', display: 'image', correct: 0, options: ['海滩', '森林', '沙漠', '山脉'], imageType: 'beach' },
      ]
    },
    reading_3: {
      name: '阅读 L3',
      type: 'reading',
      difficulty: 3,
      questions: [
        { question: '故事里发生了什么？', display: 'text', correct: 0, options: ['小朋友帮妈妈打扫', '小朋友在哭', '小朋友在玩耍', '小朋友在睡觉'] },
        { question: '故事里发生了什么？', display: 'text', correct: 1, options: ['小朋友帮妈妈打扫', '小朋友在哭', '小朋友在玩耍', '小朋友在睡觉'] },
        { question: '故事里发生了什么？', display: 'text', correct: 2, options: ['小朋友帮妈妈打扫', '小朋友在哭', '小朋友在玩耍', '小朋友在睡觉'] },
        { question: '故事里发生了什么？', display: 'text', correct: 3, options: ['小朋友帮妈妈打扫', '小朋友在哭', '小朋友在玩耍', '小朋友在睡觉'] },
        { question: '故事告诉我们什么道理？', display: 'text', correct: 0, options: ['要帮助父母', '要多睡觉', '要多玩耍', '要多哭闹'] },
      ]
    },
  },

  // 英语题目
  english: {
    // 字母认知
    letter_1: {
      name: '字母 L1',
      type: 'english_letter',
      difficulty: 1,
      questions: [
        { question: '这是哪个字母？', display: 'image', correct: 0, options: ['A', 'B', 'C', 'D'], imageType: 'letter_A' },
        { question: '这是哪个字母？', display: 'image', correct: 1, options: ['A', 'B', 'C', 'D'], imageType: 'letter_B' },
        { question: '这是哪个字母？', display: 'image', correct: 2, options: ['A', 'B', 'C', 'D'], imageType: 'letter_C' },
        { question: '这是哪个字母？', display: 'image', correct: 3, options: ['A', 'B', 'C', 'D'], imageType: 'letter_D' },
        { question: '这是哪个字母？', display: 'image', correct: 0, options: ['A', 'E', 'I', 'O'], imageType: 'letter_E' },
      ]
    },
    letter_2: {
      name: '字母 L2',
      type: 'english_letter',
      difficulty: 2,
      questions: [
        { question: '这是哪个字母？', display: 'image', correct: 0, options: ['F', 'G', 'H', 'I'], imageType: 'letter_F' },
        { question: '这是哪个字母？', display: 'image', correct: 1, options: ['F', 'G', 'H', 'I'], imageType: 'letter_G' },
        { question: '这是哪个字母？', display: 'image', correct: 2, options: ['F', 'G', 'H', 'I'], imageType: 'letter_H' },
        { question: '这是哪个字母？', display: 'image', correct: 3, options: ['F', 'G', 'H', 'I'], imageType: 'letter_I' },
        { question: '这是哪个字母？', display: 'image', correct: 0, options: ['A', 'E', 'J', 'O'], imageType: 'letter_J' },
      ]
    },
    letter_3: {
      name: '字母 L3',
      type: 'english_letter',
      difficulty: 3,
      questions: [
        { question: '这是哪个字母？', display: 'image', correct: 0, options: ['K', 'L', 'M', 'N'], imageType: 'letter_K' },
        { question: '这是哪个字母？', display: 'image', correct: 1, options: ['K', 'L', 'M', 'N'], imageType: 'letter_L' },
        { question: '这是哪个字母？', display: 'image', correct: 2, options: ['K', 'L', 'M', 'N'], imageType: 'letter_M' },
        { question: '这是哪个字母？', display: 'image', correct: 3, options: ['K', 'L', 'M', 'N'], imageType: 'letter_N' },
        { question: '这是哪个字母？', display: 'image', correct: 0, options: ['O', 'P', 'Q', 'R'], imageType: 'letter_O' },
      ]
    },
    // 单词配对
    word_1: {
      name: '单词 L1',
      type: 'english_word',
      difficulty: 1,
      questions: [
        { question: '"Apple"是什么意思？', display: 'image', correct: 0, options: ['苹果', '香蕉', '橘子', '葡萄'], imageType: 'apple' },
        { question: '"Banana"是什么意思？', display: 'image', correct: 1, options: ['苹果', '香蕉', '橘子', '葡萄'], imageType: 'banana' },
        { question: '"Cat"是什么意思？', display: 'image', correct: 2, options: ['狗', '猫', '鸟', '鱼'], imageType: 'cat' },
        { question: '"Dog"是什么意思？', display: 'image', correct: 3, options: ['狗', '猫', '鸟', '鱼'], imageType: 'dog' },
        { question: '"Sun"是什么意思？', display: 'image', correct: 0, options: ['太阳', '月亮', '星星', '云'], imageType: 'sun' },
      ]
    },
    word_2: {
      name: '单词 L2',
      type: 'english_word',
      difficulty: 2,
      questions: [
        { question: '"Book"是什么意思？', display: 'image', correct: 0, options: ['书', '笔', '纸', '包'], imageType: 'book' },
        { question: '"Pen"是什么意思？', display: 'image', correct: 1, options: ['书', '笔', '纸', '包'], imageType: 'pen' },
        { question: '"Bag"是什么意思？', display: 'image', correct: 3, options: ['书', '笔', '纸', '包'], imageType: 'bag' },
        { question: '"Car"是什么意思？', display: 'image', correct: 0, options: ['汽车', '飞机', '火车', '轮船'], imageType: 'car' },
        { question: '"Fish"是什么意思？', display: 'image', correct: 2, options: ['狗', '猫', '鸟', '鱼'], imageType: 'fish' },
      ]
    },
    word_3: {
      name: '单词 L3',
      type: 'english_word',
      difficulty: 3,
      questions: [
        { question: '"Beautiful"是什么意思？', display: 'text', correct: 0, options: ['美丽的', '丑陋的', '高的', '矮的'] },
        { question: '"Happy"是什么意思？', display: 'text', correct: 1, options: ['悲伤的', '快乐的', '生气的', '害怕的'] },
        { question: '"Run"是什么意思？', display: 'text', correct: 2, options: ['走', '跑', '跳', '飞'] },
        { question: '"Eat"是什么意思？', display: 'text', correct: 3, options: ['喝', '吃', '睡', '玩'] },
        { question: '"Red"是什么意思？', display: 'text', correct: 0, options: ['红色', '蓝色', '绿色', '黄色'] },
      ]
    },
    // 字母排序
    alphabet_1: {
      name: '排序 L1',
      type: 'alphabet_order',
      difficulty: 1,
      questions: [
        { question: '按顺序排列：A C B → ？', display: 'text', correct: 1, options: ['ABC', 'ACB', 'BAC', 'CBA'] },
        { question: '按顺序排列：B A C → ？', display: 'text', correct: 0, options: ['ABC', 'ACB', 'BAC', 'CBA'] },
        { question: '按顺序排列：C B A → ？', display: 'text', correct: 2, options: ['ABC', 'ACB', 'BAC', 'CBA'] },
        { question: '按顺序排列：A B C → ？', display: 'text', correct: 0, options: ['ABC', 'ACB', 'BAC', 'CBA'] },
        { question: '按顺序排列：B C A → ？', display: 'text', correct: 1, options: ['ABC', 'ACB', 'BAC', 'CBA'] },
      ]
    },
    alphabet_2: {
      name: '排序 L2',
      type: 'alphabet_order',
      difficulty: 2,
      questions: [
        { question: '按顺序排列：A E D B C → ？', display: 'text', correct: 0, options: ['ABCDE', 'ABDCE', 'ACBDE', 'ADEBC'] },
        { question: '按顺序排列：B D A C E → ？', display: 'text', correct: 0, options: ['ABCDE', 'ABDCE', 'ACBDE', 'ADEBC'] },
        { question: '按顺序排列：E A B D C → ？', display: 'text', correct: 0, options: ['ABCDE', 'ABDCE', 'ACBDE', 'ADEBC'] },
        { question: '按顺序排列：D C B A E → ？', display: 'text', correct: 0, options: ['ABCDE', 'ABDCE', 'ACBDE', 'ADEBC'] },
        { question: '按顺序排列：C A E B D → ？', display: 'text', correct: 0, options: ['ABCDE', 'ABDCE', 'ACBDE', 'ADEBC'] },
      ]
    },
    alphabet_3: {
      name: '排序 L3',
      type: 'alphabet_order',
      difficulty: 3,
      questions: [
        { question: '把 "CAT" 的字母排序：T C A → ？', display: 'text', correct: 0, options: ['ACT', 'ATC', 'CAT', 'CTA'] },
        { question: '把 "DOG" 的字母排序：G D O → ？', display: 'text', correct: 2, options: ['ACT', 'ATC', 'DGO', 'DOG'] },
        { question: '把 "SUN" 的字母排序：N U S → ？', display: 'text', correct: 1, options: ['NSU', 'NSU', 'SUN', 'USN'] },
        { question: '把 "BIG" 的字母排序：I G B → ？', display: 'text', correct: 3, options: ['BIG', 'BGI', 'GBI', 'BGI'] },
        { question: '把 "RUN" 的字母排序：U R N → ？', display: 'text', correct: 0, options: ['NRU', 'NUR', 'RUN', 'URN'] },
      ]
    },
    // 听力选择
    listen_1: {
      name: '听力 L1',
      type: 'listening',
      difficulty: 1,
      questions: [
        { question: '听录音，选择正确的单词', audio: 'apple', correct: 0, options: ['Apple', 'Banana', 'Orange', 'Grape'] },
        { question: '听录音，选择正确的单词', audio: 'cat', correct: 1, options: ['Dog', 'Cat', 'Bird', 'Fish'] },
        { question: '听录音，选择正确的单词', audio: 'red', correct: 2, options: ['Blue', 'Green', 'Red', 'Yellow'] },
        { question: '听录音，选择正确的单词', audio: 'one', correct: 3, options: ['Two', 'Three', 'Four', 'One'] },
        { question: '听录音，选择正确的单词', audio: 'sun', correct: 0, options: ['Sun', 'Moon', 'Star', 'Cloud'] },
      ]
    },
    listen_2: {
      name: '听力 L2',
      type: 'listening',
      difficulty: 2,
      questions: [
        { question: '听录音，选择正确的单词', audio: 'book', correct: 0, options: ['Book', 'Pen', 'Bag', 'Cup'] },
        { question: '听录音，选择正确的单词', audio: 'happy', correct: 1, options: ['Sad', 'Happy', 'Angry', 'Scared'] },
        { question: '听录音，选择正确的单词', audio: 'run', correct: 2, options: ['Walk', 'Run', 'Jump', 'Fly'] },
        { question: '听录音，选择正确的单词', audio: 'water', correct: 3, options: ['Fire', 'Earth', 'Air', 'Water'] },
        { question: '听录音，选择正确的单词', audio: 'school', correct: 0, options: ['School', 'Home', 'Park', 'Store'] },
      ]
    },
    listen_3: {
      name: '听力 L3',
      type: 'listening',
      difficulty: 3,
      questions: [
        { question: '听句子，选择正确的中文翻译', audio: 'I love you', correct: 0, options: ['我爱你', '我喜欢你', '我很开心', '我很忙'] },
        { question: '听句子，选择正确的中文翻译', audio: 'Good morning', correct: 1, options: ['晚安', '早上好', '下午好', '再见'] },
        { question: '听句子，选择正确的中文翻译', audio: 'Thank you', correct: 2, options: ['对不起', '谢谢你', '不客气', '再见'] },
        { question: '听句子，选择正确的中文翻译', audio: 'I am hungry', correct: 3, options: ['我不饿', '我很饱', '我很饿', '我在吃饭'] },
        { question: '听句子，选择正确的中文翻译', audio: 'Where is the bathroom', correct: 0, options: ['厕所在哪里', '教室在哪里', '餐厅在哪里', '办公室在哪里'] },
      ]
    },
  },

  // 逻辑题目
  logic: {
    // 分类
    classify_1: {
      name: '分类 L1',
      type: 'classification',
      difficulty: 1,
      questions: [
        { question: '把苹果放到水果篮里', display: 'image', correct: 0, options: ['水果篮', '蔬菜篮'], imageType: 'apple' },
        { question: '把胡萝卜放到哪里？', display: 'image', correct: 1, options: ['水果篮', '蔬菜篮'], imageType: 'carrot' },
        { question: '把香蕉放到哪里？', display: 'image', correct: 0, options: ['水果篮', '蔬菜篮'], imageType: 'banana' },
        { question: '把白菜放到哪里？', display: 'image', correct: 1, options: ['水果篮', '蔬菜篮'], imageType: 'cabbage' },
        { question: '把葡萄放到哪里？', display: 'image', correct: 0, options: ['水果篮', '蔬菜篮'], imageType: 'grape' },
      ]
    },
    classify_2: {
      name: '分类 L2',
      type: 'classification',
      difficulty: 2,
      questions: [
        { question: '把狗归类到哪里？', display: 'image', correct: 0, options: ['动物', '植物', '交通工具'], imageType: 'dog' },
        { question: '把树归类到哪里？', display: 'image', correct: 1, options: ['动物', '植物', '交通工具'], imageType: 'tree' },
        { question: '把汽车归类到哪里？', display: 'image', correct: 2, options: ['动物', '植物', '交通工具'], imageType: 'car' },
        { question: '把鸟归类到哪里？', display: 'image', correct: 0, options: ['动物', '植物', '交通工具'], imageType: 'bird' },
        { question: '把花归类到哪里？', display: 'image', correct: 1, options: ['动物', '植物', '交通工具'], imageType: 'flower' },
      ]
    },
    classify_3: {
      name: '分类 L3',
      type: 'classification',
      difficulty: 3,
      questions: [
        { question: '按大小分类：西瓜是', display: 'image', correct: 0, options: ['大的', '小的', '中的'], imageType: 'watermelon' },
        { question: '按颜色分类：红苹果是', display: 'image', correct: 0, options: ['红色的', '绿色的', '黄色的'], imageType: 'red_apple' },
        { question: '按用途分类：椅子是用来', display: 'text', correct: 1, options: ['坐的', '放的', '吃的'], answer补充: '坐' },
        { question: '按数量分类：三个苹果是', display: 'image', correct: 2, options: ['一个', '两个', '三个'], imageType: 'three_apples' },
        { question: '按形状分类：球是', display: 'image', correct: 0, options: ['圆形的', '方形的', '三角形的'], imageType: 'ball' },
      ]
    },
    // 排序
    sequence_1: {
      name: '排序 L1',
      type: 'sequence',
      difficulty: 1,
      questions: [
        { question: '从小到大排序：5, 2, 8', display: 'text', correct: 1, options: ['5,2,8', '2,5,8', '8,5,2', '2,8,5'] },
        { question: '从小到大排序：1, 9, 3', display: 'text', correct: 2, options: ['9,3,1', '1,3,9', '1,9,3', '3,1,9'] },
        { question: '从小到大排序：7, 4, 6', display: 'text', correct: 0, options: ['4,6,7', '6,4,7', '7,6,4', '4,7,6'] },
        { question: '从大到小排序：3, 8, 5', display: 'text', correct: 0, options: ['8,5,3', '3,5,8', '5,3,8', '8,3,5'] },
        { question: '从大到小排序：9, 1, 4', display: 'text', correct: 1, options: ['1,4,9', '9,4,1', '4,1,9', '9,1,4'] },
      ]
    },
    sequence_2: {
      name: '排序 L2',
      type: 'sequence',
      difficulty: 2,
      questions: [
        { question: '从小到大排序：12, 5, 18', display: 'text', correct: 1, options: ['18,12,5', '5,12,18', '12,5,18', '5,18,12'] },
        { question: '从小到大排序：25, 10, 30', display: 'text', correct: 2, options: ['30,25,10', '10,25,30', '10,25,30', '25,10,30'] },
        { question: '从小到大排序：7, 15, 3, 11', display: 'text', correct: 0, options: ['3,7,11,15', '15,11,7,3', '3,11,7,15', '7,3,11,15'] },
        { question: '从大到小排序：20, 8, 14, 2', display: 'text', correct: 1, options: ['2,8,14,20', '20,14,8,2', '14,20,8,2', '8,2,20,14'] },
        { question: '从小到大排序：50, 30, 40, 10', display: 'text', correct: 0, options: ['10,30,40,50', '50,40,30,10', '30,10,50,40', '40,50,10,30'] },
      ]
    },
    sequence_3: {
      name: '排序 L3',
      type: 'sequence',
      difficulty: 3,
      questions: [
        { question: '按身高从高到矮排序', display: 'text', correct: 0, options: ['爸爸>妈妈>宝宝', '宝宝>妈妈>爸爸', '妈妈>爸爸>宝宝', '爸爸>宝宝>妈妈'] },
        { question: '按年龄从小到大排序', display: 'text', correct: 1, options: ['爷爷>爸爸>我', '我<爸爸<爷爷', '爸爸<我<爷爷', '爷爷<爸爸<我'] },
        { question: '按轻重从轻到重排序', display: 'text', correct: 2, options: ['大象>汽车>自行车', '自行车<汽车<大象', '自行车<汽车<大象', '汽车<大象<自行车'] },
        { question: '按速度从快到慢排序', display: 'text', correct: 0, options: ['飞机>火车>汽车', '汽车>火车>飞机', '火车>飞机>汽车', '飞机<火车<汽车'] },
        { question: '按大小从大到小排序', display: 'text', correct: 1, options: ['地球<月亮<太阳', '太阳>地球>月亮', '月亮>地球>太阳', '地球>太阳>月亮'] },
      ]
    },
    // 规律
    pattern_1: {
      name: '规律 L1',
      type: 'pattern',
      difficulty: 1,
      questions: [
        { question: '找规律：红 蓝 红 蓝 _', display: 'text', correct: 0, options: ['红', '蓝', '绿', '黄'] },
        { question: '找规律：大 小 大 小 _', display: 'text', correct: 1, options: ['小', '大', '中', '无'] },
        { question: '找规律：圆 方 圆 方 _', display: 'text', correct: 0, options: ['圆', '方', '三角', '椭圆'] },
        { question: '找规律：1 2 1 2 _', display: 'text', correct: 1, options: ['2', '1', '3', '0'] },
        { question: '找规律：高 矮 高 矮 _', display: 'text', correct: 0, options: ['高', '矮', '中', '无'] },
      ]
    },
    pattern_2: {
      name: '规律 L2',
      type: 'pattern',
      difficulty: 2,
      questions: [
        { question: '找规律：红 蓝 绿 红 蓝 绿 _', display: 'text', correct: 0, options: ['红', '蓝', '绿', '黄'] },
        { question: '找规律：大 中 小 大 中 小 _', display: 'text', correct: 1, options: ['小', '大', '中', '无'] },
        { question: '找规律：苹果 香蕉 橘子 苹果 香蕉 橘子 _', display: 'text', correct: 0, options: ['苹果', '香蕉', '橘子', '葡萄'] },
        { question: '找规律：1 2 3 1 2 3 _', display: 'text', correct: 2, options: ['3', '2', '1', '4'] },
        { question: '找规律：狗 猫 鸟 狗 猫 鸟 _', display: 'text', correct: 3, options: ['猫', '鸟', '狗', '狗'] },
      ]
    },
    pattern_3: {
      name: '规律 L3',
      type: 'pattern',
      difficulty: 3,
      questions: [
        { question: '找规律：1 1 2 3 5 8 _', display: 'text', correct: 0, options: ['13', '11', '10', '12'] },
        { question: '找规律：2 4 6 8 _', display: 'text', correct: 1, options: ['9', '10', '11', '12'] },
        { question: '找规律：1 4 9 16 _', display: 'text', correct: 2, options: ['20', '24', '25', '30'] },
        { question: '找规律：1 3 6 10 _', display: 'text', correct: 3, options: ['13', '14', '15', '16'] },
        { question: '找规律：1 2 4 8 _', display: 'text', correct: 0, options: ['16', '12', '14', '10'] },
      ]
    },
    // 逻辑推理
    reasoning_1: {
      name: '推理 L1',
      type: 'reasoning',
      difficulty: 1,
      questions: [
        { question: '如果下雨了，地面会怎样？', display: 'text', correct: 0, options: ['湿的', '干的', '热的', '冷的'] },
        { question: '如果天黑了，会看到什么？', display: 'text', correct: 1, options: ['太阳', '月亮和星星', '云', '彩虹'] },
        { question: '鱼生活在哪里？', display: 'text', correct: 2, options: ['树上', '天上', '水里', '地下'] },
        { question: '鸟有什么而鱼没有？', display: 'text', correct: 3, options: ['眼睛', '嘴巴', '尾巴', '翅膀'] },
        { question: '什么动物会飞？', display: 'image', correct: 0, options: ['鸟', '狗', '鱼', '猫'], imageType: 'bird' },
      ]
    },
    reasoning_2: {
      name: '推理 L2',
      type: 'reasoning',
      difficulty: 2,
      questions: [
        { question: '苹果比梨大，梨比橘子大，什么最大？', display: 'text', correct: 0, options: ['苹果', '梨', '橘子', '一样大'] },
        { question: '小明比小华高，小华比小丽高，谁最矮？', display: 'text', correct: 2, options: ['小明', '小华', '小丽', '一样高'] },
        { question: '如果今天Monday，明天是？', display: 'text', correct: 1, options: ['Sunday', 'Tuesday', 'Wednesday', 'Thursday'] },
        { question: '一年有几个月？', display: 'text', correct: 3, options: ['10', '11', '12', '13'] },
        { question: '一周有几天？', display: 'text', correct: 0, options: ['7', '6', '5', '8'] },
      ]
    },
    reasoning_3: {
      name: '推理 L3',
      type: 'reasoning',
      difficulty: 3,
      questions: [
        { question: '所有狗都是动物，有些动物会飞，什么一定正确？', display: 'text', correct: 0, options: ['有些狗会飞', '所有狗都不会飞', '狗不一定是动物', '无法确定'] },
        { question: 'A比B高，B比C高，D比A高，谁最高？', display: 'text', correct: 1, options: ['A', 'D', 'B', 'C'] },
        { question: '如果有雨，足球赛取消。如果没有雨，足球赛进行。没有取消足球赛，说明什么？', display: 'text', correct: 2, options: ['下了雨', '没有下雨', '无法确定', '下了小雨'] },
        { question: '红球比蓝球大，蓝球比绿球小，什么最大？', display: 'text', correct: 0, options: ['红球', '蓝球', '绿球', '一样大'] },
        { question: '如果A=B，B=C，那么A和C的关系是？', display: 'text', correct: 1, options: ['A>C', 'A=C', 'A<C', '无法确定'] },
      ]
    },
  },
};

// 获取所有学科
QuestionData.getSubjects = function() {
  return ['math', 'chinese', 'english', 'logic'];
};

// 获取学科名称
QuestionData.getSubjectName = function(subject) {
  const names = {
    math: '数学',
    chinese: '语文',
    english: '英语',
    logic: '逻辑',
  };
  return names[subject] || subject;
};

// 获取某学科所有关卡
QuestionData.getLevels = function(subject) {
  const subjectData = this[subject];
  if (!subjectData) return [];
  return Object.keys(subjectData).map(key => ({
    key,
    ...subjectData[key]
  }));
};

// 获取某关卡的题目数量
QuestionData.getQuestionCount = function(subject, level) {
  const subjectData = this[subject];
  if (!subjectData || !subjectData[level]) return 0;
  return subjectData[level].questions.length;
};

// 获取题目数据
QuestionData.getQuestion = function(subject, level, index) {
  const subjectData = this[subject];
  if (!subjectData || !subjectData[level]) return null;
  const questions = subjectData[level].questions;
  if (index < 0 || index >= questions.length) return null;
  return questions[index];
};

// ============================================================
// 响应式缩放管理器
// ============================================================
class ScaleManager {
  constructor(game) {
    this.game = game;
    this.baseWidth = CONFIG.CANVAS_WIDTH;
    this.baseHeight = CONFIG.CANVAS_HEIGHT;
    this.scaleX = 1;
    this.scaleY = 1;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.aspectRatio = this.baseWidth / this.baseHeight;
    
    this._bindEvents();
    this.update();
  }
  
  _bindEvents() {
    window.addEventListener('resize', () => this.update());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.update(), 100);
    });
  }
  
  update() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowRatio = windowWidth / windowHeight;
    
    if (windowRatio > this.aspectRatio) {
      this.scaleY = windowHeight / this.baseHeight;
      this.scaleX = this.scaleY;
    } else {
      this.scaleX = windowWidth / this.baseWidth;
      this.scaleY = this.scaleX;
    }
    
    this.scale = Math.min(this.scaleX, this.scaleY);
    this.offsetX = (windowWidth - this.baseWidth * this.scale) / 2;
    this.offsetY = (windowHeight - this.baseHeight * this.scale) / 2;
    
    this.game.canvas.width = this.baseWidth;
    this.game.canvas.height = this.baseHeight;
    this.game.canvas.style.width = `${windowWidth}px`;
    this.game.canvas.style.height = `${windowHeight}px`;
    this.game.canvas.style.transform = `scale(${this.scale})`;
    this.game.canvas.style.transformOrigin = 'top left';
    this.game.canvas.style.position = 'absolute';
    this.game.canvas.style.left = `${this.offsetX}px`;
    this.game.canvas.style.top = `${this.offsetY}px`;
  }
  
  screenToGame(screenX, screenY) {
    const rect = this.game.canvas.getBoundingClientRect();
    const x = (screenX - rect.left) / this.scale;
    const y = (screenY - rect.top) / this.scale;
    return { x, y };
  }
  
  gameToScreen(gameX, gameY) {
    return {
      x: gameX * this.scale + this.offsetX,
      y: gameY * this.scale + this.offsetY,
    };
  }
  
  resizeCanvas() {
    this.update();
  }
}

// ============================================================
// 输入管理器
// ============================================================
class InputManager {
  constructor(game) {
    this.game = game;
    this.keys = {};
    this.keyMap = {};
    this.touches = new Map();
    this.mouse = { x: 0, y: 0, down: false, justDown: false, justUp: false };
    this.pointers = [];
    
    this._bindEvents();
  }
  
  _bindEvents() {
    // 键盘事件
    window.addEventListener('keydown', e => this._onKeyDown(e));
    window.addEventListener('keyup', e => this._onKeyUp(e));
    
    // 鼠标事件
    this.game.canvas.addEventListener('mousedown', e => this._onMouseDown(e));
    this.game.canvas.addEventListener('mouseup', e => this._onMouseUp(e));
    this.game.canvas.addEventListener('mousemove', e => this._onMouseMove(e));
    this.game.canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    // 触摸事件
    this.game.canvas.addEventListener('touchstart', e => this._onTouchStart(e), { passive: false });
    this.game.canvas.addEventListener('touchend', e => this._onTouchEnd(e), { passive: false });
    this.game.canvas.addEventListener('touchmove', e => this._onTouchMove(e), { passive: false });
    
    // 防止默认触摸行为
    this.game.canvas.style.touchAction = 'none';
  }
  
  _onKeyDown(e) {
    if (!this.keys[e.code]) {
      this.keys[e.code] = { down: true, justPressed: true };
    }
    this.keys[e.code].held = true;
    
    // 触发按键事件回调
    if (this.game.currentScene && this.game.currentScene.onKeyDown) {
      this.game.currentScene.onKeyDown(e);
    }
  }
  
  _onKeyUp(e) {
    if (this.keys[e.code]) {
      this.keys[e.code].down = false;
      this.keys[e.code].justReleased = true;
      this.keys[e.code].held = false;
    }
    
    if (this.game.currentScene && this.game.currentScene.onKeyUp) {
      this.game.currentScene.onKeyUp(e);
    }
  }
  
  _onMouseDown(e) {
    e.preventDefault();
    const pos = this.game.scaleManager.screenToGame(e.clientX, e.clientY);
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;
    this.mouse.down = true;
    this.mouse.justDown = true;
    this.mouse.button = e.button;
    
    if (this.game.currentScene && this.game.currentScene.onPointerDown) {
      this.game.currentScene.onPointerDown(pos.x, pos.y, 'mouse');
    }
  }
  
  _onMouseUp(e) {
    e.preventDefault();
    const pos = this.game.scaleManager.screenToGame(e.clientX, e.clientY);
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;
    this.mouse.down = false;
    this.mouse.justUp = true;
    
    if (this.game.currentScene && this.game.currentScene.onPointerUp) {
      this.game.currentScene.onPointerUp(pos.x, pos.y, 'mouse');
    }
  }
  
  _onMouseMove(e) {
    const pos = this.game.scaleManager.screenToGame(e.clientX, e.clientY);
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;
    
    if (this.game.currentScene && this.game.currentScene.onPointerMove) {
      this.game.currentScene.onPointerMove(pos.x, pos.y);
    }
  }
  
  _onTouchStart(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const pos = this.game.scaleManager.screenToGame(touch.clientX, touch.clientY);
      const pointerId = touch.identifier || 0;
      
      this.touches.set(pointerId, {
        id: pointerId,
        x: pos.x,
        y: pos.y,
        startX: pos.x,
        startY: pos.y,
        down: true,
        justDown: true,
      });
      
      if (this.game.currentScene && this.game.currentScene.onPointerDown) {
        this.game.currentScene.onPointerDown(pos.x, pos.y, 'touch');
      }
    }
  }
  
  _onTouchEnd(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const pointerId = touch.identifier || 0;
      const t = this.touches.get(pointerId);
      
      if (t) {
        t.down = false;
        t.justUp = true;
        
        const pos = this.game.scaleManager.screenToGame(touch.clientX, touch.clientY);
        
        if (this.game.currentScene && this.game.currentScene.onPointerUp) {
          this.game.currentScene.onPointerUp(pos.x, pos.y, 'touch');
        }
        
        this.touches.delete(pointerId);
      }
    }
  }
  
  _onTouchMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const pointerId = touch.identifier || 0;
      const t = this.touches.get(pointerId);
      
      if (t) {
        const pos = this.game.scaleManager.screenToGame(touch.clientX, touch.clientY);
        t.x = pos.x;
        t.y = pos.y;
        t.deltaX = pos.x - t.lastX || 0;
        t.deltaY = pos.y - t.lastY || 0;
        t.lastX = pos.x;
        t.lastY = pos.y;
        
        if (this.game.currentScene && this.game.currentScene.onPointerMove) {
          this.game.currentScene.onPointerMove(pos.x, pos.y);
        }
      }
    }
  }
  
  isKeyDown(code) {
    return this.keys[code] && this.keys[code].held;
  }
  
  isKeyJustDown(code) {
    return this.keys[code] && this.keys[code].justPressed;
  }
  
  getPointer() {
    if (this.touches.size > 0) {
      return Array.from(this.touches.values())[0];
    }
    return this.mouse.down ? this.mouse : null;
  }
  
  getPointers() {
    return Array.from(this.touches.values());
  }
  
  update() {
    // 清除单帧按键状态
    for (const key in this.keys) {
      this.keys[key].justPressed = false;
      this.keys[key].justReleased = false;
    }
    
    this.mouse.justDown = false;
    this.mouse.justUp = false;
    
    for (const t of this.touches.values()) {
      t.justDown = false;
      t.justUp = false;
    }
  }
}

// ============================================================
// 动画系统
// ============================================================
class Tween {
  constructor(target, props, duration, ease = 'linear', onUpdate, onComplete) {
    this.target = target;
    this.props = props;
    this.duration = duration;
    this.ease = typeof ease === 'function' ? ease : Tween.EASING[ease] || Tween.EASING.linear;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    
    this.elapsed = 0;
    this.progress = 0;
    this.startValues = {};
    this.isRunning = false;
    this.isPaused = false;
    this.repeat = 0;
    this.repeatCount = 0;
    this.yoyo = false;
    this.reverse = false;
    this.destroyed = false;
    
    for (const prop in props) {
      this.startValues[prop] = target[prop];
    }
  }
  
  start() {
    this.isRunning = true;
    return this;
  }
  
  pause() {
    this.isPaused = true;
    return this;
  }
  
  resume() {
    this.isPaused = false;
    return this;
  }
  
  stop() {
    this.isRunning = false;
    this.destroyed = true;
    return this;
  }
  
  repeatYoyo(yoyo = true) {
    this.yoyo = yoyo;
    return this;
  }
  
  repeatTimes(times) {
    this.repeat = times;
    return this;
  }
  
  update(dt) {
    if (!this.isRunning || this.isPaused || this.destroyed) return;
    
    this.elapsed += dt;
    this.progress = Math.min(this.elapsed / this.duration, 1);
    
    let easeProgress = this.ease(this.progress);
    
    if (this.yoyo) {
      if (this.reverse) {
        easeProgress = 1 - easeProgress;
      }
    }
    
    for (const prop in this.props) {
      const start = this.startValues[prop];
      const end = this.props[prop];
      this.target[prop] = Utils.lerp(start, end, easeProgress);
    }
    
    if (this.onUpdate) {
      this.onUpdate(this.target, this.progress);
    }
    
    if (this.progress >= 1) {
      if (this.repeat > 0 && this.repeatCount < this.repeat) {
        this.repeatCount++;
        this.elapsed = 0;
        if (this.yoyo) {
          this.reverse = !this.reverse;
        }
        for (const prop in this.props) {
          this.startValues[prop] = this.target[prop];
        }
      } else if (this.repeat === -1 || (this.repeat > 0 && this.repeatCount >= this.repeat)) {
        this.isRunning = false;
        if (this.onComplete) {
          this.onComplete(this.target);
        }
      } else {
        this.isRunning = false;
        if (this.onComplete) {
          this.onComplete(this.target);
        }
      }
    }
  }
}

Tween.EASING = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutElastic: t => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },
  easeOutBounce: t => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      t -= 1.5 / 2.75;
      return 7.5625 * t * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      t -= 2.25 / 2.75;
      return 7.5625 * t * t + 0.9375;
    } else {
      t -= 2.625 / 2.75;
      return 7.5625 * t * t + 0.984375;
    }
  },
  easeInBack: t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

class TweenManager {
  constructor() {
    this.tweens = [];
    this._addQueue = [];
    this._removeQueue = [];
  }
  
  add(target, props, duration, ease = 'linear', onUpdate, onComplete) {
    const tween = new Tween(target, props, duration, ease, onUpdate, onComplete);
    this._addQueue.push(tween);
    return tween;
  }
  
  remove(tween) {
    if (!tween.destroyed) {
      tween.stop();
      this._removeQueue.push(tween);
    }
  }
  
  removeAll() {
    for (const tween of this.tweens) {
      tween.stop();
    }
    this._removeQueue.push(...this.tweens);
  }
  
  update(dt) {
    // 处理队列
    while (this._addQueue.length > 0) {
      const t = this._addQueue.shift();
      t.start();
      this.tweens.push(t);
    }
    
    while (this._removeQueue.length > 0) {
      const t = this._removeQueue.shift();
      const idx = this.tweens.indexOf(t);
      if (idx !== -1) {
        this.tweens.splice(idx, 1);
      }
    }
    
    // 更新所有活跃的tween
    for (const tween of this.tweens) {
      if (tween.isRunning && !tween.isPaused) {
        tween.update(dt);
      }
    }
  }
}

// ============================================================
// 粒子系统
// ============================================================
class Particle {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = options.vx || Utils.random(-2, 2);
    this.vy = options.vy || Utils.random(-5, -1);
    this.ax = options.ax || 0;
    this.ay = options.ay || CONFIG.GRAVITY;
    
    this.life = options.life || 1;
    this.maxLife = this.life;
    this.decay = options.decay || 0.01;
    
    this.size = options.size || Utils.random(2, 6);
    this.startSize = this.size;
    this.endSize = options.endSize || 0;
    
    this.color = options.color || '#FFDD44';
    this.startColor = this.color;
    this.endColor = options.endColor || this.color;
    
    this.alpha = options.alpha || 1;
    this.rotation = options.rotation || 0;
    this.rotationSpeed = options.rotationSpeed || 0;
    
    this.gravityScale = options.gravityScale || 1;
    this.friction = options.friction || CONFIG.FRICTION;
    
    this.shape = options.shape || 'circle'; // circle, square, star, heart
    this.active = true;
  }
  
  update(dt) {
    if (!this.active) return;
    
    // 应用重力
    this.vx += this.ax * dt / 16;
    this.vy += this.ay * this.gravityScale * dt / 16;
    
    // 应用摩擦力
    this.vx *= this.friction;
    this.vy *= this.friction;
    
    // 更新位置
    this.x += this.vx * dt / 16;
    this.y += this.vy * dt / 16;
    
    // 更新生命周期
    this.life -= this.decay * dt / 16;
    if (this.life <= 0) {
      this.life = 0;
      this.active = false;
      return;
    }
    
    // 更新大小
    const lifeRatio = this.life / this.maxLife;
    this.size = Utils.lerp(this.endSize, this.startSize, lifeRatio);
    
    // 更新颜色
    this.color = this.endColor;
    
    // 更新旋转
    this.rotation += this.rotationSpeed * dt / 16;
    
    // 更新透明度
    this.alpha = lifeRatio;
  }
  
  render(ctx) {
    if (!this.active || this.alpha <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    ctx.fillStyle = this.color;
    
    switch (this.shape) {
      case 'square':
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        break;
      case 'star':
        this._drawStar(ctx, 0, 0, 5, this.size, this.size / 2);
        break;
      case 'heart':
        this._drawHeart(ctx, 0, 0, this.size);
        break;
      default: // circle
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
  }
  
  _drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }
  
  _drawHeart(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
    ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 0.75, x, y + size);
    ctx.bezierCurveTo(x, y + size * 0.75, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
    ctx.fill();
  }
}

class ParticleEmitter {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.options = options;
    this.particles = [];
    this.isEmitting = false;
    this.emitCount = 0;
    this.emitTimer = 0;
    this.burstMode = options.burst || false;
  }
  
  emit(count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = this.options.angle !== undefined 
        ? this.options.angle + Utils.random(-this.options.spread || 0, this.options.spread || 0)
        : Utils.random(0, Math.PI * 2);
      
      const speed = Utils.random(this.options.minSpeed || 1, this.options.maxSpeed || 5);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      const color = Array.isArray(this.options.colors)
        ? this.options.colors[Utils.randomInt(0, this.options.colors.length - 1)]
        : this.options.color || '#FFDD44';
      
      const particle = new Particle(
        this.x + Utils.random(-this.options.offsetX || 0, this.options.offsetX || 0),
        this.y + Utils.random(-this.options.offsetY || 0, this.options.offsetY || 0),
        {
          vx,
          vy,
          life: Utils.random(this.options.minLife || 0.5, this.options.maxLife || 1),
          decay: Utils.random(this.options.minDecay || 0.01, this.options.maxDecay || 0.02),
          size: Utils.random(this.options.minSize || 2, this.options.maxSize || 6),
          endSize: this.options.endSize || 0,
          color,
          endColor: this.options.endColor || color,
          ax: this.options.ax || 0,
          ay: this.options.ay || CONFIG.GRAVITY,
          gravityScale: this.options.gravityScale !== undefined ? this.options.gravityScale : 1,
          friction: this.options.friction || CONFIG.FRICTION,
          shape: this.options.shape || 'circle',
          rotation: Utils.random(0, Math.PI * 2),
          rotationSpeed: Utils.random(-0.1, 0.1),
        }
      );
      
      this.particles.push(particle);
    }
  }
  
  start() {
    this.isEmitting = true;
    this.emitTimer = 0;
    this.emitCount = 0;
    
    if (this.burstMode) {
      this.emit(this.options.burstCount || 20);
      this.isEmitting = false;
    }
  }
  
  stop() {
    this.isEmitting = false;
  }
  
  update(dt) {
    // 更新粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      
      if (!p.active) {
        this.particles.splice(i, 1);
      }
    }
    
    // 持续发射
    if (this.isEmitting && !this.burstMode) {
      this.emitTimer += dt;
      const interval = this.options.interval || 100;
      
      while (this.emitTimer >= interval) {
        this.emitTimer -= interval;
        this.emit(this.options.emitPerInterval || 1);
        this.emitCount++;
        
        if (this.options.maxEmits && this.emitCount >= this.options.maxEmits) {
          this.isEmitting = false;
          break;
        }
      }
    }
  }
  
  render(ctx) {
    for (const p of this.particles) {
      p.render(ctx);
    }
  }
  
  get activeCount() {
    return this.particles.length;
  }
}

class ParticleSystem {
  constructor() {
    this.emitters = [];
  }
  
  createEmitter(x, y, options) {
    const emitter = new ParticleEmitter(x, y, options);
    this.emitters.push(emitter);
    return emitter;
  }
  
  emitAt(x, y, options) {
    const emitter = this.createEmitter(x, y, options);
    emitter.start();
    return emitter;
  }
  
  burst(x, y, options = {}) {
    return this.emitAt(x, y, { ...options, burst: true, burstCount: options.count || 20 });
  }
  
  sparkle(x, y, color = '#FFDD44') {
    return this.emitAt(x, y, {
      burst: true,
      count: 8,
      colors: [color, '#FFFFFF', color],
      minSpeed: 1,
      maxSpeed: 3,
      minSize: 1,
      maxSize: 3,
      minLife: 0.3,
      maxLife: 0.6,
      gravityScale: 0.3,
      spread: Math.PI * 2,
    });
  }
  
  confetti(x, y) {
    return this.emitAt(x, y, {
      burst: true,
      count: 30,
      colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'],
      minSpeed: 2,
      maxSpeed: 6,
      minSize: 3,
      maxSize: 7,
      minLife: 1,
      maxLife: 2,
      gravityScale: 0.5,
      spread: Math.PI,
      angle: -Math.PI / 2,
    });
  }
  
  leaf(x, y) {
    return this.emitAt(x, y, {
      colors: ['#7CB342', '#8BC34A', '#9CCC65', '#AED581'],
      minSpeed: 1,
      maxSpeed: 3,
      minSize: 4,
      maxSize: 8,
      minLife: 1.5,
      maxLife: 3,
      gravityScale: 0.2,
      friction: 0.99,
      spread: Math.PI * 0.5,
      angle: -Math.PI / 2,
      shape: 'square',
    });
  }
  
  update(dt) {
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const emitter = this.emitters[i];
      emitter.update(dt);
      
      if (emitter.activeCount === 0 && !emitter.isEmitting) {
        this.emitters.splice(i, 1);
      }
    }
  }
  
  render(ctx) {
    for (const emitter of this.emitters) {
      emitter.render(ctx);
    }
  }
  
  clear() {
    this.emitters = [];
  }
}

// ============================================================
// 精灵动画系统
// ============================================================
class SpriteAnimation {
  constructor(frames, frameRate = 10, loop = true) {
    this.frames = frames;
    this.frameRate = frameRate;
    this.loop = loop;
    this.currentFrame = 0;
    this.elapsed = 0;
    this.isPlaying = false;
    this.isFinished = false;
    this.onComplete = null;
  }
  
  play() {
    this.isPlaying = true;
    this.isFinished = false;
    this.currentFrame = 0;
    this.elapsed = 0;
    return this;
  }
  
  stop() {
    this.isPlaying = false;
    return this;
  }
  
  update(dt) {
    if (!this.isPlaying || this.isFinished) return;
    
    this.elapsed += dt;
    const frameTime = 1000 / this.frameRate;
    
    while (this.elapsed >= frameTime) {
      this.elapsed -= frameTime;
      this.currentFrame++;
      
      if (this.currentFrame >= this.frames.length) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.frames.length - 1;
          this.isFinished = true;
          this.isPlaying = false;
          if (this.onComplete) {
            this.onComplete();
          }
          return;
        }
      }
    }
  }
  
  getCurrentFrame() {
    return this.frames[this.currentFrame] || this.frames[0];
  }
}

class Sprite {
  constructor(image, frameWidth, frameHeight, frameCount = 1) {
    this.image = image;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameCount = frameCount;
    this.animations = {};
    this.currentAnimation = null;
    this.frameIndex = 0;
    this.anchorX = 0.5;
    this.anchorY = 0.5;
    this.scaleX = 1;
    this.scaleY = 1;
    this.rotation = 0;
    this.alpha = 1;
    this.tint = null;
    this.visible = true;
    this.flipX = false;
    this.flipY = false;
  }
  
  addAnimation(name, frames, frameRate = 10, loop = true) {
    const anim = new SpriteAnimation(frames, frameRate, loop);
    this.animations[name] = anim;
    return anim;
  }
  
  play(name, onComplete) {
    if (!this.animations[name]) {
      console.warn(`Animation "${name}" not found`);
      return;
    }
    
    if (this.currentAnimation) {
      this.currentAnimation.stop();
    }
    
    this.currentAnimation = this.animations[name];
    this.currentAnimation.onComplete = onComplete;
    this.currentAnimation.play();
  }
  
  stop() {
    if (this.currentAnimation) {
      this.currentAnimation.stop();
    }
  }
  
  update(dt) {
    if (this.currentAnimation) {
      this.currentAnimation.update(dt);
      this.frameIndex = this.currentAnimation.currentFrame;
    }
  }
  
  render(ctx, x, y) {
    if (!this.visible) return;
    
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(x, y);
    ctx.rotate(this.rotation);
    ctx.scale(this.flipX ? -this.scaleX : this.scaleX, this.flipY ? -this.scaleY : this.scaleY);
    
    if (this.tint) {
      ctx.filter = `brightness(${this.tint})`;
    }
    
    const frameX = (this.frameIndex % this._getColumns()) * this.frameWidth;
    const frameY = Math.floor(this.frameIndex / this._getColumns()) * this.frameHeight;
    
    ctx.drawImage(
      this.image,
      frameX, frameY,
      this.frameWidth, this.frameHeight,
      -this.frameWidth * this.anchorX,
      -this.frameHeight * this.anchorY,
      this.frameWidth,
      this.frameHeight
    );
    
    ctx.restore();
  }
  
  _getColumns() {
    return Math.floor(this.image.width / this.frameWidth);
  }
}

// ============================================================
// 场景基类
// ============================================================
class Scene {
  constructor(game, name) {
    this.game = game;
    this.name = name;
    this.objects = [];
    this.uiElements = [];
    this.isActive = false;
    this.isPaused = false;
    this.transitioning = false;
  }
  
  init() {}
  
  enter(data) {}
  
  exit() {}
  
  update(dt) {
    if (this.isPaused) return;
    
    for (const obj of this.objects) {
      if (obj.update) {
        obj.update(dt);
      }
    }
  }
  
  render(ctx) {
    for (const obj of this.objects) {
      if (obj.render) {
        obj.render(ctx);
      }
    }
  }
  
  onKeyDown(e) {}
  
  onKeyUp(e) {}
  
  onPointerDown(x, y, pointer) {}
  
  onPointerUp(x, y, pointer) {}
  
  onPointerMove(x, y) {}
  
  addObject(obj) {
    this.objects.push(obj);
    return obj;
  }
  
  removeObject(obj) {
    const idx = this.objects.indexOf(obj);
    if (idx !== -1) {
      this.objects.splice(idx, 1);
    }
    return obj;
  }
  
  bringToFront(obj) {
    const idx = this.objects.indexOf(obj);
    if (idx !== -1) {
      this.objects.splice(idx, 1);
      this.objects.push(obj);
    }
  }
  
  sendToBack(obj) {
    const idx = this.objects.indexOf(obj);
    if (idx !== -1) {
      this.objects.splice(idx, 1);
      this.objects.unshift(obj);
    }
  }
}

// ============================================================
// UI 元素
// ============================================================
class UIElement {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.visible = true;
    this.interactive = true;
    this.alpha = 1;
    this.scaleX = 1;
    this.scaleY = 1;
    this.rotation = 0;
    this.tint = '#FFFFFF';
    this.isPressed = false;
    this.isHovered = false;
    this.onClick = null;
    this.onPointerDown = null;
    this.onPointerUp = null;
    this.onPointerEnter = null;
    this.onPointerLeave = null;
  }
  
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
  
  setSize(width, height) {
    this.width = width;
    this.height = height;
    return this;
  }
  
  contains(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
  
  update(dt) {}
  
  render(ctx) {}
  
  handlePointerDown(x, y) {
    if (!this.visible || !this.interactive) return false;
    if (this.contains(x, y)) {
      this.isPressed = true;
      if (this.onPointerDown) this.onPointerDown(this);
      return true;
    }
    return false;
  }
  
  handlePointerUp(x, y) {
    if (!this.visible || !this.interactive) return false;
    if (this.isPressed) {
      this.isPressed = false;
      if (this.contains(x, y)) {
        if (this.onClick) this.onClick(this);
        if (this.onPointerUp) this.onPointerUp(this);
        return true;
      }
    }
    return false;
  }
  
  handlePointerMove(x, y) {
    if (!this.visible || !this.interactive) return false;
    
    const wasHovered = this.isHovered;
    this.isHovered = this.contains(x, y);
    
    if (this.isHovered && !wasHovered && this.onPointerEnter) {
      this.onPointerEnter(this);
    } else if (!this.isHovered && wasHovered && this.onPointerLeave) {
      this.onPointerLeave(this);
    }
    
    return this.isHovered;
  }
}

class Button extends UIElement {
  constructor(x, y, width, height, text = '') {
    super(x, y, width, height);
    this.text = text;
    this.backgroundColor = '#4CAF50';
    this.pressedColor = '#388E3C';
    this.hoverColor = '#66BB6A';
    this.disabledColor = '#9E9E9E';
    this.textColor = '#FFFFFF';
    this.fontSize = 24;
    this.fontFamily = 'Arial, sans-serif';
    this.borderRadius = 8;
    this.disabled = false;
    this.icon = null;
    this.iconAlign = 'left';
    this.padding = 10;
  }
  
  render(ctx) {
    if (!this.visible) return;
    
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);
    ctx.scale(this.scaleX, this.scaleY);
    
    let color = this.backgroundColor;
    if (this.disabled) {
      color = this.disabledColor;
    } else if (this.isPressed) {
      color = this.pressedColor;
    } else if (this.isHovered) {
      color = this.hoverColor;
    }
    
    // 绘制背景
    ctx.fillStyle = color;
    this._roundRect(ctx, -this.width / 2, -this.height / 2, this.width, this.height, this.borderRadius);
    ctx.fill();
    
    // 绘制图标
    if (this.icon) {
      const iconSize = this.height - this.padding * 2;
      const iconX = this.iconAlign === 'left' 
        ? -this.width / 2 + this.padding
        : this.width / 2 - this.padding - iconSize;
      
      ctx.drawImage(
        this.icon,
        iconX,
        -iconSize / 2,
        iconSize,
        iconSize
      );
    }
    
    // 绘制文字
    if (this.text) {
      ctx.fillStyle = this.textColor;
      ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      ctx.textAlign = this.icon ? 'center' : 'center';
      ctx.textBaseline = 'middle';
      
      const textX = this.icon 
        ? (this.iconAlign === 'left' ? iconSize / 2 + this.padding : -iconSize / 2 - this.padding)
        : 0;
      
      ctx.fillText(this.text, textX, 0);
    }
    
    ctx.restore();
  }
  
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

class Text extends UIElement {
  constructor(x, y, text = '', style = {}) {
    super(x, y, 0, 0);
    this.text = text;
    this.fontSize = style.fontSize || 24;
    this.fontFamily = style.fontFamily || 'Arial, sans-serif';
    this.fontStyle = style.fontStyle || 'normal';
    this.fontWeight = style.fontWeight || 'normal';
    this.textColor = style.color || '#000000';
    this.textAlign = style.align || 'left';
    this.textBaseline = style.baseline || 'top';
    this.lineHeight = style.lineHeight || this.fontSize * 1.2;
    this.maxWidth = style.maxWidth || null;
    this.outlineColor = style.outlineColor || null;
    this.outlineWidth = style.outlineWidth || 2;
    this.shadowColor = style.shadowColor || null;
    this.shadowBlur = style.shadowBlur || 0;
    this.shadowOffsetX = style.shadowOffsetX || 0;
    this.shadowOffsetY = style.shadowOffsetY || 0;
  }
  
  setText(text) {
    this.text = text;
    return this;
  }
  
  render(ctx) {
    if (!this.visible) return;
    
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scaleX, this.scaleY);
    
    ctx.font = `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = this.textBaseline;
    
    if (this.shadowColor) {
      ctx.shadowColor = this.shadowColor;
      ctx.shadowBlur = this.shadowBlur;
      ctx.shadowOffsetX = this.shadowOffsetX;
      ctx.shadowOffsetY = this.shadowOffsetY;
    }
    
    if (this.outlineColor) {
      ctx.strokeStyle = this.outlineColor;
      ctx.lineWidth = this.outlineWidth;
    }
    
    ctx.fillStyle = this.textColor;
    
    const lines = this.text.toString().split('\n');
    let offsetY = 0;
    
    for (const line of lines) {
      if (this.outlineColor) {
        ctx.strokeText(line, 0, offsetY, this.maxWidth);
      }
      ctx.fillText(line, 0, offsetY, this.maxWidth);
      offsetY += this.lineHeight;
    }
    
    ctx.restore();
  }
  
  getWidth() {
    ctx.save();
    ctx.font = `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    const width = ctx.measureText(this.text).width;
    ctx.restore();
    return width;
  }
  
  getHeight() {
    const lines = this.text.toString().split('\n');
    return lines.length * this.lineHeight;
  }
}

class ProgressBar extends UIElement {
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.value = 0;
    this.maxValue = 100;
    this.minValue = 0;
    this.backgroundColor = '#E0E0E0';
    this.fillColor = '#4CAF50';
    this.borderColor = '#333333';
    this.borderWidth = 2;
    this.borderRadius = 4;
    this.showText = true;
    this.textColor = '#FFFFFF';
    this.fontSize = 14;
  }
  
  setValue(value) {
    this.value = Utils.clamp(value, this.minValue, this.maxValue);
    return this;
  }
  
  getPercent() {
    return (this.value - this.minValue) / (this.maxValue - this.minValue);
  }
  
  render(ctx) {
    if (!this.visible) return;
    
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scaleX, this.scaleY);
    
    // 绘制背景
    ctx.fillStyle = this.backgroundColor;
    this._roundRect(ctx, 0, 0, this.width, this.height, this.borderRadius);
    ctx.fill();
    
    // 绘制填充
    const fillWidth = this.width * this.getPercent();
    if (fillWidth > 0) {
      ctx.fillStyle = this.fillColor;
      ctx.save();
      ctx.beginPath();
      this._roundRect(ctx, 0, 0, this.width, this.height, this.borderRadius);
      ctx.clip();
      ctx.fillRect(0, 0, fillWidth, this.height);
      ctx.restore();
    }
    
    // 绘制边框
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = this.borderWidth;
    this._roundRect(ctx, 0, 0, this.width, this.height, this.borderRadius);
    ctx.stroke();
    
    // 绘制文字
    if (this.showText) {
      ctx.fillStyle = this.textColor;
      ctx.font = `${this.fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(this.getPercent() * 100)}%`, this.width / 2, this.height / 2);
    }
    
    ctx.restore();
  }
  
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

// ============================================================
// 花园场景
// ============================================================
class GardenScene extends Scene {
  constructor(game) {
    super(game, SceneType.GARDEN);
    this.selectedPlot = null;
    this.plots = [];
    this.plantTypes = {};
    this.gardenData = null;
  }
  
  init() {
    this.gardenData = Storage.get('garden');
    this._createPlots();
    this._createUI();
  }
  
  enter(data) {
    this.isActive = true;
    this.gardenData = Storage.get('garden');
    Storage.data.statistics.visits++;
    Storage.save();
  }
  
  exit() {
    this.isActive = false;
    Storage.save();
  }
  
  _createPlots() {
    this.plots = [];
    const plotSize = 100;
    const spacing = 20;
    const startX = 60;
    const startY = 400;
    
    for (let i = 0; i < this.gardenData.plots; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = startX + col * (plotSize + spacing);
      const y = startY + row * (plotSize + spacing);
      const isUnlocked = i < this.gardenData.unlockedPlots;
      
      this.plots.push({
        x,
        y,
        width: plotSize,
        height: plotSize,
        index: i,
        isUnlocked,
        plant: this.gardenData.plants[i] || null,
      });
    }
  }
  
  _createUI() {
    // 顶部状态栏
    const coinText = new Text(20, 20, `金币: ${Storage.data.player.coins}`, {
      fontSize: 20,
      color: '#FFD700',
      fontWeight: 'bold',
    });
    coinText.name = 'coinText';
    this.uiElements.push(coinText);

    const gemText = new Text(150, 20, `宝石: ${Storage.data.player.gems}`, {
      fontSize: 20,
      color: '#9C27B0',
      fontWeight: 'bold',
    });
    gemText.name = 'gemText';
    this.uiElements.push(gemText);

    // 商店按钮
    const shopBtn = new Button(CONFIG.CANVAS_WIDTH - 120, 20, 100, 40, '商店');
    shopBtn.onClick = () => this.game.changeScene(SceneType.SHOP);
    this.uiElements.push(shopBtn);

    // 背包按钮
    const invBtn = new Button(CONFIG.CANVAS_WIDTH - 230, 20, 100, 40, '背包');
    invBtn.onClick = () => this.game.changeScene(SceneType.INVENTORY);
    this.uiElements.push(invBtn);

    // 宠物区域 - 顶部
    this._createPetUI();

    // 土地说明
    const hintText = new Text(CONFIG.CANVAS_WIDTH / 2, 200, '点击空地播种', {
      fontSize: 18,
      color: '#666666',
      align: 'center',
    });
    this.uiElements.push(hintText);
  }

  _createPetUI() {
    // 宠物区域背景
    const petBg = {
      x: 60,
      y: 60,
      width: 200,
      height: 120,
      isPetArea: true,
      petX: 120,
      petY: 140,
      petSize: 50,
      render: function(ctx) {
        // 宠物窝背景
        ctx.fillStyle = '#FFF8E1';
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 15);
        ctx.fill();
        ctx.stroke();

        // 绘制宠物
        const pet = Storage.data.pet;
        this._drawPet(ctx, this.petX, this.petY, this.petSize, pet);
      },
      _drawPet: function(ctx, x, y, size, pet) {
        ctx.save();
        ctx.translate(x, y);

        if (pet.type === 'dog') {
          // 小狗 - 白色
          // 身体
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#5D4037';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, 0, size * 0.6, size * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 头
          ctx.beginPath();
          ctx.arc(0, -size * 0.4, size * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 耳朵
          ctx.beginPath();
          ctx.ellipse(-size * 0.3, -size * 0.6, size * 0.15, size * 0.2, -0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(size * 0.3, -size * 0.6, size * 0.15, size * 0.2, 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 眼睛
          ctx.fillStyle = '#3E2723';
          ctx.beginPath();
          ctx.arc(-size * 0.15, -size * 0.45, size * 0.08, 0, Math.PI * 2);
          ctx.arc(size * 0.15, -size * 0.45, size * 0.08, 0, Math.PI * 2);
          ctx.fill();

          // 眼睛高光
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(-size * 0.18, -size * 0.48, size * 0.03, 0, Math.PI * 2);
          ctx.arc(size * 0.12, -size * 0.48, size * 0.03, 0, Math.PI * 2);
          ctx.fill();

          // 鼻子
          ctx.fillStyle = '#3E2723';
          ctx.beginPath();
          ctx.ellipse(0, -size * 0.3, size * 0.08, size * 0.06, 0, 0, Math.PI * 2);
          ctx.fill();

          // 嘴巴 - 根据心情
          ctx.strokeStyle = '#5D4037';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          if (pet.happiness > 60) {
            ctx.arc(0, -size * 0.2, size * 0.15, 0.1 * Math.PI, 0.9 * Math.PI);
          } else if (pet.happiness > 30) {
            ctx.moveTo(-size * 0.15, -size * 0.2);
            ctx.lineTo(size * 0.15, -size * 0.2);
          } else {
            ctx.arc(0, -size * 0.1, size * 0.15, 1.1 * Math.PI, 1.9 * Math.PI);
          }
          ctx.stroke();

          // 尾巴
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(size * 0.5, 0);
          ctx.quadraticCurveTo(size * 0.8, -size * 0.3, size * 0.6, -size * 0.5);
          ctx.stroke();

        } else if (pet.type === 'cat') {
          // 小猫 - 橙色
          // 身体
          ctx.fillStyle = '#FF9800';
          ctx.strokeStyle = '#5D4037';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, 0, size * 0.5, size * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 头
          ctx.beginPath();
          ctx.arc(0, -size * 0.35, size * 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 耳朵（三角形）
          ctx.fillStyle = '#FF9800';
          ctx.beginPath();
          ctx.moveTo(-size * 0.35, -size * 0.5);
          ctx.lineTo(-size * 0.2, -size * 0.8);
          ctx.lineTo(-size * 0.05, -size * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(size * 0.35, -size * 0.5);
          ctx.lineTo(size * 0.2, -size * 0.8);
          ctx.lineTo(size * 0.05, -size * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // 眼睛
          ctx.fillStyle = '#3E2723';
          ctx.beginPath();
          ctx.ellipse(-size * 0.12, -size * 0.38, size * 0.06, size * 0.1, 0, 0, Math.PI * 2);
          ctx.ellipse(size * 0.12, -size * 0.38, size * 0.06, size * 0.1, 0, 0, Math.PI * 2);
          ctx.fill();

          // 鼻子
          ctx.fillStyle = '#F48FB1';
          ctx.beginPath();
          ctx.moveTo(0, -size * 0.28);
          ctx.lineTo(-size * 0.05, -size * 0.22);
          ctx.lineTo(size * 0.05, -size * 0.22);
          ctx.closePath();
          ctx.fill();

          // 胡须
          ctx.strokeStyle = '#5D4037';
          ctx.lineWidth = 1;
          for (let i = -1; i <= 1; i += 2) {
            ctx.beginPath();
            ctx.moveTo(i * size * 0.1, -size * 0.25);
            ctx.lineTo(i * size * 0.4, -size * 0.3);
            ctx.stroke();
          }

          // 尾巴
          ctx.strokeStyle = '#FF9800';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(size * 0.4, 0);
          ctx.quadraticCurveTo(size * 0.7, -size * 0.2, size * 0.6, -size * 0.5);
          ctx.stroke();
        }

        // 心情图标
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        if (pet.happiness > 60) {
          ctx.fillText('😊', 0, size * 0.7);
        } else if (pet.happiness > 30) {
          ctx.fillText('😐', 0, size * 0.7);
        } else {
          ctx.fillText('😢', 0, size * 0.7);
        }

        ctx.restore();
      },
      contains: function(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
      },
      onClick: function(x, y) {
        // 点击宠物时播放音效并增加好感
        Storage.data.pet.happiness = Math.min(100, Storage.data.pet.happiness + 5);
        Storage.save();
        game.tweens.add(this, { scale: 1.1 }, 200, 'easeOut', false, function() {
          game.tweens.add(this, { scale: 1.0 }, 200, 'easeIn');
        });
      }
    };
    this.uiElements.push(petBg);

    // 宠物状态条
    const pet = Storage.data.pet;

    // 饥饿条
    const hungerBg = { x: 60, y: 190, width: 90, height: 12, render: function(ctx) {
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width, this.height, 6);
      ctx.fill();
      ctx.fillStyle = '#FF9800';
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width * (pet.hunger / 100), this.height, 6);
      ctx.fill();
      ctx.font = '10px Arial';
      ctx.fillStyle = '#FFF';
      ctx.textAlign = 'center';
      ctx.fillText('饥饿', this.x + this.width / 2, this.y + 10);
    }};
    this.uiElements.push(hungerBg);

    // 心情条
    const happyBg = { x: 170, y: 190, width: 90, height: 12, render: function(ctx) {
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width, this.height, 6);
      ctx.fill();
      ctx.fillStyle = '#E91E63';
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width * (pet.happiness / 100), this.height, 6);
      ctx.fill();
      ctx.font = '10px Arial';
      ctx.fillStyle = '#FFF';
      ctx.textAlign = 'center';
      ctx.fillText('心情', this.x + this.width / 2, this.y + 10);
    }};
    this.uiElements.push(happyBg);

    // 宠物操作按钮
    const feedBtn = new Button(60, 210, 60, 30, '喂食');
    feedBtn.onClick = () => {
      if (Storage.data.player.gems >= 5) {
        Storage.data.player.gems -= 5;
        Storage.data.pet.hunger = Math.min(100, Storage.data.pet.hunger + 30);
        Storage.data.pet.happiness = Math.min(100, Storage.data.pet.happiness + 10);
        Storage.save();
        game.audio.playSFX('coin');
        game.particleSystem.burst(120, 140, '#FFD700', 10);
      }
    };
    this.uiElements.push(feedBtn);

    const petBtn = new Button(130, 210, 60, 30, '抚摸');
    petBtn.onClick = () => {
      Storage.data.pet.happiness = Math.min(100, Storage.data.pet.happiness + 15);
      Storage.data.pet.lastPlayed = Date.now();
      Storage.save();
      game.audio.playSFX('success');
      game.particleSystem.burst(120, 140, '#F48FB1', 8);
    };
    this.uiElements.push(petBtn);

    const playBtn = new Button(200, 210, 60, 30, '玩耍');
    playBtn.onClick = () => {
      Storage.data.pet.happiness = Math.min(100, Storage.data.pet.happiness + 20);
      Storage.data.pet.lastPlayed = Date.now();
      Storage.save();
      game.audio.playSFX('success');
      game.particleSystem.burst(120, 140, '#4FC3F7', 12);
    };
    this.uiElements.push(playBtn);
  }
  
  update(dt) {
    super.update(dt);
    
    // 更新UI
    const coinText = this.uiElements.find(el => el.name === 'coinText');
    const gemText = this.uiElements.find(el => el.name === 'gemText');
    if (coinText) coinText.setText(`金币: ${Storage.data.player.coins}`);
    if (gemText) gemText.setText(`宝石: ${Storage.data.player.gems}`);
    
    // 更新植物
    for (const plot of this.plots) {
      if (plot.plant) {
        plot.plant.growthProgress += dt / 5000; // 5秒成长
        if (plot.plant.growthProgress >= 1) {
          plot.plant.growthProgress = 1;
          plot.plant.isReady = true;
        }
      }
    }
  }
  
  render(ctx) {
    // 绘制背景
    this._renderBackground(ctx);
    
    // 绘制土地
    for (const plot of this.plots) {
      this._renderPlot(ctx, plot);
    }
    
    // 绘制UI
    for (const ui of this.uiElements) {
      ui.render(ctx);
    }
    
    // 绘制粒子
    this.game.particleSystem.render(ctx);
  }
  
  _renderBackground(ctx) {
    // 草地背景
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.3, '#87CEEB');
    gradient.addColorStop(0.3, '#90EE90');
    gradient.addColorStop(1, '#228B22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // 太阳
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(600, 100, 50, 0, Math.PI * 2);
    ctx.fill();
    
    // 云朵
    this._drawCloud(ctx, 100, 80, 0.8);
    this._drawCloud(ctx, 300, 120, 0.6);
    this._drawCloud(ctx, 500, 70, 0.7);
  }
  
  _drawCloud(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.arc(25, -10, 25, 0, Math.PI * 2);
    ctx.arc(50, 0, 30, 0, Math.PI * 2);
    ctx.arc(25, 10, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  _renderPlot(ctx, plot) {
    ctx.save();
    ctx.translate(plot.x, plot.y);
    
    if (!plot.isUnlocked) {
      // 锁定状态
      ctx.fillStyle = '#666666';
      ctx.fillRect(0, 0, plot.width, plot.height);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔒', plot.width / 2, plot.height / 2);
    } else if (plot.plant) {
      // 有植物
      const plant = plot.plant;
      
      // 土地
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, 0, plot.width, plot.height);
      
      // 植物
      this._renderPlant(ctx, plot, plant);
    } else {
      // 空地
      ctx.fillStyle = '#D2691E';
      ctx.fillRect(0, 0, plot.width, plot.height);
      
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, plot.width, plot.height);
      
      // 点击提示
      if (this.selectedPlot === plot) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, plot.width, plot.height);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', plot.width / 2, plot.height / 2);
      }
    }
    
    ctx.restore();
  }
  
  _renderPlant(ctx, plot, plant) {
    const centerX = plot.width / 2;
    const baseY = plot.height;
    
    // 植物类型配置
    const plantConfig = this._getPlantConfig(plant.type);
    
    // 茎
    const stemHeight = 40 * plant.growthProgress;
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, baseY);
    ctx.lineTo(centerX, baseY - stemHeight);
    ctx.stroke();
    
    // 叶子
    if (plant.growthProgress > 0.3) {
      const leafSize = 15 * (plant.growthProgress - 0.3) / 0.7;
      ctx.fillStyle = '#32CD32';
      ctx.beginPath();
      ctx.ellipse(centerX - 10, baseY - stemHeight * 0.6, leafSize, leafSize / 2, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(centerX + 10, baseY - stemHeight * 0.4, leafSize, leafSize / 2, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 花/果实
    if (plant.growthProgress > 0.6) {
      const flowerSize = 20 * (plant.growthProgress - 0.6) / 0.4;
      
      if (plantConfig.type === 'flower') {
        // 花朵
        ctx.fillStyle = plantConfig.color;
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(
            centerX + Math.cos(angle) * flowerSize,
            baseY - stemHeight + Math.sin(angle) * flowerSize,
            flowerSize / 2,
            flowerSize / 3,
            angle,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(centerX, baseY - stemHeight, flowerSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (plantConfig.type === 'crop') {
        // 果实
        ctx.fillStyle = plantConfig.color;
        ctx.beginPath();
        ctx.arc(centerX, baseY - stemHeight - flowerSize / 2, flowerSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // 成熟提示
    if (plant.isReady) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('✓', centerX + 30, baseY - stemHeight - 20);
    }
    
    // 进度条
    if (!plant.isReady) {
      ctx.fillStyle = '#333333';
      ctx.fillRect(10, plot.height - 15, plot.width - 20, 8);
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(10, plot.height - 15, (plot.width - 20) * plant.growthProgress, 8);
    }
  }
  
  _getPlantConfig(type) {
    const plants = {
      sunflower: { name: '向日葵', type: 'flower', color: '#FFD700', growTime: 30, value: 25 },
      rose: { name: '玫瑰', type: 'flower', color: '#FF1493', growTime: 45, value: 40 },
      tulip: { name: '郁金香', type: 'flower', color: '#FF6347', growTime: 60, value: 55 },
      tomato: { name: '番茄', type: 'crop', color: '#FF6347', growTime: 40, value: 35 },
      carrot: { name: '胡萝卜', type: 'crop', color: '#FF8C00', growTime: 35, value: 30 },
    };
    return plants[type] || plants.sunflower;
  }
  
  onPointerDown(x, y, pointer) {
    // 检查UI点击
    for (const ui of this.uiElements) {
      if (ui.handlePointerDown && ui.handlePointerDown(x, y)) {
        return;
      }
    }
    
    // 检查土地点击
    for (const plot of this.plots) {
      if (plot.isUnlocked && this._isPointInPlot(x, y, plot)) {
        this.selectedPlot = plot;
        
        if (!plot.plant) {
          // 尝试种植
          this._tryPlantSeed(plot);
        } else if (plot.plant.isReady) {
          // 收获
          this._harvestPlant(plot);
        }
        return;
      }
    }
    
    this.selectedPlot = null;
  }
  
  _isPointInPlot(x, y, plot) {
    return x >= plot.x && x <= plot.x + plot.width &&
           y >= plot.y && y <= plot.y + plot.height;
  }
  
  _tryPlantSeed(plot) {
    const seeds = Storage.data.inventory.seeds;
    const availableSeed = seeds.find(s => s.count > 0);
    
    if (availableSeed) {
      availableSeed.count--;
      
      const seedToPlant = availableSeed.id.replace('seed_', '');
      plot.plant = {
        type: seedToPlant,
        growthProgress: 0,
        isReady: false,
        plantedAt: Date.now(),
      };
      
      // 粒子效果
      this.game.particleSystem.sparkle(
        plot.x + plot.width / 2,
        plot.y + plot.height / 2,
        '#90EE90'
      );
      
      Storage.save();
    }
  }
  
  _harvestPlant(plot) {
    if (!plot.plant || !plot.plant.isReady) return;
    
    const plantConfig = this._getPlantConfig(plot.plant.type);
    const reward = plantConfig.value;
    
    // 增加金币
    Storage.data.player.coins += reward;
    Storage.data.statistics.plantsGrown++;
    Storage.data.statistics.coinsEarned += reward;
    
    // 粒子效果
    this.game.particleSystem.confetti(
      plot.x + plot.width / 2,
      plot.y + plot.height / 2
    );
    
    // 清空土地
    plot.plant = null;
    
    Storage.save();
    
    // 刷新显示
    const coinText = this.uiElements.find(el => el.name === 'coinText');
    if (coinText) coinText.setText(`金币: ${Storage.data.player.coins}`);
  }
}

// ============================================================
// 商店场景
// ============================================================
class ShopScene extends Scene {
  constructor(game) {
    super(game, SceneType.SHOP);
    this.items = [];
    this.tabs = ['seeds', 'items', 'upgrades'];
    this.currentTab = 0;
  }
  
  init() {
    this._createUI();
    this._loadItems();
  }
  
  enter(data) {
    this.isActive = true;
  }
  
  exit() {
    this.isActive = false;
    Storage.save();
  }
  
  _createUI() {
    // 返回按钮
    const backBtn = new Button(20, 20, 80, 40, '返回');
    backBtn.onClick = () => this.game.changeScene(SceneType.GARDEN);
    this.uiElements.push(backBtn);
    
    // 标题
    const title = new Text(CONFIG.CANVAS_WIDTH / 2, 30, '商店', {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#333333',
      align: 'center',
    });
    this.uiElements.push(title);
    
    // 货币显示
    const coinText = new Text(20, 70, `金币: ${Storage.data.player.coins}`, {
      fontSize: 18,
      color: '#FFD700',
      fontWeight: 'bold',
    });
    coinText.name = 'coinDisplay';
    this.uiElements.push(coinText);
    
    // 标签切换
    for (let i = 0; i < this.tabs.length; i++) {
      const tabBtn = new Button(60 + i * 100, 110, 90, 35, this.tabs[i] === 'seeds' ? '种子' : '物品');
      tabBtn.backgroundColor = i === this.currentTab ? '#4CAF50' : '#9E9E9E';
      tabBtn.name = `tab_${i}`;
      tabBtn.onClick = () => this._switchTab(i);
      this.uiElements.push(tabBtn);
    }
    
    // 商品列表容器
    this.itemContainer = {
      x: 20,
      y: 160,
      width: CONFIG.CANVAS_WIDTH - 40,
      height: CONFIG.CANVAS_HEIGHT - 200,
      scrolling: false,
      scrollY: 0,
    };
  }
  
  _loadItems() {
    // 种子商店
    this.shopItems = [
      { id: 'seed_sunflower', name: '向日葵种子', price: 10, icon: '🌻', description: '经典向日葵，金币+25' },
      { id: 'seed_rose', name: '玫瑰种子', price: 20, icon: '🌹', description: '浪漫玫瑰，金币+40' },
      { id: 'seed_tulip', name: '郁金香种子', price: 30, icon: '🌷', description: '优雅郁金香，金币+55' },
      { id: 'seed_tomato', name: '番茄种子', price: 15, icon: '🍅', description: '美味番茄，金币+35' },
      { id: 'seed_carrot', name: '胡萝卜种子', price: 12, icon: '🥕', description: '新鲜胡萝卜，金币+30' },
    ];
    
    // 升级
    this.upgrades = [
      { id: 'expand_plot', name: '扩展土地', price: 100, icon: '🧱', description: '解锁一块新土地' },
      { id: 'speed_grow', name: '加速肥料', price: 50, icon: '💧', description: '所有植物成长速度+50%' },
    ];
  }
  
  _switchTab(index) {
    this.currentTab = index;
    
    // 更新标签样式
    for (let i = 0; i < this.tabs.length; i++) {
      const btn = this.uiElements.find(el => el.name === `tab_${i}`);
      if (btn) {
        btn.backgroundColor = i === index ? '#4CAF50' : '#9E9E9E';
      }
    }
  }
  
  update(dt) {
    super.update(dt);
    
    const coinText = this.uiElements.find(el => el.name === 'coinDisplay');
    if (coinText) {
      coinText.setText(`金币: ${Storage.data.player.coins}`);
    }
  }
  
  render(ctx) {
    // 背景
    ctx.fillStyle = '#F5F5DC';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // UI
    for (const ui of this.uiElements) {
      ui.render(ctx);
    }
    
    // 商品列表
    this._renderItems(ctx);
  }
  
  _renderItems(ctx) {
    const items = this.currentTab === 0 ? this.shopItems : this.upgrades;
    const startY = this.itemContainer.y;
    const itemHeight = 70;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const y = startY + i * itemHeight;
      
      // 物品背景
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(this.itemContainer.x, y, this.itemContainer.width, itemHeight - 10);
      
      // 边框
      ctx.strokeStyle = '#DDDDDD';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.itemContainer.x, y, this.itemContainer.width, itemHeight - 10);
      
      // 图标
      ctx.font = '36px Arial';
      ctx.fillText(item.icon, this.itemContainer.x + 15, y + 35);
      
      // 名称
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(item.name, this.itemContainer.x + 60, y + 25);
      
      // 描述
      ctx.fillStyle = '#666666';
      ctx.font = '14px Arial';
      ctx.fillText(item.description, this.itemContainer.x + 60, y + 45);
      
      // 价格
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`${item.price} 💰`, this.itemContainer.x + this.itemContainer.width - 100, y + 35);
      
      // 购买按钮
      const canAfford = Storage.data.player.coins >= item.price;
      ctx.fillStyle = canAfford ? '#4CAF50' : '#9E9E9E';
      ctx.fillRect(
        this.itemContainer.x + this.itemContainer.width - 60,
        y + 10,
        50,
        35
      );
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px Arial';
      ctx.fillText('购买', this.itemContainer.x + this.itemContainer.width - 47, y + 33);
    }
  }
  
  onPointerDown(x, y, pointer) {
    // UI点击
    for (const ui of this.uiElements) {
      if (ui.handlePointerDown && ui.handlePointerDown(x, y)) {
        return;
      }
    }
    
    // 商品点击
    const items = this.currentTab === 0 ? this.shopItems : this.upgrades;
    const startY = this.itemContainer.y;
    const itemHeight = 70;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemY = startY + i * itemHeight;
      
      // 购买按钮区域
      const btnX = this.itemContainer.x + this.itemContainer.width - 60;
      if (x >= btnX && x <= btnX + 50 && y >= itemY + 10 && y <= itemY + 45) {
        this._purchaseItem(item);
        return;
      }
    }
  }
  
  _purchaseItem(item) {
    if (Storage.data.player.coins < item.price) {
      console.log('金币不足');
      return;
    }
    
    Storage.data.player.coins -= item.price;
    
    if (item.id.startsWith('seed_')) {
      // 购买种子
      const seed = Storage.data.inventory.seeds.find(s => s.id === item.id);
      if (seed) {
        seed.count += 1;
      } else {
        Storage.data.inventory.seeds.push({
          id: item.id,
          name: item.name,
          count: 1,
          price: item.price,
        });
      }
    } else if (item.id === 'expand_plot') {
      // 扩展土地
      Storage.data.garden.unlockedPlots++;
    }
    
    Storage.save();
    console.log(`购买了 ${item.name}`);
  }
}

// ============================================================
// 背包场景
// ============================================================
class InventoryScene extends Scene {
  constructor(game) {
    super(game, SceneType.INVENTORY);
  }
  
  init() {
    this._createUI();
  }
  
  enter(data) {
    this.isActive = true;
  }
  
  exit() {
    this.isActive = false;
  }
  
  _createUI() {
    // 返回按钮
    const backBtn = new Button(20, 20, 80, 40, '返回');
    backBtn.onClick = () => this.game.changeScene(SceneType.GARDEN);
    this.uiElements.push(backBtn);
    
    // 标题
    const title = new Text(CONFIG.CANVAS_WIDTH / 2, 30, '背包', {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#333333',
      align: 'center',
    });
    this.uiElements.push(title);
    
    // 种子分类标题
    const seedTitle = new Text(30, 80, '种子', {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#4CAF50',
    });
    this.uiElements.push(seedTitle);
  }
  
  render(ctx) {
    // 背景
    ctx.fillStyle = '#F5F5DC';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // UI
    for (const ui of this.uiElements) {
      ui.render(ctx);
    }
    
    // 种子列表
    this._renderSeeds(ctx);
  }
  
  _renderSeeds(ctx) {
    const seeds = Storage.data.inventory.seeds;
    const startY = 110;
    const itemHeight = 60;
    
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      const y = startY + i * itemHeight;
      
      // 背景
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(20, y, CONFIG.CANVAS_WIDTH - 40, itemHeight - 5);
      
      // 边框
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, y, CONFIG.CANVAS_WIDTH - 40, itemHeight - 5);
      
      // 图标
      const icons = {
        seed_sunflower: '🌻',
        seed_rose: '🌹',
        seed_tulip: '🌷',
        seed_tomato: '🍅',
        seed_carrot: '🥕',
      };
      
      ctx.font = '32px Arial';
      ctx.fillText(icons[seed.id] || '🌱', 35, y + 35);
      
      // 名称
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(seed.name, 80, y + 25);
      
      // 数量
      ctx.fillStyle = '#666666';
      ctx.font = '14px Arial';
      ctx.fillText(`x${seed.count}`, 80, y + 45);
    }
  }
  
  onPointerDown(x, y, pointer) {
    for (const ui of this.uiElements) {
      if (ui.handlePointerDown && ui.handlePointerDown(x, y)) {
        return;
      }
    }
  }
}

// ============================================================
// 主菜单场景
// ============================================================
class MainMenuScene extends Scene {
  constructor(game) {
    super(game, SceneType.MAIN_MENU);
  }
  
  init() {
    this._createUI();
    this._createTitleAnimation();
  }
  
  _createUI() {
    // 游戏标题
    this.title = new Text(CONFIG.CANVAS_WIDTH / 2, 200, '🌸 小花园 🌸', {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#4CAF50',
      align: 'center',
      shadowColor: '#000000',
      shadowBlur: 4,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    });
    this.uiElements.push(this.title);
    
    // 副标题
    const subtitle = new Text(CONFIG.CANVAS_WIDTH / 2, 260, '开始你的园艺之旅', {
      fontSize: 20,
      color: '#666666',
      align: 'center',
    });
    this.uiElements.push(subtitle);
    
    // 开始游戏按钮
    const startBtn = new Button(
      CONFIG.CANVAS_WIDTH / 2 - 75,
      400,
      150,
      50,
      '开始游戏'
    );
    startBtn.fontSize = 20;
    startBtn.backgroundColor = '#4CAF50';
    startBtn.hoverColor = '#66BB6A';
    startBtn.onClick = () => this.game.changeScene(SceneType.GARDEN);
    this.uiElements.push(startBtn);
    
    // 继续游戏按钮
    const continueBtn = new Button(
      CONFIG.CANVAS_WIDTH / 2 - 75,
      470,
      150,
      50,
      '继续游戏'
    );
    continueBtn.fontSize = 20;
    continueBtn.backgroundColor = '#2196F3';
    continueBtn.onClick = () => this.game.changeScene(SceneType.GARDEN);
    this.uiElements.push(continueBtn);
    
    // 设置按钮
    const settingsBtn = new Button(
      CONFIG.CANVAS_WIDTH / 2 - 75,
      540,
      150,
      50,
      '设置'
    );
    settingsBtn.fontSize = 20;
    settingsBtn.backgroundColor = '#FF9800';
    settingsBtn.onClick = () => this.game.changeScene(SceneType.SETTINGS);
    this.uiElements.push(settingsBtn);
  }
  
  _createTitleAnimation() {
    // 标题浮动动画
    this.game.tweens.add(this.title, {
      y: 220,
    }, 2000, 'easeInOutQuad', () => {
      this.game.tweens.add(this.title, {
        y: 200,
      }, 2000, 'easeInOutQuad');
    }, true);
  }
  
  enter(data) {
    this.isActive = true;
    Storage.data.statistics.visits++;
    Storage.save();
  }
  
  render(ctx) {
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#90EE90');
    gradient.addColorStop(1, '#228B22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // 装饰性花朵
    this._drawDecorations(ctx);
    
    // UI
    for (const ui of this.uiElements) {
      ui.render(ctx);
    }
  }
  
  _drawDecorations(ctx) {
    const decorations = [
      { x: 50, y: 150, emoji: '🌸', scale: 0.8 },
      { x: CONFIG.CANVAS_WIDTH - 50, y: 180, emoji: '🌺', scale: 0.7 },
      { x: 80, y: 600, emoji: '🌻', scale: 0.9 },
      { x: CONFIG.CANVAS_WIDTH - 80, y: 650, emoji: '🌷', scale: 0.8 },
      { x: 150, y: 800, emoji: '🌵', scale: 0.6 },
      { x: CONFIG.CANVAS_WIDTH - 150, y: 850, emoji: '🍀', scale: 0.7 },
    ];
    
    for (const dec of decorations) {
      ctx.save();
      ctx.translate(dec.x, dec.y);
      ctx.scale(dec.scale, dec.scale);
      ctx.font = '40px Arial';
      ctx.fillText(dec.emoji, 0, 0);
      ctx.restore();
    }
  }
  
  onPointerDown(x, y, pointer) {
    for (const ui of this.uiElements) {
      if (ui.handlePointerDown && ui.handlePointerDown(x, y)) {
        return;
      }
    }
  }
}

// ============================================================
// 设置场景
// ============================================================
class SettingsScene extends Scene {
  constructor(game) {
    super(game, SceneType.SETTINGS);
    this.settings = null;
  }
  
  init() {
    this.settings = Storage.data.settings;
    this._createUI();
  }
  
  enter(data) {
    this.isActive = true;
  }
  
  _createUI() {
    // 返回按钮
    const backBtn = new Button(20, 20, 80, 40, '返回');
    backBtn.onClick = () => this.game.changeScene(SceneType.MAIN_MENU);
    this.uiElements.push(backBtn);
    
    // 标题
    const title = new Text(CONFIG.CANVAS_WIDTH / 2, 30, '设置', {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#333333',
      align: 'center',
    });
    this.uiElements.push(title);
    
    // 音乐音量
    const musicLabel = new Text(30, 100, '音乐音量', {
      fontSize: 18,
      color: '#333333',
    });
    this.uiElements.push(musicLabel);
    
    this.musicSlider = new ProgressBar(30, 130, 200, 20);
    this.musicSlider.setValue(this.settings.music * 100);
    this.musicSlider.name = 'musicSlider';
    this.uiElements.push(this.musicSlider);
    
    // 音效音量
    const sfxLabel = new Text(30, 180, '音效音量', {
      fontSize: 18,
      color: '#333333',
    });
    this.uiElements.push(sfxLabel);
    
    this.sfxSlider = new ProgressBar(30, 210, 200, 20);
    this.sfxSlider.setValue(this.settings.sfx * 100);
    this.sfxSlider.name = 'sfxSlider';
    this.uiElements.push(this.sfxSlider);
    
    // 震动开关
    const vibeLabel = new Text(30, 260, '震动反馈', {
      fontSize: 18,
      color: '#333333',
    });
    this.uiElements.push(vibeLabel);
    
    this.vibeBtn = new Button(180, 250, 60, 35, this.settings.vibration ? '开' : '关');
    this.vibeBtn.backgroundColor = this.settings.vibration ? '#4CAF50' : '#9E9E9E';
    this.vibeBtn.name = 'vibeBtn';
    this.vibeBtn.onClick = () => {
      this.settings.vibration = !this.settings.vibration;
      this.vibeBtn.backgroundColor = this.settings.vibration ? '#4CAF50' : '#9E9E9E';
      this.vibeBtn.setText(this.settings.vibration ? '开' : '关');
      Storage.save();
    };
    this.uiElements.push(this.vibeBtn);
    
    // 重置数据按钮
    const resetBtn = new Button(
      CONFIG.CANVAS_WIDTH / 2 - 75,
      CONFIG.CANVAS_HEIGHT - 150,
      150,
      45,
      '重置游戏数据'
    );
    resetBtn.backgroundColor = '#F44336';
    resetBtn.onClick = () => {
      if (confirm('确定要重置所有游戏数据吗？此操作不可撤销。')) {
        Storage.reset();
        alert('数据已重置');
      }
    };
    this.uiElements.push(resetBtn);
  }
  
  update(dt) {
    super.update(dt);
    
    // 更新音量设置
    this.settings.music = this.musicSlider.getPercent();
    this.settings.sfx = this.sfxSlider.getPercent();
  }
  
  render(ctx) {
    // 背景
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // UI
    for (const ui of this.uiElements) {
      ui.render(ctx);
    }
  }
  
  onPointerDown(x, y, pointer) {
    for (const ui of this.uiElements) {
      if (ui.handlePointerDown && ui.handlePointerDown(x, y)) {
        return;
      }
    }
  }
  
  onPointerMove(x, y) {
    // 滑块拖动
    if (this.musicSlider.isPressed || this.sfxSlider.isPressed) {
      const slider = this.musicSlider.isPressed ? this.musicSlider : this.sfxSlider;
      const ratio = (x - slider.x) / slider.width;
      slider.setValue(Utils.clamp(ratio, 0, 1) * 100);
    }
  }
  
  exit() {
    Storage.save();
  }
}

// ============================================================
// 学习花园场景基类
// ============================================================
class LearningGardenScene extends Scene {
  constructor(game, sceneType, npcType, bgColors, subject) {
    super(game, sceneType);
    this.npcType = npcType;
    this.bgColors = bgColors;
    this.subject = subject;
    this.npcBounce = 0;
    this.cloudOffsets = [0, 0, 0];
  }

  enter(data) {
    this.isActive = true;
    LearningProgress.init();
  }

  _renderBackground(ctx) {
    const colors = this.bgColors;
    
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
    gradient.addColorStop(0, colors.sky1);
    gradient.addColorStop(0.4, colors.sky2);
    gradient.addColorStop(0.4, colors.ground1);
    gradient.addColorStop(1, colors.ground2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // 云朵
    ctx.fillStyle = colors.cloud;
    this._drawCloud(ctx, 100 + this.cloudOffsets[0] % 400, 100, 0.6);
    this._drawCloud(ctx, 350 + this.cloudOffsets[1] % 400, 150, 0.5);
    this._drawCloud(ctx, 550 + this.cloudOffsets[2] % 400, 80, 0.7);

    // 装饰元素
    this._drawDecorations(ctx);
  }

  _drawCloud(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.arc(20, -8, 20, 0, Math.PI * 2);
    ctx.arc(40, 0, 25, 0, Math.PI * 2);
    ctx.arc(20, 8, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawDecorations(ctx) {
    // 子类实现
  }

  update(dt) {
    super.update(dt);
    
    // NPC弹跳动画
    this.npcBounce += dt * 0.005;
    
    // 云朵飘动
    this.cloudOffsets[0] += dt * 0.01;
    this.cloudOffsets[1] += dt * 0.008;
    this.cloudOffsets[2] += dt * 0.012;
  }

  _drawNPC(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y + Math.sin(this.npcBounce) * 5);

    switch(this.npcType) {
      case 'fox':
        this._drawFox(ctx, size);
        break;
      case 'cat':
        this._drawCat(ctx, size);
        break;
      case 'bird':
        this._drawBird(ctx, size);
        break;
      case 'deer':
        this._drawDeer(ctx, size);
        break;
    }

    ctx.restore();
  }

  _drawFox(ctx, size) {
    // 身体
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.2, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 头
    ctx.beginPath();
    ctx.arc(0, -size * 0.3, size * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // 耳朵
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, -size * 0.5);
    ctx.lineTo(-size * 0.15, -size * 0.8);
    ctx.lineTo(-size * 0.05, -size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size * 0.3, -size * 0.5);
    ctx.lineTo(size * 0.15, -size * 0.8);
    ctx.lineTo(size * 0.05, -size * 0.5);
    ctx.closePath();
    ctx.fill();

    // 脸部
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.15, size * 0.15, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-size * 0.12, -size * 0.35, size * 0.06, 0, Math.PI * 2);
    ctx.arc(size * 0.12, -size * 0.35, size * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // 鼻子
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(0, -size * 0.18, size * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // 尾巴
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(size * 0.35, size * 0.2);
    ctx.quadraticCurveTo(size * 0.7, 0, size * 0.5, -size * 0.3);
    ctx.quadraticCurveTo(size * 0.6, -size * 0.1, size * 0.35, size * 0.1);
    ctx.fill();

    // 尾巴尖
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(size * 0.5, -size * 0.3, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawCat(ctx, size) {
    // 身体
    ctx.fillStyle = '#A0522D';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.2, size * 0.35, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // 头
    ctx.beginPath();
    ctx.arc(0, -size * 0.3, size * 0.32, 0, Math.PI * 2);
    ctx.fill();

    // 耳朵
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, -size * 0.45);
    ctx.lineTo(-size * 0.15, -size * 0.75);
    ctx.lineTo(-size * 0.02, -size * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size * 0.3, -size * 0.45);
    ctx.lineTo(size * 0.15, -size * 0.75);
    ctx.lineTo(size * 0.02, -size * 0.45);
    ctx.closePath();
    ctx.fill();

    // 内耳
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.moveTo(-size * 0.25, -size * 0.48);
    ctx.lineTo(-size * 0.15, -size * 0.65);
    ctx.lineTo(-size * 0.08, -size * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size * 0.25, -size * 0.48);
    ctx.lineTo(size * 0.15, -size * 0.65);
    ctx.lineTo(size * 0.08, -size * 0.48);
    ctx.closePath();
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(-size * 0.12, -size * 0.32, size * 0.06, size * 0.1, 0, 0, Math.PI * 2);
    ctx.ellipse(size * 0.12, -size * 0.32, size * 0.06, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // 鼻子
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.22);
    ctx.lineTo(-size * 0.05, -size * 0.17);
    ctx.lineTo(size * 0.05, -size * 0.17);
    ctx.closePath();
    ctx.fill();

    // 尾巴
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(size * 0.3, size * 0.15);
    ctx.quadraticCurveTo(size * 0.6, 0, size * 0.5, -size * 0.4);
    ctx.stroke();
  }

  _drawBird(ctx, size) {
    // 身体
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.3, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // 头
    ctx.beginPath();
    ctx.arc(0, -size * 0.35, size * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // 嘴巴
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.35);
    ctx.lineTo(-size * 0.1, -size * 0.25);
    ctx.lineTo(0, -size * 0.15);
    ctx.lineTo(size * 0.1, -size * 0.25);
    ctx.closePath();
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-size * 0.08, -size * 0.38, size * 0.05, 0, Math.PI * 2);
    ctx.arc(size * 0.08, -size * 0.38, size * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // 翅膀
    ctx.fillStyle = '#4682B4';
    ctx.beginPath();
    ctx.ellipse(-size * 0.35, 0, size * 0.15, size * 0.25, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.35, 0, size * 0.15, size * 0.25, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 腿
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-size * 0.1, size * 0.2);
    ctx.lineTo(-size * 0.1, size * 0.4);
    ctx.moveTo(size * 0.1, size * 0.2);
    ctx.lineTo(size * 0.1, size * 0.4);
    ctx.stroke();
  }

  _drawDeer(ctx, size) {
    // 身体
    ctx.fillStyle = '#D2691E';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.15, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 头
    ctx.beginPath();
    ctx.arc(0, -size * 0.35, size * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // 鹿角
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-size * 0.15, -size * 0.55);
    ctx.lineTo(-size * 0.25, -size * 0.85);
    ctx.lineTo(-size * 0.35, -size * 0.75);
    ctx.moveTo(-size * 0.25, -size * 0.85);
    ctx.lineTo(-size * 0.2, -size * 0.95);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.15, -size * 0.55);
    ctx.lineTo(size * 0.25, -size * 0.85);
    ctx.lineTo(size * 0.35, -size * 0.75);
    ctx.moveTo(size * 0.25, -size * 0.85);
    ctx.lineTo(size * 0.2, -size * 0.95);
    ctx.stroke();

    // 耳朵
    ctx.fillStyle = '#D2691E';
    ctx.beginPath();
    ctx.ellipse(-size * 0.35, -size * 0.35, size * 0.12, size * 0.08, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.35, -size * 0.35, size * 0.12, size * 0.08, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-size * 0.1, -size * 0.38, size * 0.05, 0, Math.PI * 2);
    ctx.arc(size * 0.1, -size * 0.38, size * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // 鼻子
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.28, size * 0.06, size * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();

    // 斑点
    ctx.fillStyle = '#F5DEB3';
    const spots = [[-0.2, -0.2], [0.15, -0.15], [-0.1, 0], [0.2, 0.1], [-0.25, 0.15]];
    for (const [sx, sy] of spots) {
      ctx.beginPath();
      ctx.arc(size * sx, size * sy, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// 数学花园场景
class MathGardenScene extends LearningGardenScene {
  constructor(game) {
    super(
      game,
      SceneType.MATH_GARDEN,
      'fox',
      {
        sky1: '#1a237e',
        sky2: '#3949ab',
        ground1: '#c8e6c9',
        ground2: '#81c784',
        cloud: 'rgba(255,255,255,0.8)',
      },
      'math'
    );
  }

  _drawDecorations(ctx) {
    // 数学符号装饰
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '40px Arial';
    ctx.fillText('＋', 50, 300);
    ctx.fillText('－', 650, 400);
    ctx.fillText('×', 100, 500);
    ctx.fillText('÷', 600, 200);
    ctx.font = '30px Arial';
    ctx.fillText('＝', 300, 150);
    ctx.fillText('123', 500, 550);

    // 花朵装饰
    ctx.fillStyle = '#E91E63';
    this._drawFlower(ctx, 80, 350, 15);
    this._drawFlower(ctx, 640, 300, 12);
    ctx.fillStyle = '#9C27B0';
    this._drawFlower(ctx, 150, 500, 10);
  }

  _drawFlower(ctx, x, y, size) {
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(
        x + Math.cos(angle) * size,
        y + Math.sin(angle) * size,
        size / 2,
        size / 3,
        angle,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  _createUI() {
    // 返回按钮
    const backBtn = new Button(20, 20, 80, 40, '返回');
    backBtn.onClick = () => this.game.changeScene(SceneType.GARDEN);
    this.uiElements.push(backBtn);

    // 标题
    const title = new Text(CONFIG.CANVAS_WIDTH / 2, 30, '数学花园', {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#FFFFFF',
      align: 'center',
    });
    this.uiElements.push(title);

    // 星星总数
    const totalStars = LearningProgress.getTotalStars();
    const starsText = new Text(CONFIG.CANVAS_WIDTH / 2, 70, `总星星: ${totalStars} ⭐`, {
      fontSize: 18,
      color: '#FFEB3B',
      align: 'center',
    });
    this.uiElements.push(starsText);

    // 关卡按钮
    const levels = QuestionData.getLevels('math');
    const startY = 200;
    const btnWidth = 200;
    const btnHeight = 60;
    const spacing = 15;

    levels.forEach((level, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = col === 0 ? 80 : 420;
      const y = startY + row * (btnHeight + spacing);

      const levelNum = index + 1;
      const stars = LearningProgress.getLevelStars('math', levelNum);
      const unlocked = LearningProgress.isLevelUnlocked('math', levelNum);

      const levelBtn = new Button(x, y, btnWidth, btnHeight, '');
      levelBtn.backgroundColor = unlocked ? '#4CAF50' : '#9E9E9E';
      levelBtn.disabled = !unlocked;

      // 存储关卡信息用于点击处理
      levelBtn.levelData = { subject: 'math', level: levelNum, levelKey: level.key };
      levelBtn.onClick = () => {
        this.game.changeScene(SceneType.LEARNING, levelBtn.levelData);
      };

      // 添加关卡标签
      levelBtn.render = function(ctx) {
        if (!this.visible) return;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        let color = this.backgroundColor;
        if (this.disabled) {
          color = this.disabledColor;
        } else if (this.isPressed) {
          color = this.pressedColor;
        } else if (this.isHovered) {
          color = this.hoverColor;
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 10);
        ctx.fill();

        // 关卡名称
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(level.name, 0, -10);

        // 星星显示
        ctx.font = '20px Arial';
        ctx.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), 0, 15);

        // 锁定图标
        if (!unlocked) {
          ctx.font = '24px Arial';
          ctx.fillText('🔒', 0, 0);
        }

        ctx.restore();
      };

      this.uiElements.push(levelBtn);
    });
  }

  render(ctx) {
    this._renderBackground(ctx);
    this._drawNPC(ctx, 580, 350, 80);

    for (const ui of this.uiElements) {
      ui.render(ctx);
    }
  }
}

// 语文花园场景
class ChineseGardenScene extends LearningGardenScene {
  constructor(game) {
    super(
      game,
      SceneType.CHINESE_GARDEN,
      'cat',
      {
        sky1: '#006064',
        sky2: '#00838f',
        ground1: '#fff9c4',
        ground2: '#fff176',
        cloud: 'rgba(255,255,255,0.9)',
      },
      'chinese'
    );
  }

  _drawDecorations(ctx) {
    // 中文字符装饰
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.font = '50px Arial';
    ctx.fillText('汉', 60, 280);
    ctx.fillText('字', 620, 180);
    ctx.font = '35px Arial';
    ctx.fillText('拼', 150, 480);
    ctx.fillText('音', 550, 520);
    ctx.font = '28px Arial';
    ctx.fillText('阅', 80, 120);
    ctx.fillText('读', 640, 400);

    // 竹子装饰
    ctx.fillStyle = '#2E7D32';
    ctx.fillRect(50, 350, 15, 150);
    ctx.fillRect(45, 400, 25, 8);
    ctx.fillRect(45, 450, 25, 8);

    ctx.fillRect(630, 280, 15, 180);
    ctx.fillRect(625, 330, 25, 8);
    ctx.fillRect(625, 380, 25, 8);
    ctx.fillRect(625, 430, 25, 8);
  }

  _createUI() {
    const backBtn = new Button(20, 20, 80, 40, '返回');
    backBtn.onClick = () => this.game.changeScene(SceneType.GARDEN);
    this.uiElements.push(backBtn);

    const title = new Text(CONFIG.CANVAS_WIDTH / 2, 30, '语文花园', {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#FFFFFF',
      align: 'center',
    });
    this.uiElements.push(title);

    const totalStars = LearningProgress.getTotalStars();
    const starsText = new Text(CONFIG.CANVAS_WIDTH / 2, 70, `总星星: ${totalStars} ⭐`, {
      fontSize: 18,
      color: '#FFEB3B',
      align: 'center',
    });
    this.uiElements.push(starsText);

    const levels = QuestionData.getLevels('chinese');
    const startY = 200;
    const btnWidth = 200;
    const btnHeight = 60;
    const spacing = 15;

    levels.forEach((level, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = col === 0 ? 80 : 420;
      const y = startY + row * (btnHeight + spacing);

      const levelNum = index + 1;
      const stars = LearningProgress.getLevelStars('chinese', levelNum);
      const unlocked = LearningProgress.isLevelUnlocked('chinese', levelNum);

      const levelBtn = new Button(x, y, btnWidth, btnHeight, '');
      levelBtn.backgroundColor = unlocked ? '#4CAF50' : '#9E9E9E';
      levelBtn.disabled = !unlocked;
      levelBtn.levelData = { subject: 'chinese', level: levelNum, levelKey: level.key };
      levelBtn.onClick = () => {
        this.game.changeScene(SceneType.LEARNING, levelBtn.levelData);
      };

      levelBtn.render = function(ctx) {
        if (!this.visible) return;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        let color = this.backgroundColor;
        if (this.disabled) {
          color = this.disabledColor;
        } else if (this.isPressed) {
          color = this.pressedColor;
        } else if (this.isHovered) {
          color = this.hoverColor;
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 10);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(level.name, 0, -10);

        ctx.font = '20px Arial';
        ctx.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), 0, 15);

        if (!unlocked) {
          ctx.font = '24px Arial';
          ctx.fillText('🔒', 0, 0);
        }

        ctx.restore();
      };

      this.uiElements.push(levelBtn);
    });
  }

  render(ctx) {
    this._renderBackground(ctx);
    this._drawNPC(ctx, 580, 350, 80);

    for (const ui of this.uiElements) {
      ui.render(ctx);
    }
  }
}

// 英语花园场景
class EnglishGardenScene extends LearningGardenScene {
  constructor(game) {
    super(
      game,
      SceneType.ENGLISH_GARDEN,
      'bird',
      {
        sky1: '#1b5e20',
        sky2: '#388e3c',
        ground1: '#e8f5e9',
        ground2: '#a5d6a7',
        cloud: 'rgba(255,255,255,0.85)',
      },
      'english'
    );
  }

  _drawDecorations(ctx) {
    // 英文字母装饰
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 45px Arial';
    ctx.fillText('A', 70, 200);
    ctx.fillText('B', 620, 280);
    ctx.fillText('C', 100, 450);
    ctx.font = 'bold 35px Arial';
    ctx.fillText('ABC', 500, 150);
    ctx.fillText('XYZ', 300, 550);

    // 彩虹装饰
    const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
    for (let i = 0; i < rainbowColors.length; i++) {
      ctx.strokeStyle = rainbowColors[i];
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(360, 120, 60 + i * 6, Math.PI, 0);
      ctx.stroke();
    }

    // 小星星
    ctx.fillStyle = '#FFEB3B';
    const starPositions = [[80, 350], [650, 450], [200, 150], [550, 300]];
    for (const [sx, sy] of starPositions) {
      this._drawStar(ctx, sx, sy, 10);
    }
  }

  _drawStar(ctx, x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  _createUI() {
    const backBtn = new Button(20, 20, 80, 40, '返回');
    backBtn.onClick = () => this.game.changeScene(SceneType.GARDEN);
    this.uiElements.push(backBtn);

    const title = new Text(CONFIG.CANVAS_WIDTH / 2, 30, '英语花园', {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#FFFFFF',
      align: 'center',
    });
    this.uiElements.push(title);

    const totalStars = LearningProgress.getTotalStars();
    const starsText = new Text(CONFIG.CANVAS_WIDTH / 2, 70, `总星星: ${totalStars} ⭐`, {
      fontSize: 18,
      color: '#FFEB3B',
      align: 'center',
    });
    this.uiElements.push(starsText);

    const levels = QuestionData.getLevels('english');
    const startY = 200;
    const btnWidth = 200;
    const btnHeight = 60;
    const spacing = 15;

    levels.forEach((level, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = col === 0 ? 80 : 420;
      const y = startY + row * (btnHeight + spacing);

      const levelNum = index + 1;
      const stars = LearningProgress.getLevelStars('english', levelNum);
      const unlocked = LearningProgress.isLevelUnlocked('english', levelNum);

      const levelBtn = new Button(x, y, btnWidth, btnHeight, '');
      levelBtn.backgroundColor = unlocked ? '#4CAF50' : '#9E9E9E';
      levelBtn.disabled = !unlocked;
      levelBtn.levelData = { subject: 'english', level: levelNum, levelKey: level.key };
      levelBtn.onClick = () => {
        this.game.changeScene(SceneType.LEARNING, levelBtn.levelData);
      };

      levelBtn.render = function(ctx) {
        if (!this.visible) return;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        let color = this.backgroundColor;
        if (this.disabled) {
          color = this.disabledColor;
        } else if (this.isPressed) {
          color = this.pressedColor;
        } else if (this.isHovered) {
          color = this.hoverColor;
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 10);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(level.name, 0, -10);

        ctx.font = '20px Arial';
        ctx.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), 0, 15);

        if (!unlocked) {
          ctx.font = '24px Arial';
          ctx.fillText('🔒', 0, 0);
        }

        ctx.restore();
      };

      this.uiElements.push(levelBtn);
    });
  }

  render(ctx) {
    this._renderBackground(ctx);
    this._drawNPC(ctx, 580, 350, 80);

    for (const ui of this.uiElements) {
      ui.render(ctx);
    }
  }
}

// 逻辑花园场景
class LogicGardenScene extends LearningGardenScene {
  constructor(game) {
    super(
      game,
      SceneType.LOGIC_GARDEN,
      'deer',
      {
        sky1: '#4a148c',
        sky2: '#7b1fa2',
        ground1: '#e1bee7',
        ground2: '#ce93d8',
        cloud: 'rgba(255,255,255,0.75)',
      },
      'logic'
    );
  }

  _drawDecorations(ctx) {
    // 逻辑符号装饰
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = 'bold 40px Arial';
    ctx.fillText('?', 80, 250);
    ctx.fillText('!', 650, 350);
    ctx.font = '30px Arial';
    ctx.fillText('①②③', 500, 150);
    ctx.fillText('★★★', 150, 480);

    // 问号气泡
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(600, 180, 35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 40px Arial';
    ctx.fillText('?', 585, 195);

    // 箭头装饰
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(100, 350);
    ctx.lineTo(150, 350);
    ctx.lineTo(140, 340);
    ctx.moveTo(150, 350);
    ctx.lineTo(140, 360);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(550, 500);
    ctx.lineTo(620, 500);
    ctx.lineTo(610, 490);
    ctx.moveTo(620, 500);
    ctx.lineTo(610, 510);
    ctx.stroke();
  }

  _createUI() {
    const backBtn = new Button(20, 20, 80, 40, '返回');
    backBtn.onClick = () => this.game.changeScene(SceneType.GARDEN);
    this.uiElements.push(backBtn);

    const title = new Text(CONFIG.CANVAS_WIDTH / 2, 30, '逻辑花园', {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#FFFFFF',
      align: 'center',
    });
    this.uiElements.push(title);

    const totalStars = LearningProgress.getTotalStars();
    const starsText = new Text(CONFIG.CANVAS_WIDTH / 2, 70, `总星星: ${totalStars} ⭐`, {
      fontSize: 18,
      color: '#FFEB3B',
      align: 'center',
    });
    this.uiElements.push(starsText);

    const levels = QuestionData.getLevels('logic');
    const startY = 200;
    const btnWidth = 200;
    const btnHeight = 60;
    const spacing = 15;

    levels.forEach((level, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = col === 0 ? 80 : 420;
      const y = startY + row * (btnHeight + spacing);

      const levelNum = index + 1;
      const stars = LearningProgress.getLevelStars('logic', levelNum);
      const unlocked = LearningProgress.isLevelUnlocked('logic', levelNum);

      const levelBtn = new Button(x, y, btnWidth, btnHeight, '');
      levelBtn.backgroundColor = unlocked ? '#4CAF50' : '#9E9E9E';
      levelBtn.disabled = !unlocked;
      levelBtn.levelData = { subject: 'logic', level: levelNum, levelKey: level.key };
      levelBtn.onClick = () => {
        this.game.changeScene(SceneType.LEARNING, levelBtn.levelData);
      };

      levelBtn.render = function(ctx) {
        if (!this.visible) return;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        let color = this.backgroundColor;
        if (this.disabled) {
          color = this.disabledColor;
        } else if (this.isPressed) {
          color = this.pressedColor;
        } else if (this.isHovered) {
          color = this.hoverColor;
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 10);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(level.name, 0, -10);

        ctx.font = '20px Arial';
        ctx.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), 0, 15);

        if (!unlocked) {
          ctx.font = '24px Arial';
          ctx.fillText('🔒', 0, 0);
        }

        ctx.restore();
      };

      this.uiElements.push(levelBtn);
    });
  }

  render(ctx) {
    this._renderBackground(ctx);
    this._drawNPC(ctx, 580, 350, 80);

    for (const ui of this.uiElements) {
      ui.render(ctx);
    }
  }
}

// ============================================================
// 学习场景 - 关卡进行
// ============================================================
class LearningScene extends Scene {
  constructor(game) {
    super(game, SceneType.LEARNING);
    this.subject = null;
    this.level = null;
    this.levelKey = null;
    this.currentQuestionIndex = 0;
    this.lives = 3;
    this.wrongAnswers = 0;
    this.isShowingFeedback = false;
    this.feedbackTimer = 0;
    this.isLevelComplete = false;
    this.showRewardPanel = false;
    this.selectedReward = null;
    this.shakeOffset = 0;
    this.correctAnimProgress = 0;
    this.questionDisplayTime = 0;
  }

  enter(data) {
    this.isActive = true;
    this.subject = data.subject;
    this.level = data.level;
    this.levelKey = data.levelKey;
    this.currentQuestionIndex = 0;
    this.lives = 3;
    this.wrongAnswers = 0;
    this.isShowingFeedback = false;
    this.feedbackTimer = 0;
    this.isLevelComplete = false;
    this.showRewardPanel = false;
    this.selectedReward = null;
    this.questionDisplayTime = 0;
    this._createUI();
  }

  _createUI() {
    this.uiElements = [];

    // 返回按钮
    const backBtn = new Button(20, 20, 80, 40, '返回');
    backBtn.onClick = () => this.game.changeScene(this._getGardenScene());
    this.uiElements.push(backBtn);

    // 标题
    const levelName = QuestionData.getLevels(this.subject).find(l => l.key === this.levelKey)?.name || '关卡';
    const title = new Text(CONFIG.CANVAS_WIDTH / 2, 30, levelName, {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333333',
      align: 'center',
    });
    this.uiElements.push(title);

    // 进度指示器
    this.progressIndicator = new Text(CONFIG.CANVAS_WIDTH / 2, 65, '第 1/5 题', {
      fontSize: 16,
      color: '#666666',
      align: 'center',
    });
    this.uiElements.push(this.progressIndicator);

    // 生命值显示
    this.livesDisplay = new Text(CONFIG.CANVAS_WIDTH - 100, 30, '生命: ❤️❤️❤️', {
      fontSize: 16,
      color: '#F44336',
      align: 'left',
    });
    this.uiElements.push(this.livesDisplay);

    // 问题显示区域
    this.questionDisplay = {
      x: CONFIG.CANVAS_WIDTH / 2,
      y: 250,
      question: null,
      render: function(ctx) {
        if (!this.question) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // 问题背景
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        ctx.beginPath();
        ctx.roundRect(-280, -80, 560, 160, 15);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // 问题文字
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.question.question, 0, -20);

        // 显示图片
        if (this.question.display === 'image' && this.question.imageType) {
          this._drawImage(ctx, this.question.imageType, this.question.imageCount);
        }

        ctx.restore();
      },
      _drawImage: function(ctx, imageType, count) {
        count = count || 1;
        const startX = -((count - 1) * 40) / 2;
        for (let i = 0; i < count; i++) {
          LearningScene._drawQuestionImage(ctx, startX + i * 40, 40, imageType);
        }
      }
    };
    this.uiElements.push(this.questionDisplay);

    // 创建答案按钮
    this.answerButtons = [];
    this._createAnswerButtons();

    // 反馈动画
    this.feedbackDisplay = {
      x: CONFIG.CANVAS_WIDTH / 2,
      y: 500,
      isCorrect: true,
      alpha: 0,
      scale: 0,
      render: function(ctx) {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = this.alpha;
        ctx.scale(this.scale, this.scale);

        // 圆形背景
        ctx.fillStyle = this.isCorrect ? '#4CAF50' : '#F44336';
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
        ctx.fill();

        // 符号
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.isCorrect ? '✓' : '✗', 0, 0);

        ctx.restore();
      }
    };
    this.uiElements.push(this.feedbackDisplay);

    // 加载第一题
    this._loadQuestion(0);
  }

  _createAnswerButtons() {
    const question = QuestionData.getQuestion(this.subject, this.levelKey, this.currentQuestionIndex);
    if (!question) return;

    const options = question.options;
    const btnWidth = 300;
    const btnHeight = 60;
    const spacing = 15;
    const startY = 520;

    // 根据选项数量调整布局
    const cols = options.length <= 2 ? 1 : 2;
    const rows = Math.ceil(options.length / cols);

    options.forEach((option, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = cols === 1 ? CONFIG.CANVAS_WIDTH / 2 - btnWidth / 2 : (col === 0 ? 60 : 360);
      const y = startY + row * (btnHeight + spacing);

      const btn = new Button(x, y, btnWidth, btnHeight, String(option));
      btn.optionIndex = index;
      btn.backgroundColor = '#2196F3';
      btn.onClick = () => this._onAnswerSelected(index);

      this.answerButtons.push(btn);
      this.uiElements.push(btn);
    });
  }

  _clearAnswerButtons() {
    for (const btn of this.answerButtons) {
      const idx = this.uiElements.indexOf(btn);
      if (idx !== -1) this.uiElements.splice(idx, 1);
    }
    this.answerButtons = [];
  }

  _loadQuestion(index) {
    const question = QuestionData.getQuestion(this.subject, this.levelKey, index);
    if (!question) {
      this._onLevelComplete();
      return;
    }

    this.currentQuestionIndex = index;
    this.questionDisplay.question = question;
    this.progressIndicator.setText(`第 ${index + 1}/5 题`);
    this.questionDisplayTime = 0;

    // 清除旧按钮并创建新按钮
    this._clearAnswerButtons();
    this._createAnswerButtons();
  }

  _onAnswerSelected(optionIndex) {
    if (this.isShowingFeedback || this.isLevelComplete) return;

    const question = this.questionDisplay.question;
    const isCorrect = optionIndex === question.correct;

    // 播放音效
    this.game.audio.playSFX(isCorrect ? 'success' : 'error');

    if (isCorrect) {
      this._showFeedback(true);
      this.correctAnimProgress = 0;

      // 正确后延迟进入下一题
      setTimeout(() => {
        this._clearFeedback();
        this._loadQuestion(this.currentQuestionIndex + 1);
      }, 1200);
    } else {
      this.wrongAnswers++;
      this.lives--;
      this._showFeedback(false);

      // 震动效果
      this.shakeOffset = 10;
      setTimeout(() => { this.shakeOffset = 0; }, 300);

      if (this.lives <= 0) {
        // 游戏结束
        setTimeout(() => {
          this._onLevelFailed();
        }, 1500);
      } else {
        // 更新生命显示
        this.livesDisplay.setText('生命: ' + '❤️'.repeat(this.lives) + '🖤'.repeat(3 - this.lives));
        setTimeout(() => {
          this._clearFeedback();
        }, 1500);
      }
    }
  }

  _showFeedback(isCorrect) {
    this.isShowingFeedback = true;
    this.feedbackDisplay.isCorrect = isCorrect;
    this.feedbackDisplay.alpha = 1;
    this.feedbackDisplay.scale = 0;

    // 动画效果
    this.game.tweens.add(this.feedbackDisplay, { scale: 1.2, alpha: 1 }, 200, 'easeOutBack');

    if (isCorrect) {
      // 粒子效果
      this.game.particleSystem.confetti(this.feedbackDisplay.x, this.feedbackDisplay.y);
    }
  }

  _clearFeedback() {
    this.isShowingFeedback = false;
    this.feedbackDisplay.alpha = 0;
    this.feedbackDisplay.scale = 0;
  }

  _onLevelComplete() {
    this.isLevelComplete = true;

    // 计算星星
    const stars = Math.max(1, 3 - this.wrongAnswers);

    // 保存进度
    LearningProgress.setLevelStars(this.subject, this.level, stars);

    // 显示奖励面板
    this.showRewardPanel = true;
    this.earnedStars = stars;

    // 庆祝动画
    this.game.particleSystem.confetti(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
    this.game.audio.playSFX('success');

    this._createRewardPanel();
  }

  _onLevelFailed() {
    this.isLevelComplete = true;

    // 保存进度（0星）
    LearningProgress.setLevelStars(this.subject, this.level, 0);

    // 显示失败面板
    this.showRewardPanel = true;
    this.earnedStars = 0;

    this._createRewardPanel(true);
  }

  _createRewardPanel(isFailed = false) {
    // 隐藏答案按钮
    this._clearAnswerButtons();

    // 背景遮罩
    this.rewardOverlay = {
      alpha: 0,
      render: function(ctx) {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        ctx.restore();
      }
    };
    this.uiElements.push(this.rewardOverlay);
    this.game.tweens.add(this.rewardOverlay, { alpha: 0.8 }, 300, 'easeOut');

    // 奖励面板
    this.rewardPanel = {
      x: CONFIG.CANVAS_WIDTH / 2,
      y: CONFIG.CANVAS_HEIGHT + 300,
      width: 500,
      height: 400,
      render: function(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 面板背景
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 20);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 标题
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isFailed ? '再接再厉！' : '恭喜过关！', 0, -140);

        // 星星显示
        ctx.font = '40px Arial';
        ctx.fillText('★'.repeat(this.earnedStars || 0) + '☆'.repeat(3 - (this.earnedStars || 0)), 0, -80);

        if (!isFailed) {
          // 奖励选项
          const rewards = this.rewards || [];
          const rewardWidth = 130;
          const startX = -((rewards.length - 1) * rewardWidth) / 2;

          rewards.forEach((reward, i) => {
            const rx = startX + i * rewardWidth;
            const ry = 30;

            // 奖励背景
            ctx.fillStyle = '#E8F5E9';
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(rx - 55, ry - 50, 110, 100, 10);
            ctx.fill();
            ctx.stroke();

            // 奖励图标
            ctx.font = '36px Arial';
            ctx.fillText(reward.icon, rx, ry - 10);

            // 奖励名称
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.fillText(reward.name, rx, ry + 35);
          });
        }

        ctx.restore();
      },
      rewards: this._generateRewards()
    };
    this.uiElements.push(this.rewardPanel);
    this.game.tweens.add(this.rewardPanel, { y: CONFIG.CANVAS_HEIGHT / 2 }, 400, 'easeOutBack');

    // 重新挑战按钮
    const retryBtn = new Button(CONFIG.CANVAS_WIDTH / 2 - 75, CONFIG.CANVAS_HEIGHT / 2 + 180, 150, 50, isFailed ? '重新挑战' : '返回');
    retryBtn.backgroundColor = isFailed ? '#FF9800' : '#4CAF50';
    retryBtn.onClick = () => {
      if (isFailed) {
        // 重新开始当前关卡
        this._resetLevel();
      } else {
        // 返回花园
        this.game.changeScene(this._getGardenScene());
      }
    };
    this.uiElements.push(retryBtn);
  }

  _generateRewards() {
    if (this.earnedStars === 0) return [];

    const rewardPool = [
      { id: 'fragment_1', name: '角色碎片', icon: '🧩' },
      { id: 'fragment_2', name: '角色碎片', icon: '🧩' },
      { id: 'deco_1', name: '小花朵', icon: '🌸' },
      { id: 'deco_2', name: '小树苗', icon: '🌱' },
      { id: 'item_1', name: '双倍卡', icon: '✨' },
      { id: 'item_2', name: '跳过卡', icon: '⏭️' },
    ];

    const count = this.earnedStars;
    const rewards = [];
    const shuffled = [...rewardPool].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count && i < shuffled.length; i++) {
      rewards.push(shuffled[i]);
    }

    return rewards;
  }

  _resetLevel() {
    // 移除奖励面板
    this.uiElements = this.uiElements.filter(el => 
      el !== this.rewardOverlay && 
      el !== this.rewardPanel &&
      !el.retryBtn
    );

    this.rewardOverlay = null;
    this.rewardPanel = null;

    // 重置状态
    this.currentQuestionIndex = 0;
    this.lives = 3;
    this.wrongAnswers = 0;
    this.isLevelComplete = false;
    this.showRewardPanel = false;
    this.earnedStars = 0;

    // 重新创建UI
    this._createUI();
  }

  _getGardenScene() {
    switch(this.subject) {
      case 'math': return SceneType.MATH_GARDEN;
      case 'chinese': return SceneType.CHINESE_GARDEN;
      case 'english': return SceneType.ENGLISH_GARDEN;
      case 'logic': return SceneType.LOGIC_GARDEN;
      default: return SceneType.GARDEN;
    }
  }

  update(dt) {
    super.update(dt);

    // 震动效果
    if (this.shakeOffset !== 0) {
      this.shakeOffset *= 0.9;
      if (this.shakeOffset < 0.5) this.shakeOffset = 0;
    }

    // 正确动画进度
    if (this.correctAnimProgress > 0) {
      this.correctAnimProgress += dt / 1000;
    }
  }

  render(ctx) {
    // 背景
    this._renderBackground(ctx);

    // 应用震动
    ctx.save();
    if (this.shakeOffset !== 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.shakeOffset * 2,
        (Math.random() - 0.5) * this.shakeOffset * 2
      );
    }

    // 渲染UI元素
    for (const ui of this.uiElements) {
      if (ui !== this.rewardOverlay && ui !== this.rewardPanel) {
        ui.render(ctx);
      }
    }

    // 渲染奖励面板（最上层）
    if (this.rewardOverlay) this.rewardOverlay.render(ctx);
    if (this.rewardPanel) this.rewardPanel.render(ctx);

    ctx.restore();

    // 粒子效果
    this.game.particleSystem.render(ctx);
  }

  _renderBackground(ctx) {
    // 学习场景使用简单的渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
    gradient.addColorStop(0, '#E3F2FD');
    gradient.addColorStop(1, '#BBDEFB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // 装饰图案
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(50, 100, 30, 0, Math.PI * 2);
    ctx.arc(100, 80, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(650, 200, 25, 0, Math.PI * 2);
    ctx.arc(700, 180, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(80, 600, 35, 0, Math.PI * 2);
    ctx.arc(140, 580, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(620, 700, 28, 0, Math.PI * 2);
    ctx.arc(680, 680, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  onPointerDown(x, y, pointer) {
    for (const ui of this.uiElements) {
      if (ui.handlePointerDown && ui.handlePointerDown(x, y)) {
        return;
      }
    }
  }
}

// 静态方法：绘制题目图片
LearningScene._drawQuestionImage = function(ctx, x, y, imageType) {
  ctx.save();
  ctx.translate(x, y);

  switch(imageType) {
    case 'apple':
      ctx.fillStyle = '#F44336';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(-2, -18, 4, 8);
      break;

    case 'flower':
      ctx.fillStyle = '#E91E63';
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(angle) * 8, Math.sin(angle) * 8, 6, 4, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#FFEB3B';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'star':
      ctx.fillStyle = '#FFEB3B';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const px = Math.cos(angle) * 12;
        const py = Math.sin(angle) * 12;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;

    case 'balloon':
      ctx.fillStyle = '#9C27B0';
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(0, 25);
      ctx.stroke();
      break;

    case 'bird':
      ctx.fillStyle = '#87CEEB';
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(8, -5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(14, -5);
      ctx.lineTo(18, -5);
      ctx.lineTo(14, -3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(10, -6, 2, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'circle':
      ctx.fillStyle = '#2196F3';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'square':
      ctx.fillStyle = '#FF9800';
      ctx.fillRect(-12, -12, 24, 24);
      break;

    case 'triangle':
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(15, 12);
      ctx.lineTo(-15, 12);
      ctx.closePath();
      ctx.fill();
      break;

    case 'hexagon':
      ctx.fillStyle = '#9C27B0';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(angle) * 14;
        const py = Math.sin(angle) * 14;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;

    case 'pentagon':
      ctx.fillStyle = '#00BCD4';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(angle) * 14;
        const py = Math.sin(angle) * 14;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;

    case 'octagon':
      ctx.fillStyle = '#FF5722';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(angle) * 14;
        const py = Math.sin(angle) * 14;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;

    case 'heptagon':
      ctx.fillStyle = '#795548';
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(angle) * 14;
        const py = Math.sin(angle) * 14;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;

    case 'dog':
      ctx.fillStyle = '#8D6E63';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-12, -5, 5, 0, Math.PI * 2);
      ctx.arc(12, -5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(-5, -3, 3, 0, Math.PI * 2);
      ctx.arc(5, -3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 5, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'cat':
      ctx.fillStyle = '#FF9800';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-15, -10);
      ctx.lineTo(-8, -25);
      ctx.lineTo(-3, -10);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(15, -10);
      ctx.lineTo(8, -25);
      ctx.lineTo(3, -10);
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.ellipse(-5, -3, 3, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(5, -3, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'car':
      ctx.fillStyle = '#F44336';
      ctx.fillRect(-18, -5, 36, 15);
      ctx.fillRect(-12, -12, 24, 10);
      ctx.fillStyle = '#2196F3';
      ctx.fillRect(-10, -10, 8, 6);
      ctx.fillRect(2, -10, 8, 6);
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(-10, 12, 5, 0, Math.PI * 2);
      ctx.arc(10, 12, 5, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'book':
      ctx.fillStyle = '#795548';
      ctx.fillRect(-15, -12, 30, 24);
      ctx.fillStyle = '#FFF';
      ctx.fillRect(-12, -9, 24, 18);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-10, -6 + i * 6);
        ctx.lineTo(10, -6 + i * 6);
        ctx.stroke();
      }
      break;

    case 'sun':
      ctx.fillStyle = '#FFEB3B';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFEB3B';
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
        ctx.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
        ctx.stroke();
      }
      break;

    case 'letter_A':
      ctx.fillStyle = '#333';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('A', 0, 0);
      break;

    case 'letter_B':
      ctx.fillStyle = '#333';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('B', 0, 0);
      break;

    case 'letter_C':
      ctx.fillStyle = '#333';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('C', 0, 0);
      break;

    case 'tree':
      ctx.fillStyle = '#795548';
      ctx.fillRect(-4, 5, 8, 15);
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(18, 10);
      ctx.lineTo(-18, 10);
      ctx.closePath();
      ctx.fill();
      break;

    default:
      // 默认圆点
      ctx.fillStyle = '#9E9E9E';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
  }

  ctx.restore();
};

// ============================================================
// 游戏主类
// ============================================================
class Game {
  constructor(canvasId) {
    // DOM元素
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element "${canvasId}" not found`);
    }
    this.ctx = this.canvas.getContext('2d');
    
    // 初始化组件
    this.scaleManager = new ScaleManager(this);
    this.inputManager = new InputManager(this);
    this.tweens = new TweenManager();
    this.particleSystem = new ParticleSystem();
    this.audio = new AudioManager();
    
    // 场景管理
    this.scenes = {};
    this.currentScene = null;
    this.pendingSceneChange = null;
    this.sceneChangeData = null;
    this.transition = {
      isActive: false,
      alpha: 0,
      fadingIn: false,
      fadingOut: false,
      duration: 300,
      elapsed: 0,
      onComplete: null,
    };
    
    // 游戏状态
    this.state = GameState.LOADING;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.fps = 0;
    this.fpsCounter = 0;
    this.fpsTime = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.targetFPS = CONFIG.DEFAULT_FPS;
    
    // 初始化
    this._init();
  }
  
  _init() {
    // 初始化存储
    Storage.init();
    
    // 注册场景
    this._registerScenes();
    
    // 设置画布
    this.canvas.width = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;
    
    // 启动游戏
    this.state = GameState.MENU;
    this.changeScene(SceneType.MAIN_MENU);
    this.start();
  }
  
  _registerScenes() {
    this.scenes[SceneType.MAIN_MENU] = new MainMenuScene(this);
    this.scenes[SceneType.GARDEN] = new GardenScene(this);
    this.scenes[SceneType.SHOP] = new ShopScene(this);
    this.scenes[SceneType.INVENTORY] = new InventoryScene(this);
    this.scenes[SceneType.SETTINGS] = new SettingsScene(this);
    this.scenes[SceneType.MATH_GARDEN] = new MathGardenScene(this);
    this.scenes[SceneType.CHINESE_GARDEN] = new ChineseGardenScene(this);
    this.scenes[SceneType.ENGLISH_GARDEN] = new EnglishGardenScene(this);
    this.scenes[SceneType.LOGIC_GARDEN] = new LogicGardenScene(this);
    this.scenes[SceneType.LEARNING] = new LearningScene(this);
    
    // 初始化所有场景
    for (const name in this.scenes) {
      this.scenes[name].init();
    }
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(t => this._gameLoop(t));
  }
  
  stop() {
    this.isRunning = false;
  }
  
  pause() {
    this.isPaused = true;
  }
  
  resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }
  
  _gameLoop(currentTime) {
    if (!this.isRunning) return;
    
    // 计算delta time
    this.deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // FPS计算
    this.fpsCounter++;
    this.fpsTime += this.deltaTime;
    if (this.fpsTime >= 1000) {
      this.fps = this.fpsCounter;
      this.fpsCounter = 0;
      this.fpsTime = 0;
    }
    
    // 限制delta time（防止卡顿后跳帧）
    this.deltaTime = Math.min(this.deltaTime, 100);
    
    // 更新
    this._update(this.deltaTime);
    
    // 渲染
    this._render();
    
    // 下一帧
    requestAnimationFrame(t => this._gameLoop(t));
  }
  
  _update(dt) {
    // 更新输入
    this.inputManager.update();
    
    // 更新过渡效果
    this._updateTransition(dt);
    
    // 更新当前场景
    if (this.currentScene && !this.isPaused) {
      this.currentScene.update(dt);
    }
    
    // 更新tween系统
    this.tweens.update(dt);
    
    // 更新粒子系统
    this.particleSystem.update(dt);
    
    // 处理场景切换
    if (this.pendingSceneChange) {
      this._doSceneChange();
    }
  }
  
  _render() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 渲染当前场景
    if (this.currentScene) {
      this.currentScene.render(this.ctx);
    }
    
    // 渲染过渡效果
    if (this.transition.isActive) {
      this.ctx.fillStyle = `rgba(0, 0, 0, ${this.transition.alpha})`;
      this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }
  }
  
  _updateTransition(dt) {
    if (!this.transition.isActive) return;
    
    const t = this.transition;
    t.elapsed += dt;
    
    if (t.fadingOut) {
      t.alpha = t.elapsed / t.duration;
      if (t.alpha >= 1) {
        t.alpha = 1;
        t.fadingOut = false;
        t.elapsed = 0;
        
        if (t.onComplete) {
          t.onComplete();
        }
      }
    } else if (t.fadingIn) {
      t.alpha = 1 - (t.elapsed / t.duration);
      if (t.alpha <= 0) {
        t.alpha = 0;
        t.fadingIn = false;
        t.isActive = false;
      }
    }
  }
  
  changeScene(sceneName, data = null, withTransition = true) {
    // 防御性检查：忽略无效的场景名
    if (!sceneName) {
      console.warn('changeScene called with invalid sceneName:', sceneName);
      return;
    }
    this.pendingSceneChange = sceneName;
    this.sceneChangeData = data;
    
    if (withTransition && !this.transition.isActive) {
      this._startTransition(() => {
        this._doSceneChange();
      });
    } else if (!withTransition) {
      this._doSceneChange();
    }
  }
  
  _startTransition(onMidpoint) {
    const t = this.transition;
    t.isActive = true;
    t.fadingOut = true;
    t.fadingIn = false;
    t.alpha = 0;
    t.elapsed = 0;
    t.onMidpoint = onMidpoint;
    t.onComplete = () => {
      if (t.onMidpoint) {
        t.onMidpoint();
      }
      t.fadingIn = true;
      t.elapsed = 0;
      t.onComplete = null;
    };
  }
  
  _doSceneChange() {
    const newSceneName = this.pendingSceneChange;
    
    // 防御性检查：忽略无效的场景名
    if (!newSceneName) {
      console.warn('changeScene: invalid sceneName:', newSceneName);
      this.pendingSceneChange = null;
      this.sceneChangeData = null;
      return;
    }
    
    // 退出当前场景
    if (this.currentScene) {
      this.currentScene.exit();
      this.currentScene.isActive = false;
    }
    
    // 查找新场景
    const newScene = this.scenes[newSceneName];
    if (!newScene) {
      console.error(`Scene "${newSceneName}" not found`);
      this.pendingSceneChange = null;
      this.sceneChangeData = null;
      return;
    }
    
    // 切换场景
    this.currentScene = newScene;
    this.currentScene.enter(this.sceneChangeData);
    this.currentScene.isActive = true;
    
    // 清理
    this.pendingSceneChange = null;
    this.sceneChangeData = null;
    this.tweens.removeAll();
    this.particleSystem.clear();
    
    console.log(`Changed to scene: ${newSceneName}`);
  }
  
  // 状态管理
  getState() {
    return this.state;
  }
  
  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    console.log(`Game state: ${oldState} -> ${newState}`);
    
    // 状态变化处理
    switch (newState) {
      case GameState.PAUSED:
        this.pause();
        break;
      case GameState.PLAYING:
        this.resume();
        break;
    }
  }
  
  // 工具方法
  addTween(target, props, duration, ease, onUpdate, onComplete) {
    return this.tweens.add(target, props, duration, ease, onUpdate, onComplete);
  }
  
  removeTween(tween) {
    this.tweens.remove(tween);
  }
  
  emitParticles(x, y, options) {
    return this.particleSystem.emitAt(x, y, options);
  }
  
  burstParticles(x, y, options) {
    return this.particleSystem.burst(x, y, options);
  }
}

// ============================================================
// 启动游戏
// ============================================================
function startGame(canvasId = 'gameCanvas') {
  const game = new Game(canvasId);
  return game;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Game, startGame, CONFIG, GameState, SceneType, Storage, Utils };
}
