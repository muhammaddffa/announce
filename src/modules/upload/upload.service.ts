import cloudinary from '../../config/cloudinary';
import { AppError } from '../../utils/errorHandler';
import { HTTP_STATUS } from '../../shared/constants/statusCodes';
import fs from 'fs';

interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export class UploadService {
  // Upload single image to Cloudinary
  async uploadImage(file: Express.Multer.File, folder: string = 'announce'): Promise<UploadResult> {
    try {
      this.validateImage(file);

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' }, // Max size
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });

      // Delete temp file
      this.deleteLocalFile(file.path);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      };
    } catch (error: any) {
      // Delete temp file if upload failed
      this.deleteLocalFile(file.path);
      
      throw new AppError(
        error.message || 'Failed to upload image',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Validate image
  private validateImage(file: Express.Multer.File): void {
    // Check if file exists
    if (!file) {
      throw new AppError('No file uploaded', HTTP_STATUS.BAD_REQUEST);
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError(
        'Invalid file type. Only JPEG, PNG, and WebP are allowed',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new AppError(
        'File size too large. Maximum size is 5MB',
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  // Delete local temporary file
  private deleteLocalFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting local file:', error);
    }
  }

  // Delete image from Cloudinary
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error: any) {
      throw new AppError(
        'Failed to delete image',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Upload multiple images
  async uploadMultipleImages(files: Express.Multer.File[], folder: string = 'announcements'): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }
}