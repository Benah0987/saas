import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '../api/api';

const FileUpload = ({ token, onUploadSuccess }) => {
    const [error, setError] = useState(null);

    const { getRootProps, getInputProps } = useDropzone({
        accept: '.bin',
        onDrop: async (acceptedFiles) => {
            setError(null);
            if (acceptedFiles.length === 0) return;

            try {
                const response = await uploadFile(acceptedFiles[0], token);
                console.log(response);
                onUploadSuccess();
            } catch (err) {
                setError('Failed to upload file');
            }
        }
    });

    return (
        <div {...getRootProps()} className="dropzone">
            <input {...getInputProps()} />
            <p>Drag & drop a .bin file here, or click to select one</p>
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default FileUpload;
