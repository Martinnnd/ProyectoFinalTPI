import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "user-search.spec.ts",
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3109",
    channel: "chrome",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next dev -p 3109",
    url: "http://localhost:3109",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { NEXT_PUBLIC_MAP_MODE: "2d" },
  },
});
