import { Timestamp } from 'firebase/firestore';

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
