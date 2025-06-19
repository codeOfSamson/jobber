const fs = require("fs").promises;
const path = require("path");
const { sleep, randomDelay } = require("./timing");
const { answerScreeningQuestions } = require("./screening");
const { sendSkippedJobsEmail } = require("./email");
const skippedScreeningLinks = [];
const useAI = process.env.USE_AI === "true";

async function applyToJobLinks(
  jobLinks,
  context,
  page,
  APPLIED_LOG,
  FAILED_LOG
) {
  const results = {
    applied: 0,
    failed: 0,
    errors: [],
  };

  for (const jobUrl of jobLinks) {
    let jobUpdatedText = "N/A";
    let employerActiveText = "N/A";
    try {
      await page.goto(jobUrl, { timeout: 60000 });
      await page.waitForLoadState("domcontentloaded", { timeout: 60000 });
      sleep(5000);

      console.log(`📝 Visiting: ${jobUrl}`);
      await randomDelay();

      // Find the "Apply Now" link reliably
      const applyLinks = page.locator(
        'a[href^="/apply-for-job"]:has-text("Apply Now"):visible'
      );

      const count = await applyLinks.count();

      try {
        const jobUpdatedElement = page.locator(
          'div[class*="InlineMessage_label"]:has-text("Job updated")'
        );
        const employerActiveElement = page.locator(
          'div[class*="InlineMessage_label"]:has-text("Employer was active")'
        );

        jobUpdatedText =
          (await jobUpdatedElement.first().textContent()) ||
          "Job update info not found";
        employerActiveText =
          (await employerActiveElement.first().textContent()) ||
          "Employer activity info not found";

        console.log("📅", jobUpdatedText);
        console.log("🧑‍💼", employerActiveText);
      } catch (err) {
        console.error("❌ Failed to scrape update/active info:", err);
      }

      let applyLink = null;

      if (count > 0) {
        // Prefer the second button, fallback to first if only one
        applyLink = applyLinks.nth(1);
        console.log("✅ Found Apply Now button.");
      } else {
        // Try finding a "Reapply" link instead
        const reapplyLinks = page.locator(
          'span:has-text("You have applied for this position") >> a[href^="/apply-for-job"]:has-text("Reapply")'
        );
        const reapplyCount = await reapplyLinks.count();

        if (reapplyCount > 0) {
          applyLink = reapplyLinks.nth(1);
          console.log("♻️ Found Reapply link.");
        } else {
          console.log(`⚠️ No Apply or Reapply link found: ${jobUrl}`);
          await fs.appendFile(FAILED_LOG, jobUrl + "\n");
          continue;
        }
      }

      // Pick one — e.g., the second one (index 1), or first if unsure
      //const applyLink = applyLinks.nth(1); // adjust index as needed
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
        console.log("clicked upload pdf");

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

      // Find the "Screening Questions" inputs reliably
      try {
        const screeningSection = await applyPage.$(
          '[class*="JobApplicationForm_questions"]'
        );

        if (screeningSection) {
          if (!useAI) {
            console.log("⚠️ Skipping job with screening questions");
            skippedScreeningLinks.push(jobUrl);
            return;
          }

          const questionBlocks = await applyPage.$$(
            '[class*="JobApplicationForm_question__"]'
          );
          const questions = [];

          for (const block of questionBlocks) {
            // Extract the question text
            const questionText = await block.$eval(
              ".JobApplicationForm_questionDescription__Gob75",
              (el) => el.innerText.trim()
            );
            questions.push(questionText);
          }

          console.log("🧠 Screening Question:", questions);

          const aiResponse = await answerScreeningQuestions(questions);
          if (!aiResponse) {
            console.warn("⚠️ AI failed, falling back to manual review.");
            skippedScreeningLinks.push(jobUrl);
            throw new Error("AI failed to return response");
          }
          const answers = aiResponse
            .split(/\n(?=\d+\.\s)/) // Split on newlines before "1. ", "2. ", etc.
            .map((ans) => ans.replace(/^\d+\.\s*/, "").trim()); // Remove "1. ", "2. ", etc.\
          console.log("🧠 Screening Answers:", answers);

          for (let i = 0; i < questionBlocks.length; i++) {
            const input = await questionBlocks[i].$("textarea, input");
            if (input && answers[i]) {
              await applyPage.waitForTimeout(2000);
              await input.fill(answers[i]);
              await applyPage.waitForTimeout(2000);
            }
          }
          console.log("✅ Screening questions filled.");
        } else {
          console.log("✅ No screening questions detected.");
        }
      } catch (err) {
        console.error("❌ Error in screening questions block:", err);
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
      await fs.appendFile(
        APPLIED_LOG,
        `${jobUrl}\n${jobUpdatedText}\n${employerActiveText}\n\n`
      );

      await randomDelay(2000, 4000);
    } catch (err) {
      console.error(`❌ Navigation or scraping failed for ${jobUrl}:`, err);
      await fs.appendFile(
        FAILED_LOG,
        `${jobUrl} - ${
          err?.message || "Unknown error"
        }\n${jobUpdatedText}\n${employerActiveText}\n\n`
      );
      continue;
    }
  }

  //sends email of jobUrl with screening questions or manual finish when ai not available
  if (skippedScreeningLinks.length > 0) {
    try {
      await sendSkippedJobsEmail(skippedScreeningLinks);
    } catch (error) {
      console.error("❌ Failed to send email:", error);
    }
  }

  return results;
}

module.exports = {
  applyToJobLinks,
};
