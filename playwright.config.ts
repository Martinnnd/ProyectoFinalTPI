import { defineConfig } from "@playwright/test";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
export default defineConfig({
  testDir: "./tests",
  testMatch: "demo.spec.ts",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3101",
    channel: executablePath ? undefined : "chrome",
    launchOptions: executablePath ? { executablePath } : undefined,
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next dev -p 3101",
    url: "http://localhost:3101",
    reuseExistingServer: false,
    timeout: 120000,
    env: { NEXT_PUBLIC_MAP_MODE: "2d" },
  },
});
