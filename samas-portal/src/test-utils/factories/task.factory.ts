/**
 * Task Factory
 * Creates mock task data for testing
 */

import { Task, TaskStatus, TaskPriority, TaskAttachment, TaskComment, KanbanColumn } from '@/types/task';

let taskCounter = 0;
let commentCounter = 0;
let attachmentCounter = 0;

const mockTimestamp = {
  toDate: () => new Date(),
  seconds: Math.floor(Date.now() / 1000),
  nanoseconds: 0,
};

export interface TaskCommentOptions {
  id?: string;
  content?: string;
  authorId?: string;
  authorName?: string;
  authorPhotoURL?: string;
}

export function createMockTaskComment(options: TaskCommentOptions = {}): TaskComment {
  commentCounter++;
  return {
    id: options.id || `comment-${commentCounter}`,
    content: options.content || `Comment ${commentCounter}`,
    authorId: options.authorId || 'user-1',
    authorName: options.authorName || 'Test User',
    authorPhotoURL: options.authorPhotoURL || 'https://example.com/avatar.jpg',
    createdAt: mockTimestamp as TaskComment['createdAt'],
    updatedAt: mockTimestamp as TaskComment['updatedAt'],
  };
}

export interface TaskAttachmentOptions {
  id?: string;
  name?: string;
  url?: string;
  type?: string;
  size?: number;
  uploadedBy?: string;
}

export function createMockTaskAttachment(options: TaskAttachmentOptions = {}): TaskAttachment {
  attachmentCounter++;
  return {
    id: options.id || `attachment-${attachmentCounter}`,
    name: options.name || `file-${attachmentCounter}.pdf`,
    url: options.url || `https://storage.example.com/files/file-${attachmentCounter}.pdf`,
    type: options.type || 'application/pdf',
    size: options.size || 1024,
    uploadedBy: options.uploadedBy || 'user-1',
    uploadedAt: mockTimestamp as TaskAttachment['uploadedAt'],
  };
}

export interface TaskFactoryOptions {
  id?: string;
  title?: string;
  description?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  assigneeName?: string | null;
  reporterId?: string;
  reporterName?: string;
  dueDate?: Date | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  tags?: string[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  order?: number;
}

export function createMockTask(options: TaskFactoryOptions = {}): Task {
  taskCounter++;
  const id = options.id || `task-${taskCounter}`;

  return {
    id,
    title: options.title || `Task ${taskCounter}`,
    description: options.description || `Description for task ${taskCounter}`,
    projectId: options.projectId || 'project-1',
    status: options.status || 'todo',
    priority: options.priority || 'medium',
    assigneeId: options.assigneeId ?? null,
    assigneeName: options.assigneeName ?? null,
    reporterId: options.reporterId || 'user-1',
    reporterName: options.reporterName || 'Test User',
    dueDate: options.dueDate ? (mockTimestamp as Task['dueDate']) : null,
    estimatedHours: options.estimatedHours ?? null,
    actualHours: options.actualHours ?? null,
    tags: options.tags || [],
    attachments: options.attachments || [],
    comments: options.comments || [],
    order: options.order ?? taskCounter,
    createdAt: mockTimestamp as Task['createdAt'],
    updatedAt: mockTimestamp as Task['updatedAt'],
  };
}

export function createMockBacklogTask(options: TaskFactoryOptions = {}): Task {
  return createMockTask({ ...options, status: 'backlog' });
}

export function createMockTodoTask(options: TaskFactoryOptions = {}): Task {
  return createMockTask({ ...options, status: 'todo' });
}

export function createMockInProgressTask(options: TaskFactoryOptions = {}): Task {
  return createMockTask({
    ...options,
    status: 'in_progress',
    assigneeId: options.assigneeId || 'user-1',
    assigneeName: options.assigneeName || 'Test User',
  });
}

export function createMockReviewTask(options: TaskFactoryOptions = {}): Task {
  return createMockTask({
    ...options,
    status: 'review',
    assigneeId: options.assigneeId || 'user-1',
    assigneeName: options.assigneeName || 'Test User',
  });
}

export function createMockDoneTask(options: TaskFactoryOptions = {}): Task {
  return createMockTask({
    ...options,
    status: 'done',
    assigneeId: options.assigneeId || 'user-1',
    assigneeName: options.assigneeName || 'Test User',
    actualHours: options.actualHours ?? 4,
  });
}

export function createMockUrgentTask(options: TaskFactoryOptions = {}): Task {
  return createMockTask({
    ...options,
    priority: 'urgent',
    dueDate: new Date(),
  });
}

export function createMockTaskWithComments(
  options: TaskFactoryOptions = {},
  commentCount: number = 3
): Task {
  const comments = Array.from({ length: commentCount }, () => createMockTaskComment());
  return createMockTask({ ...options, comments });
}

// Create multiple tasks
export function createMockTasks(count: number, options: TaskFactoryOptions = {}): Task[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTask({ ...options, order: i })
  );
}

// Create tasks for all Kanban columns
export function createMockKanbanBoard(projectId: string = 'project-1'): KanbanColumn[] {
  return [
    {
      id: 'backlog',
      title: 'Backlog',
      tasks: [
        createMockBacklogTask({ projectId, order: 0 }),
        createMockBacklogTask({ projectId, order: 1 }),
      ],
    },
    {
      id: 'todo',
      title: 'To Do',
      tasks: [
        createMockTodoTask({ projectId, order: 0 }),
        createMockTodoTask({ projectId, order: 1 }),
        createMockTodoTask({ projectId, order: 2 }),
      ],
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      tasks: [
        createMockInProgressTask({ projectId, order: 0 }),
      ],
    },
    {
      id: 'review',
      title: 'Review',
      tasks: [
        createMockReviewTask({ projectId, order: 0 }),
      ],
    },
    {
      id: 'done',
      title: 'Done',
      tasks: [
        createMockDoneTask({ projectId, order: 0 }),
        createMockDoneTask({ projectId, order: 1 }),
      ],
    },
  ];
}

// Reset counter for tests
export function resetTaskFactory() {
  taskCounter = 0;
  commentCounter = 0;
  attachmentCounter = 0;
}
