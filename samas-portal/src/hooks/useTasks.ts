import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import {
  tasksApi,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters,
  TaskListResult,
  ReorderTaskData,
} from '@/services/api/tasks';
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/utils/auditLog';
import { useAuth } from '@/hooks/useAuth';
import { Task, TaskStatus, TaskComment, TaskAttachment } from '@/types/task';

const TASKS_QUERY_KEY = 'tasks';

export const useTasks = (filters?: TaskFilters) => {
  return useQuery<TaskListResult>({
    queryKey: [TASKS_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await tasksApi.getAll(filters, 100);
      return result;
    },
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, id],
    queryFn: () => tasksApi.getById(id),
    enabled: !!id,
  });
};

export const useProjectTasks = (projectId: string) => {
  return useQuery<Task[]>({
    queryKey: [TASKS_QUERY_KEY, 'project', projectId],
    queryFn: () => tasksApi.getByProject(projectId),
    enabled: !!projectId,
  });
};

export const useAssigneeTasks = (assigneeId: string) => {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, 'assignee', assigneeId],
    queryFn: () => tasksApi.getByAssignee(assigneeId),
    enabled: !!assigneeId,
  });
};

export const useTaskStats = (projectId: string) => {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, 'stats', projectId],
    queryFn: () => tasksApi.getTaskStats(projectId),
    enabled: !!projectId,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateTaskData) => {
      const id = await tasksApi.create(data);
      if (currentUser) {
        await createAuditLog({
          action: 'task.created',
          entityType: 'task',
          entityId: id,
          entityName: data.title,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: { after: data as unknown as Record<string, unknown> },
        });
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      success('Task created successfully');
    },
    onError: (err) => {
      error(`Failed to create task: ${err.message}`);
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskData }) => {
      const existingTask = await tasksApi.getById(id);
      await tasksApi.update(id, data);
      if (currentUser && existingTask) {
        await createAuditLog({
          action: 'task.updated',
          entityType: 'task',
          entityId: id,
          entityName: existingTask.title,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: existingTask as unknown as Record<string, unknown>,
            after: data as unknown as Record<string, unknown>,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      success('Task updated successfully');
    },
    onError: (err) => {
      error(`Failed to update task: ${err.message}`);
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const existingTask = await tasksApi.getById(id);
      await tasksApi.delete(id);
      if (currentUser && existingTask) {
        await createAuditLog({
          action: 'task.deleted',
          entityType: 'task',
          entityId: id,
          entityName: existingTask.title,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: { before: existingTask as unknown as Record<string, unknown> },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      success('Task deleted successfully');
    },
    onError: (err) => {
      error(`Failed to delete task: ${err.message}`);
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: TaskStatus;
    }) => {
      const task = await tasksApi.getById(id);
      await tasksApi.updateStatus(id, status);
      if (currentUser && task) {
        await createAuditLog({
          action: 'task.status_changed',
          entityType: 'task',
          entityId: id,
          entityName: task.title,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: { status: task.status },
            after: { status },
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
    onError: (err) => {
      console.error('Failed to update task status:', err);
    },
  });
};

export const useAssignTask = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({
      taskId,
      assigneeId,
      assigneeName,
    }: {
      taskId: string;
      assigneeId: string | null;
      assigneeName: string | null;
    }) => {
      const task = await tasksApi.getById(taskId);
      await tasksApi.assign(taskId, assigneeId, assigneeName);
      if (currentUser && task) {
        await createAuditLog({
          action: 'task.assigned',
          entityType: 'task',
          entityId: taskId,
          entityName: task.title,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: { assignee: task.assigneeName },
            after: { assignee: assigneeName },
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      success('Task assigned successfully');
    },
    onError: (err) => {
      error(`Failed to assign task: ${err.message}`);
    },
  });
};

export const useMoveTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      newStatus,
      newOrder,
    }: {
      taskId: string;
      newStatus: TaskStatus;
      newOrder: number;
    }) => {
      await tasksApi.moveTask(taskId, newStatus, newOrder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
    onError: (err) => {
      console.error('Failed to move task:', err);
    },
  });
};

export const useReorderTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tasks: ReorderTaskData[]) => {
      await tasksApi.reorderTasks(tasks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
    onError: (err) => {
      console.error('Failed to reorder tasks:', err);
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({
      taskId,
      content,
    }: {
      taskId: string;
      content: string;
    }) => {
      if (!currentUser) throw new Error('Must be logged in to comment');

      const comment: Omit<TaskComment, 'id'> = {
        content,
        authorId: currentUser.id,
        authorName: currentUser.displayName,
        authorPhotoURL: currentUser.photoURL || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await tasksApi.addComment(taskId, comment);

      const task = await tasksApi.getById(taskId);
      if (task) {
        await createAuditLog({
          action: 'task.comment_added',
          entityType: 'task',
          entityId: taskId,
          entityName: task.title,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      success('Comment added');
    },
    onError: (err) => {
      error(`Failed to add comment: ${err.message}`);
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({
      taskId,
      commentId,
      content,
    }: {
      taskId: string;
      commentId: string;
      content: string;
    }) => {
      await tasksApi.updateComment(taskId, commentId, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      success('Comment updated');
    },
    onError: (err) => {
      error(`Failed to update comment: ${err.message}`);
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({
      taskId,
      commentId,
    }: {
      taskId: string;
      commentId: string;
    }) => {
      await tasksApi.deleteComment(taskId, commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      success('Comment deleted');
    },
    onError: (err) => {
      error(`Failed to delete comment: ${err.message}`);
    },
  });
};

export const useAddAttachment = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({
      taskId,
      name,
      url,
      type,
      size,
    }: {
      taskId: string;
      name: string;
      url: string;
      type: string;
      size: number;
    }) => {
      if (!currentUser) throw new Error('Must be logged in');

      const attachment: Omit<TaskAttachment, 'id'> = {
        name,
        url,
        type,
        size,
        uploadedBy: currentUser.id,
        uploadedAt: Timestamp.now(),
      };

      await tasksApi.addAttachment(taskId, attachment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      success('Attachment added');
    },
    onError: (err) => {
      error(`Failed to add attachment: ${err.message}`);
    },
  });
};

export const useRemoveAttachment = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({
      taskId,
      attachmentId,
    }: {
      taskId: string;
      attachmentId: string;
    }) => {
      await tasksApi.removeAttachment(taskId, attachmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      success('Attachment removed');
    },
    onError: (err) => {
      error(`Failed to remove attachment: ${err.message}`);
    },
  });
};

export const useUpdateActualHours = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({
      taskId,
      hours,
    }: {
      taskId: string;
      hours: number;
    }) => {
      await tasksApi.updateActualHours(taskId, hours);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      success('Time logged');
    },
    onError: (err) => {
      error(`Failed to log time: ${err.message}`);
    },
  });
};
