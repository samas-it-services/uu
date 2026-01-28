import { FC, useState } from 'react';
import { Plus, Edit, Trash2, Shield, Loader2 } from 'lucide-react';
import { ProjectRole } from '@/types/projectRole';
import { RolePermissions } from '@/types/role';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ProjectRoleModal } from './ProjectRoleModal';
import {
  useProjectRoles,
  useCreateProjectRole,
  useUpdateProjectRole,
  useDeleteProjectRole,
} from '@/hooks/useProjectRoles';
import { usePermissions } from '@/hooks/usePermissions';

interface ProjectRolesSettingsProps {
  projectId: string;
}

export const ProjectRolesSettings: FC<ProjectRolesSettingsProps> = ({ projectId }) => {
  const { isSuperAdmin } = usePermissions();
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ProjectRole | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);

  const { data: roles, isLoading } = useProjectRoles(projectId);
  const createRole = useCreateProjectRole(projectId);
  const updateRole = useUpdateProjectRole(projectId);
  const deleteRole = useDeleteProjectRole(projectId);

  const canManageRoles = isSuperAdmin;

  const handleCreate = () => {
    setSelectedRole(null);
    setShowModal(true);
  };

  const handleEdit = (role: ProjectRole) => {
    setSelectedRole(role);
    setShowModal(true);
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? Team members with this role will need to be reassigned.')) {
      return;
    }
    setDeletingRoleId(roleId);
    try {
      await deleteRole.mutateAsync(roleId);
    } finally {
      setDeletingRoleId(null);
    }
  };

  const handleSubmit = async (data: { name: string; description: string; color: string; permissions: RolePermissions }) => {
    if (selectedRole) {
      await updateRole.mutateAsync({
        roleId: selectedRole.id,
        data: {
          name: data.name,
          description: data.description,
          color: data.color,
          permissions: data.permissions,
        },
      });
    } else {
      await createRole.mutateAsync({
        name: data.name,
        description: data.description,
        color: data.color,
        permissions: data.permissions,
      });
    }
    setShowModal(false);
    setSelectedRole(null);
  };

  const countPermissions = (permissions: RolePermissions): number => {
    let count = 0;
    Object.values(permissions).forEach((p) => {
      count += p.actions?.length || 0;
    });
    return count;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Project Roles</h3>
          <p className="text-sm text-gray-500">
            Define custom roles and permissions for this project
          </p>
        </div>
        {canManageRoles && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        )}
      </div>

      {roles && roles.length === 0 ? (
        <Card className="p-8 text-center">
          <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Roles Defined</h3>
          <p className="text-gray-500 mb-4">
            Create custom roles to control what team members can do in this project.
          </p>
          {canManageRoles && (
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Role
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {roles?.map((role) => (
            <Card key={role.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: role.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{role.name}</h4>
                      {role.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>{countPermissions(role.permissions)} permissions</span>
                    </div>
                  </div>
                </div>

                {canManageRoles && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!role.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(role.id)}
                        disabled={deletingRoleId === role.id}
                        className="text-red-500 hover:text-red-600"
                      >
                        {deletingRoleId === role.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProjectRoleModal
        open={showModal}
        onOpenChange={setShowModal}
        role={selectedRole}
        onSubmit={handleSubmit}
        isLoading={createRole.isPending || updateRole.isPending}
      />
    </div>
  );
};
