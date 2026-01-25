import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { Module, Action } from '@/types/role';

const SUPER_ADMINS = ['bill@samas.tech', 'bilgrami@gmail.com'];

export const usePermissions = () => {
  const { user, roles } = useAuth();

  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    return SUPER_ADMINS.includes(user.email) || user.roles.includes('super_admin');
  }, [user]);

  const isFinanceManager = useMemo(() => {
    if (!user) return false;
    return user.roles.includes('finance_manager');
  }, [user]);

  const isProjectManager = useMemo(() => {
    if (!user) return false;
    return user.roles.includes('project_manager');
  }, [user]);

  const hasPermission = useMemo(() => {
    return (module: Module, action: Action): boolean => {
      if (isSuperAdmin) return true;

      for (const role of roles) {
        if (role.permissions[module]?.[action]) {
          return true;
        }
      }
      return false;
    };
  }, [roles, isSuperAdmin]);

  const canAccessProject = useMemo(() => {
    return (projectId: string): boolean => {
      if (!user) return false;
      if (isSuperAdmin) return true;

      // Finance managers can view all projects
      if (isFinanceManager) return true;

      // Check if user is a manager or member of the project
      return (
        user.managedProjects.includes(projectId) ||
        user.memberProjects.includes(projectId)
      );
    };
  }, [user, isSuperAdmin, isFinanceManager]);

  const canManageProject = useMemo(() => {
    return (projectId: string): boolean => {
      if (!user) return false;
      if (isSuperAdmin) return true;

      // Only project managers and admins can manage projects
      return user.managedProjects.includes(projectId);
    };
  }, [user, isSuperAdmin]);

  const canAccessSensitiveData = useMemo(() => {
    if (!user) return false;
    if (isSuperAdmin) return true;

    for (const role of roles) {
      if (role.dataAccess?.sensitiveFinancials) {
        return true;
      }
    }
    return false;
  }, [user, roles, isSuperAdmin]);

  const canAccessAllProjects = useMemo(() => {
    if (!user) return false;
    if (isSuperAdmin) return true;

    for (const role of roles) {
      if (role.dataAccess?.allProjects) {
        return true;
      }
    }
    return false;
  }, [user, roles, isSuperAdmin]);

  const canAccessGlobalAssets = useMemo(() => {
    if (!user) return false;
    if (isSuperAdmin) return true;

    for (const role of roles) {
      if (role.dataAccess?.globalAssets) {
        return true;
      }
    }
    return false;
  }, [user, roles, isSuperAdmin]);

  return {
    hasPermission,
    canAccessProject,
    canManageProject,
    canAccessSensitiveData,
    canAccessAllProjects,
    canAccessGlobalAssets,
    isSuperAdmin,
    isFinanceManager,
    isProjectManager,
  };
};
