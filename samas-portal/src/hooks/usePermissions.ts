import { useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';
import { Module, PermissionAction, RolePermissions } from '@/types/role';
import { ProjectRole } from '@/types/projectRole';
import { Project } from '@/types/project';

const SUPER_ADMINS = ['bill@samas.tech', 'bilgrami@gmail.com'];

/**
 * Check if permissions object grants the specified action on a module
 */
function checkPermissionActions(
  permissions: RolePermissions | undefined,
  module: Module,
  action: PermissionAction
): boolean {
  if (!permissions) return false;
  const permission = permissions[module];
  if (!permission) return false;
  return permission.actions?.includes(action) ?? false;
}

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

  /**
   * Check if user has a system-level permission
   */
  const hasPermission = useMemo(() => {
    return (module: Module, action: PermissionAction): boolean => {
      if (isSuperAdmin) return true;
      if (!userRole) return false;

      return checkPermissionActions(userRole.permissions, module, action);
    };
  }, [userRole, isSuperAdmin]);

  /**
   * Check if user has permission via project role (additive model)
   * This requires the project and project roles to be passed in
   */
  const hasProjectPermission = useCallback(
    (
      module: Module,
      action: PermissionAction,
      project: Project | null | undefined,
      projectRoles: ProjectRole[] | undefined
    ): boolean => {
      // Super admin always has access
      if (isSuperAdmin) return true;

      // Check system role permission first
      if (userRole && checkPermissionActions(userRole.permissions, module, action)) {
        return true;
      }

      // If no project context, only system permissions apply
      if (!project || !projectRoles || !user) return false;

      // Find user's membership in project
      const membership = project.teamMembers.find((m) => m.userId === user.id);
      if (!membership) return false;

      // If member has a project role, check its permissions
      if (membership.projectRoleId) {
        const projectRole = projectRoles.find((r) => r.id === membership.projectRoleId);
        if (projectRole && checkPermissionActions(projectRole.permissions, module, action)) {
          return true;
        }
      }

      return false;
    },
    [user, userRole, isSuperAdmin]
  );

  /**
   * Get user's project role in a specific project
   */
  const getUserProjectRole = useCallback(
    (project: Project | null | undefined, projectRoles: ProjectRole[] | undefined): ProjectRole | null => {
      if (!project || !projectRoles || !user) return null;

      const membership = project.teamMembers.find((m) => m.userId === user.id);
      if (!membership?.projectRoleId) return null;

      return projectRoles.find((r) => r.id === membership.projectRoleId) || null;
    },
    [user]
  );

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
    // System-level permissions
    hasPermission,
    // Project-aware permissions (additive model)
    hasProjectPermission,
    getUserProjectRole,
    // Access checks
    canAccessProject,
    canManageProject,
    canAccessSensitiveData,
    canAccessAllProjects,
    canAccessGlobalAssets,
    // Role checks
    isSuperAdmin,
    isFinanceIncharge,
    isProjectManager,
    isQAManager,
    isAnalyst,
    // Legacy alias
    isFinanceManager: isFinanceIncharge,
  };
};
