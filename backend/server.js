const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { autoApply } = require("./services/jobService");
const { WebSocketServer, WebSocket } = require("ws");
const http = require("http");
const jobRoutes = require("./routes/jobRoutes");

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Store connected clients
const clients = new Set();

// WebSocket connection handler
wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("Client connected");

  ws.on("close", () => {
    clients.delete(ws);
    console.log("Client disconnected");
  });
});

// Broadcast function to send logs to all connected clients
function broadcastLog(log) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "log", data: log }));
    }
  });
}

// Override console.log to broadcast logs
const originalConsoleLog = console.log;
console.log = function (...args) {
  originalConsoleLog.apply(console, args);
  broadcastLog(args.join(" "));
};

const originalConsoleError = console.error;
console.error = function (...args) {
  originalConsoleError.apply(console, args);
  broadcastLog(`ERROR: ${args.join(" ")}`);
};

const port = process.env.PORT || 3001;

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, "resume" + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.mimetype === "text/plain") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and TXT files are allowed"));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/jobs", jobRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Job search endpoint
app.post("/api/search", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No resume file uploaded" });
    }

    const { username, password, searchTerms, pageCount, email } = req.body;

    if (!username || !password || !searchTerms || !pageCount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Start the job search process
    const result = await autoApply(
      username,
      password,
      searchTerms,
      parseInt(pageCount),
      req.file.path,
      email
    );

    res.json(result);
  } catch (error) {
    console.error("Error in job search:", error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message,
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
