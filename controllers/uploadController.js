import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

export const uploadSingleImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const category = req.body.category || 'general';
  const fileUrl = `/uploads/${category}/${req.file.filename}`;
  res.json({ success: true, message: 'Image uploaded successfully', data: { url: fileUrl } });
};

export const deleteImage = (req, res) => {
  try {
    const { category, filename } = req.params;
    const filePath = path.join(uploadsDir, category, filename);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'Image deleted successfully' });
    } else {
        res.status(404).json({ success: false, message: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};