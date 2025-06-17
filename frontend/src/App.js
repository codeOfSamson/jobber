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

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Job Search" />
            <Tab label="History" />
            <Tab label="Logs" />
          </Tabs>
        </Box>

        {currentTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <JobSearchForm />
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

        {currentTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <LogViewer />
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}

export default App;
