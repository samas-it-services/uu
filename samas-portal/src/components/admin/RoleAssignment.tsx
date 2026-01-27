import { FC, useState, useEffect } from 'react';
import { User } from '@/types/user';
import { Role } from '@/types/role';
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

interface RoleAssignmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  roles: Role[];
  onSubmit: (userId: string, roleIds: string[]) => void;
  isLoading?: boolean;
}

export const RoleAssignment: FC<RoleAssignmentProps> = ({
  open,
  onOpenChange,
  user,
  roles,
  onSubmit,
  isLoading = false,
}) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      // Single role system - convert role to array for UI compatibility
      setSelectedRoles(user.role ? [user.role] : []);
    } else {
      setSelectedRoles([]);
    }
  }, [user]);

  const handleToggleRole = (roleId: string) => {
    // Single role system - only one role can be selected at a time
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? [] : [roleId]
    );
  };

  const handleSubmit = () => {
    if (user) {
      onSubmit(user.id, selectedRoles);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Roles</DialogTitle>
          <DialogDescription>
            Select roles for <strong>{user.displayName}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer"
              onClick={() => handleToggleRole(role.id)}
            >
              <Checkbox
                checked={selectedRoles.includes(role.id)}
                onCheckedChange={() => handleToggleRole(role.id)}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{role.name}</span>
                  {role.isSystem && (
                    <Badge variant="secondary" className="text-xs">
                      System
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
              </div>
            </div>
          ))}
          {roles.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No roles available</p>
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
