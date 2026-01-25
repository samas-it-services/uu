import { Timestamp } from 'firebase/firestore';

export interface Project {
  id: string;
  name: string;
  description: string;
  code: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  deadline: Timestamp | null;
  managerId: string;
  managerName: string;
  teamMembers: TeamMember[];
  budget: ProjectBudget | null;
  tags: string[];
  color: string;
  icon: string;
  isArchived: boolean;
  settings: ProjectSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ProjectStatus =
  | 'planning'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TeamMember {
  userId: string;
  userName: string;
  userPhotoURL: string;
  role: 'manager' | 'lead' | 'member' | 'viewer';
  joinedAt: Timestamp;
}

export interface ProjectBudget {
  total: number;
  spent: number;
  currency: string;
}

export interface ProjectSettings {
  allowExternalViewers: boolean;
  requireTaskApproval: boolean;
  enableTimeTracking: boolean;
  defaultTaskPriority: string;
  notifyOnTaskComplete: boolean;
  notifyOnBudgetThreshold: boolean;
  budgetThreshold: number;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  overdueTask: number;
  totalDocuments: number;
  totalExpenses: number;
  teamSize: number;
}
