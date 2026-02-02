import { Timestamp } from 'firebase/firestore';

export interface Document {
  id: string;
  name: string;
  description: string;
  type: DocumentType;
  mimeType: string;
  size: number;
  url: string;
  storagePath: string;
  projectId: string | null;
  folderId: string | null;
  uploadedBy: string;
  uploadedByName: string;
  sharedWith: DocumentShare[];
  tags: string[];
  version: number;
  previousVersions: DocumentVersion[];
  googleDriveId: string | null;
  isSensitive: boolean;
  visibility: 'global' | 'project' | 'private' | 'role';
  allowedRoles?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type DocumentType =
  | 'file'
  | 'folder'
  | 'google_doc'
  | 'google_sheet'
  | 'google_slide'
  | 'google_form';

export interface DocumentShare {
  userId: string;
  userName: string;
  permission: 'view' | 'comment' | 'edit';
  sharedAt: Timestamp;
  sharedBy: string;
}

export interface DocumentVersion {
  version: number;
  url: string;
  storagePath: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Timestamp;
  notes: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  projectId: string | null;
  createdBy: string;
  sharedWith: DocumentShare[];
  visibility: 'global' | 'project' | 'private' | 'role';
  allowedRoles?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
