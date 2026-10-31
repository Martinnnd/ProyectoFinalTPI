import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testMatch: ["media-optional-real.spec.ts", "publications.spec.ts"],
  use: { ...base.use, baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001" },
  webServer: undefined,
});
