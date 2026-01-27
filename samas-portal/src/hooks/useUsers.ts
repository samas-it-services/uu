import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, CreateUserData, UpdateUserData } from '@/services/api/users';
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/utils/auditLog';
import { useAuth } from '@/hooks/useAuth';

const USERS_QUERY_KEY = 'users';

export const useUsers = () => {
  return useQuery({
    queryKey: [USERS_QUERY_KEY],
    queryFn: () => usersApi.getAll(),
  });
};

export const useActiveUsers = () => {
  return useQuery({
    queryKey: [USERS_QUERY_KEY, 'active'],
    queryFn: () => usersApi.getActiveUsers(),
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: [USERS_QUERY_KEY, id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const id = await usersApi.create(data);
      if (currentUser) {
        await createAuditLog({
          action: 'user.created',
          entityType: 'user',
          entityId: id,
          entityName: data.displayName,
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
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      success('User created successfully');
    },
    onError: (err) => {
      error(`Failed to create user: ${err.message}`);
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }) => {
      const existingUser = await usersApi.getById(id);
      await usersApi.update(id, data);
      if (currentUser && existingUser) {
        await createAuditLog({
          action: 'user.updated',
          entityType: 'user',
          entityId: id,
          entityName: existingUser.displayName,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: existingUser as unknown as Record<string, unknown>,
            after: data as unknown as Record<string, unknown>,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      success('User updated successfully');
    },
    onError: (err) => {
      error(`Failed to update user: ${err.message}`);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const existingUser = await usersApi.getById(id);
      await usersApi.delete(id);
      if (currentUser && existingUser) {
        await createAuditLog({
          action: 'user.deleted',
          entityType: 'user',
          entityId: id,
          entityName: existingUser.displayName,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: { before: existingUser as unknown as Record<string, unknown> },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      success('User deleted successfully');
    },
    onError: (err) => {
      error(`Failed to delete user: ${err.message}`);
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const existingUser = await usersApi.getById(id);
      if (isActive) {
        await usersApi.activate(id);
      } else {
        await usersApi.deactivate(id);
      }
      if (currentUser && existingUser) {
        await createAuditLog({
          action: isActive ? 'user.activated' : 'user.deactivated',
          entityType: 'user',
          entityId: id,
          entityName: existingUser.displayName,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
        });
      }
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (err) => {
      error(`Failed to update user status: ${err.message}`);
    },
  });
};

export const useAssignUserRole = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, roleId }: { id: string; roleId: string }) => {
      const existingUser = await usersApi.getById(id);
      await usersApi.assignRole(id, roleId as import('@/types/user').UserRole);
      if (currentUser && existingUser) {
        await createAuditLog({
          action: 'user.roles_assigned',
          entityType: 'user',
          entityId: id,
          entityName: existingUser.displayName,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: { role: existingUser.role },
            after: { role: roleId },
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      success('Role assigned successfully');
    },
    onError: (err) => {
      error(`Failed to assign role: ${err.message}`);
    },
  });
};

export const useAssignUserRoles = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, roleIds }: { id: string; roleIds: string[] }) => {
      const existingUser = await usersApi.getById(id);
      // Single role system - take the first role from the array
      const roleId = roleIds[0] || 'analyst';
      await usersApi.assignRole(id, roleId as import('@/types/user').UserRole);
      if (currentUser && existingUser) {
        await createAuditLog({
          action: 'user.roles_assigned',
          entityType: 'user',
          entityId: id,
          entityName: existingUser.displayName,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: { role: existingUser.role },
            after: { role: roleId },
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      success('Role assigned successfully');
    },
    onError: (err) => {
      error(`Failed to assign role: ${err.message}`);
    },
  });
};

export const useAssignUserProjects = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      projects,
    }: {
      id: string;
      projects: string[];
    }) => {
      const existingUser = await usersApi.getById(id);
      await usersApi.assignProjects(id, projects);
      if (currentUser && existingUser) {
        await createAuditLog({
          action: 'user.projects_assigned',
          entityType: 'user',
          entityId: id,
          entityName: existingUser.displayName,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: { projects: existingUser.projects },
            after: { projects },
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      success('Projects assigned successfully');
    },
    onError: (err) => {
      error(`Failed to assign projects: ${err.message}`);
    },
  });
};
