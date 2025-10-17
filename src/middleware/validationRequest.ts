import { Request, Response, NextFunction } from "express";
import { ZodTypeAny , ZodError} from "zod";
import { HTTP_STATUS } from "../shared/constants/statusCodes";
import { query } from "winston";

export const validateRequest = (schema: ZodTypeAny) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.issues.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message
                    })),
                });
            }
            next(error)
        }
    }
}