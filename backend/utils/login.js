require("dotenv").config();

async function login(page, username, password) {
  await page.goto("https://www.cakeresume.com/login?locale=zh-TW");

  try {
    await page.waitForSelector('button[aria-label="Close Message"]', {
      timeout: 7000,
    });
    await page.click('button[aria-label="Close Message"]');
    console.log("Modal closed");
  } catch (e) {
    console.log("Modal not found, continuing...");
  }

  await page
    .locator("a.Button_buttonSubGreen__3PowK", { hasText: "登入" })
    .nth(1)
    .click();
  console.log("Sign In Clicked");

  await page.fill('input[name="email"]', username);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]'),
  ]);
  console.log("✅ Logged in");
}

module.exports = {
  login,
};
