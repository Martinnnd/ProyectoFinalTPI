import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "mapbox.spec.ts",
  workers: 1,
  timeout: 90000,
  use: {
    baseURL: "http://localhost:3102",
    channel: "chrome",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next start -p 3102",
    url: "http://localhost:3102",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
