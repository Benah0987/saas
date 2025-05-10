const API_URL = "http://localhost:5000/api/files";

// ✅ Upload file with progress tracking
export const uploadFile = async (file, token, onUploadProgress) => {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_URL}/upload`, true);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        // ✅ Track upload progress
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onUploadProgress) {
                const percentComplete = Math.round((event.loaded * 100) / event.total);
                onUploadProgress(percentComplete);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject(new Error("❌ Failed to upload file"));
            }
        };

        xhr.onerror = () => reject(new Error("❌ Network Error"));
        xhr.send(formData);
    });
};

// ✅ Download Excel file
export const downloadExcel = async () => {
    const response = await fetch(`${API_URL}/download-excel`);

    if (!response.ok) {
        throw new Error("❌ Failed to download Excel file");
    }

    return await response.blob();
};