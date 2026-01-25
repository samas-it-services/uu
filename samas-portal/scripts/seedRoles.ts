/**
 * Seed Default Roles Script
 *
 * Run this script to seed the default system roles in Firestore.
 * Usage: npx ts-node scripts/seedRoles.ts
 *
 * Or add to package.json:
 * "seed:roles": "npx ts-node scripts/seedRoles.ts"
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';

// Firebase config - replace with your actual config or load from env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

const systemRoles = [
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

async function seedRoles() {
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
}

seedRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding roles:', error);
    process.exit(1);
  });
