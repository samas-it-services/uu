/**
 * Google Drive API Service
 *
 * This service provides integration with Google Drive for:
 * - Listing files and folders
 * - Uploading files
 * - Creating documents
 * - Syncing with Firebase Storage
 *
 * Prerequisites:
 * 1. Enable Google Drive API in Google Cloud Console
 * 2. Add the drive.file scope to Firebase Auth
 * 3. Configure OAuth consent screen
 */

import { auth } from '@/services/firebase/config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  owners?: { displayName: string; emailAddress: string }[];
}

export interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

export interface DriveListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

type DriveMimeType =
  | 'application/vnd.google-apps.document'
  | 'application/vnd.google-apps.spreadsheet'
  | 'application/vnd.google-apps.presentation'
  | 'application/vnd.google-apps.form';

const MIME_TYPES = {
  folder: 'application/vnd.google-apps.folder',
  document: 'application/vnd.google-apps.document' as DriveMimeType,
  spreadsheet: 'application/vnd.google-apps.spreadsheet' as DriveMimeType,
  presentation: 'application/vnd.google-apps.presentation' as DriveMimeType,
  form: 'application/vnd.google-apps.form' as DriveMimeType,
};

class GoogleDriveService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    if (this.accessToken && now < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Access token can only be obtained during sign-in with Google provider
    // If we don't have a valid token, the user needs to re-authenticate
    if (!this.accessToken) {
      throw new Error('No access token available. Please connect to Google Drive.');
    }

    // Token expired, need to re-authenticate
    throw new Error('Access token expired. Please reconnect to Google Drive.');
  }

  /**
   * Re-authenticate with Google Drive scope
   */
  async reauthenticate(): Promise<void> {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.setCustomParameters({ prompt: 'consent' });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (credential?.accessToken) {
      this.accessToken = credential.accessToken;
      this.tokenExpiry = Date.now() + 3600000;
    }
  }

  /**
   * Make an authenticated request to the Drive API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isUpload = false
  ): Promise<T> {
    const token = await this.getAccessToken();
    const baseUrl = isUpload ? UPLOAD_API_BASE : DRIVE_API_BASE;

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear it and throw
        this.accessToken = null;
        throw new Error('Authentication expired. Please sign in again.');
      }
      const error = await response.json();
      throw new Error(error.error?.message || 'Drive API error');
    }

    return response.json();
  }

  /**
   * List files in a folder
   */
  async listFiles(
    folderId?: string,
    pageToken?: string,
    pageSize = 50
  ): Promise<DriveListResponse> {
    let query = "trashed = false";

    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    const params = new URLSearchParams({
      q: query,
      pageSize: String(pageSize),
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink, parents, owners)',
      orderBy: 'folder, name',
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    return this.request<DriveListResponse>(`/files?${params}`);
  }

  /**
   * Search for files
   */
  async searchFiles(query: string, pageSize = 20): Promise<DriveListResponse> {
    const searchQuery = `name contains '${query}' and trashed = false`;

    const params = new URLSearchParams({
      q: searchQuery,
      pageSize: String(pageSize),
      fields: 'files(id, name, mimeType, size, webViewLink, iconLink, thumbnailLink)',
    });

    return this.request<DriveListResponse>(`/files?${params}`);
  }

  /**
   * Get file metadata
   */
  async getFile(fileId: string): Promise<DriveFile> {
    const params = new URLSearchParams({
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink, parents, owners',
    });

    return this.request<DriveFile>(`/files/${fileId}?${params}`);
  }

  /**
   * Create a new folder
   */
  async createFolder(name: string, parentId?: string): Promise<DriveFile> {
    const metadata: Record<string, unknown> = {
      name,
      mimeType: MIME_TYPES.folder,
    };

    if (parentId) {
      metadata.parents = [parentId];
    }

    return this.request<DriveFile>('/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    });
  }

  /**
   * Create a new Google Doc/Sheet/Slides
   */
  async createDocument(
    name: string,
    type: 'document' | 'spreadsheet' | 'presentation',
    parentId?: string
  ): Promise<DriveFile> {
    const metadata: Record<string, unknown> = {
      name,
      mimeType: MIME_TYPES[type],
    };

    if (parentId) {
      metadata.parents = [parentId];
    }

    return this.request<DriveFile>('/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    });
  }

  /**
   * Upload a file to Drive
   */
  async uploadFile(
    file: File,
    name?: string,
    parentId?: string
  ): Promise<DriveFile> {
    const metadata: Record<string, unknown> = {
      name: name || file.name,
    };

    if (parentId) {
      metadata.parents = [parentId];
    }

    // Use multipart upload for files
    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    form.append('file', file);

    const token = await this.getAccessToken();

    const response = await fetch(
      `${UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    return response.json();
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.request(`/files/${fileId}`, { method: 'DELETE' });
  }

  /**
   * Move a file to trash
   */
  async trashFile(fileId: string): Promise<DriveFile> {
    return this.request<DriveFile>(`/files/${fileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trashed: true }),
    });
  }

  /**
   * Rename a file
   */
  async renameFile(fileId: string, newName: string): Promise<DriveFile> {
    return this.request<DriveFile>(`/files/${fileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
  }

  /**
   * Move a file to a different folder
   */
  async moveFile(
    fileId: string,
    newParentId: string,
    oldParentId?: string
  ): Promise<DriveFile> {
    const params = new URLSearchParams({
      addParents: newParentId,
    });

    if (oldParentId) {
      params.append('removeParents', oldParentId);
    }

    return this.request<DriveFile>(`/files/${fileId}?${params}`, {
      method: 'PATCH',
    });
  }

  /**
   * Get download URL for a file
   */
  async getDownloadUrl(fileId: string): Promise<string> {
    const file = await this.getFile(fileId);
    return file.webContentLink || '';
  }

  /**
   * Export a Google Doc/Sheet/Slides to a specific format
   */
  async exportFile(
    fileId: string,
    mimeType: string
  ): Promise<Blob> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${DRIVE_API_BASE}/files/${fileId}/export?mimeType=${encodeURIComponent(mimeType)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  /**
   * Check if the user has Drive access
   */
  async checkAccess(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage quota
   */
  async getStorageQuota(): Promise<{
    limit: number;
    usage: number;
    usageInDrive: number;
  }> {
    const response = await this.request<{
      storageQuota: {
        limit: string;
        usage: string;
        usageInDrive: string;
      };
    }>('/about?fields=storageQuota');

    return {
      limit: parseInt(response.storageQuota.limit),
      usage: parseInt(response.storageQuota.usage),
      usageInDrive: parseInt(response.storageQuota.usageInDrive),
    };
  }
}

export const driveService = new GoogleDriveService();
