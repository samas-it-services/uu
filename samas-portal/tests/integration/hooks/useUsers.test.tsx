/**
 * useUsers Hook Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import { useUsers, useActiveUsers, useUser } from '@/hooks/useUsers';
import { createMockUser, createMockSuperAdmin } from '@/test-utils/factories/user.factory';
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

// Mock the users API
vi.mock('@/services/api/users', () => ({
  usersApi: {
    getAll: vi.fn(() => Promise.resolve([])),
    getById: vi.fn(() => Promise.resolve(null)),
    getActiveUsers: vi.fn(() => Promise.resolve([])),
    getByEmail: vi.fn(() => Promise.resolve(null)),
    create: vi.fn(() => Promise.resolve('new-id')),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    activate: vi.fn(() => Promise.resolve()),
    deactivate: vi.fn(() => Promise.resolve()),
    assignRoles: vi.fn(() => Promise.resolve()),
    assignProjects: vi.fn(() => Promise.resolve()),
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

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useUsers hook', () => {
    it('should fetch all users', async () => {
      const mockUsers = [
        createMockUser({ email: 'user1@example.com' }),
        createMockUser({ email: 'user2@example.com' }),
      ];

      const { usersApi } = await import('@/services/api/users');
      vi.mocked(usersApi.getAll).mockResolvedValue(mockUsers);

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUsers);
      expect(usersApi.getAll).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      const { usersApi } = await import('@/services/api/users');
      vi.mocked(usersApi.getAll).mockResolvedValue([]);

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useActiveUsers hook', () => {
    it('should fetch only active users', async () => {
      const activeUsers = [
        createMockUser({ email: 'active@example.com', isActive: true }),
      ];

      const { usersApi } = await import('@/services/api/users');
      vi.mocked(usersApi.getActiveUsers).mockResolvedValue(activeUsers);

      const { result } = renderHook(() => useActiveUsers(), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(activeUsers);
      expect(usersApi.getActiveUsers).toHaveBeenCalled();
    });
  });

  describe('useUser hook', () => {
    it('should fetch a single user by ID', async () => {
      const mockUser = createMockUser({ id: 'user-123', email: 'test@example.com' });

      const { usersApi } = await import('@/services/api/users');
      vi.mocked(usersApi.getById).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useUser('user-123'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUser);
      expect(usersApi.getById).toHaveBeenCalledWith('user-123');
    });

    it('should not fetch when ID is empty', async () => {
      const { usersApi } = await import('@/services/api/users');

      const { result } = renderHook(() => useUser(''), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      // Should not trigger a fetch
      expect(result.current.isFetching).toBe(false);
      expect(usersApi.getById).not.toHaveBeenCalled();
    });

    it('should return null for non-existent user', async () => {
      const { usersApi } = await import('@/services/api/users');
      vi.mocked(usersApi.getById).mockResolvedValue(null);

      const { result } = renderHook(() => useUser('non-existent'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });
  });
});
