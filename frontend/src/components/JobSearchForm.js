import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";

const JobSearchForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    jobTitle: "",
    pageCount: "1",
    email: "",
  });
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setResume(file);
      setError("");
    } else {
      setError("Please upload a PDF file");
      setResume(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });
      if (resume) {
        formDataToSend.append("resume", resume);
      }

      const response = await fetch("http://localhost:3001/api/jobs/search", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start job search");
      }

      // Reset form after successful submission
      setFormData({
        username: "",
        password: "",
        jobTitle: "",
        pageCount: "1",
        email: "",
      });
      setResume(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Start Job Search
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          label="Job Title"
          name="jobTitle"
          value={formData.jobTitle}
          onChange={handleInputChange}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          label="Number of Pages"
          name="pageCount"
          type="number"
          value={formData.pageCount}
          onChange={handleInputChange}
          inputProps={{ min: 1, max: 10 }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
        />
        <Box sx={{ mt: 2, mb: 2 }}>
          <input
            accept="application/pdf"
            style={{ display: "none" }}
            id="resume-upload"
            type="file"
            onChange={handleResumeChange}
          />
          <label htmlFor="resume-upload">
            <Button variant="outlined" component="span" fullWidth>
              Upload Resume (PDF)
            </Button>
          </label>
          {resume && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected: {resume.name}
            </Typography>
          )}
        </Box>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading || !resume}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : "Start Job Search"}
        </Button>
      </Box>
    </Paper>
  );
};

export default JobSearchForm;
