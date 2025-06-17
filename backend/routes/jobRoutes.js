const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { startJobSearch } = require("../controllers/jobController");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only PDF files
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Route for starting job search with resume upload
router.post("/search", upload.single("resume"), startJobSearch);

module.exports = router;
