import { FC, useState, useMemo } from 'react';
import { Search, Plus, Users } from 'lucide-react';
import { User } from '@/types/user';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useToggleUserStatus, useAssignUserRoles } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { UserCard } from '@/components/admin/UserCard';
import { UserModal } from '@/components/admin/UserModal';
import { RoleAssignment } from '@/components/admin/RoleAssignment';
import { PermissionGuard } from '@/components/guards/PermissionGuard';

export const UsersPage: FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { hasPermission } = usePermissions();

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const toggleUserStatus = useToggleUserStatus();
  const assignUserRoles = useAssignUserRoles();

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.displayName}?`)) {
      await deleteUser.mutateAsync(user.id);
    }
  };

  const handleToggleStatus = async (user: User) => {
    await toggleUserStatus.mutateAsync({ id: user.id, isActive: !user.isActive });
  };

  const handleAssignRoles = (user: User) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleUserSubmit = async (data: { email: string; displayName: string; photoURL?: string; isActive: boolean }) => {
    if (selectedUser) {
      await updateUser.mutateAsync({
        id: selectedUser.id,
        data: {
          displayName: data.displayName,
          photoURL: data.photoURL,
          isActive: data.isActive,
        },
      });
    } else {
      await createUser.mutateAsync({
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        role: 'analyst',
        isActive: data.isActive,
      });
    }
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const handleRolesSubmit = async (userId: string, roleIds: string[]) => {
    await assignUserRoles.mutateAsync({ id: userId, roleIds });
    setShowRoleModal(false);
    setSelectedUser(null);
  };

  const isLoading = usersLoading || rolesLoading;
  const canCreate = hasPermission('rbac', 'create');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage users and their access</p>
          </div>
        </div>
        <PermissionGuard module="rbac" action="create">
          <Button onClick={handleAddUser}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </PermissionGuard>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No users found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try a different search term' : 'Add users to get started'}
          </p>
          {canCreate && !searchQuery && (
            <Button onClick={handleAddUser} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add First User
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              roles={roles || []}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onToggleStatus={handleToggleStatus}
              onAssignRole={handleAssignRoles}
            />
          ))}
        </div>
      )}

      <UserModal
        open={showUserModal}
        onOpenChange={setShowUserModal}
        user={selectedUser}
        onSubmit={handleUserSubmit}
        isLoading={createUser.isPending || updateUser.isPending}
      />

      <RoleAssignment
        open={showRoleModal}
        onOpenChange={setShowRoleModal}
        user={selectedUser}
        roles={roles || []}
        onSubmit={handleRolesSubmit}
        isLoading={assignUserRoles.isPending}
      />
    </div>
  );
};
