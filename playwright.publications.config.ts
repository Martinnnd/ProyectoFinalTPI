import { defineConfig } from '@playwright/test';
import base from './playwright.config';

const existingServer = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
  ...base,
  testMatch: ['publications.spec.ts', 'feed.spec.ts'],
  use: { ...base.use, ...(existingServer ? { baseURL: existingServer } : {}) },
  webServer: existingServer ? undefined : base.webServer,
});
