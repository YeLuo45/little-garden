# 技术方案 — 小花园（Little Garden）

**提案ID**: P-20260422-005
**版本**: v1.0
**日期**: 2026-04-22
**状态**: 初稿

---

## 1. 技术栈

| 维度 | 选择 |
|------|------|
| 渲染引擎 | HTML5 Canvas 2D |
| 语言 | Vanilla JavaScript（ES6+） |
| 样式 | 纯 CSS3（无框架） |
| 音效 | Web Audio API（程序化合成） |
| 数据存储 | localStorage |
| 构建工具 | 无（无需构建，浏览器直接运行） |
| 部署方式 | GitHub Pages + 本地 HTML 双模式 |

---

## 2. 文件结构

```
little-garden/
├── index.html          # 入口 HTML
├── style.css           # 样式文件
├── game.js             # 游戏主逻辑
├── SPEC.md             # 简明技术规格（开发者参考）
└── docs/
    ├── gdd.v1.md       # 游戏设计文档
    ├── creative-review.md  # 创意总监审核
    └── technical-solution.v1.md  # 本文档
```

---

## 3. 响应式缩放方案

### 3.1 设计分辨率

- **逻辑分辨率**: 1280 × 720（16:9）
- **最小支持**: 320 × 180

### 3.2 缩放策略

```javascript
// 获取缩放比例（保持 16:9 比例）
function getScale() {
    const designWidth = 1280;
    const designHeight = 720;
    const scaleX = window.innerWidth / designWidth;
    const scaleY = window.innerHeight / designHeight;
    return Math.min(scaleX, scaleY);
}

// 应用缩放
function applyScale(canvas) {
    const scale = getScale();
    canvas.style.width = (1280 * scale) + 'px';
    canvas.style.height = (720 * scale) + 'px';
    canvas.style.position = 'absolute';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
}
```

### 3.3 居中与黑边

- 保持 16:9 比例，超出部分用 CSS `background: #1a1a2e` 黑色填充
- 页面背景色匹配游戏内天空色 `#C8E6C9`

---

## 4. Canvas 渲染架构

### 4.1 渲染循环

```javascript
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1280;
        this.canvas.height = 720;
        this.lastTime = 0;
        this.state = 'menu'; // menu | playing | paused
    }

    start() {
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(timestamp) {
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
        // 更新游戏逻辑
    }

    render() {
        // 渲染
    }
}
```

### 4.2 场景/状态管理

```javascript
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    SHOP: 'shop',
    PET_DETAIL: 'pet_detail',
    GARDEN: 'garden'
};
```

### 4.3 输入处理

```javascript
// 触摸/鼠标统一处理
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / getScale();
    const y = (e.clientY - rect.top) / getScale();
    handleClick(x, y);
});

// 触摸支持
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / getScale();
    const y = (touch.clientY - rect.top) / getScale();
    handleClick(x, y);
}, { passive: false });
```

---

## 5. 纯 Canvas 2D 绘制规范

### 5.1 角色绘制函数库

所有角色使用程序化 Canvas 2D 绘制，无外部图片依赖。

```javascript
// 示例：绘制小园宝（主角）
function drawYuanBao(ctx, x, y, size, mood) {
    ctx.save();
    ctx.translate(x, y);

    // 身体（圆形）
    ctx.fillStyle = '#8BC34A';
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 眼睛
    const eyeY = -size * 0.2;
    ctx.fillStyle = '#3E2723';
    ctx.beginPath();
    ctx.arc(-size * 0.3, eyeY, size * 0.15, 0, Math.PI * 2);
    ctx.arc(size * 0.3, eyeY, size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛高光
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-size * 0.35, eyeY - size * 0.05, size * 0.05, 0, Math.PI * 2);
    ctx.arc(size * 0.25, eyeY - size * 0.05, size * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // 嘴巴（根据心情）
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (mood === 'happy') {
        ctx.arc(0, size * 0.1, size * 0.3, 0.1 * Math.PI, 0.9 * Math.PI);
    } else if (mood === 'sad') {
        ctx.arc(0, size * 0.4, size * 0.3, 1.1 * Math.PI, 1.9 * Math.PI);
    } else {
        ctx.moveTo(-size * 0.2, size * 0.2);
        ctx.lineTo(size * 0.2, size * 0.2);
    }
    ctx.stroke();

    ctx.restore();
}
```

### 5.2 UI 绘制

```javascript
// 圆角矩形绘制
function drawRoundedRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

// 按钮绘制
function drawButton(ctx, x, y, w, h, text, isHovered) {
    const fill = isHovered ? '#388E3C' : '#4CAF50';
    drawRoundedRect(ctx, x, y, w, h, 20, fill);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
}
```

### 5.3 动画系统

```javascript
// 简易缓动函数
const Easing = {
    easeOut: t => 1 - Math.pow(1 - t, 3),
    elasticOut: t => {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
    },
    bounceOut: t => {
        const n1 = 7.5625, d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
};

// 动画组件
class Animation {
    constructor(target, props, duration, easing = 'easeOut') {
        this.target = target;
        this.props = props; // { x: { from: 0, to: 100 } }
        this.duration = duration;
        this.easing = Easing[easing];
        this.elapsed = 0;
        this.done = false;
    }

    update(dt) {
        this.elapsed += dt;
        const t = Math.min(this.elapsed / this.duration, 1);
        const e = this.easing(t);

        for (const [key, v] of Object.entries(this.props)) {
            this.target[key] = v.from + (v.to - v.from) * e;
        }

        if (t >= 1) this.done = true;
    }
}
```

---

## 6. Web Audio API 音效合成

### 6.1 音频管理器

```javascript
class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);
    }

    resume() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    // 播放音符
    playTone(freq, duration, type = 'sine', volume = 0.3) {
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

    // 播放音效
    playSFX(type) {
        this.resume();
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
                // 模拟水流声
                const noise = this.ctx.createBufferSource();
                const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.1;
                noise.buffer = buffer;
                const noiseGain = this.ctx.createGain();
                noiseGain.gain.setValueAtTime(0.1, this.ctx.currentTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
                noise.connect(noiseGain);
                noiseGain.connect(this.masterGain);
                noise.start();
                break;
        }
    }
}
```

---

## 7. 数据持久化（localStorage）

### 7.1 数据结构

```javascript
const SAVE_KEY = 'littleGarden_saveData';

const defaultSaveData = {
    version: 1,
    mode: 'child', // 'child' | 'adult'
    coins: 100,
    stars: 0,
    pets: [
        { id: 'dog', name: '小白', hunger: 80, happiness: 80, health: 100, level: 1, exp: 0 }
    ],
    garden: {
        plots: [
            { cropId: null, plantedAt: null, stage: 0 },
            // ... 6 plots total
        ]
    },
    inventory: [],
    achievements: [],
    settings: {
        musicVolume: 0.5,
        sfxVolume: 0.5
    },
    lastSave: Date.now()
};
```

### 7.2 保存/加载

```javascript
function saveGame() {
    const data = getGameState();
    data.lastSave = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
        const data = JSON.parse(raw);
        // 版本迁移检查
        if (data.version < 1) { /* 迁移逻辑 */ }
        return data;
    } catch (e) {
        console.error('Save data corrupted:', e);
        return null;
    }
}

// 自动保存（每30秒）
setInterval(saveGame, 30000);
```

---

## 8. 游戏核心模块

### 8.1 模块列表

| 模块 | 职责 |
|------|------|
| `Game` | 主循环、状态管理、场景切换 |
| `InputManager` | 统一输入处理（鼠标/触摸/键盘） |
| `AudioManager` | Web Audio API 音效合成 |
| `SaveManager` | localStorage 存取 |
| `PetSystem` | 宠物状态、互动、成长 |
| `GardenSystem` | 作物种植、生长、收获 |
| `ShopSystem` | 商店购买 |
| `UIRenderer` | Canvas UI 绘制 |
| `AnimationManager` | 动画队列管理 |
| `ParticleSystem` | 粒子效果 |

### 8.2 核心类关系

```
Game
├── InputManager
├── AudioManager
├── SaveManager
├── PetSystem
│   └── Pet (per pet instance)
├── GardenSystem
│   └── Plot (per plot instance)
├── ShopSystem
├── UIRenderer
├── AnimationManager
└── ParticleSystem
```

---

## 9. 部署方案

### 9.1 GitHub Pages

- 仓库: `https://github.com/YeLuo45/little-garden`
- 部署分支: `gh-pages`
- 访问地址: `https://yeluo45.github.io/little-garden/`
- 触发方式: 推送 `gh-pages` 分支自动部署

### 9.2 本地运行

- 直接用浏览器打开 `index.html` 即可
- 推荐使用 http 服务器避免跨域问题（某些浏览器对 file:// 有安全限制）

```bash
# Python 简易服务器
python3 -m http.server 8080

# Node.js
npx serve .
```

---

## 10. 验收标准

| 检查项 | 要求 |
|--------|------|
| 文件结构 | index.html / style.css / game.js 三文件存在 |
| 浏览器运行 | Chrome/Firefox/Safari 直接打开无报错 |
| 响应式 | 任意窗口尺寸下保持 16:9 比例，内容完整显示 |
| 双模式切换 | 幼儿模式 / 儿童模式可正常切换 |
| 宠物互动 | 喂食/抚摸/玩耍有反馈动画 |
| 种植流程 | 播种→生长→收获 完整循环 |
| 音效 | 点击/成功/错误/收集 均有音效 |
| 数据保存 | 刷新页面数据不丢失 |
| 构建 | 无需构建，零依赖 |
