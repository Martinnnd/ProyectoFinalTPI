import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'groups.spec.ts',
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3107',
    channel: 'chrome',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'node node_modules/next/dist/bin/next dev -p 3107',
    url: 'http://localhost:3107',
    reuseExistingServer: false,
    timeout: 120_000,
    env: { NEXT_PUBLIC_MAP_MODE: '2d' },
  },
});
