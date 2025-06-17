import React from "react";
import { Typography, Paper, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Welcome to AutoJobber
      </Typography>

      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Automated Job Application Assistant
        </Typography>

        <Typography paragraph>
          AutoJobber helps you automate your job search process on CakeResume.
          Simply upload your resume, set your search preferences, and let the
          system handle the rest.
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Quick Start Guide:
        </Typography>

        <ol>
          <Typography component="li" paragraph>
            Enter your CakeResume credentials
          </Typography>
          <Typography component="li" paragraph>
            Upload your resume (PDF or TXT format)
          </Typography>
          <Typography component="li" paragraph>
            Set your job search preferences
          </Typography>
          <Typography component="li" paragraph>
            Start the automated job search
          </Typography>
        </ol>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
            onClick={() => navigate("/search")}
          >
            Start Job Search
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Home;
