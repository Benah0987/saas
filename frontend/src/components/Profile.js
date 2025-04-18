import React, { useState, useContext, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Box,
  CircularProgress,
  Button,
  Chip,
  Divider,
  IconButton
} from "@mui/material";
import { AuthContext } from "../context/AuthContext";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import ArticleIcon from "@mui/icons-material/Article";
import DownloadIcon from "@mui/icons-material/Download";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, token } = useContext(AuthContext);
  const [userFiles, setUserFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch files uploaded by the logged-in user
  const fetchUserFiles = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/files", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const userFiles = data.filter((file) => file.userId === user._id);
        setUserFiles(userFiles);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error("Error fetching user files:", err);
      setError("Failed to load your files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserFiles();
    }
  }, [user]);

  const handleDownload = (filePath) => {
    const fullUrl = `http://localhost:5000${filePath}`;
    window.open(fullUrl, "_blank");
  };

  const getFileIcon = (filename) => {
    if (filename.endsWith(".pdf")) return <PictureAsPdfIcon color="error" />;
    if (filename.match(/\.(bib|nbib)$/i)) return <ArticleIcon color="secondary" />;
    if (filename.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i)) return <ImageIcon color="primary" />;
    return <InsertDriveFileIcon />;
  };

  const getFileType = (filename) => {
    if (filename.match(/\.(bib|nbib)$/i)) return 'BibTeX';
    if (filename.match(/\.(pdf)$/i)) return 'PDF';
    if (filename.match(/\.(jpg|jpeg|png|gif)$/i)) return 'Image';
    return 'Text';
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
        {/* User Profile Section */}
        <Box display="flex" flexDirection="column" alignItems="center" sx={{ mb: 4 }}>
          <Avatar sx={{ 
            width: 100, 
            height: 100, 
            backgroundColor: "primary.main",
            mb: 2
          }}>
            <AccountCircleIcon sx={{ fontSize: 70, color: "white" }} />
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            {user?.username}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {user?.email}
          </Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/home')}
          >
            Go to File Upload
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* User Files Section */}
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
          Your Uploaded Files ({userFiles.length})
        </Typography>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty State */}
        {!loading && userFiles.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            p: 4,
            backgroundColor: 'background.default',
            borderRadius: 2
          }}>
            <Typography variant="body1" color="text.secondary">
              No files uploaded yet. Upload your first file to get started!
            </Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              onClick={() => navigate('/upload')}
            >
              Upload Files
            </Button>
          </Box>
        )}

        {/* File List */}
        {!loading && userFiles.length > 0 && (
          <List sx={{ 
            backgroundColor: 'background.paper',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            {userFiles.map((file) => (
              <ListItem 
                key={file._id} 
                sx={{ 
                  borderBottom: '1px solid', 
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' }
                }}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    onClick={() => handleDownload(file.path)}
                    aria-label="download"
                  >
                    <DownloadIcon />
                  </IconButton>
                }
              >
                <Box sx={{ mr: 2 }}>
                  {getFileIcon(file.filename)}
                </Box>
                <ListItemText
                  primary={file.filename}
                  secondary={`Uploaded: ${new Date(file.uploadedAt).toLocaleString()}`}
                  sx={{ mr: 2 }}
                />
                <Chip 
                  label={getFileType(file.filename)}
                  size="small"
                  variant="outlined"
                />
              </ListItem>
            ))}
          </List>
        )}

        {/* Error State */}
        {error && (
          <Box sx={{ 
            backgroundColor: 'error.light', 
            p: 2, 
            borderRadius: 2,
            mt: 2
          }}>
            <Typography color="error">{error}</Typography>
            <Button 
              variant="text" 
              color="error"
              onClick={fetchUserFiles}
              sx={{ mt: 1 }}
            >
              Retry
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Profile;