import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "hashtags.spec.ts",
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3103",
    channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next start -p 3103",
    url: "http://localhost:3103",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
