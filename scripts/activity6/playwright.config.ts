import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'controlled.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180000,
  reporter: [['json', { outputFile: '../../' + (process.env.ACTIVITY6_OUT || 'docs/evidence/actividad6-rendimiento') + '/controlled-playwright.json' }]],
  outputDir: '../../tmp/activity6-controlled-output',
  use: {
    ...devices['Pixel 7'],
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:4173',
    serviceWorkers: 'block',
    trace: 'off',
  },
  webServer: { command: 'node scripts/serve-test-web.mjs', cwd: '../..', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
});
