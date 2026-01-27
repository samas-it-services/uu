import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Role, RolePermissions } from '@/types/role';
import { defaultPermissions } from '@/services/api/roles';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PermissionMatrix } from './PermissionMatrix';

const roleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  onSubmit: (data: RoleFormData & { permissions: RolePermissions }) => void;
  isLoading?: boolean;
}

export const RoleModal: FC<RoleModalProps> = ({
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
      permissions: defaultPermissions,
    },
  });

  const permissions = watch('permissions');

  useEffect(() => {
    if (role) {
      reset({
        name: role.name,
        description: role.description,
        permissions: role.permissions,
      });
    } else {
      reset({
        name: '',
        description: '',
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
          <DialogTitle>{role ? 'Edit Role' : 'Create New Role'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Role Name
              </label>
              <Input
                id="name"
                placeholder="Project Manager"
                {...register('name')}
                error={errors.name?.message}
                disabled={role?.isSystem}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="description"
                placeholder="Manages projects and team members"
                {...register('description')}
                error={errors.description?.message}
              />
            </div>
          </div>

          <PermissionMatrix
            permissions={permissions}
            onPermissionsChange={handlePermissionsChange}
            disabled={false}
          />

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
