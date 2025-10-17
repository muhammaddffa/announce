import { Router } from 'express';
import { UploadController } from './upload.controller';
import { authMiddleware } from '../../middleware/authMiddleware';
import { uploadSingle, uploadMultiple, handleMulterError } from '../../middleware/uploudMiddleware';

const router = Router();
const controller = new UploadController();

// Apply auth middleware
router.use(authMiddleware);

// Upload single image
router.post(
  '/image',
  uploadSingle,
  handleMulterError,
  controller.uploadImage
);

// Upload multiple images
router.post(
  '/images',
  uploadMultiple,
  handleMulterError,
  controller.uploadMultipleImages
);

// Delete image
router.delete('/:publicId', controller.deleteImage);

export default router;