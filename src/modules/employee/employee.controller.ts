import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from './employee.service';
import { successResponse } from '../../utils/response';
import { HTTP_STATUS } from '../../shared/constants/statusCodes';

export class EmployeeController {
  private service: EmployeeService;

  constructor() {
    this.service = new EmployeeService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, departmentId, isActive } = req.query;
      
      const result = await this.service.getAll({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search: search as string,
        departmentId: departmentId as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      });

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Employees retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const employee = await this.service.getById(id);
      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Employee retrieved successfully',
        data: employee
      }
      );
    } catch (error) {
      next(error);
    }
  };

  getByDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { departmentId } = req.params;
      const employees = await this.service.getByDepartment(departmentId);
      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Employees retrieved successfully',
        data: employees
      }
      );
    } catch (error) {
      next(error);
    }
  };

  // Tambahkan method ini
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employee = await this.service.create(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        code: HTTP_STATUS.CREATED,
        status: "success",
        message: 'Employee created successfully',
        data: employee
      }
      );
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const employee = await this.service.update(id, req.body);
      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Employee updated successfully',
        data: employee
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
        message: 'Employee deleted successfully'
      }
      );
    } catch (error) {
      next(error);
    }
  };
}