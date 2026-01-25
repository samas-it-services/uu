import { Timestamp } from 'firebase/firestore';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  targetAudience: TargetAudience;
  projectIds: string[];
  roleIds: string[];
  isPublished: boolean;
  publishedAt: Timestamp | null;
  expiresAt: Timestamp | null;
  isPinned: boolean;
  attachments: AnnouncementAttachment[];
  readBy: AnnouncementRead[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type AnnouncementType =
  | 'general'
  | 'policy'
  | 'event'
  | 'maintenance'
  | 'urgent'
  | 'celebration';

export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'critical';

export type TargetAudience = 'all' | 'projects' | 'roles';

export interface AnnouncementAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface AnnouncementRead {
  userId: string;
  readAt: Timestamp;
}
