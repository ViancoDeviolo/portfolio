import { defineConfig, devices } from '@playwright/test';

// O tsconfig não carrega os tipos do Node; o cast lê process.env.CI sem trazê-los para o projeto todo.
export default defineConfig({
  testDir: 'tests/e2e',
  webServer: { command: 'npm run preview -- --port 4321', url: 'http://localhost:4321', reuseExistingServer: !(globalThis as { process?: { env: { CI?: string } } }).process?.env.CI },
  use: { baseURL: 'http://localhost:4321' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
