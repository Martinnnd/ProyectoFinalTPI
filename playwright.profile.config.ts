import { defineConfig } from '@playwright/test';
import base from './playwright.config';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
export default defineConfig({
  ...base,
  testMatch: ['profile-real.spec.ts', 'ratings-real.spec.ts'],
  use: {
    ...base.use,
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
    channel: executablePath ? undefined : base.use?.channel,
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  webServer: undefined,
});
