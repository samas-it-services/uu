import { FC } from 'react';
import { format } from 'date-fns';
import {
  Folder,
  Calendar,
  Users,
  Clock,
  ChevronRight,
  Archive,
  MoreVertical,
} from 'lucide-react';
import { Project, ProjectStatus, ProjectPriority } from '@/types/project';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  onArchive?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }
> = {
  planning: { label: 'Planning', variant: 'secondary' },
  active: { label: 'Active', variant: 'success' },
  on_hold: { label: 'On Hold', variant: 'warning' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const priorityConfig: Record<ProjectPriority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'text-gray-500' },
  medium: { label: 'Medium', className: 'text-blue-500' },
  high: { label: 'High', className: 'text-orange-500' },
  critical: { label: 'Critical', className: 'text-red-500' },
};

export const ProjectCard: FC<ProjectCardProps> = ({
  project,
  onClick,
  onArchive: _onArchive,
  onEdit,
  showActions = true,
}) => {
  const statusInfo = statusConfig[project.status];
  const priorityInfo = priorityConfig[project.priority];

  const progress = project.budget
    ? Math.round((project.budget.spent / project.budget.total) * 100)
    : null;

  const isOverdue =
    project.deadline &&
    project.status !== 'completed' &&
    project.status !== 'cancelled' &&
    project.deadline.toDate() < new Date();

  return (
    <Card
      className={cn(
        'p-4 hover:shadow-md transition-shadow cursor-pointer',
        project.isArchived && 'opacity-60',
        isOverdue && 'border-red-300 dark:border-red-700'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${project.color}20` }}
        >
          <Folder className="h-6 w-6" style={{ color: project.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 font-mono uppercase">
              {project.code}
            </span>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            {project.priority !== 'medium' && (
              <span className={cn('text-xs font-medium', priorityInfo.className)}>
                {priorityInfo.label}
              </span>
            )}
            {project.isArchived && (
              <Badge variant="secondary">
                <Archive className="h-3 w-3 mr-1" />
                Archived
              </Badge>
            )}
            {isOverdue && <Badge variant="destructive">Overdue</Badge>}
          </div>

          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">
            {project.name}
          </h3>

          {project.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {project.description}
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            {/* Manager */}
            <div className="flex items-center gap-1">
              <Avatar size="sm" fallback={project.managerName} />
              <span className="truncate max-w-[100px]">{project.managerName}</span>
            </div>

            {/* Team size */}
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{project.teamMembers.length}</span>
            </div>

            {/* Deadline */}
            {project.deadline && (
              <div
                className={cn(
                  'flex items-center gap-1',
                  isOverdue && 'text-red-500'
                )}
              >
                <Calendar className="h-4 w-4" />
                <span>{format(project.deadline.toDate(), 'MMM d, yyyy')}</span>
              </div>
            )}

            {/* Duration */}
            {project.startDate && project.endDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  {format(project.startDate.toDate(), 'MMM d')} -{' '}
                  {format(project.endDate.toDate(), 'MMM d')}
                </span>
              </div>
            )}
          </div>

          {/* Budget Progress */}
          {project.budget && progress !== null && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Budget</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: project.budget.currency,
                  }).format(project.budget.spent)}{' '}
                  /{' '}
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: project.budget.currency,
                  }).format(project.budget.total)}
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    progress >= 100
                      ? 'bg-red-500'
                      : progress >= 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  )}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {project.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {project.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{project.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2">
          {showActions && (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </Card>
  );
};
