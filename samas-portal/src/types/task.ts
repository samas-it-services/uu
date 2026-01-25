import { Timestamp } from 'firebase/firestore';
import { CustomFieldValue } from './customField';

/**
 * Task type categories for classification
 */
export type TaskType =
  | 'growth' // Growth initiatives
  | 'experimentation' // A/B tests, experiments
  | 'operational' // Day-to-day operations
  | 'maintenance' // Tech debt, maintenance
  | 'bug' // Bug fixes
  | 'feature'; // New feature development

/**
 * Task category for domain classification
 */
export type TaskCategory =
  | 'seo' // Search engine optimization
  | 'marketing' // Marketing activities
  | 'engineering' // Engineering tasks
  | 'design' // Design work
  | 'content' // Content creation
  | 'analytics' // Analytics and reporting
  | 'other'; // Miscellaneous

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assigneeName: string | null;
  reporterId: string;
  reporterName: string;
  dueDate: Timestamp | null;
  estimatedHours: number | null;
  actualHours: number | null;
  tags: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // === Extended Fields (v0.6.0) ===

  // Lifecycle
  completionDate?: Timestamp | null; // User-defined completion date (from imports)
  actualCompletionDate?: Timestamp | null; // System-recorded actual completion

  // Categorization
  taskType?: TaskType | null; // growth, experimentation, operational, etc.
  category?: TaskCategory | null; // seo, marketing, engineering, etc.
  phase?: string | null; // Project phase (e.g., "Search & Discovery")
  sprint?: string | null; // Sprint/week identifier (e.g., "Week 1")

  // Goals & Criteria
  goal?: string | null; // What this task aims to achieve
  acceptanceCriteria?: string | null; // How to know task is complete
  successMetrics?: string | null; // How to measure performance

  // Additional Context
  notes?: string | null; // General notes

  // External Integration
  externalId?: string | null; // Task # from external system (CSV, Jira)
  externalUrl?: string | null; // Link to external ticket
  sourceSystem?: string | null; // "csv_import", "jira", "asana", etc.

  // Custom Fields
  customFields?: Record<string, CustomFieldValue>; // Dynamic custom fields
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Timestamp;
}

export interface TaskComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}
