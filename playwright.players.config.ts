import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'players-*.spec.ts',workers:1,timeout:60000,use:{baseURL:'http://localhost:3001',channel:'chrome',headless:true},webServer:{command:'npm run dev',url:'http://localhost:3001',reuseExistingServer:true,timeout:120000}});
