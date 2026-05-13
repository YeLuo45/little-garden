const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './',
  timeout: 30000,
  retries: 1,
  headless: true,
  viewport: {
    width: 720,
    height: 1280,
  },
  baseURL: 'https://yeluo45.github.io/little-garden/',
  use: {
    baseURL: 'https://yeluo45.github.io/little-garden/',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
