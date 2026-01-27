/**
 * useAuth Hook Integration Tests
 * Updated for new RBAC system (v0.5.0)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { createMockUser, createMockSuperuser, createMockAnalyst } from '@/test-utils/factories/user.factory';
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
  // AuthContext uses `userRole` (singular Role) not `roles` (array)
  const userRole = roles.length > 0 ? roles[0] : null;

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
      userRole,
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
      expect(result.current.userRole).toBeNull();
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

    it('should return userRole for authenticated user', () => {
      const mockUser = createMockSuperuser();
      const mockRoles = [createMockSuperAdminRole()];

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser, mockRoles, false),
      });

      expect(result.current.userRole).not.toBeNull();
      // New RBAC: Role is named "Super User"
      expect(result.current.userRole?.name).toBe('Super User');
    });

    it('should identify super user by email', () => {
      // New RBAC: User has single role, not roles array
      const mockUser = createMockUser({ email: 'bill@samas.tech', role: 'superuser' });
      const mockRoles = [createMockSuperAdminRole()];

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser, mockRoles, false),
      });

      expect(result.current.user?.email).toBe('bill@samas.tech');
      // New RBAC: user.role is a string, not user.roles array
      expect(result.current.user?.role).toBe('superuser');
    });

    it('should have signInWithGoogle and signOut functions', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(null, [], false),
      });

      expect(typeof result.current.signInWithGoogle).toBe('function');
      expect(typeof result.current.signOut).toBe('function');
    });
  });

  describe('User Roles (New RBAC Structure)', () => {
    it('should support analyst role', () => {
      // New RBAC: User has single role
      const mockUser = createMockUser({ role: 'analyst' });
      const mockRoles = [createMockEmployeeRole()];

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser, mockRoles, false),
      });

      expect(result.current.user?.role).toBe('analyst');
      expect(result.current.userRole?.id).toBe('analyst');
    });

    it('should have single role per user', () => {
      // New RBAC: Users have exactly one role, not multiple
      const mockUser = createMockUser({ role: 'project_manager' });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser, [], false),
      });

      expect(result.current.user?.role).toBe('project_manager');
      // Verify it's a string, not an array
      expect(typeof result.current.user?.role).toBe('string');
    });
  });

  describe('Project Access (New RBAC Structure)', () => {
    it('should track projects for project manager', () => {
      // New RBAC: User has `projects` array (unified, not separate managed/member)
      const mockUser = createMockUser({
        role: 'project_manager',
        projects: ['project-1', 'project-2'],
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser, [], false),
      });

      expect(result.current.user?.projects).toEqual(['project-1', 'project-2']);
    });

    it('should track projects for analyst', () => {
      // New RBAC: User has `projects` array
      const mockUser = createMockAnalyst({
        projects: ['project-1'],
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser, [], false),
      });

      expect(result.current.user?.projects).toEqual(['project-1']);
    });
  });
});
