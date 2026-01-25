import { auditLogsApi, CreateAuditLogData } from '@/services/api/auditLogs';

export const createAuditLog = async (data: CreateAuditLogData): Promise<string> => {
  return auditLogsApi.create(data);
};

export const formatAuditAction = (action: string): string => {
  const actionLabels: Record<string, string> = {
    'user.created': 'User Created',
    'user.updated': 'User Updated',
    'user.deleted': 'User Deleted',
    'user.activated': 'User Activated',
    'user.deactivated': 'User Deactivated',
    'user.roles_assigned': 'Roles Assigned',
    'user.projects_assigned': 'Projects Assigned',
    'role.created': 'Role Created',
    'role.updated': 'Role Updated',
    'role.deleted': 'Role Deleted',
    'role.permissions_updated': 'Permissions Updated',
    login: 'User Login',
    logout: 'User Logout',
  };

  return actionLabels[action] || action;
};

export const getAuditActionColor = (action: string): string => {
  if (action.includes('created')) return 'success';
  if (action.includes('deleted')) return 'destructive';
  if (action.includes('deactivated')) return 'warning';
  if (action.includes('activated')) return 'success';
  return 'secondary';
};
