/**
 * useProjectRoles Hook Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import {
  useProjectRoles,
  useProjectRole,
  useCreateProjectRole,
  useUpdateProjectRole,
  useDeleteProjectRole,
} from '@/hooks/useProjectRoles';
import { createMockSuperAdmin } from '@/test-utils/factories/user.factory';
import { User } from '@/types/user';
import { Role, RolePermissions } from '@/types/role';
import { ProjectRole } from '@/types/projectRole';
import { Timestamp } from 'firebase/firestore';

vi.mock('firebase/auth');
vi.mock('firebase/firestore');
vi.mock('@/services/firebase/config', () => ({
  auth: {},
  db: {},
  googleProvider: {},
}));

const mockPermissions: RolePermissions = {
  finance: { actions: ['read'], scope: 'project' },
  documents: { actions: ['read'], scope: 'project' },
  projects: { actions: ['read'], scope: 'project' },
  assets: { actions: ['read'], scope: 'project' },
  tasks: { actions: ['read'], scope: 'project' },
  announcements: { actions: ['read'], scope: 'project' },
  rbac: { actions: [], scope: 'none' },
};

const createMockProjectRole = (overrides: Partial<ProjectRole> = {}): ProjectRole => ({
  id: 'role-1',
  projectId: 'project-1',
  name: 'Developer',
  description: 'Development team member',
  isDefault: true,
  permissions: mockPermissions,
  color: '#3b82f6',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides,
});

vi.mock('@/services/api/projectRoles', () => ({
  projectRolesApi: {
    getAll: vi.fn(() => Promise.resolve([])),
    getById: vi.fn(() => Promise.resolve(null)),
    create: vi.fn(() => Promise.resolve('new-role-id')),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    createDefaultRoles: vi.fn(() => Promise.resolve()),
    hasRoles: vi.fn(() => Promise.resolve(false)),
    getDefaultMemberRole: vi.fn(() => Promise.resolve(null)),
    getAdminRole: vi.fn(() => Promise.resolve(null)),
  },
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

const createWrapper = (user: User | null = null, roles: Role[] = []) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          user,
          firebaseUser: user ? { uid: user.id } : null,
          roles,
          loading: false,
          signInWithGoogle: vi.fn(),
          signOut: vi.fn(),
        }}
      >
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );

  return Wrapper;
};

describe('useProjectRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useProjectRoles hook', () => {
    it('should fetch all roles for a project', async () => {
      const mockRoles = [
        createMockProjectRole({ id: 'role-1', name: 'Project Admin' }),
        createMockProjectRole({ id: 'role-2', name: 'Developer' }),
        createMockProjectRole({ id: 'role-3', name: 'Observer' }),
      ];

      const { projectRolesApi } = await import('@/services/api/projectRoles');
      vi.mocked(projectRolesApi.getAll).mockResolvedValue(mockRoles);

      const { result } = renderHook(() => useProjectRoles('project-1'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data?.[0].name).toBe('Project Admin');
    });

    it('should return empty array for project without roles', async () => {
      const { projectRolesApi } = await import('@/services/api/projectRoles');
      vi.mocked(projectRolesApi.getAll).mockResolvedValue([]);

      const { result } = renderHook(() => useProjectRoles('project-1'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should not fetch when projectId is undefined', async () => {
      const { projectRolesApi } = await import('@/services/api/projectRoles');

      const { result } = renderHook(() => useProjectRoles(undefined), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      expect(result.current.isFetching).toBe(false);
      expect(projectRolesApi.getAll).not.toHaveBeenCalled();
    });
  });

  describe('useProjectRole hook', () => {
    it('should fetch a single role by ID', async () => {
      const mockRole = createMockProjectRole({ id: 'role-123', name: 'Reviewer' });

      const { projectRolesApi } = await import('@/services/api/projectRoles');
      vi.mocked(projectRolesApi.getById).mockResolvedValue(mockRole);

      const { result } = renderHook(() => useProjectRole('project-1', 'role-123'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.name).toBe('Reviewer');
    });

    it('should not fetch when projectId is undefined', async () => {
      const { projectRolesApi } = await import('@/services/api/projectRoles');

      const { result } = renderHook(() => useProjectRole(undefined, 'role-123'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      expect(result.current.isFetching).toBe(false);
      expect(projectRolesApi.getById).not.toHaveBeenCalled();
    });

    it('should not fetch when roleId is undefined', async () => {
      const { projectRolesApi } = await import('@/services/api/projectRoles');

      const { result } = renderHook(() => useProjectRole('project-1', undefined), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      expect(result.current.isFetching).toBe(false);
      expect(projectRolesApi.getById).not.toHaveBeenCalled();
    });
  });

  describe('useCreateProjectRole hook', () => {
    it('should create a new role', async () => {
      const { projectRolesApi } = await import('@/services/api/projectRoles');
      vi.mocked(projectRolesApi.create).mockResolvedValue('new-role-id');

      const { result } = renderHook(() => useCreateProjectRole('project-1'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await act(async () => {
        await result.current.mutateAsync({
          name: 'Custom Role',
          description: 'A custom role for testing',
          permissions: mockPermissions,
          color: '#ff0000',
        });
      });

      expect(projectRolesApi.create).toHaveBeenCalledWith('project-1', {
        name: 'Custom Role',
        description: 'A custom role for testing',
        permissions: mockPermissions,
        color: '#ff0000',
      });
    });

    it('should handle create error', async () => {
      const { projectRolesApi } = await import('@/services/api/projectRoles');
      vi.mocked(projectRolesApi.create).mockRejectedValue(new Error('Permission denied'));

      const { result } = renderHook(() => useCreateProjectRole('project-1'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            name: 'Custom Role',
            description: 'Test',
            permissions: mockPermissions,
          });
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useUpdateProjectRole hook', () => {
    it('should update role permissions', async () => {
      const { projectRolesApi } = await import('@/services/api/projectRoles');
      vi.mocked(projectRolesApi.update).mockResolvedValue();

      const { result } = renderHook(() => useUpdateProjectRole('project-1'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      const updatedPermissions: RolePermissions = {
        ...mockPermissions,
        tasks: { actions: ['create', 'read', 'update', 'delete'], scope: 'project' },
      };

      await act(async () => {
        await result.current.mutateAsync({
          roleId: 'role-1',
          data: { permissions: updatedPermissions },
        });
      });

      expect(projectRolesApi.update).toHaveBeenCalledWith('project-1', 'role-1', {
        permissions: updatedPermissions,
      });
    });

    it('should update role name and description', async () => {
      const { projectRolesApi } = await import('@/services/api/projectRoles');
      vi.mocked(projectRolesApi.update).mockResolvedValue();

      const { result } = renderHook(() => useUpdateProjectRole('project-1'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await act(async () => {
        await result.current.mutateAsync({
          roleId: 'role-1',
          data: {
            name: 'Updated Name',
            description: 'Updated description',
          },
        });
      });

      expect(projectRolesApi.update).toHaveBeenCalledWith('project-1', 'role-1', {
        name: 'Updated Name',
        description: 'Updated description',
      });
    });
  });

  describe('useDeleteProjectRole hook', () => {
    it('should delete a non-default role', async () => {
      const { projectRolesApi } = await import('@/services/api/projectRoles');
      vi.mocked(projectRolesApi.delete).mockResolvedValue();

      const { result } = renderHook(() => useDeleteProjectRole('project-1'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await act(async () => {
        await result.current.mutateAsync('custom-role-1');
      });

      expect(projectRolesApi.delete).toHaveBeenCalledWith('project-1', 'custom-role-1');
    });

    it('should handle delete error for default role', async () => {
      const { projectRolesApi } = await import('@/services/api/projectRoles');
      vi.mocked(projectRolesApi.delete).mockRejectedValue(
        new Error('Cannot delete default project roles')
      );

      const { result } = renderHook(() => useDeleteProjectRole('project-1'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync('default-role-1');
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('Default Roles', () => {
    it('should return 4 default roles for a new project', async () => {
      const mockDefaultRoles = [
        createMockProjectRole({ id: '1', name: 'Project Admin', isDefault: true }),
        createMockProjectRole({ id: '2', name: 'Developer', isDefault: true }),
        createMockProjectRole({ id: '3', name: 'Reviewer', isDefault: true }),
        createMockProjectRole({ id: '4', name: 'Observer', isDefault: true }),
      ];

      const { projectRolesApi } = await import('@/services/api/projectRoles');
      vi.mocked(projectRolesApi.getAll).mockResolvedValue(mockDefaultRoles);

      const { result } = renderHook(() => useProjectRoles('project-1'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(4);
      expect(result.current.data?.every((r) => r.isDefault)).toBe(true);
    });
  });
});
