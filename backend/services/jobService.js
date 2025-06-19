const { launchBrowser } = require("../utils/browser");
const { collectJobLinks } = require("../utils/collector");
const { applyToJobLinks } = require("../utils/applyJobs");
const { login } = require("../utils/login");
const { processResume } = require("./resumeService");
const nodemailer = require("nodemailer");
const path = require("path");

async function autoApply(
  username,
  password,
  jobTitle,
  pageCount,
  resumePath,
  email
) {
  console.log("Starting autoApply with parameters:", {
    username,
    jobTitle,
    pageCount,
    resumePath,
    email,
  });

  const APPLIED_LOG = path.resolve(__dirname, "../applied_jobs.txt");
  const FAILED_LOG = path.resolve(__dirname, "../failed_jobs.txt");

  console.log(`\n🧠 Starting search: "${jobTitle}" across ${pageCount} pages`);

  // Process the resume file
  const processedResumePath = await processResume(resumePath);
  console.log("Resume processed:", processedResumePath);

  const { browser, context, page } = await launchBrowser();
  console.log("Browser launched successfully");

  try {
    await login(page, username, password);
    console.log("Login successful");

    const jobLinks = await collectJobLinks(page, jobTitle, parseInt(pageCount));

    const result = await applyToJobLinks(
      jobLinks,
      context,
      page,
      APPLIED_LOG,
      FAILED_LOG
    );
    console.log("Job application process completed");

    return result;
  } catch (error) {
    console.error("Error in autoApply:", error);
    throw error;
  } finally {
    await browser.close();
    console.log("Browser closed");
  }
}

module.exports = {
  autoApply,
};
