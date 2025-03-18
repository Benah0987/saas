import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  filename: String,
  filepath: String,
  mimetype: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
  analyzedData: Array, // Store extracted citations
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ✅ Associate file with user
});

export default mongoose.model('File', FileSchema);
