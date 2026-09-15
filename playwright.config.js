const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./test/e2e",
  use: { baseURL: "http://127.0.0.1:4174", browserName: "chromium" },
  reporter: "list",
  webServer: {
    command: "node build/serve.js",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
  },
});
