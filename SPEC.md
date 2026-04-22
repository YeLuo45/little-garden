# SPEC.md — 小花园（Little Garden）

**版本**: v1.0
**日期**: 2026-04-22
**引擎**: 纯 HTML5 Canvas + Vanilla JS

---

## 快速开始

1. 直接用浏览器打开 `index.html`
2. 或启动本地服务器：`python3 -m http.server 8080` 后访问 http://localhost:8080

---

## 文件结构

```
little-garden/
├── index.html    # 游戏入口
├── style.css     # 样式文件
├── game.js       # 游戏核心逻辑（2913行）
└── docs/
    ├── gdd.v1.md              # 游戏设计文档
    ├── creative-review.md     # 创意总监审核
    ├── technical-solution.v1.md  # 技术方案
    └── SPEC.md               # 本文档
```

---

## 游戏架构

### 核心类

| 类 | 职责 |
|----|------|
| `Game` | 主控制器，状态管理，场景切换 |
| `GameState` | 状态枚举 |
| `SceneType` | 场景枚举 |
| `Storage` | localStorage 数据持久化 |
| `Utils` | 工具函数 |

### 场景列表

| 场景 | 说明 |
|------|------|
| `BOOT` | 启动初始化 |
| `MAIN_MENU` | 主菜单 |
| `GARDEN` | 花园（种植/收获） |
| `SHOP` | 商店（购买道具） |
| `INVENTORY` | 背包（查看物品） |
| `SETTINGS` | 设置（音乐/音效） |

---

## 游戏循环

- 目标帧率：60 FPS
- 使用 `requestAnimationFrame`
- deltaTime 自动计算

---

## 启动方式

```javascript
const game = startGame('gameCanvas');
```

游戏会自动初始化并进入主菜单。

---

## 数据存储

- 使用 `localStorage`
- 键名：`little_garden_save`
- 自动保存间隔：30秒

---

## 响应式缩放

- 逻辑分辨率：720 × 1280（竖屏）
- 自动适配窗口，保持比例

---

## 技术特点

- 纯 Canvas 2D 渲染
- Web Audio API 音效合成
- 无外部依赖
- 无需构建工具
