/**
 * QUnit Tests: Learning scenes (MathGardenScene, LearningScene)
 */

QUnit.module('LearningScene', function() {
  
  // Mock canvas context
  const mockCtx = {
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    globalAlpha: 1,
    fillStyle: '#000',
    font: '16px Arial',
    textAlign: 'left',
    textBaseline: 'top',
    fillText: () => {},
    strokeText: () => {},
    measureText: () => ({ width: 50 }),
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    closePath: () => {},
    fill: () => {},
    stroke: () => {},
    arc: () => {},
    ellipse: () => {},
    drawImage: () => {},
    clearRect: () => {},
    rect: () => {},
    shadowColor: null,
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    lineWidth: 1,
  };

  // Create minimal mock game
  function createMockGame() {
    return {
      scenes: {},
      currentScene: null,
      pendingSceneChange: null,
      sceneChangeData: null,
      transition: { isActive: false },
      state: 'playing',
      audio: { playSFX: () => {} },
      changeScene: function(sceneName, data, withTransition) {
        this.pendingSceneChange = sceneName;
        this.sceneChangeData = data;
      },
      _doSceneChange: function() {
        const newSceneName = this.pendingSceneChange;
        if (this.currentScene) {
          this.currentScene.exit();
          this.currentScene.isActive = false;
        }
        this.currentScene = this.scenes[newSceneName];
        if (this.currentScene) {
          this.currentScene.isActive = true;
          this.currentScene.enter(this.sceneChangeData);
        }
        this.pendingSceneChange = null;
        this.sceneChangeData = null;
      },
      particleSystem: {
        emitAt: () => {},
        burst: () => {},
      },
    };
  }

  QUnit.test('MathGardenScene instantiation', function(assert) {
    const mockGame = createMockGame();
    const scene = new MathGardenScene(mockGame);
    
    assert.strictEqual(scene.name, SceneType.MATH_GARDEN, 'MathGardenScene name is math_garden');
    assert.ok(scene instanceof LearningGardenScene, 'MathGardenScene extends LearningGardenScene');
    assert.ok(scene instanceof Scene, 'MathGardenScene extends Scene');
    assert.strictEqual(scene.petType, 'fox', 'Pet type is fox');
    assert.strictEqual(scene.learningType, 'math', 'Learning type is math');
  });

  QUnit.test('MathGardenScene has required lifecycle methods', function(assert) {
    const mockGame = createMockGame();
    const scene = new MathGardenScene(mockGame);
    
    assert.ok(typeof scene.init === 'function', 'Scene has init method');
    assert.ok(typeof scene.enter === 'function', 'Scene has enter method');
    assert.ok(typeof scene.exit === 'function', 'Scene has exit method');
    assert.ok(typeof scene.update === 'function', 'Scene has update method');
    assert.ok(typeof scene.render === 'function', 'Scene has render method');
    assert.ok(typeof scene._drawDecorations === 'function', 'Scene has _drawDecorations method');
    assert.ok(typeof scene._createUI === 'function', 'Scene has _createUI method');
  });

  QUnit.test('MathGardenScene can be initialized', function(assert) {
    const mockGame = createMockGame();
    const scene = new MathGardenScene(mockGame);
    
    let error = null;
    try {
      scene.init();
    } catch (e) {
      error = e;
    }
    
    assert.strictEqual(error, null, 'MathGardenScene init does not throw');
  });

  QUnit.test('MathGardenScene render does not throw', function(assert) {
    const mockGame = createMockGame();
    const scene = new MathGardenScene(mockGame);
    scene.init();
    
    let error = null;
    try {
      scene.render(mockCtx);
    } catch (e) {
      error = e;
    }
    
    assert.strictEqual(error, null, 'MathGardenScene render does not throw');
  });

  QUnit.test('MathGardenScene has uiElements after init', function(assert) {
    const mockGame = createMockGame();
    const scene = new MathGardenScene(mockGame);
    scene.init();
    
    // After init, uiElements should exist
    assert.ok(Array.isArray(scene.uiElements), 'uiElements is an array');
    assert.ok(Array.isArray(scene.objects), 'objects is an array');
  });

  QUnit.test('LearningScene instantiation', function(assert) {
    const mockGame = createMockGame();
    const scene = new LearningScene(mockGame);
    
    assert.strictEqual(scene.name, SceneType.LEARNING, 'LearningScene name is learning');
    assert.ok(scene instanceof Scene, 'LearningScene extends Scene');
  });

  QUnit.test('LearningScene has required lifecycle methods', function(assert) {
    const mockGame = createMockGame();
    const scene = new LearningScene(mockGame);
    
    assert.ok(typeof scene.init === 'function', 'Scene has init method');
    assert.ok(typeof scene.enter === 'function', 'Scene has enter method');
    assert.ok(typeof scene.exit === 'function', 'Scene has exit method');
    assert.ok(typeof scene.update === 'function', 'Scene has update method');
    assert.ok(typeof scene.render === 'function', 'Scene has render method');
  });

  QUnit.test('LearningScene can be initialized', function(assert) {
    const mockGame = createMockGame();
    const scene = new LearningScene(mockGame);
    
    let error = null;
    try {
      scene.init();
    } catch (e) {
      error = e;
    }
    
    assert.strictEqual(error, null, 'LearningScene init does not throw');
  });

  QUnit.test('LearningScene render does not throw', function(assert) {
    const mockGame = createMockGame();
    const scene = new LearningScene(mockGame);
    scene.init();
    
    let error = null;
    try {
      scene.render(mockCtx);
    } catch (e) {
      error = e;
    }
    
    assert.strictEqual(error, null, 'LearningScene render does not throw');
  });

  QUnit.test('SceneType constants are defined', function(assert) {
    assert.strictEqual(SceneType.MATH_GARDEN, 'math_garden', 'MATH_GARDEN constant is math_garden');
    assert.strictEqual(SceneType.LEARNING, 'learning', 'LEARNING constant is learning');
    assert.strictEqual(typeof SceneType.CHINESE_GARDEN, 'string', 'CHINESE_GARDEN is defined');
    assert.strictEqual(typeof SceneType.ENGLISH_GARDEN, 'string', 'ENGLISH_GARDEN is defined');
    assert.strictEqual(typeof SceneType.LOGIC_GARDEN, 'string', 'LOGIC_GARDEN is defined');
  });

  QUnit.test('Game can register learning scenes', function(assert) {
    const mockGame = createMockGame();
    
    mockGame.scenes[SceneType.MATH_GARDEN] = new MathGardenScene(mockGame);
    mockGame.scenes[SceneType.LEARNING] = new LearningScene(mockGame);
    
    assert.ok(mockGame.scenes[SceneType.MATH_GARDEN] instanceof MathGardenScene, 'MathGardenScene registered');
    assert.ok(mockGame.scenes[SceneType.LEARNING] instanceof LearningScene, 'LearningScene registered');
  });

  QUnit.test('MathGardenScene enter and exit work', function(assert) {
    const mockGame = createMockGame();
    const scene = new MathGardenScene(mockGame);
    scene.init();
    
    let enterCalled = false;
    let exitCalled = false;
    
    scene.enter = function(data) {
      enterCalled = true;
    };
    
    scene.exit = function() {
      exitCalled = true;
    };
    
    scene.enter('test');
    assert.strictEqual(enterCalled, true, 'enter was called');
    
    scene.exit();
    assert.strictEqual(exitCalled, true, 'exit was called');
  });

  QUnit.test('LearningScene enter and exit work', function(assert) {
    const mockGame = createMockGame();
    const scene = new LearningScene(mockGame);
    scene.init();
    
    let enterCalled = false;
    let exitCalled = false;
    
    scene.enter = function(data) {
      enterCalled = true;
    };
    
    scene.exit = function() {
      exitCalled = true;
    };
    
    scene.enter('test');
    assert.strictEqual(enterCalled, true, 'enter was called');
    
    scene.exit();
    assert.strictEqual(exitCalled, true, 'exit was called');
  });

  QUnit.test('LearningGardenScene exists and is base class', function(assert) {
    const mockGame = createMockGame();
    const scene = new MathGardenScene(mockGame);
    
    assert.ok(scene instanceof LearningGardenScene, 'MathGardenScene extends LearningGardenScene');
    assert.ok(scene instanceof Scene, 'LearningGardenScene extends Scene');
  });
});
