import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { Module, PermissionAction } from '@/types/role';

const SUPER_ADMINS = ['bill@samas.tech', 'bilgrami@gmail.com'];

export const usePermissions = () => {
  const { user, userRole } = useAuth();

  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    return SUPER_ADMINS.includes(user.email) || user.role === 'superuser';
  }, [user]);

  const isFinanceIncharge = useMemo(() => {
    if (!user) return false;
    return user.role === 'finance_incharge';
  }, [user]);

  const isProjectManager = useMemo(() => {
    if (!user) return false;
    return user.role === 'project_manager';
  }, [user]);

  const isQAManager = useMemo(() => {
    if (!user) return false;
    return user.role === 'qa_manager';
  }, [user]);

  const isAnalyst = useMemo(() => {
    if (!user) return false;
    return user.role === 'analyst';
  }, [user]);

  const hasPermission = useMemo(() => {
    return (module: Module, action: PermissionAction): boolean => {
      if (isSuperAdmin) return true;
      if (!userRole) return false;

      const permission = userRole.permissions[module];
      if (!permission) return false;

      return permission.actions?.includes(action) ?? false;
    };
  }, [userRole, isSuperAdmin]);

  const canAccessProject = useMemo(() => {
    return (projectId: string): boolean => {
      if (!user) return false;
      if (isSuperAdmin) return true;

      // Finance in-charge can view all projects
      if (isFinanceIncharge) return true;

      // Check if user is a member of the project
      return user.projects?.includes(projectId) ?? false;
    };
  }, [user, isSuperAdmin, isFinanceIncharge]);

  const canManageProject = useMemo(() => {
    return (projectId: string): boolean => {
      if (!user) return false;
      if (isSuperAdmin) return true;

      // Only project managers who are members can manage
      return isProjectManager && (user.projects?.includes(projectId) ?? false);
    };
  }, [user, isSuperAdmin, isProjectManager]);

  const canAccessSensitiveData = useMemo(() => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    if (isFinanceIncharge) return true;
    return false;
  }, [user, isSuperAdmin, isFinanceIncharge]);

  const canAccessAllProjects = useMemo(() => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    if (isFinanceIncharge) return true;
    return false;
  }, [user, isSuperAdmin, isFinanceIncharge]);

  const canAccessGlobalAssets = useMemo(() => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    if (isFinanceIncharge) return true;
    return false;
  }, [user, isSuperAdmin, isFinanceIncharge]);

  return {
    hasPermission,
    canAccessProject,
    canManageProject,
    canAccessSensitiveData,
    canAccessAllProjects,
    canAccessGlobalAssets,
    isSuperAdmin,
    isFinanceIncharge,
    isProjectManager,
    isQAManager,
    isAnalyst,
    // Legacy alias
    isFinanceManager: isFinanceIncharge,
  };
};
