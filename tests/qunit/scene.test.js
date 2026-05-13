/**
 * QUnit Tests: Scene base class and changeScene
 */

QUnit.module('Scene', function() {
  
  // Mock game instance
  function createMockGame() {
    return {
      scenes: {},
      currentScene: null,
      pendingSceneChange: null,
      sceneChangeData: null,
      transition: {
        isActive: false,
        alpha: 0,
        fadingIn: false,
        fadingOut: false,
        duration: 300,
        elapsed: 0,
        onComplete: null,
        onMidpoint: null,
      },
      state: 'playing',
      changeScene: function(sceneName, data = null, withTransition = true) {
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
      },
      _startTransition: function(onMidpoint) {
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
      },
      _doSceneChange: function() {
        const newSceneName = this.pendingSceneChange;
        
        if (!newSceneName) {
          console.warn('changeScene: invalid sceneName:', newSceneName);
          this.pendingSceneChange = null;
          this.sceneChangeData = null;
          return;
        }
        
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
      state: 'playing',
    };
  }

  QUnit.test('Scene instantiation and default properties', function(assert) {
    const mockGame = createMockGame();
    const scene = new Scene(mockGame, 'test_scene');
    
    assert.strictEqual(scene.game, mockGame, 'Scene has reference to game');
    assert.strictEqual(scene.name, 'test_scene', 'Scene name is correct');
    assert.deepEqual(scene.objects, [], 'Scene objects array is empty');
    assert.deepEqual(scene.uiElements, [], 'Scene uiElements array is empty');
    assert.strictEqual(scene.isActive, false, 'Scene is not active by default');
    assert.strictEqual(scene.isPaused, false, 'Scene is not paused by default');
    assert.strictEqual(scene.transitioning, false, 'Scene is not transitioning by default');
  });

  QUnit.test('Scene addObject and removeObject', function(assert) {
    const mockGame = createMockGame();
    const scene = new Scene(mockGame, 'test');
    
    const obj1 = { name: 'obj1' };
    const obj2 = { name: 'obj2' };
    
    scene.addObject(obj1);
    scene.addObject(obj2);
    
    assert.strictEqual(scene.objects.length, 2, 'Scene has 2 objects after adding');
    assert.strictEqual(scene.objects[0], obj1, 'obj1 is at index 0');
    assert.strictEqual(scene.objects[1], obj2, 'obj2 is at index 1');
    
    scene.removeObject(obj1);
    
    assert.strictEqual(scene.objects.length, 1, 'Scene has 1 object after removing');
    assert.strictEqual(scene.objects[0], obj2, 'obj2 remains after removing obj1');
  });

  QUnit.test('Scene bringToFront and sendToBack', function(assert) {
    const mockGame = createMockGame();
    const scene = new Scene(mockGame, 'test');
    
    const obj1 = { name: 'obj1' };
    const obj2 = { name: 'obj2' };
    const obj3 = { name: 'obj3' };
    
    scene.addObject(obj1);
    scene.addObject(obj2);
    scene.addObject(obj3);
    
    // Bring obj1 to front
    scene.bringToFront(obj1);
    assert.strictEqual(scene.objects[2], obj1, 'obj1 is now at the front');
    assert.strictEqual(scene.objects[1], obj2, 'obj2 is in the middle');
    assert.strictEqual(scene.objects[0], obj3, 'obj3 is at the back');
    
    // Send obj3 to back
    scene.sendToBack(obj3);
    assert.strictEqual(scene.objects[0], obj3, 'obj3 is now at the back');
    assert.strictEqual(scene.objects[2], obj1, 'obj1 is still at the front');
  });

  QUnit.test('Scene lifecycle methods exist', function(assert) {
    const mockGame = createMockGame();
    const scene = new Scene(mockGame, 'test');
    
    assert.ok(typeof scene.init === 'function', 'Scene has init method');
    assert.ok(typeof scene.enter === 'function', 'Scene has enter method');
    assert.ok(typeof scene.exit === 'function', 'Scene has exit method');
    assert.ok(typeof scene.update === 'function', 'Scene has update method');
    assert.ok(typeof scene.render === 'function', 'Scene has render method');
  });

  QUnit.test('Scene enter and exit can be called without error', function(assert) {
    const mockGame = createMockGame();
    const scene = new Scene(mockGame, 'test');
    
    let enterCalled = false;
    let exitCalled = false;
    
    scene.enter = function(data) {
      enterCalled = true;
      assert.strictEqual(data, 'testData', 'enter receives correct data');
    };
    
    scene.exit = function() {
      exitCalled = true;
    };
    
    scene.enter('testData');
    assert.strictEqual(enterCalled, true, 'enter was called');
    
    scene.exit();
    assert.strictEqual(exitCalled, true, 'exit was called');
  });

  QUnit.test('Game changeScene with mock', function(assert) {
    const mockGame = createMockGame();
    
    // Create two scenes
    const scene1 = new Scene(mockGame, 'scene1');
    const scene2 = new Scene(mockGame, 'scene2');
    
    scene1.init();
    scene2.init();
    
    mockGame.scenes['scene1'] = scene1;
    mockGame.scenes['scene2'] = scene2;
    
    // Change scene without transition
    mockGame.changeScene('scene2', null, false);
    
    assert.strictEqual(mockGame.currentScene, scene2, 'currentScene is scene2');
    assert.strictEqual(mockGame.currentScene.isActive, true, 'scene2 is active');
    assert.strictEqual(mockGame.pendingSceneChange, null, 'pendingSceneChange is cleared');
  });

  QUnit.test('Game changeScene ignores invalid scene name', function(assert) {
    const mockGame = createMockGame();
    
    const scene1 = new Scene(mockGame, 'scene1');
    scene1.init();
    mockGame.scenes['scene1'] = scene1;
    mockGame.currentScene = scene1;
    
    // Try to change to non-existent scene
    mockGame.changeScene('nonexistent', null, false);
    
    assert.strictEqual(mockGame.currentScene, scene1, 'currentScene unchanged for invalid scene');
    assert.strictEqual(mockGame.pendingSceneChange, null, 'pendingSceneChange is null');
  });

  QUnit.test('Scene update respects isPaused', function(assert) {
    const mockGame = createMockGame();
    const scene = new Scene(mockGame, 'test');
    
    let updateCount = 0;
    const testObj = {
      update: function(dt) {
        updateCount++;
      }
    };
    
    scene.addObject(testObj);
    scene.isPaused = false;
    
    scene.update(16);
    assert.strictEqual(updateCount, 1, 'update called once when not paused');
    
    scene.isPaused = true;
    scene.update(16);
    assert.strictEqual(updateCount, 1, 'update not called when paused');
  });

  QUnit.test('Scene render calls render on objects', function(assert) {
    const mockGame = createMockGame();
    const scene = new Scene(mockGame, 'test');
    
    let renderCount = 0;
    const testObj = {
      render: function(ctx) {
        renderCount++;
      }
    };
    
    scene.addObject(testObj);
    
    const mockCtx = {};
    scene.render(mockCtx);
    
    assert.strictEqual(renderCount, 1, 'render called once on object');
  });

  QUnit.test('Scene pointer event handlers exist', function(assert) {
    const mockGame = createMockGame();
    const scene = new Scene(mockGame, 'test');
    
    assert.ok(typeof scene.onKeyDown === 'function', 'Scene has onKeyDown');
    assert.ok(typeof scene.onKeyUp === 'function', 'Scene has onKeyUp');
    assert.ok(typeof scene.onPointerDown === 'function', 'Scene has onPointerDown');
    assert.ok(typeof scene.onPointerUp === 'function', 'Scene has onPointerUp');
    assert.ok(typeof scene.onPointerMove === 'function', 'Scene has onPointerMove');
  });
});
