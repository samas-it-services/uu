import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from '@/types/user';
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
import { Checkbox } from '@/components/ui/Checkbox';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  photoURL: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSubmit: (data: UserFormData) => void;
  isLoading?: boolean;
}

export const UserModal: FC<UserModalProps> = ({
  open,
  onOpenChange,
  user,
  onSubmit,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      displayName: '',
      photoURL: '',
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL || '',
        isActive: user.isActive,
      });
    } else {
      reset({
        email: '',
        displayName: '',
        photoURL: '',
        isActive: true,
      });
    }
  }, [user, reset]);

  const handleFormSubmit = (data: UserFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription className="sr-only">
            {user ? 'Edit user details including email, name, and status' : 'Create a new user account'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register('email')}
              error={errors.email?.message}
              disabled={!!user}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">
              Display Name
            </label>
            <Input
              id="displayName"
              placeholder="John Doe"
              {...register('displayName')}
              error={errors.displayName?.message}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="photoURL" className="text-sm font-medium">
              Photo URL (optional)
            </label>
            <Input
              id="photoURL"
              placeholder="https://example.com/photo.jpg"
              {...register('photoURL')}
              error={errors.photoURL?.message}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked as boolean)}
            />
            <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
              Active
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              {user ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
