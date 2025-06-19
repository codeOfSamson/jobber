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
    const [appliedJobsRaw, failedJobsRaw] = await Promise.all([
      fs.readFile(appliedLogPath, "utf8").catch(() => ""),
      fs.readFile(failedLogPath, "utf8").catch(() => ""),
    ]);

    // Helper to parse log lines with metadata
    function parseLogWithMetadata(lines, status) {
      const jobs = [];
      let jobUpdated = null;
      let employerActive = null;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        if (line.startsWith("Job updated ")) {
          jobUpdated = line;
        } else if (line.startsWith("The employer was active")) {
          employerActive = line;
        } else if (line.startsWith("http")) {
          let url = line;
          let error = undefined;
          // For failed jobs, error is after ' - '
          if (status === "failed" && url.includes(" - ")) {
            [url, error] = url.split(" - ");
          }
          jobs.push({
            url,
            status,
            error,
            jobUpdated,
            employerActive,
            timestamp: new Date().toISOString(),
          });
          jobUpdated = null;
          employerActive = null;
        }
      }
      return jobs;
    }

    // Parse applied and failed jobs
    const applied = parseLogWithMetadata(appliedJobsRaw.split("\n"), "applied");
    const failed = parseLogWithMetadata(failedJobsRaw.split("\n"), "failed");

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
