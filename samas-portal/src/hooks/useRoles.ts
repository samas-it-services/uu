import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, CreateRoleData, UpdateRoleData } from '@/services/api/roles';
import { RolePermissions } from '@/types/role';
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/utils/auditLog';
import { useAuth } from '@/hooks/useAuth';

const ROLES_QUERY_KEY = 'roles';

export const useRoles = () => {
  return useQuery({
    queryKey: [ROLES_QUERY_KEY],
    queryFn: () => rolesApi.getAll(),
  });
};

export const useRole = (id: string) => {
  return useQuery({
    queryKey: [ROLES_QUERY_KEY, id],
    queryFn: () => rolesApi.getById(id),
    enabled: !!id,
  });
};

export const useSystemRoles = () => {
  return useQuery({
    queryKey: [ROLES_QUERY_KEY, 'system'],
    queryFn: () => rolesApi.getSystemRoles(),
  });
};

export const useCustomRoles = () => {
  return useQuery({
    queryKey: [ROLES_QUERY_KEY, 'custom'],
    queryFn: () => rolesApi.getCustomRoles(),
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateRoleData) => {
      const id = await rolesApi.create(data);
      if (currentUser) {
        await createAuditLog({
          action: 'role.created',
          entityType: 'role',
          entityId: id,
          entityName: data.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: { after: data as unknown as Record<string, unknown> },
        });
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] });
      success('Role created successfully');
    },
    onError: (err) => {
      error(`Failed to create role: ${err.message}`);
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRoleData }) => {
      const existingRole = await rolesApi.getById(id);
      await rolesApi.update(id, data);
      if (currentUser && existingRole) {
        await createAuditLog({
          action: 'role.updated',
          entityType: 'role',
          entityId: id,
          entityName: existingRole.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: existingRole as unknown as Record<string, unknown>,
            after: data as unknown as Record<string, unknown>,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] });
      success('Role updated successfully');
    },
    onError: (err) => {
      error(`Failed to update role: ${err.message}`);
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const existingRole = await rolesApi.getById(id);
      await rolesApi.delete(id);
      if (currentUser && existingRole) {
        await createAuditLog({
          action: 'role.deleted',
          entityType: 'role',
          entityId: id,
          entityName: existingRole.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: { before: existingRole as unknown as Record<string, unknown> },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] });
      success('Role deleted successfully');
    },
    onError: (err) => {
      error(`Failed to delete role: ${err.message}`);
    },
  });
};

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, permissions }: { id: string; permissions: RolePermissions }) => {
      const existingRole = await rolesApi.getById(id);
      await rolesApi.updatePermissions(id, permissions);
      if (currentUser && existingRole) {
        await createAuditLog({
          action: 'role.permissions_updated',
          entityType: 'role',
          entityId: id,
          entityName: existingRole.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: { permissions: existingRole.permissions },
            after: { permissions },
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] });
      success('Permissions updated successfully');
    },
    onError: (err) => {
      error(`Failed to update permissions: ${err.message}`);
    },
  });
};

