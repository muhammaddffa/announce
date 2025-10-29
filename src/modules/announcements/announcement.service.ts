import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errorHandler';
import { HTTP_STATUS } from '../../shared/constants/statusCodes';
import { getPaginationParams, getPaginationMeta } from '../../utils/pagination';
import { 
  CreateCommentDto,
  GetAllAnnouncementsParams, 
  PaginationParams,
  UpdateCommentDto,
} from './announcement.types';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './announcement.dto';

export class AnnouncementService {
  async getStatistics() {
    const [total, published, draft, unpublished] = await Promise.all([
      prisma.announcements.count(),
      prisma.announcements.count({ where: { status: 'published' } }),
      prisma.announcements.count({ where: { status: 'draft' } }),
      prisma.announcements.count({ where: { status: 'unpublished' } })
    ]);

    return {
      totalAnnouncement: total,
      totalPublished: published,
      totalDraft: draft,
      totalUnpublished: unpublished
    };
  }

  async getAll(params: GetAllAnnouncementsParams) {
    const { status, page, limit, search, sortBy = 'created_at', sortOrder = 'desc' } = params;
    const { skip, take } = getPaginationParams(page, limit);

    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const total = await prisma.announcements.count({ where });

    const announcements = await prisma.announcements.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        employees: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            position: true
          }
        }
      }
    });

    return {
      data: announcements,
      meta: getPaginationMeta(page, limit, total)
    };
  }

  async getPublished(params: PaginationParams) {
    return this.getAll({ ...params, status: 'published' });
  }

  async getByUserId(userId: string, params: PaginationParams) {
    const { skip, take } = getPaginationParams(params.page, params.limit);

    const where = { created_by: userId };
    const total = await prisma.announcements.count({ where });

    const announcements = await prisma.announcements.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: 'desc' },
      include: {
        employees: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            position: true
          }
        }
      }
    });

    return {
      data: announcements,
      meta: getPaginationMeta(params.page, params.limit, total)
    };
  }

  // create method
  async create(data: CreateAnnouncementDto) {
    const { tags, recipients, ...announcementData } = data;

    // Create announcement first
    const announcement = await prisma.announcements.create({
      data: announcementData,
      include: {
        employees: {
          select: {
            id: true,
            nik: true,
            full_name: true,
            avatar_url: true,
            position: true
          }
        }
      }
    });

    // Create tags if exists
    if (tags && tags.length > 0) {
      await prisma.announcement_tags.createMany({
        data: tags.map((tag) => ({
          announcement_id: announcement.id,
          tag_name: tag
        }))
      });
    }

    // Create recipients if exists
    if (recipients && recipients.length > 0) {
      await prisma.announcement_recipients.createMany({
        data: recipients.map((r) => ({
          announcement_id: announcement.id,
          recipient_type: r.type,
          recipient_id: r.id
        }))
      });
    }

    // Fetch complete announcement with relations
    const completeAnnouncement = await prisma.announcements.findUnique({
      where: { id: announcement.id },
      include: {
        employees: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            position: true
          }
        },
        announcement_tags: true,
        announcement_recipients: {
          include: {
            employee: {
              select: {
                id: true,
                full_name: true,
                nik: true,
              }
            },
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return completeAnnouncement;
  }

  async getById(id: string) {
    const announcement = await prisma.announcements.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            position: true
          }
        },
        announcement_tags: true,
        announcement_recipients: {
          include: {
            employee: {
              select: {
                id: true,
                full_name: true,
                nik: true,
              }
            },
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!announcement) {
      throw new AppError('Announcement not found', HTTP_STATUS.NOT_FOUND);
    }

    // Increment view count (fire and forget)
    prisma.announcements.update({
      where: { id },
      data: { views_count: { increment: 1 } }
    }).catch((err: any) => console.error('Failed to increment view count:', err));

    return announcement;
  }

  async update(id: string, data: UpdateAnnouncementDto, userId: string) {
    const existing = await prisma.announcements.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError('Announcement not found', HTTP_STATUS.NOT_FOUND);
    }

    if (existing.created_by !== userId) {
      throw new AppError('Unauthorized to update this announcement', HTTP_STATUS.FORBIDDEN);
    }

    const { tags, recipients, ...announcementData } = data;

    // Update announcement
    const announcement = await prisma.announcements.update({
      where: { id },
      data: announcementData
    });

    // Update tags if provided
    if (tags !== undefined) {
      await prisma.announcement_tags.deleteMany({ 
        where: { announcement_id: id } 
      });
      
      if (tags.length > 0) {
        await prisma.announcement_tags.createMany({
          data: tags.map((tag: string) => ({
            announcement_id: id,
            tag_name: tag
          }))
        });
      }
    }

    // Update recipients if provided
    if (recipients !== undefined) {
      await prisma.announcement_recipients.deleteMany({ 
        where: { announcement_id: id } 
      });
      
      if (recipients.length > 0) {
        await prisma.announcement_recipients.createMany({
          data: recipients.map((r) => ({
            announcement_id: id,
            recipient_type: r.type,
            recipient_id: r.id
          }))
        });
      }
    }

    const updatedAnnouncement = await prisma.announcements.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            nik: true,
            full_name: true,
            avatar_url: true,
            position: true
          }
        },
        announcement_tags: true,
        announcement_recipients: {
          include: {
            employee: {
              select: {
                id: true,
                full_name: true,
                nik: true,
              }
            },
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return updatedAnnouncement;
  }

  async delete(id: string, userId: string) {
    const existing = await prisma.announcements.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError('Announcement not found', HTTP_STATUS.NOT_FOUND);
    }

    if (existing.created_by !== userId) {
      throw new AppError('Unauthorized to delete this announcement', HTTP_STATUS.FORBIDDEN);
    }

    await prisma.announcements.delete({ where: { id } });
  }

  async publish(id: string, userId: string) {
    const existing = await prisma.announcements.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError('Announcement not found', HTTP_STATUS.NOT_FOUND);
    }

    if (existing.created_by !== userId) {
      throw new AppError('Unauthorized to publish this announcement', HTTP_STATUS.FORBIDDEN);
    }

    return prisma.announcements.update({
      where: { id },
      data: {
        status: 'published',
        publish_date: existing.publish_date || new Date()
      }
    });
  }

  async unpublish(id: string, userId: string) {
    const existing = await prisma.announcements.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError('Announcement not found', HTTP_STATUS.NOT_FOUND);
    }

    if (existing.created_by !== userId) {
      throw new AppError('Unauthorized to unpublish this announcement', HTTP_STATUS.FORBIDDEN);
    }

    return prisma.announcements.update({
      where: { id },
      data: { status: 'unpublished' }
    });
  }

  /**
   * Comment Methods
   */
  async addComment(announcementId: string, userId: string, data: CreateCommentDto) {
    // Check if announcement exists
    const announcement = await prisma.announcements.findUnique({
      where: { id: announcementId }
    });

    if (!announcement) {
      throw new AppError('Announcement not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if comments are enabled
    if (!announcement.enable_comments) {
      throw new AppError('Comments are disabled for this announcement', HTTP_STATUS.FORBIDDEN);
    }

    // Create comment
    const comment = await prisma.announcement_comments.create({
      data: {
        announcement_id: announcementId,
        user_id: userId,  
        comment_text: data.comment_text,
        parent_comment_id: data.parent_comment_id || null
      },
      include: {
        employees: {
          select: {
            id: true,
            nik: true,
            full_name: true,
            avatar_url: true,
            position: true
          }
        }
      }
    });

    // Increment comments count
    await prisma.announcements.update({
      where: { id: announcementId },
      data: { comments_count: { increment: 1 } }
    });

    return comment;
  }

  async getComments(announcementId: string, params: PaginationParams) {
  const { skip, take } = getPaginationParams(params.page, params.limit);

  const announcement = await prisma.announcements.findUnique({
    where: { id: announcementId }
  });

  if (!announcement) {
    throw new AppError('Announcement not found', HTTP_STATUS.NOT_FOUND);
  }

  const where = { 
    announcement_id: announcementId,
    parent_comment_id: null
  };

  const total = await prisma.announcement_comments.count({ where });

  const comments = await prisma.announcement_comments.findMany({
    where,
    skip,
    take,
    orderBy: { created_at: 'desc' },
    include: {
      employees: {
        select: {
          id: true,
          nik: true,
          full_name: true,
          avatar_url: true,
          position: true
        }
      },
      other_announcement_comments: {
        take: 1,
        orderBy: { created_at: 'asc' },
        include: {
          employees: {
            select: {
              id: true,
              nik: true,
              full_name: true,
              avatar_url: true,
              position: true
            }
          }
        }
      },
      _count: {
        select: {
          other_announcement_comments: true
        }
      }
    }
  });

  return {
    data: comments,
    meta: getPaginationMeta(params.page, params.limit, total)
  };
}

  async updateComment(commentId: string, userId: string, data: UpdateCommentDto) {
    const existing = await prisma.announcement_comments.findUnique({
      where: { id: commentId }
    });

    if (!existing) {
      throw new AppError('Comment not found', HTTP_STATUS.NOT_FOUND);
    }

    if (existing.user_id !== userId) { 
      throw new AppError('Unauthorized to update this comment', HTTP_STATUS.FORBIDDEN);
    }

    return prisma.announcement_comments.update({
      where: { id: commentId },
      data: { 
        comment_text: data.comment_text, 
        is_edited: true,
        updated_at: new Date()
      },
      include: {
        employees: {
          select: {
            id: true,
            nik: true,
            full_name: true,
            avatar_url: true,
            position: true
          }
        }
      }
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const existing = await prisma.announcement_comments.findUnique({
      where: { id: commentId },
      include: {
        other_announcement_comments: true
      }
    });

    if (!existing) {
      throw new AppError('Comment not found', HTTP_STATUS.NOT_FOUND);
    }

    if (existing.user_id !== userId) {
      throw new AppError('Unauthorized to delete this comment', HTTP_STATUS.FORBIDDEN);
    }

    // Hitung total comments to delete (parent + all nested replies)
    const totalToDelete = 1 + existing.other_announcement_comments.length;

    // Delete comment (will cascade delete replies due to onDelete: Cascade)
    await prisma.announcement_comments.delete({ 
      where: { id: commentId } 
    });

    // Decrement comments count
    await prisma.announcements.update({
      where: { id: existing.announcement_id },
      data: { comments_count: { decrement: totalToDelete } }
    });
  }

  async getReplies(commentId: string) {
    const comment = await prisma.announcement_comments.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new AppError('Comment not found', HTTP_STATUS.NOT_FOUND);
    }

    const replies = await prisma.announcement_comments.findMany({
      where: { parent_comment_id: commentId },
      orderBy: { created_at: 'asc' },
      include: {
        employees: {
          select: {
            id: true,
            nik: true,
            full_name: true,
            avatar_url: true,
            position: true
          }
        }
      }
    });

    return replies;
  }
}
