import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

// Only this test-owned server is used; never reuse the student's open board.
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.local/browsers');
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  retries: 0,
  timeout: 45_000,
  outputDir: process.env.ASSURANCE_ARTIFACTS ?? '.local/browser-results',
  reporter: [['list'], ['json', { outputFile: `${process.env.ASSURANCE_ARTIFACTS ?? '.local/browser-results'}/results.json` }]],
  use: { baseURL: 'http://127.0.0.1:5091', browserName: 'chromium', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: {
    command: 'dotnet bin/Debug/net10.0/StudentLab.dll --urls http://127.0.0.1:5091',
    cwd: './src/StudentLab',
    url: 'http://127.0.0.1:5091/api/health',
    reuseExistingServer: false,
    timeout: 30_000,
    env: { ASPNETCORE_ENVIRONMENT: 'Production' },
  },
});
