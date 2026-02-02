import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '@/services/firebase/config';
import { Document, DocumentType, DocumentShare, DocumentVersion, Folder } from '@/types/document';

const DOCUMENTS_COLLECTION = 'documents';
const FOLDERS_COLLECTION = 'folders';

export interface CreateDocumentData {
  name: string;
  description?: string;
  type: DocumentType;
  projectId?: string | null;
  folderId?: string | null;
  uploadedBy: string;
  uploadedByName: string;
  tags?: string[];
  isSensitive?: boolean;
  visibility?: 'global' | 'project' | 'private' | 'role';
}

export interface UpdateDocumentData {
  name?: string;
  description?: string;
  folderId?: string | null;
  tags?: string[];
  isSensitive?: boolean;
  visibility?: 'global' | 'project' | 'private' | 'role';
}

export interface CreateFolderData {
  name: string;
  parentId?: string | null;
  projectId?: string | null;
  createdBy: string;
  visibility?: 'global' | 'project' | 'private' | 'role';
}

export interface DocumentFilters {
  projectId?: string;
  folderId?: string | null;
  type?: DocumentType;
  uploadedBy?: string;
  tags?: string[];
}

export const documentsApi = {
  // Document operations
  async getAll(filters?: DocumentFilters, pageLimit = 50): Promise<Document[]> {
    const docsRef = collection(db, DOCUMENTS_COLLECTION);
    let q = query(docsRef, orderBy('createdAt', 'desc'));

    if (filters?.projectId) {
      q = query(q, where('projectId', '==', filters.projectId));
    }
    if (filters?.folderId !== undefined) {
      q = query(q, where('folderId', '==', filters.folderId));
    }
    if (filters?.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters?.uploadedBy) {
      q = query(q, where('uploadedBy', '==', filters.uploadedBy));
    }

    q = query(q, limit(pageLimit));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Document[];
  },

  async getById(id: string): Promise<Document | null> {
    const docRef = doc(db, DOCUMENTS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Document;
  },

  async getByFolder(folderId: string | null): Promise<Document[]> {
    const docsRef = collection(db, DOCUMENTS_COLLECTION);
    const q = query(
      docsRef,
      where('folderId', '==', folderId),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Document[];
  },

  async getByProject(projectId: string): Promise<Document[]> {
    const docsRef = collection(db, DOCUMENTS_COLLECTION);
    const q = query(
      docsRef,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Document[];
  },

  async search(searchTerm: string): Promise<Document[]> {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation - consider using Algolia or similar for production
    const docsRef = collection(db, DOCUMENTS_COLLECTION);
    const q = query(docsRef, orderBy('name'));
    const snapshot = await getDocs(q);
    const term = searchTerm.toLowerCase();
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Document)
      .filter(
        (d) =>
          d.name.toLowerCase().includes(term) ||
          d.description.toLowerCase().includes(term) ||
          d.tags.some((t) => t.toLowerCase().includes(term))
      );
  },

  async upload(
    file: File,
    data: CreateDocumentData
  ): Promise<string> {
    const now = Timestamp.now();
    const storagePath = `documents/${data.projectId || 'general'}/${Date.now()}/${file.name}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    // Determine visibility
    let visibility = data.visibility;
    if (!visibility) {
      visibility = data.projectId ? 'project' : 'global';
    }

    const docsRef = collection(db, DOCUMENTS_COLLECTION);
    const docRef = await addDoc(docsRef, {
      name: data.name || file.name,
      description: data.description || '',
      type: data.type,
      mimeType: file.type,
      size: file.size,
      url,
      storagePath,
      projectId: data.projectId || null,
      folderId: data.folderId || null,
      uploadedBy: data.uploadedBy,
      uploadedByName: data.uploadedByName,
      sharedWith: [],
      tags: data.tags || [],
      version: 1,
      previousVersions: [],
      googleDriveId: null,
      isSensitive: data.isSensitive || false,
      visibility,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  },

  async update(id: string, data: UpdateDocumentData): Promise<void> {
    const docRef = doc(db, DOCUMENTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  async uploadNewVersion(
    id: string,
    file: File,
    _uploadedBy: string,
    _notes?: string
  ): Promise<void> {
    const document = await this.getById(id);
    if (!document) throw new Error('Document not found');

    const now = Timestamp.now();
    const storagePath = `documents/${document.projectId || 'general'}/${Date.now()}/${file.name}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    const previousVersion: DocumentVersion = {
      version: document.version,
      url: document.url,
      storagePath: document.storagePath,
      size: document.size,
      uploadedBy: document.uploadedBy,
      uploadedAt: document.updatedAt,
      notes: '',
    };

    const docRef = doc(db, DOCUMENTS_COLLECTION, id);
    await updateDoc(docRef, {
      url,
      storagePath,
      mimeType: file.type,
      size: file.size,
      version: document.version + 1,
      previousVersions: [...document.previousVersions, previousVersion],
      updatedAt: now,
    });
  },

  async delete(id: string): Promise<void> {
    const document = await this.getById(id);
    if (document) {
      // Delete file from storage
      try {
        const storageRef = ref(storage, document.storagePath);
        await deleteObject(storageRef);
      } catch (error) {
        console.error('Error deleting file from storage:', error);
      }

      // Delete previous versions
      for (const version of document.previousVersions) {
        try {
          const versionRef = ref(storage, version.storagePath);
          await deleteObject(versionRef);
        } catch (error) {
          console.error('Error deleting version from storage:', error);
        }
      }
    }

    const docRef = doc(db, DOCUMENTS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  async share(
    id: string,
    share: Omit<DocumentShare, 'sharedAt'>
  ): Promise<void> {
    const document = await this.getById(id);
    if (!document) throw new Error('Document not found');

    const now = Timestamp.now();
    const newShare: DocumentShare = {
      ...share,
      sharedAt: now,
    };

    // Remove existing share for this user if exists
    const existingShares = document.sharedWith.filter(
      (s) => s.userId !== share.userId
    );

    const docRef = doc(db, DOCUMENTS_COLLECTION, id);
    await updateDoc(docRef, {
      sharedWith: [...existingShares, newShare],
      updatedAt: now,
    });
  },

  async unshare(id: string, userId: string): Promise<void> {
    const document = await this.getById(id);
    if (!document) throw new Error('Document not found');

    const docRef = doc(db, DOCUMENTS_COLLECTION, id);
    await updateDoc(docRef, {
      sharedWith: document.sharedWith.filter((s) => s.userId !== userId),
      updatedAt: Timestamp.now(),
    });
  },

  // Folder operations
  async getFolders(parentId: string | null = null, projectId?: string): Promise<Folder[]> {
    const foldersRef = collection(db, FOLDERS_COLLECTION);
    let q = query(foldersRef, where('parentId', '==', parentId), orderBy('name', 'asc'));

    if (projectId) {
      q = query(q, where('projectId', '==', projectId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Folder[];
  },

  async getFolder(id: string): Promise<Folder | null> {
    const docRef = doc(db, FOLDERS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Folder;
  },

  async createFolder(data: CreateFolderData): Promise<string> {
    const now = Timestamp.now();
    const foldersRef = collection(db, FOLDERS_COLLECTION);
    
    // Determine visibility
    let visibility = data.visibility;
    if (!visibility) {
      visibility = data.projectId ? 'project' : 'global';
    }

    const docRef = await addDoc(foldersRef, {
      name: data.name,
      parentId: data.parentId || null,
      projectId: data.projectId || null,
      createdBy: data.createdBy,
      sharedWith: [],
      visibility,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async updateFolder(id: string, name: string): Promise<void> {
    const docRef = doc(db, FOLDERS_COLLECTION, id);
    await updateDoc(docRef, {
      name,
      updatedAt: Timestamp.now(),
    });
  },

  async deleteFolder(id: string): Promise<void> {
    // First delete all documents in this folder
    const documents = await this.getByFolder(id);
    for (const document of documents) {
      await this.delete(document.id);
    }

    // Delete subfolders recursively
    const subfolders = await this.getFolders(id);
    for (const subfolder of subfolders) {
      await this.deleteFolder(subfolder.id);
    }

    const docRef = doc(db, FOLDERS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  async getDocumentStats(projectId?: string): Promise<{
    total: number;
    byType: Record<DocumentType, number>;
    totalSize: number;
  }> {
    const docsRef = collection(db, DOCUMENTS_COLLECTION);
    let q = query(docsRef);

    if (projectId) {
      q = query(q, where('projectId', '==', projectId));
    }

    const snapshot = await getDocs(q);
    const documents = snapshot.docs.map((doc) => doc.data() as Omit<Document, 'id'>);

    const byType: Record<DocumentType, number> = {
      file: 0,
      folder: 0,
      google_doc: 0,
      google_sheet: 0,
      google_slide: 0,
      google_form: 0,
    };

    let totalSize = 0;
    documents.forEach((d) => {
      byType[d.type]++;
      totalSize += d.size;
    });

    return {
      total: documents.length,
      byType,
      totalSize,
    };
  },
};
