import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProjectRole } from '@/types/projectRole';
import { RolePermissions } from '@/types/role';
import { defaultPermissions } from '@/services/api/roles';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PermissionMatrix } from '@/components/admin/PermissionMatrix';

const roleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  color: z.string().min(1, 'Color is required'),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface ProjectRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: ProjectRole | null;
  onSubmit: (data: RoleFormData & { permissions: RolePermissions }) => void;
  isLoading?: boolean;
}

const colorOptions = [
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#6b7280', label: 'Gray' },
];

export const ProjectRoleModal: FC<ProjectRoleModalProps> = ({
  open,
  onOpenChange,
  role,
  onSubmit,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoleFormData & { permissions: RolePermissions }>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#3b82f6',
      permissions: defaultPermissions,
    },
  });

  const permissions = watch('permissions');
  const selectedColor = watch('color');

  useEffect(() => {
    if (role) {
      reset({
        name: role.name,
        description: role.description,
        color: role.color,
        permissions: role.permissions,
      });
    } else {
      reset({
        name: '',
        description: '',
        color: '#3b82f6',
        permissions: defaultPermissions,
      });
    }
  }, [role, reset]);

  const handleFormSubmit = (data: RoleFormData & { permissions: RolePermissions }) => {
    onSubmit(data);
  };

  const handlePermissionsChange = (newPermissions: RolePermissions) => {
    setValue('permissions', newPermissions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Project Role' : 'Create Project Role'}</DialogTitle>
          <DialogDescription className="sr-only">
            {role ? 'Edit project role name, description and permissions' : 'Create a new project role with custom permissions'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Role Name
              </label>
              <Input
                id="name"
                placeholder="Developer"
                {...register('name')}
                error={errors.name?.message}
                disabled={role?.isDefault}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="description"
                placeholder="Full access to tasks and documents"
                {...register('description')}
                error={errors.description?.message}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Role Color</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setValue('color', color.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color.value
                      ? 'border-gray-900 dark:border-white scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Permissions</h4>
            <p className="text-xs text-gray-500 mb-4">
              These permissions apply within this project only. Users also keep their system-level permissions.
            </p>
            <PermissionMatrix
              permissions={permissions}
              onPermissionsChange={handlePermissionsChange}
              disabled={false}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              {role ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
