const { autoApply } = require("../services/jobService");
const path = require("path");
const fs = require("fs").promises;

async function startJobSearch(req, res) {
  try {
    const { username, password, jobTitle, pageCount, email } = req.body;
    const resumeFile = req.file;

    if (!resumeFile) {
      return res.status(400).json({ error: "Resume file is required" });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, "../uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Move the uploaded file to the uploads directory
    const resumePath = path.join(uploadsDir, resumeFile.originalname);
    await fs.rename(resumeFile.path, resumePath);

    console.log("Starting job search with parameters:", {
      username,
      jobTitle,
      pageCount,
      resumePath,
      email,
    });

    const result = await autoApply(
      username,
      password,
      jobTitle,
      pageCount,
      resumePath,
      email
    );

    res.json({
      success: true,
      message: "Job search completed",
      results: result,
    });
  } catch (error) {
    console.error("Error in startJobSearch:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

async function getJobHistory(req, res) {
  try {
    const appliedLogPath = path.join(__dirname, "../applied_jobs.txt");
    const failedLogPath = path.join(__dirname, "../failed_jobs.txt");

    // Read both log files
    const [appliedJobs, failedJobs] = await Promise.all([
      fs.readFile(appliedLogPath, "utf8").catch(() => ""),
      fs.readFile(failedLogPath, "utf8").catch(() => ""),
    ]);

    // Parse the logs
    const applied = appliedJobs
      .split("\n")
      .filter(Boolean)
      .map((job) => ({
        url: job,
        status: "applied",
        timestamp: new Date().toISOString(),
      }));

    const failed = failedJobs
      .split("\n")
      .filter(Boolean)
      .map((job) => {
        const [url, error] = job.split(" - ");
        return {
          url,
          status: "failed",
          error: error || "Unknown error",
          timestamp: new Date().toISOString(),
        };
      });

    res.json({
      success: true,
      history: [...applied, ...failed].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      ),
    });
  } catch (error) {
    console.error("Error in getJobHistory:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

module.exports = {
  startJobSearch,
  getJobHistory,
};
