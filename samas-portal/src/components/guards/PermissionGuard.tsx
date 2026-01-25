import { FC, ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Module, Action } from '@/types/role';

interface PermissionGuardProps {
  module: Module;
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGuard: FC<PermissionGuardProps> = ({
  module,
  action,
  children,
  fallback = null,
}) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
