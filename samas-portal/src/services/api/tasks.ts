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
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskAttachment,
  TaskComment,
} from '@/types/task';

const TASKS_COLLECTION = 'tasks';

export interface CreateTaskData {
  title: string;
  description: string;
  projectId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  assigneeName?: string | null;
  reporterId: string;
  reporterName: string;
  dueDate?: Date | null;
  estimatedHours?: number | null;
  tags?: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  assigneeName?: string | null;
  dueDate?: Date | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  tags?: string[];
}

export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  reporterId?: string;
  search?: string;
}

export interface TaskListResult {
  tasks: Task[];
  lastDoc: DocumentSnapshot | null;
}

export interface ReorderTaskData {
  taskId: string;
  newStatus: TaskStatus;
  newOrder: number;
}

export const tasksApi = {
  async getAll(
    filters?: TaskFilters,
    pageSize = 100,
    lastDoc?: DocumentSnapshot
  ): Promise<TaskListResult> {
    const tasksRef = collection(db, TASKS_COLLECTION);
    let q = query(tasksRef, orderBy('order', 'asc'));

    if (filters?.projectId) {
      q = query(q, where('projectId', '==', filters.projectId));
    }
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters?.priority) {
      q = query(q, where('priority', '==', filters.priority));
    }
    if (filters?.assigneeId) {
      q = query(q, where('assigneeId', '==', filters.assigneeId));
    }
    if (filters?.reporterId) {
      q = query(q, where('reporterId', '==', filters.reporterId));
    }

    q = query(q, limit(pageSize));

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];

    const newLastDoc =
      snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1]
        : null;

    return { tasks, lastDoc: newLastDoc };
  },

  async getByProject(projectId: string): Promise<Task[]> {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const q = query(
      tasksRef,
      where('projectId', '==', projectId),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];
  },

  async getByStatus(projectId: string, status: TaskStatus): Promise<Task[]> {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const q = query(
      tasksRef,
      where('projectId', '==', projectId),
      where('status', '==', status),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];
  },

  async getByAssignee(assigneeId: string): Promise<Task[]> {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const q = query(
      tasksRef,
      where('assigneeId', '==', assigneeId),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];
  },

  async getById(id: string): Promise<Task | null> {
    const docRef = doc(db, TASKS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Task;
  },

  async create(data: CreateTaskData): Promise<string> {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const now = Timestamp.now();

    // Get the highest order for this project's status column
    const existingTasks = await this.getByStatus(
      data.projectId,
      data.status || 'backlog'
    );
    const maxOrder = existingTasks.reduce(
      (max, task) => Math.max(max, task.order),
      0
    );

    const docRef = await addDoc(tasksRef, {
      title: data.title,
      description: data.description,
      projectId: data.projectId,
      status: data.status || 'backlog',
      priority: data.priority || 'medium',
      assigneeId: data.assigneeId || null,
      assigneeName: data.assigneeName || null,
      reporterId: data.reporterId,
      reporterName: data.reporterName,
      dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
      estimatedHours: data.estimatedHours || null,
      actualHours: null,
      tags: data.tags || [],
      attachments: [],
      comments: [],
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  },

  async update(id: string, data: UpdateTaskData): Promise<void> {
    const docRef = doc(db, TASKS_COLLECTION, id);
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    // Convert dates to Timestamps
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate
        ? Timestamp.fromDate(data.dueDate)
        : null;
    }

    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, TASKS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  async updateStatus(id: string, status: TaskStatus): Promise<void> {
    const docRef = doc(db, TASKS_COLLECTION, id);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  },

  async assign(
    id: string,
    assigneeId: string | null,
    assigneeName: string | null
  ): Promise<void> {
    const docRef = doc(db, TASKS_COLLECTION, id);
    await updateDoc(docRef, {
      assigneeId,
      assigneeName,
      updatedAt: Timestamp.now(),
    });
  },

  async updateOrder(id: string, order: number): Promise<void> {
    const docRef = doc(db, TASKS_COLLECTION, id);
    await updateDoc(docRef, {
      order,
      updatedAt: Timestamp.now(),
    });
  },

  async reorderTasks(tasks: ReorderTaskData[]): Promise<void> {
    const batch = writeBatch(db);

    for (const task of tasks) {
      const docRef = doc(db, TASKS_COLLECTION, task.taskId);
      batch.update(docRef, {
        status: task.newStatus,
        order: task.newOrder,
        updatedAt: Timestamp.now(),
      });
    }

    await batch.commit();
  },

  async moveTask(
    taskId: string,
    newStatus: TaskStatus,
    newOrder: number
  ): Promise<void> {
    const docRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(docRef, {
      status: newStatus,
      order: newOrder,
      updatedAt: Timestamp.now(),
    });
  },

  // Comment operations
  async addComment(taskId: string, comment: Omit<TaskComment, 'id'>): Promise<void> {
    const task = await this.getById(taskId);
    if (!task) return;

    const newComment: TaskComment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const docRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(docRef, {
      comments: [...task.comments, newComment],
      updatedAt: Timestamp.now(),
    });
  },

  async updateComment(
    taskId: string,
    commentId: string,
    content: string
  ): Promise<void> {
    const task = await this.getById(taskId);
    if (!task) return;

    const updatedComments = task.comments.map((c) =>
      c.id === commentId
        ? { ...c, content, updatedAt: Timestamp.now() }
        : c
    );

    const docRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(docRef, {
      comments: updatedComments,
      updatedAt: Timestamp.now(),
    });
  },

  async deleteComment(taskId: string, commentId: string): Promise<void> {
    const task = await this.getById(taskId);
    if (!task) return;

    const filteredComments = task.comments.filter((c) => c.id !== commentId);

    const docRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(docRef, {
      comments: filteredComments,
      updatedAt: Timestamp.now(),
    });
  },

  // Attachment operations
  async addAttachment(
    taskId: string,
    attachment: Omit<TaskAttachment, 'id'>
  ): Promise<void> {
    const task = await this.getById(taskId);
    if (!task) return;

    const newAttachment: TaskAttachment = {
      ...attachment,
      id: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const docRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(docRef, {
      attachments: [...task.attachments, newAttachment],
      updatedAt: Timestamp.now(),
    });
  },

  async removeAttachment(taskId: string, attachmentId: string): Promise<void> {
    const task = await this.getById(taskId);
    if (!task) return;

    const filteredAttachments = task.attachments.filter(
      (a) => a.id !== attachmentId
    );

    const docRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(docRef, {
      attachments: filteredAttachments,
      updatedAt: Timestamp.now(),
    });
  },

  // Time tracking
  async updateActualHours(id: string, hours: number): Promise<void> {
    const docRef = doc(db, TASKS_COLLECTION, id);
    await updateDoc(docRef, {
      actualHours: hours,
      updatedAt: Timestamp.now(),
    });
  },

  // Statistics
  async getTaskStats(projectId: string): Promise<{
    total: number;
    byStatus: Record<TaskStatus, number>;
    byPriority: Record<TaskPriority, number>;
    overdue: number;
    unassigned: number;
  }> {
    const tasks = await this.getByProject(projectId);
    const now = new Date();

    const byStatus: Record<TaskStatus, number> = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };

    const byPriority: Record<TaskPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    let overdue = 0;
    let unassigned = 0;

    for (const task of tasks) {
      byStatus[task.status]++;
      byPriority[task.priority]++;

      if (!task.assigneeId) {
        unassigned++;
      }

      if (
        task.dueDate &&
        task.status !== 'done' &&
        task.dueDate.toDate() < now
      ) {
        overdue++;
      }
    }

    return {
      total: tasks.length,
      byStatus,
      byPriority,
      overdue,
      unassigned,
    };
  },
};
