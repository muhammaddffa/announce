import { Request, Response, NextFunction } from 'express';
import { AnnouncementService } from './announcement.service';
import { successResponse } from '../../utils/response';
import { HTTP_STATUS } from '../../shared/constants/statusCodes';
import { stat } from 'fs';


export class AnnouncementController {
  private service: AnnouncementService;

  constructor() {
    this.service = new AnnouncementService();
  }

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getStatistics();
      res.status(HTTP_STATUS.OK).json(
        {
          code: HTTP_STATUS.OK,
          status: "success",
          message: 'Announcement statistics retrieved successfully',
          data: stats
        }
      );
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, page, limit, search, sortBy, sortOrder } = req.query;
      
      const result = await this.service.getAll({
        status: status as string,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Announcements retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getPublished = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.query;
      
      const result = await this.service.getPublished({
        page: Number(page) || 1,
        limit: Number(limit) || 10
      });

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Published announcements retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  // Pakai Request biasa
  getMyAnnouncements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { page, limit } = req.query;
      
      const result = await this.service.getByUserId(userId, {
        page: Number(page) || 1,
        limit: Number(limit) || 10
      });

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'My announcements retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const data = req.body;

      const announcement = await this.service.create({
        ...data,
        created_by: userId
      });

      res.status(HTTP_STATUS.CREATED).json({
        code: HTTP_STATUS.CREATED,
        status: "success",
        message: 'Announcement created successfully',
        data: announcement
      }
      );
    } catch (error: any) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: HTTP_STATUS.BAD_REQUEST,
        message: 'Announcement creation failed',
        error: error.message
      });
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const announcement = await this.service.getById(id);

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Announcement getByid successfully',
        data: announcement
      }
      );
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const userId = req.user!.id;

      const announcement = await this.service.update(id, data, userId);

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Announcement updated successfully',
        data: announcement
      }
      );
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await this.service.delete(id, userId);

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Announcement deleted successfully'
      }
      );
    } catch (error) {
      next(error);
    }
  };

  publish = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const announcement = await this.service.publish(id, userId);

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "succcess",
        message: 'Announcement published successfully',
        data: announcement
      }
      );
    } catch (error) {
      next(error);
    }
  };

  unpublish = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const announcement = await this.service.unpublish(id, userId);

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "succcess",
        message: 'Announcement unpublished successfully',
        data: announcement
      }
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Commment CONTOLLERS
   */

  addComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // announcement ID
      const userId = req.user!.id;
      const data = req.body;

      const comment = await this.service.addComment(id, userId, data);

      res.status(HTTP_STATUS.CREATED).json({
        code: HTTP_STATUS.CREATED,
        status: "success",
        message: 'Comment added successfully',
        data: comment
      });
    } catch (error) {
      next(error);
    }
  };

  getComments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;

      const result = await this.service.getComments(id, {
        page: Number(page) || 1,
        limit: Number(limit) || 10
      });

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Comments retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  updateComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params;
      const userId = req.user!.id;
      const data = req.body;

      const comment = await this.service.updateComment(commentId, userId, data);

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Comment updated successfully',
        data: comment
      });
    } catch (error) {
      next(error);
    }
  };

  deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params;
      const userId = req.user!.id;

      await this.service.deleteComment(commentId, userId);

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getReplies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params;

      const replies = await this.service.getReplies(commentId);

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Replies retrieved successfully',
        data: replies
      });
    } catch (error) {
      next(error);
    }
  };
}