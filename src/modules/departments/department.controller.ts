import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from './department.service';
import { successResponse } from '../../utils/response';
import { HTTP_STATUS } from '../../shared/constants/statusCodes';

export class DepartmentController {
  private service: DepartmentService;

  constructor() {
    this.service = new DepartmentService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departments = await this.service.getAll();
      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Departments retrieved successfully',
        data: departments
      }
      );
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const department = await this.service.getById(id);
      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Department retrieved successfully',
        data: department
      }
      );
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const department = await this.service.create(data);
      res.status(HTTP_STATUS.CREATED).json({
        code: HTTP_STATUS.CREATED,
        status: "success",
        message: 'Department created successfully',
        data: department
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
      const department = await this.service.update(id, data);
      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Department updated successfully',
        data: department
      }
      );
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.delete(id);
      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Department deleted successfully'
      }
      );
    } catch (error) {
      next(error);
    }
  };
}