/**
 * Role Factory
 * Creates mock role data for testing
 */

import { Role, Permission, RolePermissions, DataAccess } from '@/types/role';

let roleCounter = 0;

const mockTimestamp = {
  toDate: () => new Date(),
  seconds: Math.floor(Date.now() / 1000),
  nanoseconds: 0,
};

const noPermission: Permission = {
  create: false,
  read: false,
  update: false,
  delete: false,
};

const readOnlyPermission: Permission = {
  create: false,
  read: true,
  update: false,
  delete: false,
};

const fullPermission: Permission = {
  create: true,
  read: true,
  update: true,
  delete: true,
};

const defaultPermissions: RolePermissions = {
  finance: noPermission,
  documents: readOnlyPermission,
  projects: readOnlyPermission,
  assets: noPermission,
  tasks: readOnlyPermission,
  announcements: readOnlyPermission,
  rbac: noPermission,
};

const defaultDataAccess: DataAccess = {
  allProjects: false,
  sensitiveFinancials: false,
  globalAssets: false,
};

export interface RoleFactoryOptions {
  id?: string;
  name?: string;
  description?: string;
  isSystem?: boolean;
  permissions?: Partial<RolePermissions>;
  dataAccess?: Partial<DataAccess>;
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
    dataAccess: {
      ...defaultDataAccess,
      ...options.dataAccess,
    },
    createdAt: mockTimestamp as Role['createdAt'],
    updatedAt: mockTimestamp as Role['updatedAt'],
  };
}

export function createMockSuperAdminRole(): Role {
  return createMockRole({
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full system access',
    isSystem: true,
    permissions: {
      finance: fullPermission,
      documents: fullPermission,
      projects: fullPermission,
      assets: fullPermission,
      tasks: fullPermission,
      announcements: fullPermission,
      rbac: fullPermission,
    },
    dataAccess: {
      allProjects: true,
      sensitiveFinancials: true,
      globalAssets: true,
    },
  });
}

export function createMockFinanceManagerRole(): Role {
  return createMockRole({
    id: 'finance_manager',
    name: 'Finance Manager',
    description: 'Financial management access',
    isSystem: true,
    permissions: {
      finance: fullPermission,
      documents: readOnlyPermission,
      projects: readOnlyPermission,
      assets: readOnlyPermission,
      tasks: readOnlyPermission,
      announcements: readOnlyPermission,
      rbac: noPermission,
    },
    dataAccess: {
      allProjects: true,
      sensitiveFinancials: true,
      globalAssets: true,
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
      finance: readOnlyPermission,
      documents: fullPermission,
      projects: fullPermission,
      assets: readOnlyPermission,
      tasks: fullPermission,
      announcements: readOnlyPermission,
      rbac: noPermission,
    },
    dataAccess: {
      allProjects: false,
      sensitiveFinancials: false,
      globalAssets: false,
    },
  });
}

export function createMockEmployeeRole(): Role {
  return createMockRole({
    id: 'employee',
    name: 'Employee',
    description: 'Basic employee access',
    isSystem: true,
    permissions: {
      finance: { ...noPermission, read: true, create: true }, // Can read and create expenses
      documents: readOnlyPermission,
      projects: readOnlyPermission,
      assets: readOnlyPermission,
      tasks: { ...readOnlyPermission, update: true }, // Can update assigned tasks
      announcements: readOnlyPermission,
      rbac: noPermission,
    },
    dataAccess: {
      allProjects: false,
      sensitiveFinancials: false,
      globalAssets: false,
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
