import { FC, useEffect, useState } from 'react';
import { Loader2, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useAuth } from '@/hooks/useAuth';
import { useAllProjects } from '@/hooks/useProjects';
import { useRoles } from '@/hooks/useRoles';
import {
  useCreateAnnouncement,
  useUpdateAnnouncement,
} from '@/hooks/useAnnouncements';
import {
  Announcement,
  AnnouncementType,
  AnnouncementPriority,
  TargetAudience,
} from '@/types/announcement';
import { Timestamp } from 'firebase/firestore';

interface AnnouncementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement?: Announcement | null;
  defaultProjectId?: string;
}

const announcementTypes: { value: AnnouncementType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'policy', label: 'Policy' },
  { value: 'event', label: 'Event' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'celebration', label: 'Celebration' },
];

const priorityOptions: { value: AnnouncementPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const audienceOptions: { value: TargetAudience; label: string }[] = [
  { value: 'all', label: 'All Employees' },
  { value: 'projects', label: 'Specific Projects' },
  { value: 'roles', label: 'Specific Roles' },
];

export const AnnouncementModal: FC<AnnouncementModalProps> = ({
  open,
  onOpenChange,
  announcement,
  defaultProjectId,
}) => {
  const { user } = useAuth();
  const { data: projects } = useAllProjects();
  const { data: roles } = useRoles();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();

  const isEditing = !!announcement;

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('general');
  const [priority, setPriority] = useState<AnnouncementPriority>('normal');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('all');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  // Reset form when modal opens/closes or announcement changes
  useEffect(() => {
    if (open) {
      if (announcement) {
        setTitle(announcement.title);
        setContent(announcement.content);
        setType(announcement.type);
        setPriority(announcement.priority);
        setTargetAudience(announcement.targetAudience);
        setSelectedProjectIds(announcement.projectIds || []);
        setSelectedRoleIds(announcement.roleIds || []);
        setExpiresAt(
          announcement.expiresAt
            ? announcement.expiresAt.toDate().toISOString().split('T')[0]
            : ''
        );
        setIsPinned(announcement.isPinned);
        setIsPublished(announcement.isPublished);
      } else {
        setTitle('');
        setContent('');
        setType('general');
        setPriority('normal');
        setTargetAudience('all');
        setSelectedProjectIds(defaultProjectId ? [defaultProjectId] : []);
        setSelectedRoleIds([]);
        setExpiresAt('');
        setIsPinned(false);
        setIsPublished(true);
      }
    }
  }, [open, announcement, defaultProjectId]);

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSubmit = async () => {
    if (!user || !title.trim() || !content.trim()) return;

    const data = {
      title: title.trim(),
      content: content.trim(),
      type,
      priority,
      targetAudience,
      projectIds: targetAudience === 'projects' ? selectedProjectIds : [],
      roleIds: targetAudience === 'roles' ? selectedRoleIds : [],
      expiresAt: expiresAt
        ? Timestamp.fromDate(new Date(expiresAt + 'T23:59:59'))
        : null,
      isPinned,
      isPublished,
    };

    try {
      if (isEditing && announcement) {
        await updateAnnouncement.mutateAsync({ id: announcement.id, data });
      } else {
        await createAnnouncement.mutateAsync({
          ...data,
          authorId: user.id,
          authorName: user.displayName,
          authorPhotoURL: user.photoURL || '',
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const isPending = createAnnouncement.isPending || updateAnnouncement.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Announcement' : 'Create Announcement'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing
              ? 'Edit an existing announcement'
              : 'Create a new announcement for employees'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="announcement-title">Title *</Label>
            <Input
              id="announcement-title"
              data-testid="announcement-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title"
              className="mt-1"
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="announcement-content">Content *</Label>
            <textarea
              id="announcement-content"
              data-testid="announcement-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter announcement content..."
              rows={6}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
            />
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type *</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as AnnouncementType)}
              >
                <SelectTrigger data-testid="announcement-type" className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {announcementTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority *</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as AnnouncementPriority)}
              >
                <SelectTrigger data-testid="announcement-priority" className="mt-1">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <Label>Target Audience *</Label>
            <Select
              value={targetAudience}
              onValueChange={(value) => setTargetAudience(value as TargetAudience)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select target audience" />
              </SelectTrigger>
              <SelectContent>
                {audienceOptions.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Selection (if audience is projects) */}
          {targetAudience === 'projects' && (
            <div>
              <Label>Select Projects</Label>
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                {projects?.map((project) => (
                  <label
                    key={project.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-accent p-1 rounded"
                  >
                    <Checkbox
                      checked={selectedProjectIds.includes(project.id)}
                      onCheckedChange={() => handleProjectToggle(project.id)}
                    />
                    <span className="text-sm">{project.name}</span>
                  </label>
                ))}
                {(!projects || projects.length === 0) && (
                  <p className="text-sm text-muted-foreground">No projects available</p>
                )}
              </div>
            </div>
          )}

          {/* Role Selection (if audience is roles) */}
          {targetAudience === 'roles' && (
            <div>
              <Label>Select Roles</Label>
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                {roles?.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-accent p-1 rounded"
                  >
                    <Checkbox
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={() => handleRoleToggle(role.id)}
                    />
                    <span className="text-sm">{role.name}</span>
                  </label>
                ))}
                {(!roles || roles.length === 0) && (
                  <p className="text-sm text-muted-foreground">No roles available</p>
                )}
              </div>
            </div>
          )}

          {/* Expiration Date */}
          <div>
            <Label htmlFor="expires-at">Expiration Date (Optional)</Label>
            <div className="relative mt-1">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="expires-at"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="pl-10"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for no expiration
            </p>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={isPinned}
                onCheckedChange={(checked) => setIsPinned(checked === true)}
              />
              <span className="text-sm">Pin to top</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={isPublished}
                onCheckedChange={(checked) => setIsPublished(checked === true)}
              />
              <span className="text-sm">Publish immediately</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              data-testid="submit-announcement"
              onClick={handleSubmit}
              disabled={isPending || !title.trim() || !content.trim()}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : isEditing ? (
                'Update Announcement'
              ) : (
                'Create Announcement'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
