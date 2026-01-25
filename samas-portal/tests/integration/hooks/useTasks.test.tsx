/**
 * useTasks Hook Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import { useTasks, useTask, useProjectTasks } from '@/hooks/useTasks';
import { createMockSuperAdmin, createMockEmployee } from '@/test-utils/factories/user.factory';
import { createMockTask } from '@/test-utils/factories/task.factory';
import { User } from '@/types/user';
import { Role } from '@/types/role';

vi.mock('firebase/auth');
vi.mock('firebase/firestore');
vi.mock('@/services/firebase/config', () => ({
  auth: {},
  db: {},
  googleProvider: {},
}));

vi.mock('@/services/api/tasks', () => ({
  tasksApi: {
    getAll: vi.fn(() => Promise.resolve([])),
    getById: vi.fn(() => Promise.resolve(null)),
    getByProject: vi.fn(() => Promise.resolve([])),
    getByAssignee: vi.fn(() => Promise.resolve([])),
    getByStatus: vi.fn(() => Promise.resolve([])),
    create: vi.fn(() => Promise.resolve('new-id')),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    updateStatus: vi.fn(() => Promise.resolve()),
    addComment: vi.fn(() => Promise.resolve()),
    addAttachment: vi.fn(() => Promise.resolve()),
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

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useTasks hook', () => {
    it('should fetch all tasks', async () => {
      const mockTasks = [
        createMockTask({ title: 'Implement login' }),
        createMockTask({ title: 'Design homepage' }),
      ];

      const { tasksApi } = await import('@/services/api/tasks');
      vi.mocked(tasksApi.getAll).mockResolvedValue(mockTasks);

      const { result } = renderHook(() => useTasks(), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
    });
  });

  describe('useTask hook', () => {
    it('should fetch a single task by ID', async () => {
      const mockTask = createMockTask({ id: 'task-123', title: 'Test Task' });

      const { tasksApi } = await import('@/services/api/tasks');
      vi.mocked(tasksApi.getById).mockResolvedValue(mockTask);

      const { result } = renderHook(() => useTask('task-123'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.title).toBe('Test Task');
    });

    it('should not fetch when ID is empty', async () => {
      const { tasksApi } = await import('@/services/api/tasks');

      const { result } = renderHook(() => useTask(''), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      expect(result.current.isFetching).toBe(false);
      expect(tasksApi.getById).not.toHaveBeenCalled();
    });
  });

  describe('useProjectTasks hook', () => {
    it('should fetch tasks for a specific project', async () => {
      const mockTasks = [
        createMockTask({ projectId: 'project-1', title: 'Task 1' }),
        createMockTask({ projectId: 'project-1', title: 'Task 2' }),
      ];

      const { tasksApi } = await import('@/services/api/tasks');
      vi.mocked(tasksApi.getByProject).mockResolvedValue(mockTasks);

      const { result } = renderHook(() => useProjectTasks('project-1'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(tasksApi.getByProject).toHaveBeenCalledWith('project-1');
    });

    it('should not fetch when project ID is empty', async () => {
      const { tasksApi } = await import('@/services/api/tasks');

      renderHook(() => useProjectTasks(''), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      expect(tasksApi.getByProject).not.toHaveBeenCalled();
    });
  });

  describe('Task Status (Kanban)', () => {
    const statuses = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const;

    for (const status of statuses) {
      it(`should handle task with ${status} status`, async () => {
        const mockTask = createMockTask({ status });

        const { tasksApi } = await import('@/services/api/tasks');
        vi.mocked(tasksApi.getById).mockResolvedValue(mockTask);

        const { result } = renderHook(() => useTask('task-1'), {
          wrapper: createWrapper(createMockEmployee(), []),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.status).toBe(status);
      });
    }
  });

  describe('Task Priority', () => {
    const priorities = ['low', 'medium', 'high', 'urgent'] as const;

    for (const priority of priorities) {
      it(`should handle task with ${priority} priority`, async () => {
        const mockTask = createMockTask({ priority });

        const { tasksApi } = await import('@/services/api/tasks');
        vi.mocked(tasksApi.getById).mockResolvedValue(mockTask);

        const { result } = renderHook(() => useTask('task-1'), {
          wrapper: createWrapper(createMockEmployee(), []),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.priority).toBe(priority);
      });
    }
  });

  describe('Task Assignee', () => {
    it('should include assignee in task data', async () => {
      const mockTask = createMockTask({ assigneeId: 'user-123' });

      const { tasksApi } = await import('@/services/api/tasks');
      vi.mocked(tasksApi.getById).mockResolvedValue(mockTask);

      const { result } = renderHook(() => useTask('task-1'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.assigneeId).toBe('user-123');
    });
  });
});
