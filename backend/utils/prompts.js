const readline = require("readline");

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

module.exports = {
  promptWithTimeout,
};
