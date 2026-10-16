import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  reporter: [['list'], ['html', { outputFolder: 'reports/browser', open: 'never' }], ['junit', { outputFile: 'reports/browser.xml' }]],
  use: {
    ...devices['Pixel 7'],
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block',
  },
  webServer: { command: 'node scripts/serve-test-web.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
});
