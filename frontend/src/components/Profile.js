import React, { useState, useContext, useEffect } from "react";
import { Container, Paper, Typography, List, ListItem, ListItemText, Avatar, Box, CircularProgress } from "@mui/material";
import { AuthContext } from "../context/AuthContext";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const Profile = () => {
  const { user, token } = useContext(AuthContext);
  const [userFiles, setUserFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Fetch files uploaded by the logged-in user
  const fetchUserFiles = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/files", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        // Filter only files uploaded by the logged-in user
        const userFiles = data.filter((file) => file.userId === user._id);
        setUserFiles(userFiles);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error("Error fetching user files:", err);
      setError("Failed to load your files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserFiles();
    }
  }, [user]);

  return (
    <Container maxWidth="md">
      <Paper
        elevation={5}
        sx={{
          padding: 4,
          textAlign: "center",
          borderRadius: 3,
          marginTop: 5,
          backgroundColor: "background.paper",
        }}
      >
        {/* ✅ User Avatar & Details */}
        <Box display="flex" flexDirection="column" alignItems="center">
          <Avatar sx={{ width: 80, height: 80, backgroundColor: "primary.main" }}>
            <AccountCircleIcon sx={{ fontSize: 60, color: "white" }} />
          </Avatar>
          <Typography variant="h5" sx={{ marginTop: 2, fontWeight: "bold" }}>
            {user?.username}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {user?.email}
          </Typography>
        </Box>

        {/* ✅ File Upload Section */}
        <Typography variant="h5" sx={{ marginTop: 3, fontWeight: "bold" }}>
          Your Uploaded Files
        </Typography>

        {/* ✅ Loading Indicator */}
        {loading && <CircularProgress sx={{ marginTop: 2 }} />}

        {/* ✅ File List */}
        {!loading && userFiles.length > 0 ? (
          <List sx={{ marginTop: 2 }}>
            {userFiles.map((file) => (
              <ListItem key={file._id} sx={{ borderBottom: "1px solid #ddd" }}>
                <ListItemText
                  primary={file.filename}
                  secondary={`Uploaded: ${new Date(file.uploadedAt).toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          !loading && <Typography color="textSecondary">No files uploaded yet.</Typography>
        )}

        {/* ✅ Error Message */}
        {error && <Typography color="error">{error}</Typography>}
      </Paper>
    </Container>
  );
};

export default Profile;
