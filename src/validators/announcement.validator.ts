import { title } from "process";
import {optional, z} from "zod";

export const createAnnouncementsSchema = z.object({
    body: z.object({
        title: z.string().min(5, "Title must be at least 5 characters").max(255),
        description: z.string().min(10, "Description must be at least 5 characters").max(255),
        content: z.string().min(1, "Content is required"),
        announcementCoverUrl: z.string().url().optional(),
        pageCoverUrl: z.string().url().optional(),
        status: z.enum(['draft', 'published', 'unpublished']).optional().default('draft'),
        enableComments: z.boolean().optional().default(false),
        publishDate: z.string().datetime().optional().nullable(),
        tags: z.array(z.string()).optional(),
        recipients: z.array(
            z.object({
                type: z.enum(['department', 'employee']),
                id: z.string().uuid(),
            })
        ).optional(),
    }),
});

export const updateAnnouncementSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid announcement ID'),
  }),
  body: z.object({
    title: z.string().min(5).max(255).optional(),
    description: z.string().min(10).optional(),
    content: z.string().min(1).optional(),
    announcementCoverUrl: z.string().url().optional(),
    pageCoverUrl: z.string().url().optional(),
    status: z.enum(['draft', 'published', 'unpublished']).optional(),
    enableComments: z.boolean().optional(),
    publishDate: z.string().datetime().optional().nullable(),
    tags: z.array(z.string()).optional(),
    recipients: z.array(
      z.object({
        type: z.enum(['department', 'employee']),
        id: z.string().uuid(),
      })
    ).optional(),
  }),
});

export const getAnnouncementsByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid announcement ID'),
    }),
})