import { defineConfig } from "@playwright/test";

const existing = process.env.PLAYWRIGHT_BASE_URL;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
export default defineConfig({
  testDir: "./tests",
  testMatch: "decade-game.spec.ts",
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: existing || "http://localhost:3140",
    launchOptions: executablePath ? { executablePath } : undefined,
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: existing
    ? undefined
    : {
        command: "node node_modules/next/dist/bin/next dev -p 3140",
        url: "http://localhost:3140",
        reuseExistingServer: false,
        timeout: 120000,
        env: { NEXT_PUBLIC_MAP_MODE: "2d", NEXT_PUBLIC_API_URL: "http://localhost:5198" },
      },
});
