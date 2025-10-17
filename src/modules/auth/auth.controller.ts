import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { successResponse } from '../../utils/response';
import { HTTP_STATUS } from '../../shared/constants/statusCodes';
import { stat } from 'fs';


export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }
  
  // register = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const data = req.body;
  //     const result = await this.service.register(data);

  //     res.status(HTTP_STATUS.CREATED).json({
  //       code: HTTP_STATUS.CREATED,
  //       message: 'Registration successful',
  //       data: result
  //     }
  //     );
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const result = await this.service.login(data);

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Login successful',
        data: result
      }
      );
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const profile = await this.service.getProfile(userId);

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: "success",
        message: 'Profile retrieved successfully',
        data: profile
      }
      );
    } catch (error) {
      next(error);
    }
  };

  verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      const decoded = this.service.verifyToken(token);

      res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        message: 'Token verified successfully',
        data: decoded
      }
      );
    } catch (error) {
      next(error);
    }
  };
}