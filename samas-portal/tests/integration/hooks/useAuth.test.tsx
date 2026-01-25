/**
 * useAuth Hook Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { createMockUser, createMockSuperAdmin } from '@/test-utils/factories/user.factory';
import { createMockSuperAdminRole, createMockEmployeeRole } from '@/test-utils/factories/role.factory';
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

interface MockAuthProviderProps {
  children: ReactNode;
  user?: User | null;
  roles?: Role[];
  loading?: boolean;
}

const createMockAuthProvider = (
  user: User | null = null,
  roles: Role[] = [],
  loading = false
) => {
  const MockAuthProvider = ({ children }: MockAuthProviderProps) => {
    const mockContextValue = {
      user,
      firebaseUser: user
        ? {
            uid: user.id,
            email: user.email,
            displayName: user.displayName,
          }
        : null,
      roles,
      loading,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    };

    return (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );
  };

  return MockAuthProvider;
};

const createWrapper = (
  user: User | null = null,
  roles: Role[] = [],
  loading = false
) => {
  const MockAuthProvider = createMockAuthProvider(user, roles, loading);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>{children}</MockAuthProvider>
    </QueryClientProvider>
  );

  return Wrapper;
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return loading state initially', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(null, [], true),
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
    });

    it('should return null user when not authenticated', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(null, [], false),
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.roles).toEqual([]);
    });
  });

  describe('Authenticated State', () => {
    it('should return user data when authenticated', () => {
      const mockUser = createMockUser({ email: 'test@example.com' });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser, [], false),
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.user?.email).toBe('test@example.com');
    });

    it('should return roles for authenticated user', () => {
      const mockUser = createMockSuperAdmin();
      const mockRoles = [createMockSuperAdminRole()];

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser, mockRoles, false),
      });

      expect(result.current.roles).toHaveLength(1);
      expect(result.current.roles[0].name).toBe('Super Admin');
    });

    it('should identify super admin by email', () => {
      const mockUser = createMockUser({ email: 'bill@samas.tech', roles: ['super_admin'] });
      const mockRoles = [createMockSuperAdminRole()];

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser, mockRoles, false),
      });

      expect(result.current.user?.email).toBe('bill@samas.tech');
      expect(result.current.user?.roles).toContain('super_admin');
    });

    it('should have signInWithGoogle and signOut functions', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(null, [], false),
      });

      expect(typeof result.current.signInWithGoogle).toBe('function');
      expect(typeof result.current.signOut).toBe('function');
    });
  });

  describe('User Roles', () => {
    it('should support employee role', () => {
      const mockUser = createMockUser({ roles: ['employee'] });
      const mockRoles = [createMockEmployeeRole()];

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser, mockRoles, false),
      });

      expect(result.current.user?.roles).toContain('employee');
      expect(result.current.roles[0].id).toBe('employee');
    });

    it('should support multiple roles', () => {
      const mockUser = createMockUser({ roles: ['employee', 'project_manager'] });
      const mockRoles = [createMockEmployeeRole()];

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser, mockRoles, false),
      });

      expect(result.current.user?.roles).toContain('employee');
      expect(result.current.user?.roles).toContain('project_manager');
    });
  });

  describe('Project Access', () => {
    it('should track managed projects for project manager', () => {
      const mockUser = createMockUser({
        roles: ['project_manager'],
        managedProjects: ['project-1', 'project-2'],
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser, [], false),
      });

      expect(result.current.user?.managedProjects).toEqual(['project-1', 'project-2']);
    });

    it('should track member projects for employee', () => {
      const mockUser = createMockUser({
        roles: ['employee'],
        memberProjects: ['project-1'],
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser, [], false),
      });

      expect(result.current.user?.memberProjects).toEqual(['project-1']);
    });
  });
});
