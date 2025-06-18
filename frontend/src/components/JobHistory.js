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
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Search, Clear } from "@mui/icons-material";

const JobHistory = () => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:3001/api/jobs/history");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch job history");
      }

      setHistory(data.history || []);
      setFilteredHistory(data.history || []);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError(err.message || "Failed to load job history");
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

  // Apply filters whenever filter states change
  useEffect(() => {
    let filtered = [...history];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const jobDate = new Date();

      switch (dateFilter) {
        case "today":
          filtered = filtered.filter((job) => {
            jobDate.setTime(new Date(job.timestamp).getTime());
            return jobDate.toDateString() === now.toDateString();
          });
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter((job) => {
            jobDate.setTime(new Date(job.timestamp).getTime());
            return jobDate >= weekAgo;
          });
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter((job) => {
            jobDate.setTime(new Date(job.timestamp).getTime());
            return jobDate >= monthAgo;
          });
          break;
        default:
          break;
      }
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (job.error &&
            job.error.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredHistory(filtered);
  }, [history, statusFilter, dateFilter, searchTerm]);

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFilter("all");
    setSearchTerm("");
  };

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
        <Typography sx={{ mt: 2 }}>Loading job history...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchHistory} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Job Application History
      </Typography>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="applied">Applied</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateFilter}
                label="Date Range"
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm("")}>
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              variant="outlined"
              onClick={clearFilters}
              fullWidth
              size="small"
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {filteredHistory.length} of {history.length} applications
      </Typography>

      {filteredHistory.length === 0 ? (
        <Alert severity="info">
          {history.length === 0
            ? "No job applications yet. Start a job search to see your history here."
            : "No applications match your current filters."}
        </Alert>
      ) : (
        <List>
          {filteredHistory.map((job, index) => (
            <ListItem
              key={index}
              divider={index !== filteredHistory.length - 1}
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
