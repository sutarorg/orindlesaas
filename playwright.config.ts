import { defineConfig, devices } from "@playwright/test";
import sparticuz from "@sparticuz/chromium";

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
sparticuz.setGraphicsMode = false;
const sparticuzArgs = sparticuz.args.filter((argument) => ![
  "--single-process",
  "--no-zygote",
  "--disable-web-security",
  "--allow-running-insecure-content",
  "--disable-site-isolation-trials",
].includes(argument));
const chromiumLaunchOptions = executablePath ? { executablePath, args: sparticuzArgs } : undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["list"], ["html", { outputFolder: "playwright-report", open: "never" }], ["junit", { outputFile: "test-results/playwright-junit.xml" }]]
    : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions: chromiumLaunchOptions } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"], launchOptions: chromiumLaunchOptions } },
    { name: "mobile-safari", use: { ...devices["iPhone 14"] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm start",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
