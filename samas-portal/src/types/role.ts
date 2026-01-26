import { Timestamp } from 'firebase/firestore';

/**
 * RBAC Role Definitions
 * See docs/rbac.md for complete specification
 */

export type PermissionScope = 'global' | 'project' | 'own' | 'none';
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';

export interface Permission {
  actions: PermissionAction[];
  scope: PermissionScope;
}

export interface RolePermissions {
  finance: Permission;
  documents: Permission;
  projects: Permission;
  assets: Permission;
  tasks: Permission;
  announcements: Permission;
  rbac: Permission;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: RolePermissions;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type Module = keyof RolePermissions;
