import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/services/firebase/config';

const AUDIT_LOGS_COLLECTION = 'auditLogs';

export type AuditAction =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.activated'
  | 'user.deactivated'
  | 'user.roles_assigned'
  | 'user.projects_assigned'
  | 'role.created'
  | 'role.updated'
  | 'role.deleted'
  | 'role.permissions_updated'
  | 'expense.created'
  | 'expense.updated'
  | 'expense.deleted'
  | 'expense.submitted'
  | 'expense.approved'
  | 'expense.rejected'
  | 'expense.paid'
  | 'approval.created'
  | 'approval.approved'
  | 'approval.rejected'
  | 'approval.cancelled'
  | 'document.uploaded'
  | 'document.updated'
  | 'document.deleted'
  | 'document.shared'
  | 'document.version_uploaded'
  | 'folder.created'
  | 'folder.deleted'
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'project.archived'
  | 'project.status_changed'
  | 'project.team_member_added'
  | 'project.team_member_removed'
  | 'project.team_member_role_changed'
  | 'project.role_created'
  | 'project.role_updated'
  | 'project.role_deleted'
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'task.status_changed'
  | 'task.assigned'
  | 'task.comment_added'
  | 'login'
  | 'logout';

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: 'user' | 'role' | 'session' | 'expense' | 'approval' | 'document' | 'folder' | 'project' | 'task';
  entityId: string;
  entityName: string;
  performedBy: {
    id: string;
    email: string;
    displayName: string;
  };
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Timestamp;
}

export interface CreateAuditLogData {
  action: AuditAction;
  entityType: 'user' | 'role' | 'session' | 'expense' | 'approval' | 'document' | 'folder' | 'project' | 'task';
  entityId: string;
  entityName: string;
  performedBy: {
    id: string;
    email: string;
    displayName: string;
  };
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

export interface AuditLogFilters {
  action?: AuditAction;
  entityType?: 'user' | 'role' | 'session' | 'expense' | 'approval' | 'document' | 'folder';
  entityId?: string;
  performedById?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

export const auditLogsApi = {
  async getAll(pageSize = 50): Promise<AuditLog[]> {
    const logsRef = collection(db, AUDIT_LOGS_COLLECTION);
    const q = query(logsRef, orderBy('createdAt', 'desc'), limit(pageSize));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];
  },

  async getPaginated(
    pageSize = 50,
    lastDocument?: DocumentSnapshot
  ): Promise<PaginatedResult<AuditLog>> {
    const logsRef = collection(db, AUDIT_LOGS_COLLECTION);
    let q = query(logsRef, orderBy('createdAt', 'desc'), limit(pageSize + 1));

    if (lastDocument) {
      q = query(logsRef, orderBy('createdAt', 'desc'), startAfter(lastDocument), limit(pageSize + 1));
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const data = docs.slice(0, pageSize).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];

    return {
      data,
      lastDoc: docs.length > 0 ? docs[Math.min(docs.length - 1, pageSize - 1)] : null,
      hasMore,
    };
  },

  async getById(id: string): Promise<AuditLog | null> {
    const docRef = doc(db, AUDIT_LOGS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as AuditLog;
  },

  async getByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    const logsRef = collection(db, AUDIT_LOGS_COLLECTION);
    const q = query(
      logsRef,
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];
  },

  async getByPerformer(performerId: string): Promise<AuditLog[]> {
    const logsRef = collection(db, AUDIT_LOGS_COLLECTION);
    const q = query(
      logsRef,
      where('performedBy.id', '==', performerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];
  },

  async getByAction(action: AuditAction): Promise<AuditLog[]> {
    const logsRef = collection(db, AUDIT_LOGS_COLLECTION);
    const q = query(logsRef, where('action', '==', action), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    const logsRef = collection(db, AUDIT_LOGS_COLLECTION);
    const q = query(
      logsRef,
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];
  },

  async create(data: CreateAuditLogData): Promise<string> {
    const logsRef = collection(db, AUDIT_LOGS_COLLECTION);
    const docRef = await addDoc(logsRef, {
      ...data,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async search(filters: AuditLogFilters, pageSize = 50): Promise<AuditLog[]> {
    const logsRef = collection(db, AUDIT_LOGS_COLLECTION);
    const constraints: ReturnType<typeof where>[] = [];

    if (filters.action) {
      constraints.push(where('action', '==', filters.action));
    }
    if (filters.entityType) {
      constraints.push(where('entityType', '==', filters.entityType));
    }
    if (filters.entityId) {
      constraints.push(where('entityId', '==', filters.entityId));
    }
    if (filters.performedById) {
      constraints.push(where('performedBy.id', '==', filters.performedById));
    }
    if (filters.startDate) {
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
    }

    const q = query(logsRef, ...constraints, orderBy('createdAt', 'desc'), limit(pageSize));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];
  },
};
