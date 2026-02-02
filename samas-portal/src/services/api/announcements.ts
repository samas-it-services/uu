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
  arrayUnion,
} from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import {
  Announcement,
  AnnouncementType,
  AnnouncementPriority,
  TargetAudience,
  AnnouncementAttachment,
  AnnouncementRead,
} from '@/types/announcement';

const COLLECTION_NAME = 'announcements';

export interface CreateAnnouncementData {
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  targetAudience: TargetAudience;
  projectIds?: string[];
  roleIds?: string[];
  isPublished?: boolean;
  expiresAt?: Timestamp | null;
  isPinned?: boolean;
  attachments?: AnnouncementAttachment[];
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  targetAudience?: TargetAudience;
  projectIds?: string[];
  roleIds?: string[];
  isPublished?: boolean;
  expiresAt?: Timestamp | null;
  isPinned?: boolean;
  attachments?: AnnouncementAttachment[];
}

export interface AnnouncementFilters {
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  isPublished?: boolean;
  isPinned?: boolean;
  authorId?: string;
}

export const announcementsApi = {
  /**
   * Get all announcements with optional filters
   * Returns announcements ordered by isPinned DESC, publishedAt DESC
   */
  async getAll(filters?: AnnouncementFilters, pageLimit = 50): Promise<Announcement[]> {
    const ref = collection(db, COLLECTION_NAME);
    // Base query: order by isPinned first (pinned at top), then by publishedAt
    let q = query(ref, orderBy('isPinned', 'desc'), orderBy('publishedAt', 'desc'));

    if (filters?.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters?.priority) {
      q = query(q, where('priority', '==', filters.priority));
    }
    if (filters?.isPublished !== undefined) {
      q = query(q, where('isPublished', '==', filters.isPublished));
    }
    if (filters?.authorId) {
      q = query(q, where('authorId', '==', filters.authorId));
    }

    q = query(q, limit(pageLimit));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Announcement[];
  },

  /**
   * Get only published and non-expired announcements
   */
  async getPublished(pageLimit = 50): Promise<Announcement[]> {
    const ref = collection(db, COLLECTION_NAME);
    const now = Timestamp.now();

    // Get all published announcements and filter client-side for expiration
    const q = query(
      ref,
      where('isPublished', '==', true),
      orderBy('isPinned', 'desc'),
      orderBy('publishedAt', 'desc'),
      limit(pageLimit)
    );

    const snapshot = await getDocs(q);
    const announcements = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Announcement[];

    // Filter out expired announcements (expiresAt < now)
    return announcements.filter(
      (a) => !a.expiresAt || a.expiresAt.toMillis() > now.toMillis()
    );
  },

  /**
   * Get announcements visible to a specific user based on their projects and roles
   * Returns global announcements + project-targeted + role-targeted
   */
  async getForUser(
    userProjectIds: string[],
    userRoleId: string,
    pageLimit = 50
  ): Promise<Announcement[]> {
    const ref = collection(db, COLLECTION_NAME);
    const now = Timestamp.now();
    const announcementMap = new Map<string, Announcement>();

    // 1. Get all global announcements (targetAudience = 'all')
    const globalQuery = query(
      ref,
      where('isPublished', '==', true),
      where('targetAudience', '==', 'all'),
      orderBy('isPinned', 'desc'),
      orderBy('publishedAt', 'desc'),
      limit(pageLimit)
    );
    const globalSnapshot = await getDocs(globalQuery);
    globalSnapshot.docs.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() } as Announcement;
      if (!data.expiresAt || data.expiresAt.toMillis() > now.toMillis()) {
        announcementMap.set(doc.id, data);
      }
    });

    // 2. Get project-targeted announcements
    if (userProjectIds.length > 0) {
      // Firestore array-contains-any supports up to 10 values
      const projectChunks = [];
      for (let i = 0; i < userProjectIds.length; i += 10) {
        projectChunks.push(userProjectIds.slice(i, i + 10));
      }

      for (const chunk of projectChunks) {
        const projectQuery = query(
          ref,
          where('isPublished', '==', true),
          where('targetAudience', '==', 'projects'),
          where('projectIds', 'array-contains-any', chunk),
          limit(pageLimit)
        );
        const projectSnapshot = await getDocs(projectQuery);
        projectSnapshot.docs.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() } as Announcement;
          if (!data.expiresAt || data.expiresAt.toMillis() > now.toMillis()) {
            announcementMap.set(doc.id, data);
          }
        });
      }
    }

    // 3. Get role-targeted announcements
    if (userRoleId) {
      const roleQuery = query(
        ref,
        where('isPublished', '==', true),
        where('targetAudience', '==', 'roles'),
        where('roleIds', 'array-contains', userRoleId),
        limit(pageLimit)
      );
      const roleSnapshot = await getDocs(roleQuery);
      roleSnapshot.docs.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as Announcement;
        if (!data.expiresAt || data.expiresAt.toMillis() > now.toMillis()) {
          announcementMap.set(doc.id, data);
        }
      });
    }

    // Convert map to array and sort by isPinned DESC, publishedAt DESC
    const announcements = Array.from(announcementMap.values());
    return announcements.sort((a, b) => {
      // Pinned first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then by publishedAt desc
      const aTime = a.publishedAt?.toMillis() ?? 0;
      const bTime = b.publishedAt?.toMillis() ?? 0;
      return bTime - aTime;
    });
  },

  /**
   * Get a single announcement by ID
   */
  async getById(id: string): Promise<Announcement | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Announcement;
  },

  /**
   * Create a new announcement
   */
  async create(data: CreateAnnouncementData): Promise<string> {
    const now = Timestamp.now();
    const ref = collection(db, COLLECTION_NAME);

    const docRef = await addDoc(ref, {
      title: data.title,
      content: data.content,
      type: data.type,
      priority: data.priority,
      authorId: data.authorId,
      authorName: data.authorName,
      authorPhotoURL: data.authorPhotoURL || '',
      targetAudience: data.targetAudience,
      projectIds: data.projectIds || [],
      roleIds: data.roleIds || [],
      isPublished: data.isPublished ?? false,
      publishedAt: data.isPublished ? now : null,
      expiresAt: data.expiresAt || null,
      isPinned: data.isPinned ?? false,
      attachments: data.attachments || [],
      readBy: [],
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  },

  /**
   * Update an existing announcement
   */
  async update(id: string, data: UpdateAnnouncementData): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const now = Timestamp.now();

    // If publishing for the first time, set publishedAt
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: now,
    };

    // Handle publishing state changes
    if (data.isPublished !== undefined) {
      const existing = await this.getById(id);
      if (data.isPublished && !existing?.isPublished) {
        updateData.publishedAt = now;
      } else if (!data.isPublished) {
        updateData.publishedAt = null;
      }
    }

    await updateDoc(docRef, updateData);
  },

  /**
   * Delete an announcement
   */
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  /**
   * Mark an announcement as read by a user
   */
  async markAsRead(id: string, userId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const now = Timestamp.now();

    // Check if user already read this
    const existing = await this.getById(id);
    if (existing?.readBy.some((r) => r.userId === userId)) {
      return; // Already read, no need to update
    }

    const readEntry: AnnouncementRead = {
      userId,
      readAt: now,
    };

    await updateDoc(docRef, {
      readBy: arrayUnion(readEntry),
      updatedAt: now,
    });
  },

  /**
   * Toggle the pinned status of an announcement
   */
  async togglePin(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Announcement not found');

    const newPinnedState = !existing.isPinned;
    const docRef = doc(db, COLLECTION_NAME, id);

    await updateDoc(docRef, {
      isPinned: newPinnedState,
      updatedAt: Timestamp.now(),
    });

    return newPinnedState;
  },

  /**
   * Publish an announcement
   */
  async publish(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const now = Timestamp.now();

    await updateDoc(docRef, {
      isPublished: true,
      publishedAt: now,
      updatedAt: now,
    });
  },

  /**
   * Unpublish an announcement
   */
  async unpublish(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);

    await updateDoc(docRef, {
      isPublished: false,
      publishedAt: null,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Check if a user has read an announcement
   */
  hasUserRead(announcement: Announcement, userId: string): boolean {
    return announcement.readBy.some((r) => r.userId === userId);
  },

  /**
   * Get unread count for a user
   */
  async getUnreadCount(
    userId: string,
    userProjectIds: string[],
    userRoleId: string
  ): Promise<number> {
    const announcements = await this.getForUser(userProjectIds, userRoleId);
    return announcements.filter((a) => !this.hasUserRead(a, userId)).length;
  },
};
