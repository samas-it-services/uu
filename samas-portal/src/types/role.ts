import { Timestamp } from 'firebase/firestore';

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: RolePermissions;
  dataAccess: DataAccess;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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

export interface Permission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface DataAccess {
  allProjects: boolean;
  sensitiveFinancials: boolean;
  globalAssets: boolean;
}

export type Module = keyof RolePermissions;
export type Action = keyof Permission;
