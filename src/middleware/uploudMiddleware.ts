import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from '../utils/errorHandler';
import { HTTP_STATUS } from '../shared/constants/statusCodes';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Temporary storage before uploading to Cloudinary
    cb(null, 'uploads/temp');
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed extensions
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed (JPEG, PNG, WebP)', HTTP_STATUS.BAD_REQUEST));
  }
};

// Create multer upload instance
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 5 // Max 5 files at once
  }
});

// Middleware for single file upload
export const uploadSingle = upload.single('image');

// Middleware for multiple files upload
export const uploadMultiple = upload.array('images', 5);

// Error handling middleware for multer
export const handleMulterError = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Too many files. Maximum is 5 files'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Unexpected field name'
      });
    }
  }
  next(err);
};