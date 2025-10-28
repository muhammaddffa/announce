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
  type: 'employee' | 'department';
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
  recipients?: Array<{
    type: 'department' | 'employee';
    id: string;
  }>;
}