/**
 * usePermissions Hook Integration Tests
 * Updated for new RBAC system (v0.5.0)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  createMockUser,
  createMockSuperuser,
  createMockFinanceIncharge,
  createMockProjectManager,
  createMockAnalyst,
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

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Role Identification', () => {
    it('should identify super user by email', () => {
      const mockUser = createMockUser({ email: 'bill@samas.tech' });

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, []),
      });

      expect(result.current.isSuperAdmin).toBe(true);
    });

    it('should identify super user by role', () => {
      const mockUser = createMockSuperuser();
      const mockRoles = [createMockSuperAdminRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.isSuperAdmin).toBe(true);
    });

    it('should identify finance incharge', () => {
      const mockUser = createMockFinanceIncharge();
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

  describe('hasPermission (New RBAC Structure)', () => {
    it('should return true for super user on any permission', () => {
      const mockUser = createMockSuperuser();
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

    it('should check role permissions for finance incharge', () => {
      const mockUser = createMockFinanceIncharge();
      const mockRoles = [createMockFinanceManagerRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      // Finance incharge has full finance permissions
      expect(result.current.hasPermission('finance', 'create')).toBe(true);
      expect(result.current.hasPermission('finance', 'read')).toBe(true);
      expect(result.current.hasPermission('finance', 'update')).toBe(true);

      // Finance incharge has read-only on projects (global scope)
      expect(result.current.hasPermission('projects', 'read')).toBe(true);
      // Note: Finance incharge doesn't have create for projects
      expect(result.current.hasPermission('projects', 'create')).toBe(false);

      // Finance incharge cannot access RBAC
      expect(result.current.hasPermission('rbac', 'read')).toBe(false);
    });

    it('should check role permissions for analyst', () => {
      const mockUser = createMockAnalyst();
      const mockRoles = [createMockEmployeeRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      // Analyst has no finance permissions (scope: none)
      expect(result.current.hasPermission('finance', 'read')).toBe(false);
      expect(result.current.hasPermission('finance', 'create')).toBe(false);

      // Analyst can read projects (project scope)
      expect(result.current.hasPermission('projects', 'read')).toBe(true);

      // Analyst cannot delete projects
      expect(result.current.hasPermission('projects', 'delete')).toBe(false);

      // Analyst cannot access RBAC
      expect(result.current.hasPermission('rbac', 'read')).toBe(false);
    });
  });

  describe('canAccessProject', () => {
    it('should allow super user to access any project', () => {
      const mockUser = createMockSuperuser();
      const mockRoles = [createMockSuperAdminRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessProject('any-project')).toBe(true);
      expect(result.current.canAccessProject('another-project')).toBe(true);
    });

    it('should allow finance incharge to access any project (read-only)', () => {
      const mockUser = createMockFinanceIncharge();
      const mockRoles = [createMockFinanceManagerRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessProject('any-project')).toBe(true);
    });

    it('should only allow project manager to access their assigned projects', () => {
      // New RBAC: User has `projects` array instead of `managedProjects`
      const mockUser = createMockProjectManager({
        projects: ['project-1', 'project-2'],
      });
      const mockRoles = [createMockProjectManagerRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessProject('project-1')).toBe(true);
      expect(result.current.canAccessProject('project-2')).toBe(true);
      expect(result.current.canAccessProject('project-3')).toBe(false);
    });

    it('should allow analyst to access their assigned projects', () => {
      // New RBAC: User has `projects` array instead of `memberProjects`
      const mockUser = createMockAnalyst({
        projects: ['project-1'],
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
    it('should allow super user to manage any project', () => {
      const mockUser = createMockSuperuser();
      const mockRoles = [createMockSuperAdminRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canManageProject('any-project')).toBe(true);
    });

    it('should only allow project manager to manage their projects', () => {
      const mockUser = createMockProjectManager({
        projects: ['project-1'],
      });
      const mockRoles = [createMockProjectManagerRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canManageProject('project-1')).toBe(true);
      expect(result.current.canManageProject('project-2')).toBe(false);
    });

    it('should not allow finance incharge to manage projects', () => {
      const mockUser = createMockFinanceIncharge();
      const mockRoles = [createMockFinanceManagerRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canManageProject('any-project')).toBe(false);
    });
  });

  describe('canAccessSensitiveData', () => {
    it('should allow super user to access sensitive data', () => {
      const mockUser = createMockSuperuser();
      const mockRoles = [createMockSuperAdminRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessSensitiveData).toBe(true);
    });

    it('should allow finance incharge to access sensitive data', () => {
      const mockUser = createMockFinanceIncharge();
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

    it('should NOT allow analyst to access sensitive data', () => {
      const mockUser = createMockAnalyst();
      const mockRoles = [createMockEmployeeRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessSensitiveData).toBe(false);
    });
  });

  describe('canAccessAllProjects', () => {
    it('should allow super user to access all projects', () => {
      const mockUser = createMockSuperuser();
      const mockRoles = [createMockSuperAdminRole()];

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(mockUser, mockRoles),
      });

      expect(result.current.canAccessAllProjects).toBe(true);
    });

    it('should allow finance incharge to access all projects', () => {
      const mockUser = createMockFinanceIncharge();
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
