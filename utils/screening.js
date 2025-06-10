const fs = require("fs");
const axios = require("axios");

const OLLAMA_API = "http://localhost:11434/api/generate";

const resumeText = fs.readFileSync("resume.txt", "utf-8");

async function answerScreeningQuestions(questions = []) {
  const promptIntro = `
You are a job applicant answering screening questions for a technical job. Answer truthfully and professionally, using the resume below:

Resume:
${resumeText}

Now, answer the following screening questions:
`;

  const fullPrompt =
    promptIntro + questions.map((q, i) => `${i + 1}. ${q}`).join("\n");

  try {
    const response = await axios.post(OLLAMA_API, {
      model: "llama3:latest",
      prompt: fullPrompt,
      stream: false,
    });
    console.log("aiRES", response.data);
    return response.data.response;
  } catch (err) {
    console.error("❌ Error answering screening questions:", err);
    return null;
  }
}

// async function runTest() {
//   const aiAnswers = await answerScreeningQuestions(questions);
//   console.log("📄 AI Screening Answers:\n", aiAnswers);
//   return aiAnswers;
// }

// runTest();

module.exports = {
  answerScreeningQuestions,
};
