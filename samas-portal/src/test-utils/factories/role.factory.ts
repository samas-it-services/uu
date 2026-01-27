/**
 * Role Factory
 * Creates mock role data for testing
 */

import { Role, Permission, RolePermissions, PermissionAction } from '@/types/role';

let roleCounter = 0;

const mockTimestamp = {
  toDate: () => new Date(),
  seconds: Math.floor(Date.now() / 1000),
  nanoseconds: 0,
};

const noPermission: Permission = {
  actions: [],
  scope: 'none',
};

const readOnlyPermission = (scope: 'global' | 'project' | 'own' = 'project'): Permission => ({
  actions: ['read'] as PermissionAction[],
  scope,
});

const fullPermission = (scope: 'global' | 'project' | 'own' = 'global'): Permission => ({
  actions: ['create', 'read', 'update', 'delete'] as PermissionAction[],
  scope,
});

const customPermission = (actions: PermissionAction[], scope: 'global' | 'project' | 'own' | 'none'): Permission => ({
  actions,
  scope,
});

const defaultPermissions: RolePermissions = {
  finance: noPermission,
  documents: readOnlyPermission('project'),
  projects: readOnlyPermission('project'),
  assets: noPermission,
  tasks: readOnlyPermission('project'),
  announcements: readOnlyPermission('project'),
  rbac: noPermission,
};

export interface RoleFactoryOptions {
  id?: string;
  name?: string;
  description?: string;
  isSystem?: boolean;
  permissions?: Partial<RolePermissions>;
}

export function createMockRole(options: RoleFactoryOptions = {}): Role {
  roleCounter++;
  const id = options.id || `role-${roleCounter}`;

  return {
    id,
    name: options.name || `Test Role ${roleCounter}`,
    description: options.description || `Description for role ${roleCounter}`,
    isSystem: options.isSystem ?? false,
    permissions: {
      ...defaultPermissions,
      ...options.permissions,
    },
    createdAt: mockTimestamp as Role['createdAt'],
    updatedAt: mockTimestamp as Role['updatedAt'],
  };
}

export function createMockSuperAdminRole(): Role {
  return createMockRole({
    id: 'superuser',
    name: 'Super User',
    description: 'Full system access',
    isSystem: true,
    permissions: {
      finance: fullPermission('global'),
      documents: fullPermission('global'),
      projects: fullPermission('global'),
      assets: fullPermission('global'),
      tasks: fullPermission('global'),
      announcements: fullPermission('global'),
      rbac: fullPermission('global'),
    },
  });
}

export function createMockFinanceManagerRole(): Role {
  return createMockRole({
    id: 'finance_incharge',
    name: 'Finance In-charge',
    description: 'Financial management access',
    isSystem: true,
    permissions: {
      finance: fullPermission('global'),
      documents: customPermission(['read', 'update'], 'project'),
      projects: readOnlyPermission('global'),
      assets: customPermission(['read', 'update'], 'project'),
      tasks: customPermission(['read', 'update'], 'own'),
      announcements: fullPermission('project'),
      rbac: noPermission,
    },
  });
}

export function createMockProjectManagerRole(): Role {
  return createMockRole({
    id: 'project_manager',
    name: 'Project Manager',
    description: 'Project management access',
    isSystem: true,
    permissions: {
      finance: readOnlyPermission('project'),
      documents: fullPermission('project'),
      projects: customPermission(['read', 'update'], 'project'),
      assets: fullPermission('project'),
      tasks: fullPermission('project'),
      announcements: fullPermission('project'),
      rbac: noPermission,
    },
  });
}

export function createMockEmployeeRole(): Role {
  return createMockRole({
    id: 'analyst',
    name: 'Analyst',
    description: 'Basic employee access',
    isSystem: true,
    permissions: {
      finance: noPermission,
      documents: fullPermission('own'),
      projects: readOnlyPermission('project'),
      assets: customPermission(['read', 'update'], 'project'),
      tasks: customPermission(['read', 'update'], 'own'),
      announcements: readOnlyPermission('project'),
      rbac: noPermission,
    },
  });
}

// Create all system roles
export function createAllSystemRoles(): Role[] {
  return [
    createMockSuperAdminRole(),
    createMockFinanceManagerRole(),
    createMockProjectManagerRole(),
    createMockEmployeeRole(),
  ];
}

// Reset counter for tests
export function resetRoleFactory() {
  roleCounter = 0;
}
