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
  },
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
    
    // 退出当前场景
    if (this.currentScene) {
      this.currentScene.exit();
      this.currentScene.isActive = false;
    }
    
    // 查找新场景
    const newScene = this.scenes[newSceneName];
    if (!newScene) {
      console.error(`Scene "${newSceneName}" not found`);
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
