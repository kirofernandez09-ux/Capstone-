import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req, file) => {
      // Organize uploads into folders based on their purpose
      if (file.fieldname === 'paymentProof') return 'payment_proofs';
      if (file.fieldname === 'carImage') return 'car_images';
      if (file.fieldname === 'tourImage') return 'tour_images';
      return 'general_uploads';
    },
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => `${file.fieldname}_${Date.now()}`, // Create a unique file name
  },
});

// Initialize multer with the Cloudinary storage engine
export const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'), false);
        }
    }
});