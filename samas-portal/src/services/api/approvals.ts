import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import {
  Approval,
  ApprovalStatus,
  ApprovalType,
  ApprovalPriority,
  ApprovalFilters,
  ApproverInfo,
  ApprovalHistoryItem,
  ApprovalEntityType,
} from '@/types/approval';

const APPROVALS_COLLECTION = 'approvals';

export interface CreateApprovalData {
  type: ApprovalType;
  entityId: string;
  entityType: ApprovalEntityType;
  entityName: string;
  requestedBy: string;
  requestedByName: string;
  priority?: ApprovalPriority;
  amount?: number;
  currency?: string;
  projectId?: string | null;
  description: string;
  approvers: Omit<ApproverInfo, 'status' | 'decidedAt' | 'comments'>[];
  dueDate?: Date | null;
  metadata?: Record<string, unknown>;
}

export const approvalsApi = {
  async getAll(filters?: ApprovalFilters, pageLimit = 50): Promise<Approval[]> {
    const approvalsRef = collection(db, APPROVALS_COLLECTION);
    let q = query(approvalsRef, orderBy('createdAt', 'desc'));

    if (filters?.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters?.priority) {
      q = query(q, where('priority', '==', filters.priority));
    }
    if (filters?.requestedBy) {
      q = query(q, where('requestedBy', '==', filters.requestedBy));
    }
    if (filters?.projectId) {
      q = query(q, where('projectId', '==', filters.projectId));
    }

    q = query(q, limit(pageLimit));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Approval[];
  },

  async getById(id: string): Promise<Approval | null> {
    const docRef = doc(db, APPROVALS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Approval;
  },

  async getPendingForApprover(approverId: string): Promise<Approval[]> {
    const approvalsRef = collection(db, APPROVALS_COLLECTION);
    const q = query(
      approvalsRef,
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    const approvals = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Approval[];

    // Filter for approvals where the user is the current approver
    return approvals.filter((approval) => {
      const currentApprover = approval.approvers.find(
        (a) => a.level === approval.currentApproverLevel && a.status === 'pending'
      );
      return currentApprover?.userId === approverId;
    });
  },

  async getPendingByUser(userId: string): Promise<Approval[]> {
    const approvalsRef = collection(db, APPROVALS_COLLECTION);
    const q = query(
      approvalsRef,
      where('requestedBy', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Approval[];
  },

  async getByEntity(entityId: string, entityType: ApprovalEntityType): Promise<Approval | null> {
    const approvalsRef = collection(db, APPROVALS_COLLECTION);
    const q = query(
      approvalsRef,
      where('entityId', '==', entityId),
      where('entityType', '==', entityType),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Approval;
  },

  async create(data: CreateApprovalData): Promise<string> {
    const approvalsRef = collection(db, APPROVALS_COLLECTION);
    const now = Timestamp.now();

    const approvers: ApproverInfo[] = data.approvers.map((a) => ({
      ...a,
      status: 'pending',
      decidedAt: null,
      comments: null,
    }));

    const historyItem: ApprovalHistoryItem = {
      action: 'submitted',
      performedBy: data.requestedBy,
      performedByName: data.requestedByName,
      performedAt: now,
      comments: null,
      previousStatus: null,
      newStatus: 'pending',
    };

    const docRef = await addDoc(approvalsRef, {
      type: data.type,
      entityId: data.entityId,
      entityType: data.entityType,
      entityName: data.entityName,
      requestedBy: data.requestedBy,
      requestedByName: data.requestedByName,
      requestedAt: now,
      status: 'pending' as ApprovalStatus,
      priority: data.priority || 'medium',
      amount: data.amount,
      currency: data.currency,
      projectId: data.projectId || null,
      description: data.description,
      approvers,
      currentApproverLevel: approvers.length > 0 ? approvers[0].level : 1,
      approvalHistory: [historyItem],
      dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  },

  async approve(
    id: string,
    approverId: string,
    approverName: string,
    comments?: string
  ): Promise<void> {
    const approval = await this.getById(id);
    if (!approval) throw new Error('Approval not found');

    const now = Timestamp.now();
    const updatedApprovers = approval.approvers.map((a) => {
      if (a.userId === approverId && a.level === approval.currentApproverLevel) {
        return {
          ...a,
          status: 'approved' as const,
          decidedAt: now,
          comments: comments || null,
        };
      }
      return a;
    });

    // Check if all approvers at current level have approved
    const currentLevelApprovers = updatedApprovers.filter(
      (a) => a.level === approval.currentApproverLevel
    );
    const allApproved = currentLevelApprovers.every((a) => a.status === 'approved');

    // Check if there are more levels
    const maxLevel = Math.max(...approval.approvers.map((a) => a.level));
    const hasMoreLevels = approval.currentApproverLevel < maxLevel;

    let newStatus: ApprovalStatus = 'pending';
    let newLevel = approval.currentApproverLevel;

    if (allApproved) {
      if (hasMoreLevels) {
        newLevel = approval.currentApproverLevel + 1;
      } else {
        newStatus = 'approved';
      }
    }

    const historyItem: ApprovalHistoryItem = {
      action: 'approved',
      performedBy: approverId,
      performedByName: approverName,
      performedAt: now,
      comments: comments || null,
      previousStatus: approval.status,
      newStatus,
    };

    const docRef = doc(db, APPROVALS_COLLECTION, id);
    await updateDoc(docRef, {
      approvers: updatedApprovers,
      currentApproverLevel: newLevel,
      status: newStatus,
      approvalHistory: [...approval.approvalHistory, historyItem],
      updatedAt: now,
    });
  },

  async reject(
    id: string,
    rejecterId: string,
    rejecterName: string,
    reason: string
  ): Promise<void> {
    const approval = await this.getById(id);
    if (!approval) throw new Error('Approval not found');

    const now = Timestamp.now();
    const updatedApprovers = approval.approvers.map((a) => {
      if (a.userId === rejecterId && a.level === approval.currentApproverLevel) {
        return {
          ...a,
          status: 'rejected' as const,
          decidedAt: now,
          comments: reason,
        };
      }
      return a;
    });

    const historyItem: ApprovalHistoryItem = {
      action: 'rejected',
      performedBy: rejecterId,
      performedByName: rejecterName,
      performedAt: now,
      comments: reason,
      previousStatus: approval.status,
      newStatus: 'rejected',
    };

    const docRef = doc(db, APPROVALS_COLLECTION, id);
    await updateDoc(docRef, {
      approvers: updatedApprovers,
      status: 'rejected' as ApprovalStatus,
      approvalHistory: [...approval.approvalHistory, historyItem],
      updatedAt: now,
    });
  },

  async cancel(
    id: string,
    cancelledBy: string,
    cancelledByName: string,
    reason?: string
  ): Promise<void> {
    const approval = await this.getById(id);
    if (!approval) throw new Error('Approval not found');

    const now = Timestamp.now();
    const historyItem: ApprovalHistoryItem = {
      action: 'cancelled',
      performedBy: cancelledBy,
      performedByName: cancelledByName,
      performedAt: now,
      comments: reason || null,
      previousStatus: approval.status,
      newStatus: 'cancelled',
    };

    const docRef = doc(db, APPROVALS_COLLECTION, id);
    await updateDoc(docRef, {
      status: 'cancelled' as ApprovalStatus,
      approvalHistory: [...approval.approvalHistory, historyItem],
      updatedAt: now,
    });
  },

  async addComment(
    id: string,
    userId: string,
    userName: string,
    comment: string
  ): Promise<void> {
    const approval = await this.getById(id);
    if (!approval) throw new Error('Approval not found');

    const now = Timestamp.now();
    const historyItem: ApprovalHistoryItem = {
      action: 'commented',
      performedBy: userId,
      performedByName: userName,
      performedAt: now,
      comments: comment,
      previousStatus: null,
      newStatus: null,
    };

    const docRef = doc(db, APPROVALS_COLLECTION, id);
    await updateDoc(docRef, {
      approvalHistory: [...approval.approvalHistory, historyItem],
      updatedAt: now,
    });
  },

  async getStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byType: Record<ApprovalType, number>;
  }> {
    const approvalsRef = collection(db, APPROVALS_COLLECTION);
    const snapshot = await getDocs(approvalsRef);
    const approvals = snapshot.docs.map((doc) => doc.data() as Omit<Approval, 'id'>);

    const byType: Record<ApprovalType, number> = {
      expense: 0,
      purchase_order: 0,
      leave: 0,
      document: 0,
      project: 0,
      other: 0,
    };

    approvals.forEach((a) => {
      byType[a.type]++;
    });

    return {
      total: approvals.length,
      pending: approvals.filter((a) => a.status === 'pending').length,
      approved: approvals.filter((a) => a.status === 'approved').length,
      rejected: approvals.filter((a) => a.status === 'rejected').length,
      byType,
    };
  },
};
