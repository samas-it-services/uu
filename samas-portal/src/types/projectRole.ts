import { Timestamp } from 'firebase/firestore';
import { RolePermissions } from './role';

/**
 * Project-specific Role
 *
 * Each project can have its own set of roles with custom permissions.
 * Stored in: projects/{projectId}/roles/{roleId}
 *
 * Permission model: Project roles ADD to system roles (additive model).
 * A user's effective permission = systemPermission OR projectPermission.
 */
export interface ProjectRole {
  id: string;
  projectId: string;
  name: string;
  description: string;
  isDefault: boolean; // Cannot delete default roles
  permissions: RolePermissions;
  color: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Template for creating a project role (without auto-generated fields)
 */
export type ProjectRoleInput = Omit<
  ProjectRole,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * Default project role templates - created when a new project is created.
 * These provide sensible defaults for common project team roles.
 */
export const DEFAULT_PROJECT_ROLE_TEMPLATES: Omit<
  ProjectRole,
  'id' | 'projectId' | 'createdAt' | 'updatedAt'
>[] = [
  {
    name: 'Project Admin',
    description: 'Full access to all project resources',
    isDefault: true,
    color: '#ef4444', // red
    permissions: {
      finance: { actions: ['create', 'read', 'update', 'delete'], scope: 'project' },
      documents: { actions: ['create', 'read', 'update', 'delete'], scope: 'project' },
      projects: { actions: ['read', 'update'], scope: 'project' },
      assets: { actions: ['create', 'read', 'update', 'delete'], scope: 'project' },
      tasks: { actions: ['create', 'read', 'update', 'delete'], scope: 'project' },
      announcements: { actions: ['create', 'read', 'update', 'delete'], scope: 'project' },
      rbac: { actions: ['read'], scope: 'none' },
    },
  },
  {
    name: 'Developer',
    description: 'Can manage tasks and documents, read-only for other resources',
    isDefault: true,
    color: '#3b82f6', // blue
    permissions: {
      finance: { actions: ['read'], scope: 'project' },
      documents: { actions: ['create', 'read', 'update'], scope: 'project' },
      projects: { actions: ['read'], scope: 'project' },
      assets: { actions: ['read'], scope: 'project' },
      tasks: { actions: ['create', 'read', 'update', 'delete'], scope: 'project' },
      announcements: { actions: ['read'], scope: 'project' },
      rbac: { actions: [], scope: 'none' },
    },
  },
  {
    name: 'Reviewer',
    description: 'Can read all resources and update task status',
    isDefault: true,
    color: '#22c55e', // green
    permissions: {
      finance: { actions: ['read'], scope: 'project' },
      documents: { actions: ['read'], scope: 'project' },
      projects: { actions: ['read'], scope: 'project' },
      assets: { actions: ['read'], scope: 'project' },
      tasks: { actions: ['read', 'update'], scope: 'project' },
      announcements: { actions: ['read'], scope: 'project' },
      rbac: { actions: [], scope: 'none' },
    },
  },
  {
    name: 'Observer',
    description: 'Read-only access to all project resources',
    isDefault: true,
    color: '#6b7280', // gray
    permissions: {
      finance: { actions: ['read'], scope: 'project' },
      documents: { actions: ['read'], scope: 'project' },
      projects: { actions: ['read'], scope: 'project' },
      assets: { actions: ['read'], scope: 'project' },
      tasks: { actions: ['read'], scope: 'project' },
      announcements: { actions: ['read'], scope: 'project' },
      rbac: { actions: [], scope: 'none' },
    },
  },
];
