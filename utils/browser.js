const { chromium } = require("playwright");

async function launchBrowser() {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  });

  const page = await context.newPage();

  return { browser, context, page };
}

module.exports = {
  launchBrowser,
};
