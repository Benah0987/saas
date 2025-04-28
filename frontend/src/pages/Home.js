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
  Tabs,
  Tab,
  TextField,
  Grid,
  Tooltip,
  LinearProgress,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
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

  const parseBibtex = (content) => {
    try {
      const entries = content.split('@').filter(entry => entry.trim().length > 0);
      return entries.map(entry => {
        const typeMatch = entry.match(/^[^{]+/);
        const contentMatch = entry.match(/{([^}]*)}/);
        return {
          type: typeMatch ? typeMatch[0].trim() : 'unknown',
          content: contentMatch ? contentMatch[1] : entry,
          raw: `@${entry}`
        };
      });
    } catch (e) {
      console.error("Error parsing BibTeX:", e);
      return [{ type: "error", content: "Could not parse BibTeX", raw: content }];
    }
  };

  const parseCitationFile = (content) => {
    const entries = [];
    let currentEntry = {};
    
    content.split(/\r?\n/).forEach(line => {
      if (!line.trim()) {
        if (Object.keys(currentEntry).length) {
          entries.push(currentEntry);
          currentEntry = {};
        }
        return;
      }

      const separatorIndex = line.search(/[-%]\s+/);
      if (separatorIndex === -1) {
        // Handle multi-line fields
        const lastKey = Object.keys(currentEntry).pop();
        if (lastKey) currentEntry[lastKey] += `\n${line.trim()}`;
        return;
      }

      const key = line.substring(0, separatorIndex).trim();
      const value = line.substring(separatorIndex + 1).trim();

      switch (key) {
        case 'TY':
        case '%0':
          currentEntry.type = value;
          break;
        case 'AU':
        case '%A':
          currentEntry.authors = currentEntry.authors 
            ? [...currentEntry.authors, value] 
            : [value];
          break;
        case 'TI':
        case '%T':
          currentEntry.title = value;
          break;
        case 'JO':
        case 'JF':
        case '%J':
          currentEntry.journal = value;
          break;
        case 'PY':
        case 'Y1':
        case '%D':
          currentEntry.year = value;
          break;
        case 'DO':
        case '%R':
          currentEntry.doi = value;
          break;
        case 'AB':
        case '%X':
          currentEntry.abstract = value;
          break;
        case 'UR':
        case '%U':
          currentEntry.url = value;
          break;
        case 'ER':
        case '%Z':
          if (Object.keys(currentEntry).length) {
            entries.push(currentEntry);
            currentEntry = {};
          }
          break;
        default:
          currentEntry[key.toLowerCase()] = value;
      }
    });

    if (Object.keys(currentEntry).length) {
      entries.push(currentEntry);
    }

    return entries;
  };

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
        } else if (file.name.match(/\.(bib|bibtex|ris|enw|nbib)$/i)) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const content = e.target.result;
              const isBibtex = file.name.match(/\.(bib|bibtex)$/i);
              resolve({
                type: "citation",
                fileType: isBibtex ? 'bibtex' : file.name.split('.').pop().toLowerCase(),
                content: content,
                parsedContent: isBibtex ? parseBibtex(content) : parseCitationFile(content),
                fileName: file.name
              });
            };
            reader.readAsText(file);
          });
        } else {
          return { type: "unknown", fileName: file.name };
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
    const file = filePreviews[index];
    if (file.type === 'unknown') {
      if (file.fileName.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewFile({
            type: 'text',
            content: e.target.result
          });
        };
        reader.readAsText(file);
      }
    } else {
      setPreviewFile(file);
    }
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
    if (filename.match(/\.(bib|bibtex|ris|enw|nbib)$/i)) return <ArticleIcon color="secondary" />;
    if (filename.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i)) return <ImageIcon color="primary" />;
    return <InsertDriveFileIcon />;
  };

  const getFileType = (filename) => {
    if (filename.match(/\.(bib|bibtex)$/i)) return 'BibTeX';
    if (filename.match(/\.(ris|enw|nbib)$/i)) return 'Citation';
    if (filename.match(/\.(pdf)$/i)) return 'PDF';
    if (filename.match(/\.(jpg|jpeg|png|gif)$/i)) return 'Image';
    return 'Other';
  };

  const renderCitationField = (label, value) => {
    if (!value) return null;
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {label}:
        </Typography>
        <Typography variant="body2">
          {Array.isArray(value) ? value.join('; ') : value}
        </Typography>
      </Box>
    );
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
          Upload and Manage Files
        </Typography>
  
        {/* Dropzone */}
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed #007bff', // Vibrant blue for the border
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            my: 3,
            transition: 'all 0.3s ease', // Smooth transition for hover effect
            '&:hover': {
              borderColor: '#0056b3', // Darker blue on hover
              backgroundColor: '#e3f2fd', // Light blue background on hover
            },
            '&:active': {
              transform: 'scale(0.98)', // Slight compression on click
            },
          }}
        >
          <input {...getInputProps()} />
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.2rem' }}>
            Drag and drop files here, or click to select
          </Typography>
        </Box>
  
        {/* Error */}
        {error && (
          <Typography color="error" sx={{ mb: 2, fontWeight: 'bold' }}>
            {error}
          </Typography>
        )}
  
        {/* Preview Uploaded Files */}
        {filePreviews.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#444' }}>
              Files to Upload
            </Typography>
            <List>
              {filePreviews.map((file, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <Tooltip title="Preview">
                      <IconButton edge="end" onClick={() => handlePreview(index)}>
                        <PreviewIcon />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  {getFileIcon(file.fileName || 'file')}
                  <ListItemText
                    primary={file.fileName || file.type.toUpperCase()}
                    secondary={file.type}
                    sx={{ ml: 2, color: '#555' }}
                  />
                </ListItem>
              ))}
            </List>
  
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={uploading}
                sx={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#007bff',
                  '&:hover': {
                    backgroundColor: '#0056b3', // Darker blue for hover
                  },
                  fontWeight: 'bold',
                  textTransform: 'none',
                  boxShadow: '0px 4px 12px rgba(0, 123, 255, 0.3)', // Shadow for depth
                }}
              >
                {uploading ? (
                  <>
                    Uploading...
                    <CircularProgress size={20} sx={{ ml: 1 }} />
                  </>
                ) : (
                  'Upload Files'
                )}
              </Button>
            </Box>
  
            {uploading && (
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  backgroundColor: '#e3f2fd',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#007bff', // Blue progress bar
                  },
                }}
              />
            )}
          </>
        )}
  
        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <>
            <Divider sx={{ my: 4, borderColor: '#007bff' }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#444' }}>
              Uploaded Files
            </Typography>
            <List>
              {uploadedFiles.map((file) => (
                <ListItem
                  key={file._id}
                  secondaryAction={
                    <Tooltip title="Analyze">
                      <IconButton edge="end" onClick={() => handleAnalyze(file._id)}>
                        <AnalyticsIcon />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  {getFileIcon(file.filename)}
                  <ListItemText
                    primary={file.filename}
                    secondary={`Uploaded: ${new Date(file.uploadedAt).toLocaleString()}`}
                    sx={{ ml: 2, color: '#555' }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Paper>
  
      {/* File Preview Modal */}
      <Dialog
        open={Boolean(previewFile)}
        onClose={handleClosePreview}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#333' }}>
          Preview
          <IconButton
            aria-label="close"
            onClick={handleClosePreview}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {previewFile?.type === 'image' && (
            <Box component="img" src={previewFile.url} alt="Preview" sx={{ width: '100%', borderRadius: 2 }} />
          )}
          {previewFile?.type === 'pdf' && (
            <iframe src={previewFile.url} width="100%" height="600px" title="PDF Preview" />
          )}
          {previewFile?.type === 'citation' && (
            <>
              <Tabs value={previewTab} onChange={handleTabChange}>
                <Tab label="Formatted View" />
                <Tab label="Raw View" />
              </Tabs>
              {previewTab === 0 ? (
                previewFile.parsedContent.map((entry, idx) => (
                  <Paper key={idx} sx={{ p: 2, my: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {entry.title || '(No Title)'}
                    </Typography>
                    {renderCitationField('Type', entry.type)}
                    {renderCitationField('Authors', entry.authors)}
                    {renderCitationField('Journal', entry.journal)}
                    {renderCitationField('Year', entry.year)}
                    {renderCitationField('DOI', entry.doi)}
                    {renderCitationField('Abstract', entry.abstract)}
                    {renderCitationField('URL', entry.url)}
                  </Paper>
                ))
              ) : (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={20}
                    variant="outlined"
                    value={previewFile.content}
                  />
                </Box>
              )}
            </>
          )}
          {previewFile?.type === 'text' && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={20}
                variant="outlined"
                value={previewFile.content}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}  

export default Home






