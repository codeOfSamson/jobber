const fs = require("fs");
const ollama = require("ollama-node");
console.log(Object.keys(ollama));
const questions = [
  "On a scale from 1 to 10, how familiar are you with multi-threading?",
  "Explain your experience with REST APIs.",
];

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
    const response = await ollama.generate({
      model: "llama3", // or any other local model you have
      messages: [{ role: "user", content: fullPrompt }],
      stream: false,
    });

    return response.response;
  } catch (err) {
    console.error("❌ Error answering screening questions:", err);
    return null;
  }
}
async function runTest() {
  const aiAnswers = await answerScreeningQuestions(questions);
  console.log("📄 AI Screening Answers:\n", aiAnswers);
  return aiAnswers;
}
runTest();

module.exports = {
  answerScreeningQuestions,
};
