/**
 * useExpenses Hook Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import { useExpenses, useExpense, useExpenseStats } from '@/hooks/useExpenses';
import { createMockSuperAdmin, createMockEmployee } from '@/test-utils/factories/user.factory';
import { createMockExpense } from '@/test-utils/factories/expense.factory';
import { User } from '@/types/user';
import { Role } from '@/types/role';

vi.mock('firebase/auth');
vi.mock('firebase/firestore');
vi.mock('@/services/firebase/config', () => ({
  auth: {},
  db: {},
  googleProvider: {},
}));

vi.mock('@/services/api/expenses', () => ({
  expensesApi: {
    getAll: vi.fn(() => Promise.resolve({ expenses: [], total: 0, hasMore: false })),
    getById: vi.fn(() => Promise.resolve(null)),
    getByUser: vi.fn(() => Promise.resolve([])),
    getByProject: vi.fn(() => Promise.resolve([])),
    getByStatus: vi.fn(() => Promise.resolve([])),
    getPending: vi.fn(() => Promise.resolve([])),
    getExpenseStats: vi.fn(() => Promise.resolve({ total: 0, pending: 0, approved: 0, rejected: 0, paid: 0 })),
    create: vi.fn(() => Promise.resolve('new-id')),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    submit: vi.fn(() => Promise.resolve()),
    approve: vi.fn(() => Promise.resolve()),
    reject: vi.fn(() => Promise.resolve()),
    markAsPaid: vi.fn(() => Promise.resolve()),
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

describe('useExpenses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useExpenses hook', () => {
    it('should fetch all expenses', async () => {
      const mockExpenses = [
        createMockExpense({ description: 'Office supplies' }),
        createMockExpense({ description: 'Travel expenses' }),
      ];

      const { expensesApi } = await import('@/services/api/expenses');
      vi.mocked(expensesApi.getAll).mockResolvedValue({ expenses: mockExpenses, total: 2, hasMore: false });

      const { result } = renderHook(() => useExpenses(), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // useExpenses returns { pages: [{ expenses, total, hasMore }], pageParams: [] }
      expect(result.current.data?.pages[0].expenses).toHaveLength(2);
    });

    it('should return empty array when no expenses exist', async () => {
      const { expensesApi } = await import('@/services/api/expenses');
      vi.mocked(expensesApi.getAll).mockResolvedValue({ expenses: [], total: 0, hasMore: false });

      const { result } = renderHook(() => useExpenses(), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.pages[0].expenses).toEqual([]);
    });
  });

  describe('useExpense hook', () => {
    it('should fetch a single expense by ID', async () => {
      const mockExpense = createMockExpense({ id: 'expense-123' });

      const { expensesApi } = await import('@/services/api/expenses');
      vi.mocked(expensesApi.getById).mockResolvedValue(mockExpense);

      const { result } = renderHook(() => useExpense('expense-123'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.id).toBe('expense-123');
    });

    it('should not fetch when ID is empty', async () => {
      const { expensesApi } = await import('@/services/api/expenses');

      const { result } = renderHook(() => useExpense(''), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      expect(result.current.isFetching).toBe(false);
      expect(expensesApi.getById).not.toHaveBeenCalled();
    });
  });

  describe('useExpenseStats hook', () => {
    it('should fetch expense statistics', async () => {
      const mockStats = {
        total: 5000,
        pending: 1000,
        approved: 3000,
        rejected: 500,
        paid: 500,
      };

      const { expensesApi } = await import('@/services/api/expenses');
      vi.mocked(expensesApi.getExpenseStats).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useExpenseStats(), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.total).toBe(5000);
      expect(result.current.data?.pending).toBe(1000);
    });
  });

  describe('Expense Workflow', () => {
    it('should handle expense with draft status', async () => {
      const mockExpense = createMockExpense({ status: 'draft' });

      const { expensesApi } = await import('@/services/api/expenses');
      vi.mocked(expensesApi.getById).mockResolvedValue(mockExpense);

      const { result } = renderHook(() => useExpense('expense-1'), {
        wrapper: createWrapper(createMockEmployee(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.status).toBe('draft');
    });

    it('should handle expense with pending status', async () => {
      const mockExpense = createMockExpense({ status: 'pending' });

      const { expensesApi } = await import('@/services/api/expenses');
      vi.mocked(expensesApi.getById).mockResolvedValue(mockExpense);

      const { result } = renderHook(() => useExpense('expense-1'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.status).toBe('pending');
    });
  });
});
