import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  projectRolesApi,
  CreateProjectRoleData,
  UpdateProjectRoleData,
} from '@/services/api/projectRoles';
import { useToast } from '@/hooks/useToast';

/**
 * Query key factory for project roles
 */
export const projectRoleKeys = {
  all: ['projectRoles'] as const,
  lists: () => [...projectRoleKeys.all, 'list'] as const,
  list: (projectId: string) => [...projectRoleKeys.lists(), projectId] as const,
  details: () => [...projectRoleKeys.all, 'detail'] as const,
  detail: (projectId: string, roleId: string) =>
    [...projectRoleKeys.details(), projectId, roleId] as const,
};

/**
 * Hook to fetch all roles for a project
 */
export function useProjectRoles(projectId: string | undefined) {
  return useQuery({
    queryKey: projectRoleKeys.list(projectId || ''),
    queryFn: () => projectRolesApi.getAll(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single project role
 */
export function useProjectRole(projectId: string | undefined, roleId: string | undefined) {
  return useQuery({
    queryKey: projectRoleKeys.detail(projectId || '', roleId || ''),
    queryFn: () => projectRolesApi.getById(projectId!, roleId!),
    enabled: !!projectId && !!roleId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new project role
 */
export function useCreateProjectRole(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: CreateProjectRoleData) =>
      projectRolesApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectRoleKeys.list(projectId) });
      success('Role created successfully');
    },
    onError: (err: Error) => {
      error(`Failed to create role: ${err.message}`);
    },
  });
}

/**
 * Hook to update a project role
 */
export function useUpdateProjectRole(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: UpdateProjectRoleData }) =>
      projectRolesApi.update(projectId, roleId, data),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: projectRoleKeys.list(projectId) });
      queryClient.invalidateQueries({
        queryKey: projectRoleKeys.detail(projectId, roleId),
      });
      success('Role updated successfully');
    },
    onError: (err: Error) => {
      error(`Failed to update role: ${err.message}`);
    },
  });
}

/**
 * Hook to delete a project role
 */
export function useDeleteProjectRole(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (roleId: string) => projectRolesApi.delete(projectId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectRoleKeys.list(projectId) });
      success('Role deleted successfully');
    },
    onError: (err: Error) => {
      error(`Failed to delete role: ${err.message}`);
    },
  });
}

/**
 * Hook to create default roles for a project
 */
export function useCreateDefaultProjectRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectRolesApi.createDefaultRoles(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: projectRoleKeys.list(projectId) });
    },
  });
}

/**
 * Hook to get the default member role for a project
 */
export function useDefaultMemberRole(projectId: string | undefined) {
  return useQuery({
    queryKey: [...projectRoleKeys.list(projectId || ''), 'default-member'],
    queryFn: () => projectRolesApi.getDefaultMemberRole(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}
