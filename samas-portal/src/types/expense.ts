import { Timestamp } from 'firebase/firestore';

export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  projectId: string | null;
  status: ExpenseStatus;
  submittedBy: string;
  submittedByName: string;
  submittedAt: Timestamp;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: Timestamp | null;
  rejectedBy: string | null;
  rejectedByName: string | null;
  rejectedAt: Timestamp | null;
  rejectionReason: string | null;
  receipts: ExpenseReceipt[];
  isSensitive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';

export type ExpenseCategory =
  | 'travel'
  | 'meals'
  | 'supplies'
  | 'equipment'
  | 'software'
  | 'services'
  | 'marketing'
  | 'training'
  | 'other';

export interface ExpenseReceipt {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Timestamp;
}

export interface Budget {
  id: string;
  projectId: string;
  totalAmount: number;
  spentAmount: number;
  currency: string;
  fiscalYear: number;
  categories: BudgetCategory[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BudgetCategory {
  category: ExpenseCategory;
  allocated: number;
  spent: number;
}
