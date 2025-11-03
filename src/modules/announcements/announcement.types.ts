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
  department?: {
    id: string;
    name: string;
  };
  employee?: {
    id: string;
    fullName: string;
    nik: string;
  };
}

export interface CommentAuthor {
  id: string;
  nik: string;
  fullName: string;
  avatarUrl: string | null;
  position: string | null;
}

export interface AnnouncementComment {
  id: string;
  announcementId: string;
  userId: string;
  parentCommentId: string | null;
  commentText: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  employees: CommentAuthor;
  otherAnnouncementComments?: AnnouncementComment[];  // Nested replies
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
  updatedAt: Date;
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

export interface CreateAnnouncementDto {
  title: string;
  description?: string;
  content?: string;
  announcement_cover_url?: string;
  page_cover_url?: string;
  status?: string;
  enable_comments?: boolean;
  publish_date?: Date;
  created_by: string;
  tags?: string[];
  recipients?: RecipientDto[];
}

export interface RecipientDto {
  type: 'Employee' | 'Department';
  id: string;
}

export interface UpdateAnnouncementDto {
  title?: string;
  description?: string;
  content?: string;
  announcement_cover_url?: string;
  page_cover_url?: string;
  status?: string;
  enable_comments?: boolean;
  publish_date?: Date | null;
  tags?: string[];
  recipients?: RecipientDto[];
}

export interface CreateCommentDto {
  comment_text: string;
  parent_comment_id?: string | null;
}
    
export interface UpdateCommentDto {
  comment_text: string;
}