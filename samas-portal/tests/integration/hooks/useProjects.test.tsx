/**
 * useProjects Hook Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import { useProjects, useProject, useProjectStats } from '@/hooks/useProjects';
import { createMockSuperAdmin, createMockProjectManager } from '@/test-utils/factories/user.factory';
import { createMockProject } from '@/test-utils/factories/project.factory';
import { User } from '@/types/user';
import { Role } from '@/types/role';

vi.mock('firebase/auth');
vi.mock('firebase/firestore');
vi.mock('@/services/firebase/config', () => ({
  auth: {},
  db: {},
  googleProvider: {},
}));

vi.mock('@/services/api/projects', () => ({
  projectsApi: {
    getAll: vi.fn(() => Promise.resolve([])),
    getById: vi.fn(() => Promise.resolve(null)),
    getByStatus: vi.fn(() => Promise.resolve([])),
    getStats: vi.fn(() => Promise.resolve({ total: 0, active: 0, onHold: 0, completed: 0 })),
    create: vi.fn(() => Promise.resolve('new-id')),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    archive: vi.fn(() => Promise.resolve()),
    addTeamMember: vi.fn(() => Promise.resolve()),
    removeTeamMember: vi.fn(() => Promise.resolve()),
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

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useProjects hook', () => {
    it('should fetch all projects for super admin', async () => {
      const mockProjects = [
        createMockProject({ name: 'Website Redesign' }),
        createMockProject({ name: 'Mobile App' }),
      ];

      const { projectsApi } = await import('@/services/api/projects');
      vi.mocked(projectsApi.getAll).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('should return empty array when no projects exist', async () => {
      const { projectsApi } = await import('@/services/api/projects');
      vi.mocked(projectsApi.getAll).mockResolvedValue([]);

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useProject hook', () => {
    it('should fetch a single project by ID', async () => {
      const mockProject = createMockProject({ id: 'project-123', name: 'Test Project' });

      const { projectsApi } = await import('@/services/api/projects');
      vi.mocked(projectsApi.getById).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProject('project-123'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.name).toBe('Test Project');
    });

    it('should not fetch when ID is empty', async () => {
      const { projectsApi } = await import('@/services/api/projects');

      const { result } = renderHook(() => useProject(''), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      expect(result.current.isFetching).toBe(false);
      expect(projectsApi.getById).not.toHaveBeenCalled();
    });
  });

  describe('useProjectStats hook', () => {
    it('should not fetch when project ID is empty', async () => {
      const { projectsApi } = await import('@/services/api/projects');

      const { result } = renderHook(() => useProjectStats(''), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      // Should not trigger a fetch when ID is empty
      expect(result.current.isFetching).toBe(false);
      expect(projectsApi.getStats).not.toHaveBeenCalled();
    });
  });

  describe('Project Status', () => {
    it('should handle active project', async () => {
      const mockProject = createMockProject({ status: 'active' });

      const { projectsApi } = await import('@/services/api/projects');
      vi.mocked(projectsApi.getById).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProject('project-1'), {
        wrapper: createWrapper(createMockProjectManager(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.status).toBe('active');
    });

    it('should handle completed project', async () => {
      const mockProject = createMockProject({ status: 'completed' });

      const { projectsApi } = await import('@/services/api/projects');
      vi.mocked(projectsApi.getById).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProject('project-1'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.status).toBe('completed');
    });
  });

  describe('Project Team', () => {
    it('should include team members in project data', async () => {
      const mockProject = createMockProject({
        teamMembers: ['user-1', 'user-2', 'user-3'],
      });

      const { projectsApi } = await import('@/services/api/projects');
      vi.mocked(projectsApi.getById).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProject('project-1'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.teamMembers).toHaveLength(3);
    });
  });
});
