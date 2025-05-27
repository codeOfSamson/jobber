require("dotenv").config();
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const RESUME_PATH = path.resolve(__dirname, "TechRes@25.pdf");
const APPLIED_LOG = path.resolve(__dirname, "applied_jobs.txt");
const FAILED_LOG = path.resolve(__dirname, "failed_jobs.txt");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min = 500, max = 2000) {
  return sleep(Math.floor(Math.random() * (max - min) + min));
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  });

  const page = await context.newPage();

  // 1. Login
  await page.goto("https://www.cakeresume.com/login");

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

  await page.fill('input[name="email"]', process.env.CAKERESUME_EMAIL);
  await page.fill('input[name="password"]', process.env.CAKERESUME_PASSWORD);
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]'),
  ]);
  console.log("✅ Logged in");
  await randomDelay();

  // 2. Go to search page
  await page.goto("https://www.cakeresume.com/jobs?query=Software%20Engineer");
  await randomDelay();

  await page.mouse.wheel(0, 3000);
  await sleep(2000);

  const jobLinks = await page.$$eval(
    'a[class^="JobSearchItem_jobTitle__"]',
    (links) =>
      links.map((link) =>
        link.href.startsWith("/companies")
          ? link.href
          : `https://www.cakeresume.com${link.getAttribute("href")}`
      )
  );

  console.log(`🔍 Found ${jobLinks.length} job links`);

  for (const jobUrl of jobLinks) {
    try {
      await page.goto(jobUrl);
      console.log(`📝 Visiting: ${jobUrl}`);
      await randomDelay();
      await sleep(6000);

      // Scroll and click on the real apply button that opens a new tab
      const [newPagePromise] = await Promise.all([
        context.waitForEvent("page"),
        page.evaluate(() => {
          const link = Array.from(document.querySelectorAll("a")).find(
            (el) =>
              el.href.includes("/apply-for-job") &&
              el.textContent.trim() === "Apply Now"
          );
          if (link) {
            link.scrollIntoView({ behavior: "smooth", block: "center" });
            link.click();
          }
        }),
      ]);

      const applyPage = await newPagePromise;
      await sleep(7000);
      console.log("🆕 New apply tab opened");

      try {
        // Step 1: Click “Upload PDF”
        const uploadButton = applyPage
          .locator("div.JobApplicationForm_resumeTypeOption__b_UdE")
          .filter({ hasText: "Upload PDF" });

        await uploadButton.waitFor({ state: "visible" });
        await uploadButton.click();
        await randomDelay();
        console.log("clecked upload pdf");

        // Step 2: Click the dropdown to select uploaded PDF
        // const dropdownButton = applyPage.locator(
        //   'button:has-text("Select an uploaded PDF")'
        // );

        const dropdownButton = applyPage.locator(
          'button[class*="SelectButton_selectButton"][type="button"]'
        );
        await dropdownButton.click();
        console.log("clicked select uploaded");
        await sleep(3000);

        // Step 3: Click the first radio button for uploaded resume
        const firstResumeOption = applyPage
          .locator(".ReusablePdfSelectModal_name__qw_Hd")
          .first();
        await firstResumeOption.click();
        await sleep(2000);

        // Step 4: Click the Done button
        const doneButton = applyPage.locator('button:has-text("Done")');
        await doneButton.click();
        await randomDelay();

        console.log("✅ Selected uploaded resume successfully");
      } catch (err) {
        console.log("❌ Error selecting uploaded Resume:", err);
      }

      try {
        // Step 4: Click “My Template”
        const templateButton = applyPage.locator(
          'span:has-text("My Template")'
        );
        await templateButton.scrollIntoViewIfNeeded();
        await templateButton.click();
        await applyPage.waitForTimeout(1000);

        // Step 5: Select first template
        const firstRadio = applyPage
          .locator(".Radio_radioOuter__oddQs")
          .first();
        await firstRadio.click();

        // Step 6: Confirm template
        const confirmBtn = applyPage.locator('span:has-text("Confirm")');
        await confirmBtn.click();
        await applyPage.waitForTimeout(500);
      } catch (err) {
        console.log("❌ Error selecting template:", err);
      }

      try {
        // Step 7: Submit application
        const submitBtn = applyPage.locator(
          'button:has-text("Submit Application")'
        );
        await submitBtn.click();

        // Wait and close tab
        await applyPage.waitForTimeout(2000);
        await applyPage.close();
      } catch (err) {
        console.log("❌ Error Clicking Submit:", err);
      }

      // Step 8: Log applied
      console.log(`✅ Applied to ${jobUrl}`);
      fs.appendFileSync(APPLIED_LOG, jobUrl + "\n");

      await applyPage.close();
      await randomDelay(2000, 4000);
    } catch (err) {
      console.log(`❌ Error applying to ${jobUrl}:`, err);
      fs.appendFileSync(FAILED_LOG, jobUrl + "\n");
    }
  }

  await browser.close();
})();
