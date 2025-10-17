import { Router } from 'express';
import { UploadController } from './upload.controller';
import { authMiddleware } from '../../middleware/authMiddleware';
import { uploadSingle, uploadMultiple, handleMulterError } from '../../middleware/uploudMiddleware';

const router = Router();
const controller = new UploadController();

router.use(authMiddleware);

router.post(
  '/image',
  uploadSingle,
  handleMulterError,
  controller.uploadImage
);

router.post(
  '/images',
  uploadMultiple,
  handleMulterError,
  controller.uploadMultipleImages
);

router.delete('/:publicId', controller.deleteImage);

export default router;