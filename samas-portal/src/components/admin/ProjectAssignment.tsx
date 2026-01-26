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
  onSubmit: (userId: string, projects: string[]) => void;
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
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setSelectedProjects(user.projects || []);
    } else {
      setSelectedProjects([]);
    }
  }, [user]);

  const handleToggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const handleSubmit = () => {
    if (user) {
      onSubmit(user.id, selectedProjects);
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
            <br />
            <span className="text-xs">
              Role: <Badge variant="outline">{user.role}</Badge>
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
          <div className="text-sm text-muted-foreground mb-2">
            Select projects this user should have access to. Their permissions within each project
            are determined by their role ({user.role}).
          </div>
          {projects.map((project) => {
            const isSelected = selectedProjects.includes(project.id);

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
                      checked={isSelected}
                      onCheckedChange={() => handleToggleProject(project.id)}
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
