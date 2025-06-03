const path = require("path");
const { promptWithTimeout } = require("./utils/prompts");
const { launchBrowser } = require("./utils/browser");
const { collectJobLinks } = require("./utils/collector");
const { applyToJobLinks } = require("./utils/applyJobs");
const { login } = require("./utils/login");

const fallbackSearchTerms = [
  "Software Developer",
  "Software Engineer",
  "軟體工程師",
  "全端",
  "Front End Dev",
  "Backend Dev",
  "Full Stack",
];

async function main() {
  const APPLIED_LOG = path.resolve(__dirname, "applied_jobs.txt");
  const FAILED_LOG = path.resolve(__dirname, "failed_jobs.txt");

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

  const { browser, context, page } = await launchBrowser();

  await login(page);

  const jobLinks = await collectJobLinks(page, jobTitle, parseInt(pageCount));

  await applyToJobLinks(jobLinks, context, page, APPLIED_LOG, FAILED_LOG);

  await browser.close();
}

// Start everything
main().catch((err) => {
  console.error("🔥 Script crashed:", err);
});
