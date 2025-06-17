const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

async function convertPdfToText(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("Error converting PDF to text:", error);
    throw error;
  }
}

async function processResume(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    // Convert PDF to text
    const text = await convertPdfToText(filePath);
    // Save the text version
    const textPath = filePath.replace(".pdf", ".txt");
    fs.writeFileSync(textPath, text);
    return textPath;
  } else if (ext === ".txt") {
    // Already a text file
    return filePath;
  } else {
    throw new Error("Unsupported file format");
  }
}

module.exports = {
  processResume,
};
