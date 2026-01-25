import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi, CreateExpenseData, UpdateExpenseData, ExpenseFilters, ExpenseListResult } from '@/services/api/expenses';
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/utils/auditLog';
import { useAuth } from '@/hooks/useAuth';

const EXPENSES_QUERY_KEY = 'expenses';

interface ExpensesQueryResult {
  pages: ExpenseListResult[];
  pageParams: unknown[];
}

export const useExpenses = (filters?: ExpenseFilters) => {
  return useQuery<ExpensesQueryResult>({
    queryKey: [EXPENSES_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await expensesApi.getAll(filters, 100);
      return { pages: [result], pageParams: [] };
    },
  });
};

export const useExpense = (id: string) => {
  return useQuery({
    queryKey: [EXPENSES_QUERY_KEY, id],
    queryFn: () => expensesApi.getById(id),
    enabled: !!id,
  });
};

export const useUserExpenses = (userId: string) => {
  return useQuery({
    queryKey: [EXPENSES_QUERY_KEY, 'user', userId],
    queryFn: () => expensesApi.getByUser(userId),
    enabled: !!userId,
  });
};

export const useProjectExpenses = (projectId: string) => {
  return useQuery({
    queryKey: [EXPENSES_QUERY_KEY, 'project', projectId],
    queryFn: () => expensesApi.getByProject(projectId),
    enabled: !!projectId,
  });
};

export const usePendingExpenses = () => {
  return useQuery({
    queryKey: [EXPENSES_QUERY_KEY, 'pending'],
    queryFn: () => expensesApi.getPending(),
  });
};

export const useExpenseStats = (projectId?: string) => {
  return useQuery({
    queryKey: [EXPENSES_QUERY_KEY, 'stats', projectId],
    queryFn: () => expensesApi.getExpenseStats(projectId),
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateExpenseData) => {
      const id = await expensesApi.create(data);
      if (currentUser) {
        await createAuditLog({
          action: 'expense.created',
          entityType: 'expense',
          entityId: id,
          entityName: data.title,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: { after: data as unknown as Record<string, unknown> },
        });
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
      success('Expense created successfully');
    },
    onError: (err) => {
      error(`Failed to create expense: ${err.message}`);
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateExpenseData }) => {
      const existingExpense = await expensesApi.getById(id);
      await expensesApi.update(id, data);
      if (currentUser && existingExpense) {
        await createAuditLog({
          action: 'expense.updated',
          entityType: 'expense',
          entityId: id,
          entityName: existingExpense.title,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: existingExpense as unknown as Record<string, unknown>,
            after: data as unknown as Record<string, unknown>,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
      success('Expense updated successfully');
    },
    onError: (err) => {
      error(`Failed to update expense: ${err.message}`);
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const existingExpense = await expensesApi.getById(id);
      await expensesApi.delete(id);
      if (currentUser && existingExpense) {
        await createAuditLog({
          action: 'expense.deleted',
          entityType: 'expense',
          entityId: id,
          entityName: existingExpense.title,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: { before: existingExpense as unknown as Record<string, unknown> },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
      success('Expense deleted successfully');
    },
    onError: (err) => {
      error(`Failed to delete expense: ${err.message}`);
    },
  });
};

export const useSubmitExpense = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const expense = await expensesApi.getById(id);
      await expensesApi.submit(id);
      if (currentUser && expense) {
        await createAuditLog({
          action: 'expense.submitted',
          entityType: 'expense',
          entityId: id,
          entityName: expense.title,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
      success('Expense submitted for approval');
    },
    onError: (err) => {
      error(`Failed to submit expense: ${err.message}`);
    },
  });
};

export const useApproveExpense = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!currentUser) throw new Error('User not authenticated');
      const expense = await expensesApi.getById(id);
      await expensesApi.approve(id, currentUser.id, currentUser.displayName);
      if (expense) {
        await createAuditLog({
          action: 'expense.approved',
          entityType: 'expense',
          entityId: id,
          entityName: expense.title,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
      success('Expense approved');
    },
    onError: (err) => {
      error(`Failed to approve expense: ${err.message}`);
    },
  });
};

export const useRejectExpense = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!currentUser) throw new Error('User not authenticated');
      const expense = await expensesApi.getById(id);
      await expensesApi.reject(id, currentUser.id, currentUser.displayName, reason);
      if (expense) {
        await createAuditLog({
          action: 'expense.rejected',
          entityType: 'expense',
          entityId: id,
          entityName: expense.title,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: { after: { reason } },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
      success('Expense rejected');
    },
    onError: (err) => {
      error(`Failed to reject expense: ${err.message}`);
    },
  });
};

export const useMarkExpensePaid = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const expense = await expensesApi.getById(id);
      await expensesApi.markPaid(id);
      if (currentUser && expense) {
        await createAuditLog({
          action: 'expense.paid',
          entityType: 'expense',
          entityId: id,
          entityName: expense.title,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
      success('Expense marked as paid');
    },
    onError: (err) => {
      error(`Failed to mark expense as paid: ${err.message}`);
    },
  });
};

export const useUploadReceipt = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ expenseId, file }: { expenseId: string; file: File }) => {
      return expensesApi.uploadReceipt(expenseId, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
      success('Receipt uploaded successfully');
    },
    onError: (err) => {
      error(`Failed to upload receipt: ${err.message}`);
    },
  });
};

export const useDeleteReceipt = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ expenseId, receiptId }: { expenseId: string; receiptId: string }) => {
      await expensesApi.deleteReceipt(expenseId, receiptId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
      success('Receipt deleted');
    },
    onError: (err) => {
      error(`Failed to delete receipt: ${err.message}`);
    },
  });
};
