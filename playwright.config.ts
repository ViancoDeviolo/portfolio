import { defineConfig, devices } from '@playwright/test';

// O tsconfig não carrega os tipos do Node; o cast lê process.env.CI sem trazê-los para o projeto todo.
const CI = (globalThis as { process?: { env: { CI?: string } } }).process?.env.CI;

export default defineConfig({
  testDir: 'tests/e2e',
  retries: CI ? 1 : 0,
  webServer: { command: 'npm run preview -- --port 4321', url: 'http://localhost:4321', reuseExistingServer: !CI },
  use: { baseURL: 'http://localhost:4321' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // WebGL por software, como o Chromium já faz: o Firefox headless do runner da CI não tem WebGL2 sem isso.
    { name: 'firefox', use: { ...devices['Desktop Firefox'], launchOptions: { firefoxUserPrefs: { 'webgl.force-enabled': true } } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    // Sem WebGL: a cena 3D não monta e o globo estático fica (tests/e2e/motion.spec.ts).
    { name: 'no-webgl', testMatch: /motion\.spec\.ts/, use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--disable-3d-apis'] } } },
  ],
});
