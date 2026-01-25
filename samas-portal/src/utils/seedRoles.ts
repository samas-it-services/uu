/**
 * Seed Default Roles Utility
 *
 * Can be called from browser console or from a button in the admin UI.
 * Usage in console: import('@/utils/seedRoles').then(m => m.seedDefaultRoles())
 */

import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { RolePermissions, DataAccess } from '@/types/role';

const defaultPermission = {
  create: false,
  read: false,
  update: false,
  delete: false,
};

const fullPermission = {
  create: true,
  read: true,
  update: true,
  delete: true,
};

const readOnlyPermission = {
  create: false,
  read: true,
  update: false,
  delete: false,
};

interface SystemRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: RolePermissions;
  dataAccess: DataAccess;
}

const systemRoles: SystemRole[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full system access with all permissions. Can manage users, roles, and all system settings.',
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
  },
  {
    id: 'finance_manager',
    name: 'Finance Manager',
    description: 'Manages financial operations. Can view all projects and access sensitive financial data.',
    isSystem: true,
    permissions: {
      finance: fullPermission,
      documents: { ...readOnlyPermission, create: true },
      projects: readOnlyPermission,
      assets: readOnlyPermission,
      tasks: readOnlyPermission,
      announcements: readOnlyPermission,
      rbac: defaultPermission,
    },
    dataAccess: {
      allProjects: true,
      sensitiveFinancials: true,
      globalAssets: true,
    },
  },
  {
    id: 'project_manager',
    name: 'Project Manager',
    description: 'Manages assigned projects. Can only access their own projects and cannot view sensitive financial data.',
    isSystem: true,
    permissions: {
      finance: { create: true, read: true, update: true, delete: false },
      documents: fullPermission,
      projects: fullPermission,
      assets: { create: true, read: true, update: true, delete: false },
      tasks: fullPermission,
      announcements: { create: true, read: true, update: true, delete: false },
      rbac: defaultPermission,
    },
    dataAccess: {
      allProjects: false,
      sensitiveFinancials: false,
      globalAssets: false,
    },
  },
  {
    id: 'employee',
    name: 'Employee',
    description: 'Standard employee access. Can view and participate in assigned projects.',
    isSystem: true,
    permissions: {
      finance: defaultPermission,
      documents: { ...readOnlyPermission, create: true },
      projects: readOnlyPermission,
      assets: readOnlyPermission,
      tasks: { create: true, read: true, update: true, delete: false },
      announcements: readOnlyPermission,
      rbac: defaultPermission,
    },
    dataAccess: {
      allProjects: false,
      sensitiveFinancials: false,
      globalAssets: false,
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
