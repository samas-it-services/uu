import { FC, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TaskType, TaskCategory } from '@/types/task';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  projectId: string;
  defaultStatus?: TaskStatus;
}

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().optional(),
  estimatedHours: z.string().optional(),
  tags: z.string().optional(),
  // Extended fields
  taskType: z.enum(['growth', 'experimentation', 'operational', 'maintenance', 'bug', 'feature']).nullable().optional(),
  category: z.enum(['seo', 'marketing', 'engineering', 'design', 'content', 'analytics', 'other']).nullable().optional(),
  phase: z.string().max(100).optional(),
  sprint: z.string().max(50).optional(),
  goal: z.string().max(1000).optional(),
  acceptanceCriteria: z.string().max(2000).optional(),
  successMetrics: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  externalId: z.string().max(100).optional(),
  externalUrl: z.string().url().optional().or(z.literal('')),
});

type TaskFormData = z.infer<typeof taskSchema>;

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const taskTypeOptions: { value: TaskType; label: string; color: string }[] = [
  { value: 'growth', label: 'Growth', color: 'bg-green-100 text-green-800' },
  { value: 'experimentation', label: 'Experimentation', color: 'bg-purple-100 text-purple-800' },
  { value: 'operational', label: 'Operational', color: 'bg-blue-100 text-blue-800' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-gray-100 text-gray-800' },
  { value: 'bug', label: 'Bug', color: 'bg-red-100 text-red-800' },
  { value: 'feature', label: 'Feature', color: 'bg-indigo-100 text-indigo-800' },
];

const categoryOptions: { value: TaskCategory; label: string }[] = [
  { value: 'seo', label: 'SEO' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'design', label: 'Design' },
  { value: 'content', label: 'Content' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'other', label: 'Other' },
];

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg dark:border-gray-700">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
};

export const TaskModal: FC<TaskModalProps> = ({
  open,
  onOpenChange,
  task,
  projectId,
  defaultStatus = 'backlog',
}) => {
  const { user } = useAuth();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: defaultStatus,
      priority: 'medium',
      dueDate: '',
      estimatedHours: '',
      tags: '',
      taskType: null,
      category: null,
      phase: '',
      sprint: '',
      goal: '',
      acceptanceCriteria: '',
      successMetrics: '',
      notes: '',
      externalId: '',
      externalUrl: '',
    },
  });

  const watchStatus = watch('status');
  const watchPriority = watch('priority');
  const watchTaskType = watch('taskType');
  const watchCategory = watch('category');

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate
          ? task.dueDate.toDate().toISOString().split('T')[0]
          : '',
        estimatedHours: task.estimatedHours?.toString() || '',
        tags: task.tags.join(', '),
        taskType: task.taskType || null,
        category: task.category || null,
        phase: task.phase || '',
        sprint: task.sprint || '',
        goal: task.goal || '',
        acceptanceCriteria: task.acceptanceCriteria || '',
        successMetrics: task.successMetrics || '',
        notes: task.notes || '',
        externalId: task.externalId || '',
        externalUrl: task.externalUrl || '',
      });
    } else {
      reset({
        title: '',
        description: '',
        status: defaultStatus,
        priority: 'medium',
        dueDate: '',
        estimatedHours: '',
        tags: '',
        taskType: null,
        category: null,
        phase: '',
        sprint: '',
        goal: '',
        acceptanceCriteria: '',
        successMetrics: '',
        notes: '',
        externalId: '',
        externalUrl: '',
      });
    }
  }, [task, defaultStatus, reset]);

  const onSubmit = async (data: TaskFormData) => {
    if (!user) return;

    const tagsArray = data.tags
      ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const extendedData = {
      title: data.title,
      description: data.description || '',
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      estimatedHours: data.estimatedHours
        ? parseFloat(data.estimatedHours)
        : null,
      tags: tagsArray,
      // Extended fields
      taskType: data.taskType || null,
      category: data.category || null,
      phase: data.phase || null,
      sprint: data.sprint || null,
      goal: data.goal || null,
      acceptanceCriteria: data.acceptanceCriteria || null,
      successMetrics: data.successMetrics || null,
      notes: data.notes || null,
      externalId: data.externalId || null,
      externalUrl: data.externalUrl || null,
    };

    if (isEditing && task) {
      await updateTask.mutateAsync({
        id: task.id,
        data: extendedData,
      });
    } else {
      await createTask.mutateAsync({
        ...extendedData,
        projectId,
        reporterId: user.id,
        reporterName: user.displayName,
      });
    }

    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'Create Task'}</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Information */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter task title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              placeholder="Enter task description"
              rows={3}
              className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={watchStatus}
                onValueChange={(value) => setValue('status', value as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                value={watchPriority}
                onValueChange={(value) => setValue('priority', value as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
              />
            </div>

            <div>
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                step="0.5"
                min="0"
                {...register('estimatedHours')}
                placeholder="e.g., 4"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder="e.g., frontend, urgent, bug"
            />
          </div>

          {/* Categorization Section */}
          <CollapsibleSection title="Categorization" defaultOpen={isEditing && (!!task?.taskType || !!task?.category)}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Task Type</Label>
                <Select
                  value={watchTaskType || ''}
                  onValueChange={(value) => setValue('taskType', value as TaskType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className={`px-2 py-0.5 rounded text-xs ${option.color}`}>
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={watchCategory || ''}
                  onValueChange={(value) => setValue('category', value as TaskCategory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phase">Phase</Label>
                <Input
                  id="phase"
                  {...register('phase')}
                  placeholder="e.g., Search & Discovery"
                />
              </div>

              <div>
                <Label htmlFor="sprint">Sprint / Week</Label>
                <Input
                  id="sprint"
                  {...register('sprint')}
                  placeholder="e.g., Week 1"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Goals & Criteria Section */}
          <CollapsibleSection title="Goals & Criteria" defaultOpen={isEditing && (!!task?.goal || !!task?.acceptanceCriteria)}>
            <div>
              <Label htmlFor="goal">Goal</Label>
              <textarea
                id="goal"
                {...register('goal')}
                placeholder="What does this task aim to achieve?"
                rows={2}
                className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <Label htmlFor="acceptanceCriteria">Acceptance Criteria</Label>
              <textarea
                id="acceptanceCriteria"
                {...register('acceptanceCriteria')}
                placeholder="How do we know when this task is complete?"
                rows={2}
                className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <Label htmlFor="successMetrics">Success Metrics</Label>
              <textarea
                id="successMetrics"
                {...register('successMetrics')}
                placeholder="How will performance be measured?"
                rows={2}
                className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </CollapsibleSection>

          {/* Notes Section */}
          <CollapsibleSection title="Notes" defaultOpen={isEditing && !!task?.notes}>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes, context, or references"
                rows={3}
                className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </CollapsibleSection>

          {/* External Reference Section */}
          <CollapsibleSection title="External Reference" defaultOpen={isEditing && (!!task?.externalId || !!task?.externalUrl)}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="externalId">External ID</Label>
                <Input
                  id="externalId"
                  {...register('externalId')}
                  placeholder="e.g., JIRA-123"
                />
              </div>

              <div>
                <Label htmlFor="externalUrl">External URL</Label>
                <Input
                  id="externalUrl"
                  {...register('externalUrl')}
                  placeholder="https://..."
                />
                {errors.externalUrl && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.externalUrl.message}
                  </p>
                )}
              </div>
            </div>
          </CollapsibleSection>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
