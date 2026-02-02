import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  announcementsApi,
  CreateAnnouncementData,
  UpdateAnnouncementData,
  AnnouncementFilters,
} from '@/services/api/announcements';
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/utils/auditLog';
import { useAuth } from '@/hooks/useAuth';

const ANNOUNCEMENTS_QUERY_KEY = 'announcements';

/**
 * Fetch all announcements with optional filters
 */
export const useAnnouncements = (filters?: AnnouncementFilters) => {
  return useQuery({
    queryKey: [ANNOUNCEMENTS_QUERY_KEY, filters],
    queryFn: () => announcementsApi.getAll(filters),
  });
};

/**
 * Fetch only published and non-expired announcements
 */
export const usePublishedAnnouncements = () => {
  return useQuery({
    queryKey: [ANNOUNCEMENTS_QUERY_KEY, 'published'],
    queryFn: () => announcementsApi.getPublished(),
  });
};

/**
 * Fetch announcements for a specific user based on their projects and roles
 */
export const useUserAnnouncements = (
  userProjectIds: string[],
  userRoleId: string
) => {
  return useQuery({
    queryKey: [ANNOUNCEMENTS_QUERY_KEY, 'user', userProjectIds, userRoleId],
    queryFn: () => announcementsApi.getForUser(userProjectIds, userRoleId),
    enabled: userProjectIds.length > 0 || !!userRoleId,
  });
};

/**
 * Fetch a single announcement by ID
 */
export const useAnnouncement = (id: string) => {
  return useQuery({
    queryKey: [ANNOUNCEMENTS_QUERY_KEY, id],
    queryFn: () => announcementsApi.getById(id),
    enabled: !!id,
  });
};

/**
 * Get unread announcement count for a user
 */
export const useUnreadAnnouncementCount = (
  userId: string,
  userProjectIds: string[],
  userRoleId: string
) => {
  return useQuery({
    queryKey: [ANNOUNCEMENTS_QUERY_KEY, 'unread-count', userId, userProjectIds, userRoleId],
    queryFn: () => announcementsApi.getUnreadCount(userId, userProjectIds, userRoleId),
    enabled: !!userId && (userProjectIds.length > 0 || !!userRoleId),
  });
};

/**
 * Create a new announcement
 */
export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateAnnouncementData) => {
      const id = await announcementsApi.create(data);
      if (currentUser) {
        await createAuditLog({
          action: 'announcement.created',
          entityType: 'announcement',
          entityId: id,
          entityName: data.title,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
        });
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_QUERY_KEY] });
      success('Announcement created successfully');
    },
    onError: (err: Error) => {
      error(`Failed to create announcement: ${err.message}`);
    },
  });
};

/**
 * Update an existing announcement
 */
export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAnnouncementData }) => {
      const existing = await announcementsApi.getById(id);
      await announcementsApi.update(id, data);
      if (currentUser && existing) {
        await createAuditLog({
          action: 'announcement.updated',
          entityType: 'announcement',
          entityId: id,
          entityName: existing.title,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: existing as unknown as Record<string, unknown>,
            after: data as unknown as Record<string, unknown>,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_QUERY_KEY] });
      success('Announcement updated successfully');
    },
    onError: (err: Error) => {
      error(`Failed to update announcement: ${err.message}`);
    },
  });
};

/**
 * Delete an announcement
 */
export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const existing = await announcementsApi.getById(id);
      await announcementsApi.delete(id);
      if (currentUser && existing) {
        await createAuditLog({
          action: 'announcement.deleted',
          entityType: 'announcement',
          entityId: id,
          entityName: existing.title,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_QUERY_KEY] });
      success('Announcement deleted successfully');
    },
    onError: (err: Error) => {
      error(`Failed to delete announcement: ${err.message}`);
    },
  });
};

/**
 * Mark an announcement as read
 */
export const useMarkAnnouncementAsRead = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (announcementId: string) => {
      if (!currentUser) throw new Error('User not authenticated');
      await announcementsApi.markAsRead(announcementId, currentUser.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_QUERY_KEY] });
    },
  });
};

/**
 * Toggle the pinned status of an announcement
 */
export const useToggleAnnouncementPin = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const newPinnedState = await announcementsApi.togglePin(id);
      if (currentUser) {
        const existing = await announcementsApi.getById(id);
        if (existing) {
          await createAuditLog({
            action: newPinnedState ? 'announcement.pinned' : 'announcement.unpinned',
            entityType: 'announcement',
            entityId: id,
            entityName: existing.title,
            performedBy: {
              id: currentUser.id,
              email: currentUser.email,
              displayName: currentUser.displayName,
            },
          });
        }
      }
      return newPinnedState;
    },
    onSuccess: (isPinned) => {
      queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_QUERY_KEY] });
      success(isPinned ? 'Announcement pinned' : 'Announcement unpinned');
    },
    onError: (err: Error) => {
      error(`Failed to update announcement: ${err.message}`);
    },
  });
};

/**
 * Publish an announcement
 */
export const usePublishAnnouncement = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      await announcementsApi.publish(id);
      if (currentUser) {
        const existing = await announcementsApi.getById(id);
        if (existing) {
          await createAuditLog({
            action: 'announcement.published',
            entityType: 'announcement',
            entityId: id,
            entityName: existing.title,
            performedBy: {
              id: currentUser.id,
              email: currentUser.email,
              displayName: currentUser.displayName,
            },
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_QUERY_KEY] });
      success('Announcement published');
    },
    onError: (err: Error) => {
      error(`Failed to publish announcement: ${err.message}`);
    },
  });
};

/**
 * Unpublish an announcement
 */
export const useUnpublishAnnouncement = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      await announcementsApi.unpublish(id);
      if (currentUser) {
        const existing = await announcementsApi.getById(id);
        if (existing) {
          await createAuditLog({
            action: 'announcement.unpublished',
            entityType: 'announcement',
            entityId: id,
            entityName: existing.title,
            performedBy: {
              id: currentUser.id,
              email: currentUser.email,
              displayName: currentUser.displayName,
            },
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_QUERY_KEY] });
      success('Announcement unpublished');
    },
    onError: (err: Error) => {
      error(`Failed to unpublish announcement: ${err.message}`);
    },
  });
};
