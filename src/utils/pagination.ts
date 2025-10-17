import { match } from "assert";
import { skip } from "node:test";

export const getPaginationParams = (page: number = 1, limit: number = 10) => {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));

    return {
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
    }
}

export const getPaginationMeta = (
    page: number,
    limit: number,
    total: number
) => ({
    page,
    limit,
    total,
    totalPage: Math.ceil(total / limit),
});

