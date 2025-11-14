import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errorHandler';
import { HTTP_STATUS } from '../../shared/constants/statusCodes';
import { getPaginationParams, getPaginationMeta } from '../../utils/pagination';
import { 
  CreateCommentDto,
  GetAllAnnouncementsParams, 
  PaginationParams,
  UpdateCommentDto,
  RecipientDto,
} from './announcement.types';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './announcement.dto';

export class AnnouncementService {
  private async validateRecipients(recipients: RecipientDto[]) {
    const errors: string[] = [];

    for (const recipient of recipients) {
      if (!['Employee', 'Department'].includes(recipient.type)) {
        errors.push(`Invalid recipient type: ${recipient.type}. Must be 'Employee' or 'Department'`);
        continue;
      }

      if (recipient.type === 'Employee') {
        const employee = await prisma.employees.findUnique({
          where: { id: recipient.id }
        });

        if (!employee) {
          errors.push(`Employee with ID ${recipient.id} not found`);
        }
      }

      if (recipient.type === 'Department') {
        const department = await prisma.departments.findUnique({
          where: { id: recipient.id }
        });

        if (!department) {
          errors.push(`Department with ID ${recipient.id} not found`);
        }
      }
    }

    if (errors.length > 0) {
      throw new AppError(
        `Invalid recipients: ${errors.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

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

  async create(data: CreateAnnouncementDto) {
    const { tags, recipients, ...announcementData } = data;

    if (recipients && recipients.length > 0) {
      await this.validateRecipients(recipients);
    }

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

    if (tags && tags.length > 0) {
      await prisma.announcement_tags.createMany({
        data: tags.map((tag) => ({
          announcement_id: announcement.id,
          tag_name: tag
        }))
      });
    }

    if (recipients && recipients.length > 0) {
      await prisma.announcement_recipients.createMany({
        data: recipients.map((r) => ({
          announcement_id: announcement.id,
          recipient_type: r.type,
          recipient_id: r.id
        }))
      });
    }

    const completeAnnouncement = await prisma.announcements.findUnique({
      where: { id: announcement.id },
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

    return completeAnnouncement;
  }

  async getById(id: string) {
    const announcement = await prisma.announcements.findUnique({
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

    if (!announcement) {
      throw new AppError('Announcement not found', HTTP_STATUS.NOT_FOUND);
    }

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

    if (recipients && recipients.length > 0) {
      await this.validateRecipients(recipients);
    }

    const announcement = await prisma.announcements.update({
      where: { id },
      data: announcementData
    });

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
                nik: true,
                full_name: true
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
    const announcement = await prisma.announcements.findUnique({
      where: { id: announcementId }
    });

    if (!announcement) {
      throw new AppError('Announcement not found', HTTP_STATUS.NOT_FOUND);
    }

    if (!announcement.enable_comments) {
      throw new AppError('Comments are disabled for this announcement', HTTP_STATUS.FORBIDDEN);
    }

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
          take: 3,
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

    const totalToDelete = 1 + existing.other_announcement_comments.length;

    await prisma.announcement_comments.delete({ 
      where: { id: commentId } 
    });

    await prisma.announcements.update({
      where: { id: existing.announcement_id },
      data: { comments_count: { decrement: totalToDelete } }
    });
  }

  async getReplies(commentId: string, params: PaginationParams) {
    const { skip, take } = getPaginationParams(params.page, params.limit);

    const comment = await prisma.announcement_comments.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new AppError('Comment not found', HTTP_STATUS.NOT_FOUND);
    }

    const where = { parent_comment_id: commentId };
    const total = await prisma.announcement_comments.count({ where });

    const replies = await prisma.announcement_comments.findMany({
      where,
      skip,
      take,
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

    return {
      data: replies,
      meta: getPaginationMeta(params.page, params.limit, total)
    };
  }

  /**
   * Tag Methods
   */
  async searchTags(query: string, limit: number = 10) {
    const tags = await prisma.announcement_tags.groupBy({
      by: ['tag_name'],
      where: {
        tag_name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      _count: {
        tag_name: true
      },
      orderBy: {
        _count: {
          tag_name: 'desc'
        }
      },
      take: limit
    });

    return tags.map(tag => ({
      name: tag.tag_name,
      count: tag._count.tag_name
    }));
  }

  async getPopularTags(limit: number = 20) {
    const tags = await prisma.announcement_tags.groupBy({
      by: ['tag_name'],
      _count: {
        tag_name: true
      },
      orderBy: {
        _count: {
          tag_name: 'desc'
        }
      },
      take: limit
    });

    return tags.map(tag => ({
      name: tag.tag_name,
      count: tag._count.tag_name
    }));
  }

  async getAllTags() {
    const tags = await prisma.announcement_tags.groupBy({
      by: ['tag_name'],
      _count: {
        tag_name: true
      },
      orderBy: {
        tag_name: 'asc'
      }
    });

    return tags.map(tag => ({
      name: tag.tag_name,
      count: tag._count.tag_name
    }));
  }
}