import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errorHandler';
import { HTTP_STATUS } from '../../shared/constants/statusCodes';
import { getPaginationParams, getPaginationMeta } from '../../utils/pagination';
import { 
  GetAllAnnouncementsParams, 
  PaginationParams,
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
}