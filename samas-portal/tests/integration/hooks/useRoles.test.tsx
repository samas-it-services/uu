/**
 * useRoles Hook Integration Tests
 * Updated for new RBAC system (v0.5.0)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import { useRoles, useRole, useSystemRoles, useCustomRoles } from '@/hooks/useRoles';
import { createMockSuperuser } from '@/test-utils/factories/user.factory';
import {
  createMockSuperAdminRole,
  createMockFinanceManagerRole,
  createMockProjectManagerRole,
  createMockEmployeeRole,
} from '@/test-utils/factories/role.factory';
import { User } from '@/types/user';
import { Role } from '@/types/role';

// Mock Firebase modules
vi.mock('firebase/auth');
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(() => ({})),
    doc: vi.fn(() => ({})),
    getDocs: vi.fn(() => Promise.resolve({ docs: [], empty: true, size: 0 })),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => undefined })),
    query: vi.fn(() => ({})),
    where: vi.fn(() => ({})),
    orderBy: vi.fn(() => ({})),
    Timestamp: {
      now: () => ({ toDate: () => new Date() }),
    },
  };
});
vi.mock('@/services/firebase/config', () => ({
  auth: {},
  db: {},
  googleProvider: {},
}));

// Mock the roles API
vi.mock('@/services/api/roles', () => ({
  rolesApi: {
    getAll: vi.fn(() => Promise.resolve([])),
    getById: vi.fn(() => Promise.resolve(null)),
    getSystemRoles: vi.fn(() => Promise.resolve([])),
    getCustomRoles: vi.fn(() => Promise.resolve([])),
    create: vi.fn(() => Promise.resolve('new-id')),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    updatePermissions: vi.fn(() => Promise.resolve()),
  },
}));

const createWrapper = (user: User | null = null, roles: Role[] = []) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  // AuthContext uses `userRole` (singular Role) not `roles` (array)
  const userRole = roles.length > 0 ? roles[0] : null;

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          user,
          firebaseUser: user ? { uid: user.id } : null,
          userRole,
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

describe('useRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useRoles hook', () => {
    it('should fetch all roles', async () => {
      const mockRoles = [
        createMockSuperAdminRole(),
        createMockFinanceManagerRole(),
        createMockProjectManagerRole(),
        createMockEmployeeRole(),
      ];

      const { rolesApi } = await import('@/services/api/roles');
      vi.mocked(rolesApi.getAll).mockResolvedValue(mockRoles);

      const { result } = renderHook(() => useRoles(), {
        wrapper: createWrapper(createMockSuperuser(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(4);
      // New RBAC: Super Admin role is now named "Super User"
      expect(result.current.data?.[0].name).toBe('Super User');
      expect(rolesApi.getAll).toHaveBeenCalled();
    });

    it('should return empty array when no roles exist', async () => {
      const { rolesApi } = await import('@/services/api/roles');
      vi.mocked(rolesApi.getAll).mockResolvedValue([]);

      const { result } = renderHook(() => useRoles(), {
        wrapper: createWrapper(createMockSuperuser(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useRole hook', () => {
    it('should fetch a single role by ID', async () => {
      const mockRole = createMockSuperAdminRole();

      const { rolesApi } = await import('@/services/api/roles');
      vi.mocked(rolesApi.getById).mockResolvedValue(mockRole);

      const { result } = renderHook(() => useRole('superuser'), {
        wrapper: createWrapper(createMockSuperuser(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRole);
      // New RBAC: Role is named "Super User"
      expect(result.current.data?.name).toBe('Super User');
      expect(rolesApi.getById).toHaveBeenCalledWith('superuser');
    });

    it('should not fetch when ID is empty', async () => {
      const { rolesApi } = await import('@/services/api/roles');

      const { result } = renderHook(() => useRole(''), {
        wrapper: createWrapper(createMockSuperuser(), []),
      });

      expect(result.current.isFetching).toBe(false);
      expect(rolesApi.getById).not.toHaveBeenCalled();
    });
  });

  describe('useSystemRoles hook', () => {
    it('should fetch only system roles', async () => {
      const systemRoles = [
        createMockSuperAdminRole(),
        createMockFinanceManagerRole(),
        createMockProjectManagerRole(),
        createMockEmployeeRole(),
      ];

      const { rolesApi } = await import('@/services/api/roles');
      vi.mocked(rolesApi.getSystemRoles).mockResolvedValue(systemRoles);

      const { result } = renderHook(() => useSystemRoles(), {
        wrapper: createWrapper(createMockSuperuser(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(4);
      expect(rolesApi.getSystemRoles).toHaveBeenCalled();
    });
  });

  describe('useCustomRoles hook', () => {
    it('should fetch only custom roles', async () => {
      const { rolesApi } = await import('@/services/api/roles');
      vi.mocked(rolesApi.getCustomRoles).mockResolvedValue([]);

      const { result } = renderHook(() => useCustomRoles(), {
        wrapper: createWrapper(createMockSuperuser(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
      expect(rolesApi.getCustomRoles).toHaveBeenCalled();
    });
  });

  describe('Role Permissions (New RBAC Structure)', () => {
    it('should include correct permissions for super user role', async () => {
      const mockRole = createMockSuperAdminRole();

      const { rolesApi } = await import('@/services/api/roles');
      vi.mocked(rolesApi.getById).mockResolvedValue(mockRole);

      const { result } = renderHook(() => useRole('superuser'), {
        wrapper: createWrapper(createMockSuperuser(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // New RBAC: Permissions use actions array with scope
      expect(result.current.data?.permissions.finance.actions).toContain('create');
      expect(result.current.data?.permissions.finance.actions).toContain('read');
      expect(result.current.data?.permissions.finance.actions).toContain('update');
      expect(result.current.data?.permissions.finance.actions).toContain('delete');
      expect(result.current.data?.permissions.finance.scope).toBe('global');

      expect(result.current.data?.permissions.rbac.actions).toContain('create');
      expect(result.current.data?.permissions.rbac.scope).toBe('global');
    });

    it('should include correct permissions for finance incharge role', async () => {
      const mockRole = createMockFinanceManagerRole();

      const { rolesApi } = await import('@/services/api/roles');
      vi.mocked(rolesApi.getById).mockResolvedValue(mockRole);

      const { result } = renderHook(() => useRole('finance_incharge'), {
        wrapper: createWrapper(createMockSuperuser(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Finance incharge has full finance permissions with global scope
      expect(result.current.data?.permissions.finance.actions).toContain('create');
      expect(result.current.data?.permissions.finance.actions).toContain('delete');
      expect(result.current.data?.permissions.finance.scope).toBe('global');

      // Finance incharge has no RBAC access
      expect(result.current.data?.permissions.rbac.actions).toHaveLength(0);
      expect(result.current.data?.permissions.rbac.scope).toBe('none');
    });

    it('should restrict project manager permissions to project scope', async () => {
      const mockRole = createMockProjectManagerRole();

      const { rolesApi } = await import('@/services/api/roles');
      vi.mocked(rolesApi.getById).mockResolvedValue(mockRole);

      const { result } = renderHook(() => useRole('project_manager'), {
        wrapper: createWrapper(createMockSuperuser(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Project manager has finance read-only at project scope
      expect(result.current.data?.permissions.finance.actions).toContain('read');
      expect(result.current.data?.permissions.finance.actions).not.toContain('delete');
      expect(result.current.data?.permissions.finance.scope).toBe('project');

      // Project manager has full task permissions at project scope
      expect(result.current.data?.permissions.tasks.actions).toContain('create');
      expect(result.current.data?.permissions.tasks.actions).toContain('delete');
      expect(result.current.data?.permissions.tasks.scope).toBe('project');
    });
  });
});
