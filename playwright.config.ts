import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "demo.spec.ts",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3101",
    channel: "chrome",
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
