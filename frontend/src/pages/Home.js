import React, { useState, useContext, useEffect } from "react";
import { Container, Paper, Typography, Button, List, ListItem, ListItemText } from "@mui/material";
import { useDropzone } from "react-dropzone";
import { AuthContext } from "../context/AuthContext"; 

const Home = () => {
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const { uploadFiles, token, user } = useContext(AuthContext); 

  // ✅ Fetch uploaded files for current user
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/files", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch files");

        const data = await res.json();
        setUploadedFiles(data);
      } catch (err) {
        console.error("Error fetching files:", err);
      }
    };

    if (token) fetchFiles();
  }, [token]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/x-bibtex": [".bib"], "text/plain": [".txt"] },
    onDrop: (acceptedFiles) => {
      setError(null);
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
      const response = await uploadFiles(files);
      if (!response.success) throw new Error(response.message);

      alert("Files uploaded successfully!");
      setFiles([]);

      // ✅ Refresh the file list
      const res = await fetch("http://localhost:5000/api/files", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to refresh files");
      const data = await res.json();
      setUploadedFiles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // ✅ Function to analyze file & generate Excel
  const handleAnalyze = async (fileId) => {
    try {
      console.log("📤 Sending analyze request for file:", fileId);
      const response = await fetch(`http://localhost:5000/api/files/analyze/${fileId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
  
      const data = await response.json();
      console.log("📨 Analyze Response:", data);
  
      if (!response.ok) throw new Error(data.message || "Analysis failed");
  
      alert("✅ Analysis complete! Excel file generated.");
    } catch (error) {
      console.error("❌ Error analyzing file:", error);
      alert("❌ Error analyzing file: " + error.message);
    }
  };
  
  

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} style={{ padding: "20px", textAlign: "center" }}>
        <Typography variant="h4">Upload Files</Typography>

        <div {...getRootProps()} style={{ border: "2px dashed gray", padding: "20px", cursor: "pointer", marginTop: "20px" }}>
          <input {...getInputProps()} />
          <Typography>Drag & Drop Files Here or Click to Browse</Typography>
        </div>

        {files.length > 0 && (
          <List>
            {files.map((file, index) => (
              <ListItem key={index}>
                <ListItemText primary={file.name} secondary={`Size: ${(file.size / 1024).toFixed(2)} KB`} />
              </ListItem>
            ))}
          </List>
        )}

        {error && <Typography color="error">{error}</Typography>}

        <Button variant="contained" color="primary" fullWidth style={{ marginTop: "15px" }} onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Files"}
        </Button>

        <Typography variant="h5" style={{ marginTop: "20px" }}>Your Uploaded Files</Typography>
        {uploadedFiles.map((file) => (
          <ListItem key={file._id}>
            <ListItemText primary={file.filename} />
            <Button onClick={() => handleAnalyze(file._id)} disabled={analyzing}>Analyze & Generate Excel</Button>
          </ListItem>
        ))}
      </Paper>
    </Container>
  );
};

export default Home;
