import { defineConfig } from "@playwright/test";

const existing = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
  testDir: "./tests",
  testMatch: "music-ranking.spec.ts",
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: existing || "http://localhost:3134",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined,
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: existing
    ? undefined
    : {
        command: "node node_modules/next/dist/bin/next dev -p 3134",
        url: "http://localhost:3134",
        reuseExistingServer: false,
        timeout: 120000,
        env: { NEXT_PUBLIC_MAP_MODE: "2d", NEXT_PUBLIC_API_URL: "http://127.0.0.1:5198" },
      },
});
