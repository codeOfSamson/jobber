require('dotenv').config();
const { chromium } = require('playwright');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(min = 500, max = 2000) {
  return sleep(Math.floor(Math.random() * (max - min) + min));
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  });

  const page = await context.newPage();

  // 1. Login
  await page.goto('https://www.cakeresume.com/login');

  try {
    await page.waitForSelector('button[aria-label="Close Message"]', { timeout: 7000 });
    await page.click('button[aria-label="Close Message"]');
    console.log('Modal closed');
  } catch (e) {
    console.log('Modal not found, continuing...');
  }

 
//   await page.locator('a[href="/users/sign-in"]').first().waitFor({ state: 'visible' });
//   await page.locator('a[href="/users/sign-in"]').first().click();
  await page.locator('a.Button_buttonSubGreen__3PowK', { hasText: '登入' }).nth(1).click();

    console.log('Sign In Clicked Biiitch');





  await page.fill('input[name="email"]', process.env.CAKERESUME_EMAIL);
  await page.fill('input[name="password"]', process.env.CAKERESUME_PASSWORD);
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]'),
  ]);
  console.log('✅ Logged in');
  await randomDelay();

  // 2. Go to search page
  await page.goto('https://www.cakeresume.com/jobs?query=Software%20Developer');
//  await page.waitForSelector('.job-item');
  await randomDelay();

  // Scroll to load more jobs
  await page.mouse.wheel(0, 3000);
  await sleep(2000);

  const jobLinks = await page.$$eval('a[class^="JobSearchItem_jobTitle__"]', links =>
    links.map(link => 
      link.href.startsWith('/companies') 
        ? link.href 
        : `https://www.cakeresume.com${link.getAttribute('href')}`
    )
  );

  console.log(`🔍 Found ${jobLinks.length} job links`);

  for (const jobUrl of jobLinks) {
    try {
      await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
      console.log(`📝 Visiting: ${jobUrl}`);
      await randomDelay();

      // Look for Apply button
      const applyButton = await page.$('button:has-text("Apply")');
      if (applyButton) {
        await applyButton.scrollIntoViewIfNeeded();
        await randomDelay();
        await applyButton.click();
        console.log('🖱️ Clicked Apply');
        await sleep(1500);

        // Look for confirmation or submit button
        const confirm = await page.$('button:has-text("Submit")') || await page.$('button:has-text("Apply")');
        if (confirm) {
          await confirm.scrollIntoViewIfNeeded();
          await randomDelay();
          await confirm.click();
          console.log(`✅ Applied to ${jobUrl}`);
        } else {
          console.log(`❌ Could not confirm submission on ${jobUrl}`);
        }
      } else {
        console.log(`⚠️ No quick apply available for ${jobUrl}`);
      }

      await randomDelay(2000, 4000); // Wait longer before next job
    } catch (err) {
      console.log(`❌ Error applying to ${jobUrl}:`, err);
    }
  }

  await browser.close();
})();
