import React, { useState } from "react";
import {
  Container,
  Grid,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tab,
  Tabs,
} from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import JobSearchForm from "./components/JobSearchForm";
import JobHistory from "./components/JobHistory";
import LogViewer from "./components/LogViewer";

function App() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <WorkIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Auto Jobber
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Job Search & Logs" />
            <Tab label="History" />
          </Tabs>
        </Box>

        {currentTab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} sx={{ width: "45%" }}>
              <JobSearchForm />
            </Grid>
            <Grid item xs={12} md={6} sx={{ width: "45%" }}>
              <LogViewer />
            </Grid>
          </Grid>
        )}

        {currentTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <JobHistory />
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}

export default App;
