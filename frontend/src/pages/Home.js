import React, { useState, useContext, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  LinearProgress,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import { AuthContext } from "../context/AuthContext";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import PreviewIcon from "@mui/icons-material/Visibility";
import { uploadFile } from "../api/api";


const Home = () => {
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [filePreviews, setFilePreviews] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const { token } = useContext(AuthContext);

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
    accept: "*",
    multiple: true,
    onDrop: (acceptedFiles) => {
      setError(null);
      if (acceptedFiles.length === 0) return;

      setFiles(acceptedFiles);
      const previews = acceptedFiles.map((file) => {
        if (file.type.startsWith("image")) {
          return { type: "image", url: URL.createObjectURL(file) };
        } else if (file.type === "application/pdf") {
          return { type: "pdf", url: URL.createObjectURL(file) };
        } else if (file.name.endsWith(".nbib")) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) =>
              resolve({ type: "text", content: e.target.result });
            reader.readAsText(file);
          });
        } else {
          return { type: "unknown" };
        }
      });

      Promise.all(previews).then(setFilePreviews);
    },
  });

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("No files selected.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let uploadedCount = 0;
      for (const file of files) {
        await uploadFile(file, token, (progress) => {
          setUploadProgress(progress);
        });
        uploadedCount++;
      }
      setUploadProgress(100);
      alert("Files uploaded successfully!");
      setFiles([]);
    } catch (err) {
      setError("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (filePath) => {
    const fullUrl = `http://localhost:5000${filePath}`;
    window.open(fullUrl, "_blank");
  };

  const handleAnalyze = async (fileId) => {
    try {
      console.log("📤 Sending analyze request for file:", fileId);

      const response = await fetch(
        `http://localhost:5000/api/files/analyze/${fileId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      const data = await response.json();
      console.log("📨 Analyze Response:", data);

      if (!response.ok) throw new Error(data.message || "Analysis failed");

      if (!data.excelPath) throw new Error("No Excel file path returned from server");

      handleDownload(data.excelPath);
      alert("✅ Analysis complete! Excel file generated.");
    } catch (error) {
      console.error("❌ Error analyzing file:", error);
      alert("❌ Error analyzing file: " + error.message);
    }
  };

  const handlePreview = (index) => {
    setPreviewFile(filePreviews[index]);
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 3, textAlign: "center", borderRadius: 3 }}>
        <Typography variant="h4">Upload Files</Typography>

        <Box
          {...getRootProps()}
          sx={{
            border: "2px dashed #007bff",
            padding: "20px",
            cursor: "pointer",
            "&:hover": { backgroundColor: "#eaf3ff" },
          }}
        >
          <input {...getInputProps()} />
          <Typography>Drag & Drop Files Here or Click to Browse</Typography>
        </Box>

        {files.length > 0 && (
          <List>
            {files.map((file, index) => (
              <ListItem key={index}>
                <ListItemText primary={file.name} secondary={`Size: ${(file.size / 1024).toFixed(2)} KB`} />
                <Button variant="outlined" size="small" startIcon={<PreviewIcon />} onClick={() => handlePreview(index)}>
                  Preview
                </Button>
              </ListItem>
            ))}
          </List>
        )}

        <Button variant="contained" fullWidth sx={{ marginTop: 2 }} onClick={handleUpload} disabled={uploading}>
          {uploading ? <CircularProgress size={24} color="inherit" /> : "Upload Files"}
        </Button>

        {uploading && (
          <Box sx={{ marginTop: 2, width: "100%" }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2">{uploadProgress}% Uploaded</Typography>
          </Box>
        )}

        <Typography variant="h5" sx={{ marginTop: 2 }}>
          Your Uploaded Files
        </Typography>
        {uploadedFiles.map((file) => (
          <ListItem key={file._id}>
            <ListItemText primary={file.filename} />
            <Button onClick={() => handleAnalyze(file._id)} disabled={analyzing}>
              Analyze & Generate Excel
            </Button>
          </ListItem>
        ))}

        {/* ✅ File Preview Modal */}
        <Dialog open={!!previewFile} onClose={handleClosePreview} maxWidth="md" fullWidth>
          <DialogTitle>File Preview</DialogTitle>
          <DialogContent>
            {previewFile?.type === "image" && <img src={previewFile.url} alt="Preview" width="100%" />}
            {previewFile?.type === "pdf" && <iframe src={previewFile.url} width="100%" height="500px" title="PDF Preview"></iframe>}
            {previewFile?.type === "text" && (
              <Typography
                variant="body2"
                sx={{ backgroundColor: "#f4f4f4", padding: 2, borderRadius: 2, maxHeight: "200px", overflowY: "auto" }}
              >
                {previewFile.content.substring(0, 500)}...
              </Typography>
            )}
          </DialogContent>
        </Dialog>

        {error && <Typography color="error">{error}</Typography>}
      </Paper>
    </Container>
  );
};

export default Home;
