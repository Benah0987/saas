import React, { useState, useContext } from "react";
import { Container, Paper, Typography, Button, List, ListItem, ListItemText } from "@mui/material";
import { useDropzone } from "react-dropzone";
import { AuthContext } from "../context/AuthContext"; // Ensure the correct import path

const Home = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const { uploadFiles } = useContext(AuthContext); // Get uploadFiles from context

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [],
      "application/pdf": [],
      "application/msword": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
      "application/octet-stream": [".bin"],
    },
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        setError("Some files were rejected. Ensure they are in the accepted formats.");
      } else {
        setError(null);
      }
      setFiles(acceptedFiles);
    },
  });

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("No files selected.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await uploadFiles(files); // Use the uploadFiles function from context

      if (!response.success) throw new Error(response.message);

      alert("Files uploaded successfully!");
      setFiles([]); // Clear files after successful upload
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} style={{ padding: "20px", textAlign: "center" }}>
        <Typography variant="h4">Upload Files</Typography>

        {/* Drag & Drop Area */}
        <div {...getRootProps()} style={{ border: "2px dashed gray", padding: "20px", cursor: "pointer", marginTop: "20px" }}>
          <input {...getInputProps()} />
          <Typography>Drag & Drop Files Here or Click to Browse</Typography>
        </div>

        {/* Show Selected Files */}
        {files.length > 0 && (
          <List>
            {files.map((file, index) => (
              <ListItem key={index}>
                <ListItemText primary={file.name} secondary={`Size: ${(file.size / 1024).toFixed(2)} KB`} />
              </ListItem>
            ))}
          </List>
        )}

        {/* Error Message */}
        {error && <Typography color="error">{error}</Typography>}

        {/* Upload Button */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          style={{ marginTop: "15px" }}
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload Files"}
        </Button>
      </Paper>
    </Container>
  );
};

export default Home;
