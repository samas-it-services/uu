import { FC, ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface RoleGuardProps {
  roles: string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export const RoleGuard: FC<RoleGuardProps> = ({
  roles,
  requireAll = false,
  children,
  fallback = null,
}) => {
  const { isSuperAdmin, isFinanceManager, isProjectManager } = usePermissions();

  const roleChecks: Record<string, boolean> = {
    super_admin: isSuperAdmin,
    finance_manager: isFinanceManager,
    project_manager: isProjectManager,
  };

  const hasAccess = requireAll
    ? roles.every((role) => roleChecks[role])
    : roles.some((role) => roleChecks[role]);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
