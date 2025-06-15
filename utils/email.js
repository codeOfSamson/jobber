require("dotenv").config();
const nodemailer = require("nodemailer");

async function sendSkippedJobsEmail(skippedLinks = []) {
  if (!process.env.NOTIFY_EMAIL || !process.env.NOTIFY_PASSWORD) {
    console.warn("📭 Email config missing — skipping email");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NOTIFY_EMAIL,
      pass: process.env.NOTIFY_PASSWORD,
    },
  });

  const message = {
    from: process.env.NOTIFY_EMAIL,
    to: process.env.NOTIFY_EMAIL,
    subject: "Skipped Job Applications (Screening Questions)",
    text: `The following jobs were skipped due to screening questions:\n\n${skippedLinks.join(
      "\n"
    )}`,
  };

  try {
    await transporter.sendMail(message);
    console.log("📧 Email sent with skipped screening question links");
  } catch (err) {
    console.error("❌ Failed to send email:", err);
  }
}

module.exports = { sendSkippedJobsEmail };
