/**
 * usePermissions Hook Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  createMockUser,
  createMockSuperAdmin,
  createMockFinanceManager,
  createMockProjectManager,
  createMockEmployee,
} from '@/test-utils/factories/user.factory';
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
vi.mock('firebase/firestore');
vi.mock('@/services/firebase/config', () => ({
  auth: {},
  db: {},
  googleProvider: {},
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

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Role Identification', () => {
    it('should identify super admin by email', () => {
      const mockUser = createMockUser({ email: 'bill@samas.tech' });

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, []),
      });

      expect(result.current.isSuperAdmin).toBe(true);
    });

    it('should identify super admin by role', () => {
      const mockUser = createMockSuperAdmin();
      const mockRoles = [createMockSuperAdminRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.isSuperAdmin).toBe(true);
    });

    it('should identify finance manager', () => {
      const mockUser = createMockFinanceManager();
      const mockRoles = [createMockFinanceManagerRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.isFinanceManager).toBe(true);
      expect(result.current.isSuperAdmin).toBe(false);
    });

    it('should identify project manager', () => {
      const mockUser = createMockProjectManager();
      const mockRoles = [createMockProjectManagerRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.isProjectManager).toBe(true);
      expect(result.current.isSuperAdmin).toBe(false);
      expect(result.current.isFinanceManager).toBe(false);
    });

    it('should return false for all roles when not authenticated', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(null, []),
      });

      expect(result.current.isSuperAdmin).toBe(false);
      expect(result.current.isFinanceManager).toBe(false);
      expect(result.current.isProjectManager).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true for super admin on any permission', () => {
      const mockUser = createMockSuperAdmin();
      const mockRoles = [createMockSuperAdminRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.hasPermission('finance', 'create')).toBe(true);
      expect(result.current.hasPermission('finance', 'read')).toBe(true);
      expect(result.current.hasPermission('finance', 'update')).toBe(true);
      expect(result.current.hasPermission('finance', 'delete')).toBe(true);
      expect(result.current.hasPermission('rbac', 'delete')).toBe(true);
    });

    it('should check role permissions for finance manager', () => {
      const mockUser = createMockFinanceManager();
      const mockRoles = [createMockFinanceManagerRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      // Finance manager has full finance permissions
      expect(result.current.hasPermission('finance', 'create')).toBe(true);
      expect(result.current.hasPermission('finance', 'read')).toBe(true);
      expect(result.current.hasPermission('finance', 'update')).toBe(true);

      // Finance manager has read-only on projects
      expect(result.current.hasPermission('projects', 'read')).toBe(true);
      expect(result.current.hasPermission('projects', 'create')).toBe(false);

      // Finance manager cannot access RBAC
      expect(result.current.hasPermission('rbac', 'read')).toBe(false);
    });

    it('should check role permissions for employee', () => {
      const mockUser = createMockEmployee();
      const mockRoles = [createMockEmployeeRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      // Employee can read and create expenses
      expect(result.current.hasPermission('finance', 'read')).toBe(true);
      expect(result.current.hasPermission('finance', 'create')).toBe(true);

      // Employee cannot delete finance
      expect(result.current.hasPermission('finance', 'delete')).toBe(false);

      // Employee cannot access RBAC
      expect(result.current.hasPermission('rbac', 'read')).toBe(false);
    });
  });

  describe('canAccessProject', () => {
    it('should allow super admin to access any project', () => {
      const mockUser = createMockSuperAdmin();
      const mockRoles = [createMockSuperAdminRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessProject('any-project')).toBe(true);
      expect(result.current.canAccessProject('another-project')).toBe(true);
    });

    it('should allow finance manager to access any project (read-only)', () => {
      const mockUser = createMockFinanceManager();
      const mockRoles = [createMockFinanceManagerRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessProject('any-project')).toBe(true);
    });

    it('should only allow project manager to access their managed projects', () => {
      const mockUser = createMockProjectManager({
        managedProjects: ['project-1', 'project-2'],
      });
      const mockRoles = [createMockProjectManagerRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessProject('project-1')).toBe(true);
      expect(result.current.canAccessProject('project-2')).toBe(true);
      expect(result.current.canAccessProject('project-3')).toBe(false);
    });

    it('should allow employee to access their member projects', () => {
      const mockUser = createMockEmployee({
        memberProjects: ['project-1'],
      });
      const mockRoles = [createMockEmployeeRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessProject('project-1')).toBe(true);
      expect(result.current.canAccessProject('project-2')).toBe(false);
    });

    it('should deny access when not authenticated', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(null, []),
      });

      expect(result.current.canAccessProject('any-project')).toBe(false);
    });
  });

  describe('canManageProject', () => {
    it('should allow super admin to manage any project', () => {
      const mockUser = createMockSuperAdmin();
      const mockRoles = [createMockSuperAdminRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canManageProject('any-project')).toBe(true);
    });

    it('should only allow project manager to manage their projects', () => {
      const mockUser = createMockProjectManager({
        managedProjects: ['project-1'],
      });
      const mockRoles = [createMockProjectManagerRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canManageProject('project-1')).toBe(true);
      expect(result.current.canManageProject('project-2')).toBe(false);
    });

    it('should not allow finance manager to manage projects', () => {
      const mockUser = createMockFinanceManager();
      const mockRoles = [createMockFinanceManagerRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canManageProject('any-project')).toBe(false);
    });
  });

  describe('canAccessSensitiveData', () => {
    it('should allow super admin to access sensitive data', () => {
      const mockUser = createMockSuperAdmin();
      const mockRoles = [createMockSuperAdminRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessSensitiveData).toBe(true);
    });

    it('should allow finance manager to access sensitive data', () => {
      const mockUser = createMockFinanceManager();
      const mockRoles = [createMockFinanceManagerRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessSensitiveData).toBe(true);
    });

    it('should NOT allow project manager to access sensitive data', () => {
      const mockUser = createMockProjectManager();
      const mockRoles = [createMockProjectManagerRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessSensitiveData).toBe(false);
    });

    it('should NOT allow employee to access sensitive data', () => {
      const mockUser = createMockEmployee();
      const mockRoles = [createMockEmployeeRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessSensitiveData).toBe(false);
    });
  });

  describe('canAccessAllProjects', () => {
    it('should allow super admin to access all projects', () => {
      const mockUser = createMockSuperAdmin();
      const mockRoles = [createMockSuperAdminRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessAllProjects).toBe(true);
    });

    it('should allow finance manager to access all projects', () => {
      const mockUser = createMockFinanceManager();
      const mockRoles = [createMockFinanceManagerRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessAllProjects).toBe(true);
    });

    it('should NOT allow project manager to access all projects', () => {
      const mockUser = createMockProjectManager();
      const mockRoles = [createMockProjectManagerRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessAllProjects).toBe(false);
    });
  });
});
