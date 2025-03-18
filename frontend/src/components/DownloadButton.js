import React from "react";
import { Button } from "@mui/material";

const DownloadButton = ({ filePath }) => {
  const handleDownload = () => {
    if (!filePath) {
      alert("No file available for download.");
      return;
    }
    
    // Open file in a new tab for download
    window.open(`http://localhost:5000/${filePath}`, "_blank");
  };

  return (
    <Button 
      variant="contained" 
      color="secondary" 
      style={{ marginTop: "15px" }} 
      onClick={handleDownload}
      disabled={!filePath}
    >
      Download Excel
    </Button>
  );
};

export default DownloadButton;
