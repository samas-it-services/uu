import { FC, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Megaphone, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { AnnouncementCard } from '@/components/announcements/AnnouncementCard';
import { AnnouncementModal } from '@/components/announcements/AnnouncementModal';
import {
  useAnnouncements,
  useDeleteAnnouncement,
  useToggleAnnouncementPin,
  useMarkAnnouncementAsRead,
} from '@/hooks/useAnnouncements';
import { useAllProjects } from '@/hooks/useProjects';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { Announcement, AnnouncementType, AnnouncementPriority } from '@/types/announcement';
import { AnnouncementFilters } from '@/services/api/announcements';
import { announcementsApi } from '@/services/api/announcements';

const typeOptions: { value: AnnouncementType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'general', label: 'General' },
  { value: 'policy', label: 'Policy' },
  { value: 'event', label: 'Event' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'celebration', label: 'Celebration' },
];

const priorityOptions: { value: AnnouncementPriority | ''; label: string }[] = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const AnnouncementsPage: FC = () => {
  const { user } = useAuth();
  const { isSuperAdmin, isFinanceManager, isProjectManager } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters from URL params
  const typeFilter = (searchParams.get('type') || '') as AnnouncementType | '';
  const priorityFilter = (searchParams.get('priority') || '') as AnnouncementPriority | '';

  // Build filters for API
  const filters: AnnouncementFilters = {};
  if (typeFilter) filters.type = typeFilter;
  if (priorityFilter) filters.priority = priorityFilter;

  // Fetch data
  const { data: announcements, isLoading } = useAnnouncements(filters);
  const { data: projects } = useAllProjects();
  const deleteAnnouncement = useDeleteAnnouncement();
  const togglePin = useToggleAnnouncementPin();
  const markAsRead = useMarkAnnouncementAsRead();

  // Permissions
  const canCreate = isSuperAdmin || isFinanceManager || isProjectManager;
  const canEditAll = isSuperAdmin;

  // Get project name map for displaying on cards
  const projectNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    projects?.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [projects]);

  // Filter and sort announcements
  const filteredAnnouncements = useMemo(() => {
    let result = announcements || [];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.content.toLowerCase().includes(query) ||
          a.authorName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [announcements, searchQuery]);

  // Check if user has read an announcement
  const isUnread = (announcement: Announcement) => {
    if (!user) return false;
    return !announcementsApi.hasUserRead(announcement, user.id);
  };

  // Get project name for an announcement
  const getProjectName = (announcement: Announcement) => {
    if (announcement.targetAudience !== 'projects' || !announcement.projectIds.length) {
      return undefined;
    }
    // Return first project name
    return projectNameMap[announcement.projectIds[0]] || 'Unknown Project';
  };

  // Can user edit this announcement?
  const canEdit = (announcement: Announcement) => {
    if (canEditAll) return true;
    return announcement.authorId === user?.id;
  };

  // Can user delete this announcement?
  const canDelete = (_announcement: Announcement) => {
    return isSuperAdmin;
  };

  // Can user pin this announcement?
  const canPin = () => {
    return isSuperAdmin || isFinanceManager;
  };

  // Handlers
  const handleFilterChange = (key: string, value: string) => {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
  };

  const handleClick = async (announcement: Announcement) => {
    // Mark as read if unread
    if (user && isUnread(announcement)) {
      try {
        await markAsRead.mutateAsync(announcement.id);
      } catch (error) {
        // Silent fail for mark as read
      }
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowModal(true);
  };

  const handleDelete = (announcement: Announcement) => {
    setDeletingAnnouncement(announcement);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingAnnouncement) return;
    try {
      await deleteAnnouncement.mutateAsync(deletingAnnouncement.id);
      setShowDeleteConfirm(false);
      setDeletingAnnouncement(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handlePin = async (announcement: Announcement) => {
    try {
      await togglePin.mutateAsync(announcement.id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setShowModal(true);
  };

  const hasActiveFilters = typeFilter || priorityFilter || searchQuery;

  return (
    <div className="p-6 space-y-6" data-testid="announcements-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Announcements
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Company news and updates
          </p>
        </div>
        {canCreate && (
          <Button data-testid="create-announcement" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Announcement
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            data-testid="search-input"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Type filter */}
        <Select
          value={typeFilter}
          onValueChange={(value) => handleFilterChange('type', value)}
        >
          <SelectTrigger data-testid="filter-type" className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((t) => (
              <SelectItem key={t.value || 'all'} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority filter */}
        <Select
          value={priorityFilter}
          onValueChange={(value) => handleFilterChange('priority', value)}
        >
          <SelectTrigger data-testid="filter-priority" className="w-[160px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((p) => (
              <SelectItem key={p.value || 'all'} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card className="p-12 text-center">
          <Megaphone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {hasActiveFilters ? 'No announcements match your filters' : 'No announcements yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {hasActiveFilters
              ? 'Try adjusting your search or filters'
              : 'Create an announcement to get started'}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : (
            canCreate && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            )
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onClick={() => handleClick(announcement)}
              onEdit={canEdit(announcement) ? () => handleEdit(announcement) : undefined}
              onDelete={canDelete(announcement) ? () => handleDelete(announcement) : undefined}
              onPin={canPin() ? () => handlePin(announcement) : undefined}
              showActions={canEdit(announcement) || canDelete(announcement) || canPin()}
              isUnread={isUnread(announcement)}
              projectName={getProjectName(announcement)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnnouncementModal
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) setEditingAnnouncement(null);
        }}
        announcement={editingAnnouncement}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingAnnouncement?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingAnnouncement(null);
              }}
            >
              Cancel
            </Button>
            <Button
              data-testid="confirm-delete"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteAnnouncement.isPending}
            >
              {deleteAnnouncement.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
