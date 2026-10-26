import { defineConfig } from '@playwright/test';
import base from './playwright.config';

const existingServer = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
  ...base,
  testMatch: ['navigation-cache.spec.ts', 'feed-prefetch.spec.ts'],
  use: { ...base.use, ...(existingServer ? { baseURL: existingServer } : {}) },
  webServer: existingServer ? undefined : base.webServer ? { ...base.webServer, reuseExistingServer: true } : undefined,
});
