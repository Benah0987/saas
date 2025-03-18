import React, { useState, useContext, useEffect } from "react";
import { Container, Paper, Typography, List, ListItem, ListItemText } from "@mui/material";
import { AuthContext } from "../context/AuthContext";

const Profile = () => {
  const { user, token } = useContext(AuthContext);
  const [userFiles, setUserFiles] = useState([]);
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
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserFiles();
    }
  }, [user]);

  return (
    <Container maxWidth="md">
      <Paper elevation={3} style={{ padding: "20px", textAlign: "center" }}>
        <Typography variant="h4">Your Profile</Typography>
        <Typography variant="h6">Welcome, {user?.username}</Typography>

        <Typography variant="h5" style={{ marginTop: "20px" }}>Your Uploaded Files</Typography>
        {userFiles.length > 0 ? (
          <List>
            {userFiles.map((file) => (
              <ListItem key={file._id}>
                <ListItemText primary={file.filename} secondary={`Uploaded: ${new Date(file.uploadedAt).toLocaleString()}`} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>No files uploaded yet.</Typography>
        )}

        {/* Show Errors */}
        {error && <Typography color="error">{error}</Typography>}
      </Paper>
    </Container>
  );
};

export default Profile;
