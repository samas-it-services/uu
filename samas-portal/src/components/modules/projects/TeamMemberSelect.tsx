import { FC, useState } from 'react';
import { Search, UserPlus, X, Loader2, Crown, Shield, User, Eye } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { TeamMember } from '@/types/project';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

interface TeamMemberSelectProps {
  teamMembers: TeamMember[];
  availableUsers: User[];
  onAdd: (member: TeamMember) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
  onRoleChange: (userId: string, role: TeamMember['role']) => Promise<void>;
  managerId: string;
  canEdit?: boolean;
  isLoading?: boolean;
}

const roleConfig: Record<
  TeamMember['role'],
  { label: string; icon: typeof Crown; color: string }
> = {
  manager: { label: 'Manager', icon: Crown, color: 'text-yellow-500' },
  lead: { label: 'Lead', icon: Shield, color: 'text-blue-500' },
  member: { label: 'Member', icon: User, color: 'text-gray-500' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-gray-400' },
};

export const TeamMemberSelect: FC<TeamMemberSelectProps> = ({
  teamMembers,
  availableUsers,
  onAdd,
  onRemove,
  onRoleChange,
  managerId,
  canEdit = false,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<TeamMember['role']>('member');
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [changingRoleUserId, setChangingRoleUserId] = useState<string | null>(null);

  const memberIds = new Set(teamMembers.map((m) => m.userId));
  const filteredUsers = availableUsers.filter(
    (user) =>
      !memberIds.has(user.id) &&
      (user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAdd = async (user: User) => {
    setAddingUserId(user.id);
    try {
      await onAdd({
        userId: user.id,
        userName: user.displayName,
        userPhotoURL: user.photoURL || '',
        role: selectedRole,
        joinedAt: Timestamp.now(),
      });
      setSearchQuery('');
    } finally {
      setAddingUserId(null);
    }
  };

  const handleRemove = async (userId: string) => {
    if (userId === managerId) return; // Can't remove manager
    setRemovingUserId(userId);
    try {
      await onRemove(userId);
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleRoleChange = async (userId: string, role: TeamMember['role']) => {
    if (userId === managerId) return; // Can't change manager role
    setChangingRoleUserId(userId);
    try {
      await onRoleChange(userId, role);
    } finally {
      setChangingRoleUserId(null);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Team Members
        </h3>
        <Badge variant="secondary">{teamMembers.length} members</Badge>
      </div>

      {/* Add member */}
      {canEdit && (
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as TeamMember['role'])}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search results */}
          {searchQuery && filteredUsers.length > 0 && (
            <div className="border rounded-lg max-h-40 overflow-y-auto">
              {filteredUsers.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={user.photoURL}
                      fallback={user.displayName}
                      size="sm"
                    />
                    <div>
                      <div className="text-sm font-medium">{user.displayName}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAdd(user)}
                    disabled={addingUserId === user.id}
                  >
                    {addingUserId === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {searchQuery && filteredUsers.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">
              No users found
            </p>
          )}
        </div>
      )}

      {/* Team list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : teamMembers.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No team members yet
        </p>
      ) : (
        <div className="space-y-2">
          {teamMembers
            .sort((a, b) => {
              const roleOrder = { manager: 0, lead: 1, member: 2, viewer: 3 };
              return roleOrder[a.role] - roleOrder[b.role];
            })
            .map((member) => {
              const roleInfo = roleConfig[member.role];
              const RoleIcon = roleInfo.icon;
              const isManager = member.userId === managerId;

              return (
                <div
                  key={member.userId}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg',
                    'bg-gray-50 dark:bg-gray-800'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={member.userPhotoURL}
                      fallback={member.userName}
                      size="sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.userName}</span>
                        <RoleIcon className={cn('h-4 w-4', roleInfo.color)} />
                      </div>
                      <span className="text-xs text-gray-500">{roleInfo.label}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canEdit && !isManager && (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(value) =>
                            handleRoleChange(member.userId, value as TeamMember['role'])
                          }
                          disabled={changingRoleUserId === member.userId}
                        >
                          <SelectTrigger className="w-[100px] h-8">
                            {changingRoleUserId === member.userId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(member.userId)}
                          disabled={removingUserId === member.userId}
                          className="text-red-500 hover:text-red-600"
                        >
                          {removingUserId === member.userId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                    {isManager && (
                      <Badge variant="secondary" className="text-xs">
                        Owner
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </Card>
  );
};
