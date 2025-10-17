export interface AnnouncementAuthor {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    position: string | null;
}

export interface AnnouncementTag {
    id: string;
    tagName: string;
}

export interface AnnouncementRecipient {
    id: string;
    recipientType: 'department' | 'employee';
    recipientId: string;
    department?:{
        id: string;
        name: string;
    };
    employee?: {
        id: string
        fullName: string
        employeeNumber: string
    };
}

export interface Announcement {
    id: string;
    title: string;
    description: string | null;
    content: string;
    announcementCoverUrl: string | null;
    pageCoverUrl: string | null;
    status: 'draft' | 'published' | 'unpublished';
    enableComments: boolean;
    publishDate: Date | null;
    viewsCount: number;
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    createdAt: Date;
    updateAt: Date;
    createdBy: string;
    author?: AnnouncementAuthor;
    tags?: AnnouncementTag[];
    recipients?: AnnouncementRecipient[];
}

export interface GetAllAnnouncementsParams {
    status?: string;
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
    page: number;
    limit: number;
}
