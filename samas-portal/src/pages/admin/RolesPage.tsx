import { FC, useState } from 'react';
import { Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import { Role, RolePermissions } from '@/types/role';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '@/hooks/useRoles';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { RoleModal } from '@/components/admin/RoleModal';
import { PermissionGuard } from '@/components/guards/PermissionGuard';

export const RolesPage: FC = () => {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const { data: roles, isLoading } = useRoles();
  const { hasPermission } = usePermissions();

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const handleAddRole = () => {
    setSelectedRole(null);
    setShowRoleModal(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setShowRoleModal(true);
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem) {
      alert('System roles cannot be deleted.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      await deleteRole.mutateAsync(role.id);
    }
  };

  const handleRoleSubmit = async (data: {
    name: string;
    description: string;
    permissions: RolePermissions;
  }) => {
    if (selectedRole) {
      await updateRole.mutateAsync({
        id: selectedRole.id,
        data: {
          name: data.name,
          description: data.description,
          permissions: data.permissions,
        },
      });
    } else {
      await createRole.mutateAsync({
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        isSystem: false,
      });
    }
    setShowRoleModal(false);
    setSelectedRole(null);
  };

  const getPermissionCount = (role: Role): number => {
    let count = 0;
    Object.values(role.permissions).forEach((module) => {
      if (module?.actions) {
        count += module.actions.length;
      }
    });
    return count;
  };

  const getScopeLabel = (role: Role): string => {
    const scopes = new Set<string>();
    Object.values(role.permissions).forEach((module) => {
      if (module?.scope && module.scope !== 'none') {
        scopes.add(module.scope);
      }
    });
    if (scopes.has('global')) return 'Global';
    if (scopes.has('project')) return 'Project';
    if (scopes.has('own')) return 'Own';
    return 'No access';
  };

  const canCreate = hasPermission('rbac', 'create');
  const canUpdate = hasPermission('rbac', 'update');
  const canDelete = hasPermission('rbac', 'delete');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Role Management</h1>
            <p className="text-muted-foreground">Configure roles and permissions</p>
          </div>
        </div>
        <PermissionGuard module="rbac" action="create">
          <Button onClick={handleAddRole}>
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        </PermissionGuard>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !roles || roles.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No roles found</h3>
          <p className="text-muted-foreground">Create roles to manage permissions</p>
          {canCreate && (
            <Button onClick={handleAddRole} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add First Role
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {role.name}
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-xs">
                          System
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">{role.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Permissions:</span>
                    <Badge variant="outline">{getPermissionCount(role)} enabled</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {getScopeLabel(role)} Scope
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t">
                    {canUpdate && (
                      <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)}>
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    {canDelete && !role.isSystem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRole(role)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RoleModal
        open={showRoleModal}
        onOpenChange={setShowRoleModal}
        role={selectedRole}
        onSubmit={handleRoleSubmit}
        isLoading={createRole.isPending || updateRole.isPending}
      />
    </div>
  );
};
