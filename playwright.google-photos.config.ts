import { defineConfig } from '@playwright/test';

const existingServer = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
  testDir: './tests', testMatch: 'google-photos.spec.ts', workers: 1, timeout: 60000,
  use: { baseURL: existingServer ?? 'http://localhost:3110', channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chromium', headless: true, screenshot: 'only-on-failure' },
  webServer: existingServer ? undefined : {
    command: 'node node_modules/next/dist/bin/next dev -p 3110',
    url: 'http://localhost:3110', reuseExistingServer: true, timeout: 120000,
    env: { NEXT_PUBLIC_MAP_MODE: '2d', NEXT_PUBLIC_API_URL: 'http://localhost:5000' },
  },
});
