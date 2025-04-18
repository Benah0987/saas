import React, { useState, useContext, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip,
  Tab,
  Tabs,
  TextField,
  Grid,
  Tooltip,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import { AuthContext } from "../context/AuthContext";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import PreviewIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import ArticleIcon from "@mui/icons-material/Article";
import DownloadIcon from "@mui/icons-material/Download";
import AnalyticsIcon from "@mui/icons-material/Analytics";
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
  const [previewTab, setPreviewTab] = useState(0);
  const { token } = useContext(AuthContext);

  const fetchUserFiles = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/files", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      setUploadedFiles(data);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError("Failed to load files. Please try again.");
    }
  };

  useEffect(() => {
    if (token) fetchUserFiles();
  }, [token]);

  useEffect(() => {
    return () => {
      filePreviews.forEach((preview) => {
        if (preview?.url) URL.revokeObjectURL(preview.url);
      });
    };
  }, [filePreviews]);

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
        } else if (file.name.match(/\.(bib|nbib)$/i)) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) =>
              resolve({ 
                type: "bibtex", 
                content: e.target.result,
                rawContent: e.target.result,
                parsedContent: parseBibtex(e.target.result)
              });
            reader.readAsText(file);
          });
        } else {
          return { type: "unknown" };
        }
      });
      Promise.all(previews).then(setFilePreviews);
    },
  });

  const parseBibtex = (content) => {
    try {
      const entries = content.split('@');
      return entries
        .filter(entry => entry.trim().length > 0)
        .map(entry => ({
          type: (entry.match(/^[^{]+/) || ['unknown'])[0].trim(),
          content: (entry.match(/{([^}]*)}/) || [entry])[1],
          raw: `@${entry}`
        }));
    } catch (e) {
      console.error("Error parsing BibTeX:", e);
      return [{ type: "error", content: "Could not parse BibTeX", raw: content }];
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("No files selected.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const optimisticFiles = files.map((file) => ({
        _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        filename: file.name,
        temp: true,
        path: '',
        uploadedAt: new Date().toISOString()
      }));
      setUploadedFiles(prev => [...optimisticFiles, ...prev]);

      for (const file of files) {
        await uploadFile(file, token, (progress) => {
          setUploadProgress(progress);
        });
      }

      await fetchUserFiles();
      setUploadProgress(100);
      setFiles([]);
      setFilePreviews([]);
    } catch (err) {
      setError("Failed to upload files. Please try again.");
      setUploadedFiles(prev => prev.filter(f => !f.temp));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (filePath) => {
    window.open(`http://localhost:5000${filePath}`, "_blank");
  };

  const handleAnalyze = async (fileId) => {
    if (fileId.startsWith("temp-")) return;

    try {
      setAnalyzing(true);
      const response = await fetch(
        `http://localhost:5000/api/files/analyze/${fileId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Analysis failed");
      if (!data.excelPath) throw new Error("No Excel file path returned");
      handleDownload(data.excelPath);
    } catch (error) {
      console.error("Error analyzing file:", error);
      setError("Error analyzing file: " + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePreview = (index) => {
    setPreviewFile(filePreviews[index]);
    setPreviewTab(0);
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
  };

  const handleTabChange = (event, newValue) => {
    setPreviewTab(newValue);
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
    return 'Other';
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          File Management
        </Typography>

        {/* File Upload Section */}
        <Box
          {...getRootProps()}
          sx={{
            border: "2px dashed",
            borderColor: "primary.main",
            p: 4,
            textAlign: "center",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "action.hover",
              borderColor: "primary.dark",
            },
            borderRadius: 2,
            mb: 3,
          }}
        >
          <input {...getInputProps()} />
          <Typography variant="body1">
            Drag & drop files here, or click to select files
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supported formats: PDF, Images, BibTeX, and more
          </Typography>
        </Box>

        {/* Selected Files Preview */}
        {files.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
              Files to Upload ({files.length})
            </Typography>
            {files.map((file, index) => (
              <Paper key={index} elevation={1} sx={{ mb: 2, p: 2, borderRadius: 2 }}>
                <Grid container alignItems="center">
                  <Grid item xs={8}>
                    <Box display="flex" alignItems="center">
                      {getFileIcon(file.name)}
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(file.size / 1024).toFixed(2)} KB
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box display="flex" justifyContent="flex-end">
                      <Chip 
                        label={getFileType(file.name)}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <Tooltip title="Preview">
                        <IconButton onClick={() => handlePreview(index)}>
                          <PreviewIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Box>
        )}

        {/* Upload Controls */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            sx={{ mb: 1 }}
          >
            {uploading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                Uploading...
              </>
            ) : (
              `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`
            )}
          </Button>
          {uploading && (
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          )}
        </Box>

        {/* Uploaded Files Section */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium' }}>
            Your Uploaded Files ({uploadedFiles.length})
          </Typography>
          
          {uploadedFiles.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No files have been uploaded yet
            </Typography>
          ) : (
            <Box>
              {uploadedFiles.map((file) => (
                <Paper 
                  key={file._id}
                  elevation={1}
                  sx={{ 
                    mb: 2, 
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: file._id.startsWith("temp-") ? 
                      'action.hover' : 'background.paper'
                  }}
                >
                  <Grid container alignItems="center">
                    <Grid item xs={12} sm={8}>
                      <Box display="flex" alignItems="center">
                        {getFileIcon(file.filename)}
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {file.filename}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Box display="flex" justifyContent="flex-end" sx={{ mt: { xs: 1, sm: 0 } }}>
                        <Chip 
                          label={getFileType(file.filename)}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                        
                        <Tooltip title="Download">
                          <IconButton
                            onClick={() => handleDownload(file.path)}
                            disabled={file._id.startsWith("temp-")}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Analyze">
                          <IconButton
                            onClick={() => handleAnalyze(file._id)}
                            disabled={analyzing || file._id.startsWith("temp-")}
                            sx={{ ml: 1 }}
                          >
                            <AnalyticsIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
          )}
        </Box>

        {/* Error Display */}
        {error && (
          <Box sx={{ 
            backgroundColor: 'error.light', 
            p: 2, 
            borderRadius: 2,
            mt: 2
          }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {/* File Preview Dialog */}
        <Dialog
          open={!!previewFile}
          onClose={handleClosePreview}
          maxWidth="md"
          fullWidth
          sx={{ '& .MuiDialog-paper': { height: '80vh' } }}
        >
          <DialogTitle>
            File Preview
            <IconButton
              aria-label="close"
              onClick={handleClosePreview}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          {previewFile?.type === "bibtex" && (
            <>
              <Tabs value={previewTab} onChange={handleTabChange} sx={{ px: 2 }}>
                <Tab label="Parsed View" />
                <Tab label="Raw Content" />
              </Tabs>
              <DialogContent dividers sx={{ overflow: 'auto' }}>
                {previewTab === 0 ? (
                  <Box>
                    {previewFile.parsedContent.map((entry, index) => (
                      <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          {entry.type.toUpperCase()}
                        </Typography>
                        <TextField
                          value={entry.content}
                          multiline
                          fullWidth
                          variant="outlined"
                          InputProps={{
                            readOnly: true,
                            sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <TextField
                    value={previewFile.rawContent}
                    multiline
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      readOnly: true,
                      sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                    }}
                  />
                )}
              </DialogContent>
            </>
          )}

          {previewFile?.type === "image" && (
            <DialogContent dividers sx={{ display: 'flex', justifyContent: 'center' }}>
              <img
                src={previewFile.url}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </DialogContent>
          )}

          {previewFile?.type === "pdf" && (
            <DialogContent dividers sx={{ p: 0, height: '100%' }}>
              <iframe
                src={previewFile.url}
                width="100%"
                height="100%"
                title="PDF Preview"
                style={{ border: 'none' }}
              />
            </DialogContent>
          )}
        </Dialog>
      </Paper>
    </Container>
  );
};

export default Home;