import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import DownloadButton from '../components/DownloadButton';

const Home = () => {
    const [uploaded, setUploaded] = useState(false);

    return (
        <div>
            <h1>Upload and Extract Data</h1>
            <FileUpload token="YOUR_JWT_TOKEN_HERE" onUploadSuccess={() => setUploaded(true)} />
            {uploaded && <DownloadButton />}
        </div>
    );
};

export default Home;
