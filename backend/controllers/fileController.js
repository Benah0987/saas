import File from '../models/File.js';

export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded or invalid file type' });
        }

        const file = new File({
            filename: req.file.filename,
            path: req.file.path,
            owner: req.user.userId
        });

        await file.save();
        res.status(201).json({ message: 'File uploaded successfully', file });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading file', error });
    }
};
