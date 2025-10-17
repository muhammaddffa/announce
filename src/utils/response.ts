import { ApiResponse } from "../types/response";

export const successResponse = <T> (
    data: T,
    message: string = 'success'
): ApiResponse<T> => ({
    success: true,
    message,
    data
});

export const errorResponse = (
    message: string,
    statusCode: number = 400
): ApiResponse => ({
    success: false,
    message,
});

