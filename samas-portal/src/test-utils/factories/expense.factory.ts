/**
 * Expense Factory
 * Creates mock expense data for testing
 */

import { Expense, ExpenseStatus, ExpenseCategory, ExpenseReceipt } from '@/types/expense';

let expenseCounter = 0;
let receiptCounter = 0;

const mockTimestamp = {
  toDate: () => new Date(),
  seconds: Math.floor(Date.now() / 1000),
  nanoseconds: 0,
};

export interface ExpenseFactoryOptions {
  id?: string;
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  category?: ExpenseCategory;
  projectId?: string | null;
  status?: ExpenseStatus;
  submittedBy?: string;
  submittedByName?: string;
  approvedBy?: string | null;
  approvedByName?: string | null;
  rejectedBy?: string | null;
  rejectedByName?: string | null;
  rejectionReason?: string | null;
  receipts?: ExpenseReceipt[];
  isSensitive?: boolean;
}

export function createMockReceipt(options: Partial<ExpenseReceipt> = {}): ExpenseReceipt {
  receiptCounter++;
  return {
    id: options.id || `receipt-${receiptCounter}`,
    name: options.name || `receipt-${receiptCounter}.pdf`,
    url: options.url || `https://storage.example.com/receipts/receipt-${receiptCounter}.pdf`,
    type: options.type || 'application/pdf',
    size: options.size || 1024,
    uploadedAt: (options.uploadedAt || mockTimestamp) as ExpenseReceipt['uploadedAt'],
  };
}

export function createMockExpense(options: ExpenseFactoryOptions = {}): Expense {
  expenseCounter++;
  const id = options.id || `expense-${expenseCounter}`;

  return {
    id,
    title: options.title || `Expense ${expenseCounter}`,
    description: options.description || `Description for expense ${expenseCounter}`,
    amount: options.amount ?? 100.0,
    currency: options.currency || 'USD',
    category: options.category || 'supplies',
    projectId: options.projectId ?? null,
    status: options.status || 'draft',
    submittedBy: options.submittedBy || 'user-1',
    submittedByName: options.submittedByName || 'Test User',
    submittedAt: mockTimestamp as Expense['submittedAt'],
    approvedBy: options.approvedBy ?? null,
    approvedByName: options.approvedByName ?? null,
    approvedAt: options.approvedBy ? (mockTimestamp as Expense['approvedAt']) : null,
    rejectedBy: options.rejectedBy ?? null,
    rejectedByName: options.rejectedByName ?? null,
    rejectedAt: options.rejectedBy ? (mockTimestamp as Expense['rejectedAt']) : null,
    rejectionReason: options.rejectionReason ?? null,
    receipts: options.receipts || [],
    isSensitive: options.isSensitive ?? false,
    createdAt: mockTimestamp as Expense['createdAt'],
    updatedAt: mockTimestamp as Expense['updatedAt'],
  };
}

export function createMockDraftExpense(options: ExpenseFactoryOptions = {}): Expense {
  return createMockExpense({ ...options, status: 'draft' });
}

export function createMockPendingExpense(options: ExpenseFactoryOptions = {}): Expense {
  return createMockExpense({
    ...options,
    status: 'pending',
    receipts: options.receipts || [createMockReceipt()],
  });
}

export function createMockApprovedExpense(options: ExpenseFactoryOptions = {}): Expense {
  return createMockExpense({
    ...options,
    status: 'approved',
    approvedBy: options.approvedBy || 'finance-user',
    approvedByName: options.approvedByName || 'Finance Manager',
    receipts: options.receipts || [createMockReceipt()],
  });
}

export function createMockRejectedExpense(options: ExpenseFactoryOptions = {}): Expense {
  return createMockExpense({
    ...options,
    status: 'rejected',
    rejectedBy: options.rejectedBy || 'finance-user',
    rejectedByName: options.rejectedByName || 'Finance Manager',
    rejectionReason: options.rejectionReason || 'Missing documentation',
    receipts: options.receipts || [createMockReceipt()],
  });
}

export function createMockSensitiveExpense(options: ExpenseFactoryOptions = {}): Expense {
  return createMockExpense({
    ...options,
    isSensitive: true,
    category: 'services',
    title: 'Confidential Service',
  });
}

// Create multiple expenses
export function createMockExpenses(count: number, options: ExpenseFactoryOptions = {}): Expense[] {
  return Array.from({ length: count }, () => createMockExpense(options));
}

// Reset counter for tests
export function resetExpenseFactory() {
  expenseCounter = 0;
  receiptCounter = 0;
}
