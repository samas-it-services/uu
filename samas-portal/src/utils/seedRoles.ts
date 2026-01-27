/**
 * Seed Default Roles Utility
 *
 * Can be called from browser console or from a button in the admin UI.
 * Usage in console: import('@/utils/seedRoles').then(m => m.seedDefaultRoles())
 */

import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { RolePermissions, Permission, PermissionAction } from '@/types/role';

const noPermission: Permission = {
  actions: [],
  scope: 'none',
};

const fullPermission = (scope: 'global' | 'project' | 'own' = 'global'): Permission => ({
  actions: ['create', 'read', 'update', 'delete'] as PermissionAction[],
  scope,
});

const readOnlyPermission = (scope: 'global' | 'project' | 'own' = 'global'): Permission => ({
  actions: ['read'] as PermissionAction[],
  scope,
});

const customPermission = (actions: PermissionAction[], scope: 'global' | 'project' | 'own' | 'none'): Permission => ({
  actions,
  scope,
});

interface SystemRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: RolePermissions;
}

const systemRoles: SystemRole[] = [
  {
    id: 'superuser',
    name: 'Super User',
    description: 'Full system access with all permissions. Can manage users, roles, and all system settings.',
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
  },
  {
    id: 'finance_incharge',
    name: 'Finance In-charge',
    description: 'Manages financial operations. Can view all projects and access sensitive financial data.',
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
  },
  {
    id: 'project_manager',
    name: 'Project Manager',
    description: 'Manages assigned projects. Can only access their own projects and cannot view sensitive financial data.',
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
  },
  {
    id: 'qa_manager',
    name: 'QA Manager',
    description: 'Quality assurance lead. Read/update on documents and assets, own tasks only.',
    isSystem: true,
    permissions: {
      finance: readOnlyPermission('project'),
      documents: customPermission(['read', 'update'], 'project'),
      projects: readOnlyPermission('project'),
      assets: customPermission(['read', 'update'], 'project'),
      tasks: customPermission(['read', 'update'], 'own'),
      announcements: fullPermission('project'),
      rbac: noPermission,
    },
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'Team member. Read all documents, CRUD on own documents, update own tasks.',
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
  },
];

export const seedDefaultRoles = async (): Promise<void> => {
  console.log('Starting role seed...');

  const rolesRef = collection(db, 'roles');
  const now = Timestamp.now();

  for (const role of systemRoles) {
    const { id, ...roleData } = role;
    const docRef = doc(rolesRef, id);

    await setDoc(
      docRef,
      {
        ...roleData,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    console.log(`Created/Updated role: ${role.name}`);
  }

  console.log('Role seed completed successfully!');
};

export { systemRoles };
