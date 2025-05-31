require("dotenv").config();
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const readline = require("readline");

const fallbackSearchTerms = [
  "Software Developer",
  "Software Engineer",
  "軟體工程師",
  "全端",
  "Front End Dev",
  "Backend Dev",
  "Full Stack",
];

// Helper to prompt with timeout
function promptWithTimeout(question, timeoutMs, fallbackValue) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const timer = setTimeout(() => {
      console.log(
        `⏰ No input after ${
          timeoutMs / 1000
        }s, using fallback: ${fallbackValue}`
      );
      rl.close();
      resolve(fallbackValue);
    }, timeoutMs);

    rl.question(question, (answer) => {
      clearTimeout(timer);
      rl.close();
      resolve(answer.trim() || fallbackValue);
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min = 500, max = 4000) {
  return sleep(Math.floor(Math.random() * (max - min) + min));
}

async function main() {
  const randomTerm =
    fallbackSearchTerms[Math.floor(Math.random() * fallbackSearchTerms.length)];
  const jobTitle = await promptWithTimeout(
    "🔍 What job title do you want to search for? ",
    8000,
    randomTerm
  );
  const pageCount = await promptWithTimeout(
    "📄 How many pages of results should we scan? ",
    8000,
    "5"
  );
  console.log(`\n🧠 Final search: "${jobTitle}" across ${pageCount} pages`);

  const encodedQuery = encodeURIComponent(jobTitle.trim());
  const pageSearchCount = parseInt(pageCount, 10);

  const APPLIED_LOG = path.resolve(__dirname, "applied_jobs.txt");
  const FAILED_LOG = path.resolve(__dirname, "failed_jobs.txt");

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
  await page.goto(`https://www.cakeresume.com/jobs?query=${encodedQuery}`);
  await randomDelay();

  await page.mouse.wheel(0, 3000);
  await randomDelay();

  const jobLinks = new Set();

  for (let pageNum = 1; pageNum <= pageSearchCount; pageNum++) {
    const url = `https://www.cakeresume.com/jobs?query=${encodedQuery}&page=${pageNum}`;
    console.log(`🌐 Visiting page ${pageNum}: ${url}`);
    await page.goto(url);
    await page.mouse.wheel(0, 3000);
    await sleep(2000); // wait for lazy loading

    const links = await page.$$eval(
      'a[class^="JobSearchItem_jobTitle__"]',
      (anchors) =>
        anchors.map((link) =>
          link.href.startsWith("/companies")
            ? `https://www.cakeresume.com${link.getAttribute("href")}`
            : link.href
        )
    );

    console.log(`🔗 Page ${pageNum}: Found ${links.length} job links`);
    links.forEach((link) => jobLinks.add(link));
  }

  console.log(`✅ Total unique job links collected: ${jobLinks.size}`);

  for (const jobUrl of jobLinks) {
    try {
      await page.goto(jobUrl);
      console.log(`📝 Visiting: ${jobUrl}`);
      await randomDelay();

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
      await randomDelay();
      console.log("🆕 New apply tab opened");

      try {
        const uploadButton = applyPage
          .locator("div.JobApplicationForm_resumeTypeOption__b_UdE")
          .filter({ hasText: "Upload PDF" });

        await uploadButton.waitFor({ state: "visible" });
        await uploadButton.click();
        await randomDelay();
        console.log("clecked upload pdf");

        const dropdownButton = applyPage.locator(
          'button[class*="SelectButton_selectButton"][type="button"]'
        );
        await dropdownButton.click();
        console.log("clicked select uploaded");
        await sleep(3000);

        const firstResumeOption = applyPage
          .locator(".ReusablePdfSelectModal_name__qw_Hd")
          .first();
        await firstResumeOption.click();
        await sleep(2000);

        const doneButton = applyPage.locator('button:has-text("Done")');
        await doneButton.click();
        await randomDelay();

        console.log("✅ Selected uploaded resume successfully");
      } catch (err) {
        console.log("❌ Error selecting uploaded Resume:", err);
      }

      try {
        const templateButton = applyPage.locator(
          'span:has-text("My Template")'
        );
        await templateButton.scrollIntoViewIfNeeded();
        await templateButton.click();
        await applyPage.waitForTimeout(1000);

        const firstRadio = applyPage
          .locator(".Radio_radioOuter__oddQs")
          .first();
        await firstRadio.click();

        const confirmBtn = applyPage.locator('span:has-text("Confirm")');
        await confirmBtn.click();
        await applyPage.waitForTimeout(500);
      } catch (err) {
        console.log("❌ Error selecting template:", err);
      }

      try {
        const submitBtn = applyPage.locator(
          'button:has-text("Submit Application")'
        );
        await submitBtn.click();
        await applyPage.waitForTimeout(2000);
        await applyPage.close();
      } catch (err) {
        console.log("❌ Error Clicking Submit:", err);
      }

      console.log(`✅ Applied to ${jobUrl}`);
      fs.appendFileSync(APPLIED_LOG, jobUrl + "\n");

      await randomDelay(2000, 4000);
    } catch (err) {
      console.log(`❌ Error applying to ${jobUrl}:`, err);
      fs.appendFileSync(FAILED_LOG, jobUrl + "\n");
    }
  }

  await browser.close();
}

// Start everything
main().catch((err) => {
  console.error("🔥 Script crashed:", err);
});
