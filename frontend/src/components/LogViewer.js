import React, { useEffect, useState, useRef } from "react";
import { Box, Paper, Typography } from "@mui/material";

const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const wsRef = useRef(null);
  const logEndRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    wsRef.current = new WebSocket("ws://localhost:3001");

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "log") {
        setLogs((prevLogs) => [...prevLogs, data.data]);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        height: "400px",
        overflow: "auto",
        backgroundColor: "#1e1e1e",
        color: "#fff",
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: "#fff" }}>
        Backend Logs
      </Typography>
      <Box sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
        {logs.map((log, index) => (
          <div
            key={index}
            style={{
              color: log.startsWith("ERROR:") ? "#ff6b6b" : "#fff",
              marginBottom: "4px",
            }}
          >
            {log}
          </div>
        ))}
        <div ref={logEndRef} />
      </Box>
    </Paper>
  );
};

export default LogViewer;
