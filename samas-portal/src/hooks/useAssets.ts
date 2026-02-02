import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  assetsApi,
  CreateAssetData,
  UpdateAssetData,
  AssetFilters,
  CreateMaintenanceData,
} from '@/services/api/assets';
import { AssetStatus } from '@/types/asset';
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/utils/auditLog';
import { useAuth } from '@/hooks/useAuth';

const ASSETS_QUERY_KEY = 'assets';

/**
 * Fetch all assets with optional filters
 */
export const useAssets = (filters?: AssetFilters) => {
  return useQuery({
    queryKey: [ASSETS_QUERY_KEY, filters],
    queryFn: () => assetsApi.getAll(filters),
  });
};

/**
 * Fetch assets for a specific project
 */
export const useProjectAssets = (projectId: string, includeGlobal = false) => {
  return useQuery({
    queryKey: [ASSETS_QUERY_KEY, 'project', projectId, includeGlobal],
    queryFn: () => assetsApi.getByProject(projectId, includeGlobal),
    enabled: !!projectId,
  });
};

/**
 * Fetch assets assigned to a specific user
 */
export const useUserAssets = (userId: string) => {
  return useQuery({
    queryKey: [ASSETS_QUERY_KEY, 'user', userId],
    queryFn: () => assetsApi.getByAssignee(userId),
    enabled: !!userId,
  });
};

/**
 * Fetch global assets
 */
export const useGlobalAssets = () => {
  return useQuery({
    queryKey: [ASSETS_QUERY_KEY, 'global'],
    queryFn: () => assetsApi.getGlobal(),
  });
};

/**
 * Fetch a single asset by ID
 */
export const useAsset = (id: string) => {
  return useQuery({
    queryKey: [ASSETS_QUERY_KEY, id],
    queryFn: () => assetsApi.getById(id),
    enabled: !!id,
  });
};

/**
 * Search assets
 */
export const useSearchAssets = (searchTerm: string, projectId?: string) => {
  return useQuery({
    queryKey: [ASSETS_QUERY_KEY, 'search', searchTerm, projectId],
    queryFn: () => assetsApi.search(searchTerm, projectId),
    enabled: searchTerm.length >= 2,
  });
};

/**
 * Get asset statistics
 */
export const useAssetStats = (projectId?: string) => {
  return useQuery({
    queryKey: [ASSETS_QUERY_KEY, 'stats', projectId],
    queryFn: () => assetsApi.getStats(projectId),
  });
};

/**
 * Create a new asset
 */
export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateAssetData) => {
      const id = await assetsApi.create(data);
      if (currentUser) {
        await createAuditLog({
          action: 'asset.created',
          entityType: 'asset',
          entityId: id,
          entityName: data.name,
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
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
      success('Asset created successfully');
    },
    onError: (err: Error) => {
      error(`Failed to create asset: ${err.message}`);
    },
  });
};

/**
 * Update an existing asset
 */
export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAssetData }) => {
      const existing = await assetsApi.getById(id);
      await assetsApi.update(id, data);
      if (currentUser && existing) {
        await createAuditLog({
          action: 'asset.updated',
          entityType: 'asset',
          entityId: id,
          entityName: existing.name,
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
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
      success('Asset updated successfully');
    },
    onError: (err: Error) => {
      error(`Failed to update asset: ${err.message}`);
    },
  });
};

/**
 * Delete an asset
 */
export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const existing = await assetsApi.getById(id);
      await assetsApi.delete(id);
      if (currentUser && existing) {
        await createAuditLog({
          action: 'asset.deleted',
          entityType: 'asset',
          entityId: id,
          entityName: existing.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
      success('Asset deleted successfully');
    },
    onError: (err: Error) => {
      error(`Failed to delete asset: ${err.message}`);
    },
  });
};

/**
 * Assign an asset to a user
 */
export const useAssignAsset = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({
      assetId,
      userId,
      userName,
      force,
    }: {
      assetId: string;
      userId: string;
      userName: string;
      force?: boolean;
    }) => {
      const existing = await assetsApi.getById(assetId);
      await assetsApi.assign(assetId, userId, userName, force);
      if (currentUser && existing) {
        await createAuditLog({
          action: 'asset.assigned',
          entityType: 'asset',
          entityId: assetId,
          entityName: existing.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: { assignedTo: existing.assignedTo, assignedToName: existing.assignedToName },
            after: { assignedTo: userId, assignedToName: userName },
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
      success('Asset assigned successfully');
    },
    onError: (err: Error) => {
      error(`Failed to assign asset: ${err.message}`);
    },
  });
};

/**
 * Unassign an asset from a user
 */
export const useUnassignAsset = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (assetId: string) => {
      const existing = await assetsApi.getById(assetId);
      await assetsApi.unassign(assetId);
      if (currentUser && existing) {
        await createAuditLog({
          action: 'asset.unassigned',
          entityType: 'asset',
          entityId: assetId,
          entityName: existing.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: { assignedTo: existing.assignedTo, assignedToName: existing.assignedToName },
            after: { assignedTo: null, assignedToName: null },
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
      success('Asset unassigned successfully');
    },
    onError: (err: Error) => {
      error(`Failed to unassign asset: ${err.message}`);
    },
  });
};

/**
 * Update asset status
 */
export const useUpdateAssetStatus = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ assetId, status }: { assetId: string; status: AssetStatus }) => {
      const existing = await assetsApi.getById(assetId);
      await assetsApi.updateStatus(assetId, status);
      if (currentUser && existing) {
        await createAuditLog({
          action: 'asset.status_updated',
          entityType: 'asset',
          entityId: assetId,
          entityName: existing.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: { status: existing.status },
            after: { status },
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
      success('Asset status updated');
    },
    onError: (err: Error) => {
      error(`Failed to update asset status: ${err.message}`);
    },
  });
};

/**
 * Add maintenance record to an asset
 */
export const useAddMaintenanceRecord = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({
      assetId,
      data,
    }: {
      assetId: string;
      data: CreateMaintenanceData;
    }) => {
      const recordId = await assetsApi.addMaintenance(assetId, data);
      const existing = await assetsApi.getById(assetId);
      if (currentUser && existing) {
        await createAuditLog({
          action: 'asset.maintenance_added',
          entityType: 'asset',
          entityId: assetId,
          entityName: existing.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            after: { maintenanceRecord: data },
          },
        });
      }
      return recordId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
      success('Maintenance record added');
    },
    onError: (err: Error) => {
      error(`Failed to add maintenance record: ${err.message}`);
    },
  });
};
