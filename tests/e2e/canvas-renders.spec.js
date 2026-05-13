const { test, expect } = require('@playwright/test');

test.describe('Canvas Rendering Tests', () => {
  test('canvas element exists and is visible', async ({ page }) => {
    await page.goto('/');

    // Wait for game container
    await page.waitForSelector('#game-container', { state: 'visible', timeout: 10000 });

    // Check canvas exists
    const canvas = page.locator('#gameCanvas');
    await expect(canvas).toBeVisible();

    // Verify canvas dimensions
    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });
});
