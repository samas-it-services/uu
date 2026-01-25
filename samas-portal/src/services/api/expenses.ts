import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '@/services/firebase/config';
import { Expense, ExpenseReceipt, ExpenseStatus, ExpenseCategory } from '@/types/expense';

const EXPENSES_COLLECTION = 'expenses';

export interface CreateExpenseData {
  title: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  projectId: string | null;
  submittedBy: string;
  submittedByName: string;
  isSensitive?: boolean;
}

export interface UpdateExpenseData {
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  category?: ExpenseCategory;
  projectId?: string | null;
  isSensitive?: boolean;
}

export interface ExpenseFilters {
  status?: ExpenseStatus;
  category?: ExpenseCategory;
  projectId?: string;
  submittedBy?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ExpenseListResult {
  expenses: Expense[];
  lastDoc: DocumentSnapshot | null;
}

export const expensesApi = {
  async getAll(filters?: ExpenseFilters, pageSize = 50, lastDoc?: DocumentSnapshot): Promise<ExpenseListResult> {
    const expensesRef = collection(db, EXPENSES_COLLECTION);
    let q = query(expensesRef, orderBy('createdAt', 'desc'));

    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }
    if (filters?.projectId) {
      q = query(q, where('projectId', '==', filters.projectId));
    }
    if (filters?.submittedBy) {
      q = query(q, where('submittedBy', '==', filters.submittedBy));
    }

    q = query(q, limit(pageSize));

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const expenses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];

    const newLastDoc = snapshot.docs.length > 0
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

    return { expenses, lastDoc: newLastDoc };
  },

  async getById(id: string): Promise<Expense | null> {
    const docRef = doc(db, EXPENSES_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Expense;
  },

  async getByProject(projectId: string): Promise<Expense[]> {
    const expensesRef = collection(db, EXPENSES_COLLECTION);
    const q = query(
      expensesRef,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
  },

  async getByUser(userId: string): Promise<Expense[]> {
    const expensesRef = collection(db, EXPENSES_COLLECTION);
    const q = query(
      expensesRef,
      where('submittedBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
  },

  async getPending(): Promise<Expense[]> {
    const expensesRef = collection(db, EXPENSES_COLLECTION);
    const q = query(
      expensesRef,
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
  },

  async create(data: CreateExpenseData): Promise<string> {
    const expensesRef = collection(db, EXPENSES_COLLECTION);
    const now = Timestamp.now();
    const docRef = await addDoc(expensesRef, {
      ...data,
      status: 'draft' as ExpenseStatus,
      isSensitive: data.isSensitive ?? false,
      submittedAt: now,
      approvedBy: null,
      approvedByName: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedByName: null,
      rejectedAt: null,
      rejectionReason: null,
      receipts: [],
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async update(id: string, data: UpdateExpenseData): Promise<void> {
    const docRef = doc(db, EXPENSES_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(id: string): Promise<void> {
    const expense = await this.getById(id);
    if (expense) {
      // Delete associated receipts from storage
      for (const receipt of expense.receipts) {
        try {
          const storageRef = ref(storage, receipt.url);
          await deleteObject(storageRef);
        } catch (error) {
          console.error('Error deleting receipt:', error);
        }
      }
    }
    const docRef = doc(db, EXPENSES_COLLECTION, id);
    await deleteDoc(docRef);
  },

  async submit(id: string): Promise<void> {
    const docRef = doc(db, EXPENSES_COLLECTION, id);
    await updateDoc(docRef, {
      status: 'pending' as ExpenseStatus,
      submittedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  async approve(
    id: string,
    approvedBy: string,
    approvedByName: string
  ): Promise<void> {
    const docRef = doc(db, EXPENSES_COLLECTION, id);
    await updateDoc(docRef, {
      status: 'approved' as ExpenseStatus,
      approvedBy,
      approvedByName,
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  async reject(
    id: string,
    rejectedBy: string,
    rejectedByName: string,
    reason: string
  ): Promise<void> {
    const docRef = doc(db, EXPENSES_COLLECTION, id);
    await updateDoc(docRef, {
      status: 'rejected' as ExpenseStatus,
      rejectedBy,
      rejectedByName,
      rejectedAt: Timestamp.now(),
      rejectionReason: reason,
      updatedAt: Timestamp.now(),
    });
  },

  async markPaid(id: string): Promise<void> {
    const docRef = doc(db, EXPENSES_COLLECTION, id);
    await updateDoc(docRef, {
      status: 'paid' as ExpenseStatus,
      updatedAt: Timestamp.now(),
    });
  },

  async uploadReceipt(
    expenseId: string,
    file: File
  ): Promise<ExpenseReceipt> {
    const receiptId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const storagePath = `receipts/${expenseId}/${receiptId}-${file.name}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    const receipt: ExpenseReceipt = {
      id: receiptId,
      name: file.name,
      url,
      type: file.type,
      size: file.size,
      uploadedAt: Timestamp.now(),
    };

    const expense = await this.getById(expenseId);
    if (expense) {
      const docRef = doc(db, EXPENSES_COLLECTION, expenseId);
      await updateDoc(docRef, {
        receipts: [...expense.receipts, receipt],
        updatedAt: Timestamp.now(),
      });
    }

    return receipt;
  },

  async deleteReceipt(expenseId: string, receiptId: string): Promise<void> {
    const expense = await this.getById(expenseId);
    if (!expense) return;

    const receipt = expense.receipts.find((r) => r.id === receiptId);
    if (receipt) {
      try {
        const storageRef = ref(storage, receipt.url);
        await deleteObject(storageRef);
      } catch (error) {
        console.error('Error deleting receipt from storage:', error);
      }
    }

    const docRef = doc(db, EXPENSES_COLLECTION, expenseId);
    await updateDoc(docRef, {
      receipts: expense.receipts.filter((r) => r.id !== receiptId),
      updatedAt: Timestamp.now(),
    });
  },

  async getExpenseStats(projectId?: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
    totalAmount: number;
    pendingAmount: number;
    approvedAmount: number;
  }> {
    const expensesRef = collection(db, EXPENSES_COLLECTION);
    let q = query(expensesRef);

    if (projectId) {
      q = query(q, where('projectId', '==', projectId));
    }

    const snapshot = await getDocs(q);
    const expenses = snapshot.docs.map((doc) => doc.data() as Omit<Expense, 'id'>);

    return {
      total: expenses.length,
      pending: expenses.filter((e) => e.status === 'pending').length,
      approved: expenses.filter((e) => e.status === 'approved').length,
      rejected: expenses.filter((e) => e.status === 'rejected').length,
      paid: expenses.filter((e) => e.status === 'paid').length,
      totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
      pendingAmount: expenses
        .filter((e) => e.status === 'pending')
        .reduce((sum, e) => sum + e.amount, 0),
      approvedAmount: expenses
        .filter((e) => e.status === 'approved' || e.status === 'paid')
        .reduce((sum, e) => sum + e.amount, 0),
    };
  },
};
