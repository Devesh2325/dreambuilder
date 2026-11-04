import { defineConfig, devices } from '@playwright/test';

const APP_PORT = 5199;
const HOST_PORT = 5198;

// Runs the real app in the browser with the local backend, so no Supabase project is
// needed. The embed tests run on a second origin, like a customer's site would.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: true,
  reporter: 'list',
  outputDir: 'test-results',
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `npx vite --port ${APP_PORT} --strictPort`,
      url: `http://localhost:${APP_PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { VITE_BACKEND: 'local' },
    },
    {
      command: `node e2e/host-server.mjs ${HOST_PORT}`,
      url: `http://localhost:${HOST_PORT}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
