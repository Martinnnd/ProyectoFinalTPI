import { defineConfig } from "@playwright/test";

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
export default defineConfig({
  testDir: "./tests",
  testMatch: "treasure.spec.ts",
  workers: 1,
  timeout: 60000,
  expect: { timeout: 20000 },
  use: {
    baseURL: "http://localhost:3161",
    headless: true,
    launchOptions: {
      executablePath,
      args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next dev -p 3161",
    url: "http://localhost:3161",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_MAP_MODE: "auto",
      NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: "pk.treasure-browser-test",
      NEXT_PUBLIC_API_URL: "http://localhost:5198",
    },
  },
});
