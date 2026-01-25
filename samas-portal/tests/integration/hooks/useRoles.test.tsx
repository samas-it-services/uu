/**
 * useRoles Hook Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import { useRoles, useRole, useSystemRoles, useCustomRoles } from '@/hooks/useRoles';
import { createMockSuperAdmin } from '@/test-utils/factories/user.factory';
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
    updateDataAccess: vi.fn(() => Promise.resolve()),
  },
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
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(4);
      expect(result.current.data?.[0].name).toBe('Super Admin');
      expect(rolesApi.getAll).toHaveBeenCalled();
    });

    it('should return empty array when no roles exist', async () => {
      const { rolesApi } = await import('@/services/api/roles');
      vi.mocked(rolesApi.getAll).mockResolvedValue([]);

      const { result } = renderHook(() => useRoles(), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
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

      const { result } = renderHook(() => useRole('super_admin'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRole);
      expect(result.current.data?.name).toBe('Super Admin');
      expect(rolesApi.getById).toHaveBeenCalledWith('super_admin');
    });

    it('should not fetch when ID is empty', async () => {
      const { rolesApi } = await import('@/services/api/roles');

      const { result } = renderHook(() => useRole(''), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
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
        wrapper: createWrapper(createMockSuperAdmin(), []),
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
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
      expect(rolesApi.getCustomRoles).toHaveBeenCalled();
    });
  });

  describe('Role Permissions', () => {
    it('should include correct permissions for super admin role', async () => {
      const mockRole = createMockSuperAdminRole();

      const { rolesApi } = await import('@/services/api/roles');
      vi.mocked(rolesApi.getById).mockResolvedValue(mockRole);

      const { result } = renderHook(() => useRole('super_admin'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Super admin should have all permissions (permissions are objects with boolean values)
      expect(result.current.data?.permissions.finance).toEqual({ create: true, read: true, update: true, delete: true });
      expect(result.current.data?.permissions.projects).toEqual({ create: true, read: true, update: true, delete: true });
      expect(result.current.data?.permissions.rbac).toEqual({ create: true, read: true, update: true, delete: true });
    });

    it('should include correct permissions for finance manager role', async () => {
      const mockRole = createMockFinanceManagerRole();

      const { rolesApi } = await import('@/services/api/roles');
      vi.mocked(rolesApi.getById).mockResolvedValue(mockRole);

      const { result } = renderHook(() => useRole('finance_manager'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Finance manager has finance permissions but not RBAC
      expect(result.current.data?.permissions.finance).toEqual({ create: true, read: true, update: true, delete: true });
      expect(result.current.data?.permissions.rbac).toEqual({ create: false, read: false, update: false, delete: false });
    });

    it('should include correct data access for finance manager role', async () => {
      const mockRole = createMockFinanceManagerRole();

      const { rolesApi } = await import('@/services/api/roles');
      vi.mocked(rolesApi.getById).mockResolvedValue(mockRole);

      const { result } = renderHook(() => useRole('finance_manager'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Finance manager should have sensitive financial data access
      expect(result.current.data?.dataAccess.sensitiveFinancials).toBe(true);
      expect(result.current.data?.dataAccess.allProjects).toBe(true);
    });

    it('should restrict project manager data access', async () => {
      const mockRole = createMockProjectManagerRole();

      const { rolesApi } = await import('@/services/api/roles');
      vi.mocked(rolesApi.getById).mockResolvedValue(mockRole);

      const { result } = renderHook(() => useRole('project_manager'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Project manager should NOT have sensitive data access
      expect(result.current.data?.dataAccess.sensitiveFinancials).toBe(false);
      expect(result.current.data?.dataAccess.allProjects).toBe(false);
    });
  });
});
