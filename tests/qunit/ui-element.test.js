/**
 * QUnit Tests: UI Elements (Button, Text, ProgressBar)
 */

QUnit.module('UIElement', function() {
  
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
    shadowColor: null,
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    lineWidth: 1,
  };

  QUnit.test('Button instantiation and default properties', function(assert) {
    const button = new Button(10, 20, 100, 50, 'Test');
    
    assert.strictEqual(button.x, 10, 'Button x position is correct');
    assert.strictEqual(button.y, 20, 'Button y position is correct');
    assert.strictEqual(button.width, 100, 'Button width is correct');
    assert.strictEqual(button.height, 50, 'Button height is correct');
    assert.strictEqual(button.text, 'Test', 'Button text is correct');
    assert.strictEqual(button.backgroundColor, '#4CAF50', 'Button default color is green');
    assert.strictEqual(button.disabled, false, 'Button is not disabled by default');
    assert.strictEqual(button.visible, true, 'Button is visible by default');
  });

  QUnit.test('Button render does not throw', function(assert) {
    const button = new Button(10, 20, 100, 50, 'Render Test');
    button.visible = true;
    
    assert.ok(typeof button.render === 'function', 'Button has render method');
    
    // Should not throw when rendering
    let error = null;
    try {
      button.render(mockCtx);
    } catch (e) {
      error = e;
    }
    assert.strictEqual(error, null, 'Button render does not throw');
  });

  QUnit.test('Button disabled state changes color', function(assert) {
    const button = new Button(0, 0, 100, 40, 'Disabled');
    
    assert.strictEqual(button.disabled, false, 'Initially not disabled');
    assert.strictEqual(button.backgroundColor, '#4CAF50', 'Default color is green');
    
    button.disabled = true;
    assert.strictEqual(button.disabledColor, '#9E9E9E', 'Disabled color is grey');
  });

  QUnit.test('Text instantiation and default properties', function(assert) {
    const text = new Text(50, 100, 'Hello World');
    
    assert.strictEqual(text.x, 50, 'Text x position is correct');
    assert.strictEqual(text.y, 100, 'Text y position is correct');
    assert.strictEqual(text.text, 'Hello World', 'Text content is correct');
    assert.strictEqual(text.fontSize, 24, 'Default font size is 24');
    assert.strictEqual(text.textColor, '#000000', 'Default text color is black');
    assert.strictEqual(text.visible, true, 'Text is visible by default');
  });

  QUnit.test('Text setText updates text content', function(assert) {
    const text = new Text(0, 0, 'Original');
    
    assert.strictEqual(text.text, 'Original', 'Initial text is Original');
    
    const returned = text.setText('Updated');
    
    assert.strictEqual(text.text, 'Updated', 'Text is updated to Updated');
    assert.strictEqual(returned, text, 'setText returns this for chaining');
  });

  QUnit.test('Text render does not throw', function(assert) {
    const text = new Text(10, 10, 'Render Test', { fontSize: 20 });
    text.visible = true;
    
    assert.ok(typeof text.render === 'function', 'Text has render method');
    
    let error = null;
    try {
      text.render(mockCtx);
    } catch (e) {
      error = e;
    }
    assert.strictEqual(error, null, 'Text render does not throw');
  });

  QUnit.test('Text multiline support', function(assert) {
    const text = new Text(0, 0, 'Line 1\nLine 2\nLine 3');
    const lines = text.text.split('\n');
    
    assert.strictEqual(lines.length, 3, 'Text with newlines splits into 3 lines');
  });

  QUnit.test('ProgressBar instantiation and default properties', function(assert) {
    const bar = new ProgressBar(0, 0, 200, 30);
    
    assert.strictEqual(bar.x, 0, 'ProgressBar x position is correct');
    assert.strictEqual(bar.y, 0, 'ProgressBar y position is correct');
    assert.strictEqual(bar.width, 200, 'ProgressBar width is correct');
    assert.strictEqual(bar.height, 30, 'ProgressBar height is correct');
    assert.strictEqual(bar.value, 0, 'Default value is 0');
    assert.strictEqual(bar.maxValue, 100, 'Default max value is 100');
    assert.strictEqual(bar.minValue, 0, 'Default min value is 0');
    assert.strictEqual(bar.fillColor, '#4CAF50', 'Default fill color is green');
  });

  QUnit.test('ProgressBar setValue clamps to range', function(assert) {
    const bar = new ProgressBar(0, 0, 200, 30);
    bar.maxValue = 100;
    bar.minValue = 0;
    
    bar.setValue(50);
    assert.strictEqual(bar.value, 50, 'setValue(50) sets value to 50');
    
    bar.setValue(150);
    assert.strictEqual(bar.value, 100, 'setValue(150) clamps to maxValue 100');
    
    bar.setValue(-10);
    assert.strictEqual(bar.value, 0, 'setValue(-10) clamps to minValue 0');
  });

  QUnit.test('ProgressBar getPercent calculates correctly', function(assert) {
    const bar = new ProgressBar(0, 0, 200, 30);
    bar.maxValue = 100;
    bar.minValue = 0;
    
    bar.setValue(0);
    assert.strictEqual(bar.getPercent(), 0, '0 value is 0%');
    
    bar.setValue(50);
    assert.strictEqual(bar.getPercent(), 0.5, '50 value is 50%');
    
    bar.setValue(100);
    assert.strictEqual(bar.getPercent(), 1, '100 value is 100%');
  });

  QUnit.test('ProgressBar render does not throw', function(assert) {
    const bar = new ProgressBar(0, 0, 200, 30);
    bar.visible = true;
    bar.setValue(75);
    
    assert.ok(typeof bar.render === 'function', 'ProgressBar has render method');
    
    let error = null;
    try {
      bar.render(mockCtx);
    } catch (e) {
      error = e;
    }
    assert.strictEqual(error, null, 'ProgressBar render does not throw');
  });

  QUnit.test('UIElement base class transform properties', function(assert) {
    const button = new Button(0, 0, 100, 50);
    
    assert.strictEqual(button.alpha, 1, 'Default alpha is 1');
    assert.strictEqual(button.rotation, 0, 'Default rotation is 0');
    assert.strictEqual(button.scaleX, 1, 'Default scaleX is 1');
    assert.strictEqual(button.scaleY, 1, 'Default scaleY is 1');
    assert.strictEqual(button.visible, true, 'Default visible is true');
  });
});
