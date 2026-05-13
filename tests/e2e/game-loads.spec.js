const { test, expect } = require('@playwright/test');

test.describe('Game Loading Tests', () => {
  test('page loads without crash and console has no errors', async ({ page }) => {
    const errors = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', err => {
      errors.push(err.message);
    });

    // Navigate to the page
    await page.goto('/');

    // Wait for loading screen to disappear and game container to appear
    await page.waitForSelector('#game-container', { state: 'visible', timeout: 10000 });

    // Wait a bit for game to initialize
    await page.waitForTimeout(1500);

    // Verify no errors occurred
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });
});
