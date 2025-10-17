import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errorHandler";
import { error } from "console";

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        });
    }

    console.error('Error', err)

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { 
            error: err.message,
            stack: err.stack 
        }),
    });
}