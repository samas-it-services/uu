import { Timestamp } from 'firebase/firestore';

export interface Presence {
  userId: string;
  status: PresenceStatus;
  statusMessage: string;
  lastSeen: Timestamp;
  lastActivity: Timestamp;
  currentPage: string | null;
  device: DeviceInfo | null;
}

// PresenceStatus is defined in user.ts to avoid circular dependency
// Re-export from user.ts
import { PresenceStatus } from './user';
export type { PresenceStatus };

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  action: ActivityAction;
  resourceType: ResourceType;
  resourceId: string;
  resourceName: string;
  projectId: string | null;
  metadata: Record<string, string | number | boolean | null>;
  timestamp: Timestamp;
}

export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'comment'
  | 'assign'
  | 'unassign'
  | 'complete'
  | 'approve'
  | 'reject'
  | 'upload'
  | 'download'
  | 'share';

export type ResourceType =
  | 'task'
  | 'project'
  | 'document'
  | 'expense'
  | 'asset'
  | 'announcement'
  | 'user'
  | 'role';
