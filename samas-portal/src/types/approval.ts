import { Timestamp } from 'firebase/firestore';

export interface Approval {
  id: string;
  type: ApprovalType;
  entityId: string;
  entityType: ApprovalEntityType;
  entityName: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: Timestamp;
  status: ApprovalStatus;
  priority: ApprovalPriority;
  amount?: number;
  currency?: string;
  projectId: string | null;
  description: string;
  approvers: ApproverInfo[];
  currentApproverLevel: number;
  approvalHistory: ApprovalHistoryItem[];
  dueDate: Timestamp | null;
  metadata: Record<string, unknown>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ApprovalType = 'expense' | 'purchase_order' | 'leave' | 'document' | 'project' | 'other';

export type ApprovalEntityType = 'expense' | 'purchase_order' | 'leave_request' | 'document' | 'project';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'escalated';

export type ApprovalPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ApproverInfo {
  userId: string;
  userName: string;
  level: number;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  decidedAt: Timestamp | null;
  comments: string | null;
}

export interface ApprovalHistoryItem {
  action: 'submitted' | 'approved' | 'rejected' | 'escalated' | 'cancelled' | 'commented';
  performedBy: string;
  performedByName: string;
  performedAt: Timestamp;
  comments: string | null;
  previousStatus: ApprovalStatus | null;
  newStatus: ApprovalStatus | null;
}

export interface ApprovalFilters {
  type?: ApprovalType;
  status?: ApprovalStatus;
  priority?: ApprovalPriority;
  requestedBy?: string;
  approverId?: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ApprovalRule {
  id: string;
  name: string;
  description: string;
  type: ApprovalType;
  conditions: ApprovalCondition[];
  approverLevels: ApproverLevel[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ApprovalCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'in' | 'contains';
  value: unknown;
}

export interface ApproverLevel {
  level: number;
  approverType: 'user' | 'role' | 'manager';
  approverIds: string[];
  requiredApprovals: number;
  canSkip: boolean;
}
