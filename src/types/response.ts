export interface ApiResponse<T = any> {
    success: Boolean;
    message: string;
    data?: T;
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

