import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errorHandler';
import { HTTP_STATUS } from '../shared/constants/statusCodes';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    
    if (!process.env.JWT_SECRET) {
      throw new AppError('JWT_SECRET not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      employeeNumber: decoded.employeeNumber
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', HTTP_STATUS.UNAUTHORIZED));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Token expired', HTTP_STATUS.UNAUTHORIZED));
    } else {
      next(error);
    }
  }
};