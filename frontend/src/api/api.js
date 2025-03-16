const API_URL = 'http://localhost:5000/api/files';

// Upload file
export const uploadFile = async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        throw new Error('Failed to upload file');
    }

    return await response.json();
};

// Download Excel file
export const downloadExcel = async () => {
    const response = await fetch(`${API_URL}/download-excel`);

    if (!response.ok) {
        throw new Error('Failed to download Excel file');
    }

    return await response.blob();
};
