import { FC, useState, useEffect } from 'react';
import { User } from '@/types/user';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface ProjectAssignmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  projects: Project[];
  onSubmit: (userId: string, managedProjects: string[], memberProjects: string[]) => void;
  isLoading?: boolean;
}

export const ProjectAssignment: FC<ProjectAssignmentProps> = ({
  open,
  onOpenChange,
  user,
  projects,
  onSubmit,
  isLoading = false,
}) => {
  const [managedProjects, setManagedProjects] = useState<string[]>([]);
  const [memberProjects, setMemberProjects] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setManagedProjects(user.managedProjects || []);
      setMemberProjects(user.memberProjects || []);
    } else {
      setManagedProjects([]);
      setMemberProjects([]);
    }
  }, [user]);

  const handleToggleManaged = (projectId: string) => {
    setManagedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
    // If project is managed, also ensure it's not just a member
    setMemberProjects((prev) => prev.filter((id) => id !== projectId));
  };

  const handleToggleMember = (projectId: string) => {
    // If already managed, don't allow adding as just member
    if (managedProjects.includes(projectId)) return;

    setMemberProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const handleSubmit = () => {
    if (user) {
      onSubmit(user.id, managedProjects, memberProjects);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Projects</DialogTitle>
          <DialogDescription>
            Select projects for <strong>{user.displayName}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
          <div className="text-sm text-muted-foreground mb-2">
            <Badge variant="default" className="mr-2">
              Manager
            </Badge>
            Full access to manage project
            <br />
            <Badge variant="outline" className="mr-2 mt-1">
              Member
            </Badge>
            View and participate in project
          </div>
          {projects.map((project) => {
            const isManaged = managedProjects.includes(project.id);
            const isMember = memberProjects.includes(project.id);

            return (
              <div key={project.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{project.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {project.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={isManaged}
                      onCheckedChange={() => handleToggleManaged(project.id)}
                    />
                    <span className="text-sm">Manager</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={isMember || isManaged}
                      onCheckedChange={() => handleToggleMember(project.id)}
                      disabled={isManaged}
                    />
                    <span className="text-sm">Member</span>
                  </div>
                </div>
              </div>
            );
          })}
          {projects.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No projects available</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isLoading}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
