import { FC } from 'react';
import { format } from 'date-fns';
import {
  Megaphone,
  FileText,
  Calendar,
  Wrench,
  AlertTriangle,
  PartyPopper,
  Pin,
  Edit,
  Trash2,
  Eye,
  Users,
  Building,
} from 'lucide-react';
import {
  Announcement,
  AnnouncementType,
  AnnouncementPriority,
} from '@/types/announcement';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface AnnouncementCardProps {
  announcement: Announcement;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  showActions?: boolean;
  isUnread?: boolean;
  projectName?: string;
}

const typeConfig: Record<
  AnnouncementType,
  { icon: typeof Megaphone; color: string; bgColor: string; label: string }
> = {
  general: {
    icon: Megaphone,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'General',
  },
  policy: {
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'Policy',
  },
  event: {
    icon: Calendar,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Event',
  },
  maintenance: {
    icon: Wrench,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'Maintenance',
  },
  urgent: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Urgent',
  },
  celebration: {
    icon: PartyPopper,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    label: 'Celebration',
  },
};

const priorityConfig: Record<
  AnnouncementPriority,
  { variant: 'default' | 'secondary' | 'warning' | 'destructive'; label: string }
> = {
  low: { variant: 'secondary', label: 'Low' },
  normal: { variant: 'default', label: 'Normal' },
  high: { variant: 'warning', label: 'High' },
  critical: { variant: 'destructive', label: 'Critical' },
};

export const AnnouncementCard: FC<AnnouncementCardProps> = ({
  announcement,
  onClick,
  onEdit,
  onDelete,
  onPin,
  showActions = true,
  isUnread = false,
  projectName,
}) => {
  const config = typeConfig[announcement.type];
  const priority = priorityConfig[announcement.priority];
  const Icon = config.icon;

  
  const truncateContent = (content: string, maxLength = 200) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  return (
    <Card
      data-testid="announcement-card"
      className={cn(
        'p-4 hover:shadow-md transition-shadow cursor-pointer relative',
        isUnread && 'border-l-4 border-l-blue-500'
      )}
      onClick={onClick}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div
          data-testid="unread-indicator"
          className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-500"
        />
      )}

      {/* Pinned indicator */}
      {announcement.isPinned && (
        <div
          data-testid="pinned-badge"
          className="absolute top-4 right-4 flex items-center gap-1 text-amber-500"
        >
          <Pin className="h-4 w-4 fill-current" />
        </div>
      )}

      <div className="flex gap-4">
        {/* Type Icon */}
        <div
          className={cn(
            'h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0',
            config.bgColor
          )}
        >
          <Icon className={cn('h-6 w-6', config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {announcement.title}
              </h3>
              <Badge
                data-testid="type-badge"
                variant="outline"
                className={cn('text-xs', config.color)}
              >
                {config.label}
              </Badge>
              {announcement.priority !== 'normal' && (
                <Badge
                  data-testid="priority-badge"
                  variant={priority.variant}
                  className="text-xs"
                >
                  {priority.label}
                </Badge>
              )}
              {/* Project badge for project-specific announcements */}
              {announcement.targetAudience === 'projects' && projectName && (
                <Badge variant="outline" className="text-xs">
                  <Building className="h-3 w-3 mr-1" />
                  {projectName}
                </Badge>
              )}
              {/* Role badge for role-specific announcements */}
              {announcement.targetAudience === 'roles' && (
                <Badge variant="outline" className="text-xs text-purple-600">
                  <Users className="h-3 w-3 mr-1" />
                  Role-specific
                </Badge>
              )}
            </div>
          </div>

          {/* Content preview */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {truncateContent(announcement.content)}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              {/* Author */}
              <div className="flex items-center gap-2">
                <Avatar
                  size="sm"
                  src={announcement.authorPhotoURL}
                  alt={announcement.authorName}
                  fallback={announcement.authorName}
                  className="h-6 w-6"
                />
                <span>{announcement.authorName}</span>
              </div>

              {/* Date */}
              <span>
                {announcement.publishedAt
                  ? format(announcement.publishedAt.toDate(), 'MMM d, yyyy')
                  : 'Draft'}
              </span>

              {/* Read count */}
              {announcement.readBy.length > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {announcement.readBy.length} read
                </span>
              )}

              {/* Expiration */}
              {announcement.expiresAt && (
                <span className="text-amber-600">
                  Expires {format(announcement.expiresAt.toDate(), 'MMM d')}
                </span>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {onPin && (
                  <Button
                    data-testid="toggle-pin"
                    variant="ghost"
                    size="sm"
                    onClick={onPin}
                    title={announcement.isPinned ? 'Unpin' : 'Pin'}
                    className={cn(
                      announcement.isPinned && 'text-amber-500 hover:text-amber-600'
                    )}
                  >
                    <Pin className={cn('h-4 w-4', announcement.isPinned && 'fill-current')} />
                  </Button>
                )}
                {onEdit && (
                  <Button
                    data-testid="edit-announcement"
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    data-testid="delete-announcement"
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    title="Delete"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
