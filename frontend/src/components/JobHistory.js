import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  CircularProgress,
} from "@mui/material";

const JobHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/jobs/history");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch job history");
      }

      setHistory(data.history);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // Refresh history every 30 seconds
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "applied":
        return "success";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Job Application History
      </Typography>
      {history.length === 0 ? (
        <Typography>No job applications yet</Typography>
      ) : (
        <List>
          {history.map((job, index) => (
            <ListItem
              key={index}
              divider={index !== history.length - 1}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Chip
                  label={job.status}
                  color={getStatusColor(job.status)}
                  size="small"
                />
                <Typography variant="caption" color="text.secondary">
                  {new Date(job.timestamp).toLocaleString()}
                </Typography>
              </Box>
              <ListItemText
                primary={
                  <Typography
                    component="a"
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: "primary.main", textDecoration: "none" }}
                  >
                    {job.url}
                  </Typography>
                }
                secondary={job.error}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default JobHistory;
