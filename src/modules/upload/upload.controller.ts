import { Request, Response, NextFunction } from 'express';
import { UploadService } from './upload.service';
import { successResponse } from '../../utils/response';
import { HTTP_STATUS } from '../../shared/constants/statusCodes';
import { AppError } from '../../utils/errorHandler';

export class UploadController {
  private service: UploadService;

  constructor() {
    this.service = new UploadService();
  }

  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', HTTP_STATUS.BAD_REQUEST);
      }

      const folder = req.body.folder || 'announce';
      const result = await this.service.uploadImage(req.file, folder);

      res.status(HTTP_STATUS.CREATED).json({
        code: HTTP_STATUS.CREATED,
        status: "success",
        message: 'Image uploaded successfully',
        data: result
      }
      );
    } catch (error) {
      next(error);
    }
  };

  uploadMultipleImages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new AppError('No files uploaded', HTTP_STATUS.BAD_REQUEST);
      }

      const folder = req.body.folder || 'announce';
      const results = await this.service.uploadMultipleImages(req.files, folder);

      res.status(HTTP_STATUS.CREATED).json({
        code: HTTP_STATUS.CREATED,
        status: "success",
        message: 'Images uploaded successfully',
        data: results
      }
      );
    } catch (error) {
      next(error);
    }
  };

  deleteImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { publicId } = req.params;

      if (!publicId) {
        throw new AppError('Public ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      await this.service.deleteImage(publicId);

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Image deleted successfully'
      }
      );
    } catch (error) {
      next(error);
    }
  };
}