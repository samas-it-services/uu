import { FC } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  MessageSquare,
  Paperclip,
  AlertCircle,
  GripVertical,
  ExternalLink,
} from 'lucide-react';
import { Task, TaskPriority, TaskType, TaskCategory } from '@/types/task';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string; badgeVariant: 'default' | 'secondary' | 'warning' | 'destructive' }
> = {
  low: { label: 'Low', className: 'border-l-gray-400', badgeVariant: 'secondary' },
  medium: { label: 'Medium', className: 'border-l-blue-500', badgeVariant: 'default' },
  high: { label: 'High', className: 'border-l-orange-500', badgeVariant: 'warning' },
  urgent: { label: 'Urgent', className: 'border-l-red-500', badgeVariant: 'destructive' },
};

const taskTypeConfig: Record<TaskType, { label: string; className: string }> = {
  growth: { label: 'Growth', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  experimentation: { label: 'Exp', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  operational: { label: 'Ops', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  maintenance: { label: 'Maint', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
  bug: { label: 'Bug', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  feature: { label: 'Feat', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
};

const categoryConfig: Record<TaskCategory, { label: string; className: string }> = {
  seo: { label: 'SEO', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  marketing: { label: 'Marketing', className: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' },
  engineering: { label: 'Eng', className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  design: { label: 'Design', className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  content: { label: 'Content', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  analytics: { label: 'Analytics', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
  other: { label: 'Other', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
};

export const TaskCard: FC<TaskCardProps> = ({ task, onClick, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    task.dueDate &&
    task.status !== 'done' &&
    task.dueDate.toDate() < new Date();

  const priorityInfo = priorityConfig[task.priority];
  const dragging = isDragging || isSortableDragging;

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={cn(
          'p-3 cursor-pointer hover:shadow-md transition-all border-l-4',
          priorityInfo.className,
          dragging && 'opacity-50 shadow-lg rotate-2',
          isOverdue && 'bg-red-50 dark:bg-red-950/20'
        )}
        onClick={onClick}
      >
        <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
              {task.title}
            </h4>
            {task.priority !== 'medium' && (
              <Badge variant={priorityInfo.badgeVariant} className="shrink-0 text-xs">
                {priorityInfo.label}
              </Badge>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
              {task.description}
            </p>
          )}

          {/* Task Type and Category Badges */}
          {(task.taskType || task.category || task.phase) && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.taskType && (
                <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', taskTypeConfig[task.taskType].className)}>
                  {taskTypeConfig[task.taskType].label}
                </span>
              )}
              {task.category && (
                <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', categoryConfig[task.category].className)}>
                  {categoryConfig[task.category].label}
                </span>
              )}
              {task.phase && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {task.phase}
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  +{task.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {task.dueDate && (
                <div
                  className={cn(
                    'flex items-center gap-1',
                    isOverdue && 'text-red-500 font-medium'
                  )}
                >
                  {isOverdue ? (
                    <AlertCircle className="h-3 w-3" />
                  ) : (
                    <Calendar className="h-3 w-3" />
                  )}
                  <span>{format(task.dueDate.toDate(), 'MMM d')}</span>
                </div>
              )}

              {task.estimatedHours && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {task.actualHours ? `${task.actualHours}/` : ''}
                    {task.estimatedHours}h
                  </span>
                </div>
              )}

              {task.comments.length > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{task.comments.length}</span>
                </div>
              )}

              {task.attachments.length > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  <span>{task.attachments.length}</span>
                </div>
              )}

              {task.externalId && (
                <div className="flex items-center gap-1 text-gray-400" title={`External: ${task.externalId}`}>
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate max-w-[60px]">{task.externalId}</span>
                </div>
              )}
            </div>

            {task.assigneeId && (
              <Avatar
                fallback={task.assigneeName || '?'}
                size="sm"
                className="h-6 w-6"
              />
            )}
          </div>
        </div>
      </div>
      </Card>
    </div>
  );
};
