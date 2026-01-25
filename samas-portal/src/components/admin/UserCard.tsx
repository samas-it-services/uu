import { FC } from 'react';
import { User } from '@/types/user';
import { Role } from '@/types/role';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Edit2, Trash2, UserCheck, UserX, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserCardProps {
  user: User;
  roles: Role[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onAssignRoles: (user: User) => void;
}

export const UserCard: FC<UserCardProps> = ({
  user,
  roles,
  onEdit,
  onDelete,
  onToggleStatus,
  onAssignRoles,
}) => {
  const userRoles = roles.filter((role) => user.roles.includes(role.id));

  return (
    <Card className={cn(!user.isActive && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar
            src={user.photoURL}
            fallback={user.displayName.charAt(0).toUpperCase()}
            className="h-12 w-12"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{user.displayName}</h3>
              <Badge variant={user.isActive ? 'success' : 'secondary'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {userRoles.map((role) => (
                <Badge key={role.id} variant="outline" className="text-xs">
                  {role.name}
                </Badge>
              ))}
              {userRoles.length === 0 && (
                <span className="text-xs text-muted-foreground">No roles assigned</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <Button variant="ghost" size="sm" onClick={() => onAssignRoles(user)} title="Assign Roles">
            <Shield className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(user)} title="Edit User">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleStatus(user)}
            title={user.isActive ? 'Deactivate' : 'Activate'}
          >
            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(user)}
            title="Delete User"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
