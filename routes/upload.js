import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { auth, authorize } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = uploadsDir;
    
    // Create subdirectories based on file type
    if (file.fieldname === 'carImages') {
      uploadPath = path.join(uploadsDir, 'cars');
    } else if (file.fieldname === 'tourImages') {
      uploadPath = path.join(uploadsDir, 'tours');
    } else if (file.fieldname === 'avatar') {
      uploadPath = path.join(uploadsDir, 'avatars');
    } else {
      uploadPath = path.join(uploadsDir, 'general');
    }
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  }
});

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Private
router.post('/image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Generate file URL
    const fileUrl = `/uploads/${path.basename(path.dirname(req.file.path))}/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        id: req.file.filename,
        filename: req.file.originalname,
        path: fileUrl,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });

    console.log(`📸 Image uploaded: ${req.file.originalname} by ${req.user.name} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Image upload failed',
      error: error.message
    });
  }
});

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Private
router.post('/images', auth, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = req.files.map(file => {
      const fileUrl = `/uploads/${path.basename(path.dirname(file.path))}/${file.filename}`;
      return {
        id: file.filename,
        filename: file.originalname,
        path: fileUrl,
        url: fileUrl,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString()
      };
    });

    res.json({
      success: true,
      message: `${uploadedFiles.length} images uploaded successfully`,
      data: uploadedFiles
    });

    console.log(`📸 ${uploadedFiles.length} images uploaded by ${req.user.name} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Multiple image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Image upload failed',
      error: error.message
    });
  }
});

// @desc    Delete uploaded image
// @route   DELETE /api/upload/image/:filename
// @access  Private
router.delete('/image/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Find the file in various subdirectories
    const possiblePaths = [
      path.join(uploadsDir, 'cars', filename),
      path.join(uploadsDir, 'tours', filename),
      path.join(uploadsDir, 'avatars', filename),
      path.join(uploadsDir, 'general', filename),
      path.join(uploadsDir, filename)
    ];

    let filePath = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        filePath = possiblePath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

    console.log(`🗑️ Image deleted: ${filename} by ${req.user.name} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
});

// @desc    Get upload statistics
// @route   GET /api/upload/stats
// @access  Private (Admin)
router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const getDirectorySize = (dirPath) => {
      let totalSize = 0;
      let fileCount = 0;
      
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
            fileCount++;
          }
        });
      }
      
      return { totalSize, fileCount };
    };

    const carsStats = getDirectorySize(path.join(uploadsDir, 'cars'));
    const toursStats = getDirectorySize(path.join(uploadsDir, 'tours'));
    const avatarsStats = getDirectorySize(path.join(uploadsDir, 'avatars'));
    const generalStats = getDirectorySize(path.join(uploadsDir, 'general'));

    const totalStats = {
      totalSize: carsStats.totalSize + toursStats.totalSize + avatarsStats.totalSize + generalStats.totalSize,
      totalFiles: carsStats.fileCount + toursStats.fileCount + avatarsStats.fileCount + generalStats.fileCount
    };

    res.json({
      success: true,
      data: {
        total: totalStats,
        breakdown: {
          cars: carsStats,
          tours: toursStats,
          avatars: avatarsStats,
          general: generalStats
        }
      }
    });
  } catch (error) {
    console.error('Upload stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upload statistics'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed!'
    });
  }
  
  next(error);
});

export default router;