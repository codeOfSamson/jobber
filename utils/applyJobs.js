const fs = require("fs");
const { sleep, randomDelay } = require("./timing");

async function applyToJobLinks(
  jobLinks,
  context,
  page,
  APPLIED_LOG,
  FAILED_LOG
) {
  for (const jobUrl of jobLinks) {
    try {
      await page.goto(jobUrl);
      await page.waitForLoadState("networkidle");
      sleep(5000);

      console.log(`📝 Visiting: ${jobUrl}`);
      await randomDelay();

      // Find the "Apply Now" link reliably
      const applyLinks = page.locator(
        'a[href^="/apply-for-job"]:has-text("Apply Now"):visible'
      );

      const count = await applyLinks.count();

      console.log("count", count);

      if (count === 0) {
        console.log(
          `⚠️ No Apply button found: ${jobUrl}， or you've already applied.`
        );
        fs.appendFileSync(FAILED_LOG, jobUrl + "\n");
        continue;
      }

      // Pick one — e.g., the second one (index 1), or first if unsure
      const applyLink = applyLinks.nth(1); // adjust index as needed
      // Scroll it into view, if needed
      await applyLink.scrollIntoViewIfNeeded();
      await randomDelay();

      // Set up listener BEFORE clicking
      const [applyPage] = await Promise.all([
        context.waitForEvent("page", { timeout: 15000 }),
        applyLink.click(), // This should open the new tab
      ]);

      await applyPage.waitForLoadState("domcontentloaded");
      console.log("🆕 New apply tab opened");
      await randomDelay();

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
}

module.exports = {
  applyToJobLinks,
};
