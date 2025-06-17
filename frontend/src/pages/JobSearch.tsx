import React, { useState } from "react";
import {
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import axios from "axios";

const JobSearch = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    searchTerms: "",
    pageCount: "5",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      if (resumeFile) {
        formDataToSend.append("resume", resumeFile);
      }

      const response = await axios.post(
        "http://localhost:3001/api/search",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(true);
      console.log("Job search started:", response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Job Search Configuration
      </Typography>

      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="CakeResume Username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="CakeResume Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Job Search Terms"
            name="searchTerms"
            value={formData.searchTerms}
            onChange={handleInputChange}
            margin="normal"
            required
            placeholder="e.g., software engineer, python, remote"
          />

          <TextField
            fullWidth
            label="Number of Pages to Search"
            name="pageCount"
            type="number"
            value={formData.pageCount}
            onChange={handleInputChange}
            margin="normal"
            required
            inputProps={{ min: 1, max: 50 }}
          />

          <Box sx={{ mt: 2, mb: 2 }}>
            <input
              accept=".pdf,.txt"
              style={{ display: "none" }}
              id="resume-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="resume-upload">
              <Button variant="outlined" component="span">
                Upload Resume
              </Button>
            </label>
            {resumeFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected file: {resumeFile.name}
              </Typography>
            )}
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : "Start Job Search"}
          </Button>
        </form>
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Job search started successfully! Check your email for updates.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default JobSearch;
