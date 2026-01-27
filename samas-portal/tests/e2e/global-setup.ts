/**
 * Playwright Global Setup
 *
 * Runs before all tests to:
 * 1. Seed Firebase emulator with test data using REST API
 * 2. Create test users
 * 3. Generate auth storage states for each role
 */

import { FullConfig } from '@playwright/test';
import { TestUserRole, TEST_USERS } from './helpers/auth.js';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, '.auth');

// Emulator URLs
const AUTH_EMULATOR_URL = 'http://localhost:9099';
const FIRESTORE_EMULATOR_URL = 'http://localhost:8080';
const PROJECT_ID = 'demo-test-project';

// System roles to seed
const SYSTEM_ROLES = [
  {
    id: 'superuser',
    name: 'Super User',
    description: 'Full system access',
    isSystem: true,
    permissions: {
      finance: { actions: ['create', 'read', 'update', 'delete'], scope: 'global' },
      documents: { actions: ['create', 'read', 'update', 'delete'], scope: 'global' },
      projects: { actions: ['create', 'read', 'update', 'delete'], scope: 'global' },
      assets: { actions: ['create', 'read', 'update', 'delete'], scope: 'global' },
      tasks: { actions: ['create', 'read', 'update', 'delete'], scope: 'global' },
      announcements: { actions: ['create', 'read', 'update', 'delete'], scope: 'global' },
      rbac: { actions: ['create', 'read', 'update', 'delete'], scope: 'global' },
    },
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'Basic employee access',
    isSystem: true,
    permissions: {
      finance: { actions: [], scope: 'none' },
      documents: { actions: ['create', 'read', 'update', 'delete'], scope: 'own' },
      projects: { actions: ['read'], scope: 'project' },
      assets: { actions: ['read', 'update'], scope: 'project' },
      tasks: { actions: ['read', 'update'], scope: 'own' },
      announcements: { actions: ['read'], scope: 'project' },
      rbac: { actions: [], scope: 'none' },
    },
  },
  {
    id: 'project_manager',
    name: 'Project Manager',
    description: 'Project management access',
    isSystem: true,
    permissions: {
      finance: { actions: ['read'], scope: 'project' },
      documents: { actions: ['create', 'read', 'update', 'delete'], scope: 'project' },
      projects: { actions: ['read', 'update'], scope: 'project' },
      assets: { actions: ['create', 'read', 'update', 'delete'], scope: 'project' },
      tasks: { actions: ['create', 'read', 'update', 'delete'], scope: 'project' },
      announcements: { actions: ['create', 'read', 'update', 'delete'], scope: 'project' },
      rbac: { actions: [], scope: 'none' },
    },
  },
  {
    id: 'finance_incharge',
    name: 'Finance In-charge',
    description: 'Financial management access',
    isSystem: true,
    permissions: {
      finance: { actions: ['create', 'read', 'update', 'delete'], scope: 'global' },
      documents: { actions: ['read', 'update'], scope: 'project' },
      projects: { actions: ['read'], scope: 'global' },
      assets: { actions: ['read', 'update'], scope: 'project' },
      tasks: { actions: ['read', 'update'], scope: 'own' },
      announcements: { actions: ['create', 'read', 'update', 'delete'], scope: 'project' },
      rbac: { actions: [], scope: 'none' },
    },
  },
  {
    id: 'qa_manager',
    name: 'QA Manager',
    description: 'Quality assurance management',
    isSystem: true,
    permissions: {
      finance: { actions: [], scope: 'none' },
      documents: { actions: ['create', 'read', 'update'], scope: 'project' },
      projects: { actions: ['read'], scope: 'project' },
      assets: { actions: ['read', 'update'], scope: 'project' },
      tasks: { actions: ['create', 'read', 'update'], scope: 'project' },
      announcements: { actions: ['create', 'read', 'update'], scope: 'project' },
      rbac: { actions: [], scope: 'none' },
    },
  },
];

/**
 * Create a user in the Auth emulator using REST API
 */
async function createUserInEmulator(email: string, password: string, displayName: string): Promise<string> {
  const signUpUrl = `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test-api-key`;

  const response = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      displayName,
      returnSecureToken: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Check if user already exists
    if (errorText.includes('EMAIL_EXISTS')) {
      // Sign in to get the localId
      const signInUrl = `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test-api-key`;
      const signInResponse = await fetch(signInUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });

      if (!signInResponse.ok) {
        throw new Error(`Failed to sign in existing user ${email}`);
      }

      const signInData = await signInResponse.json();
      return signInData.localId;
    }
    throw new Error(`Failed to create user ${email}: ${errorText}`);
  }

  const data = await response.json();
  return data.localId;
}

/**
 * Seed a document in Firestore emulator using REST API
 */
async function seedFirestoreDocument(
  collection: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const url = `${FIRESTORE_EMULATOR_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;

  // Convert data to Firestore format
  const firestoreFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      firestoreFields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      firestoreFields[key] = { integerValue: value.toString() };
    } else if (typeof value === 'boolean') {
      firestoreFields[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      firestoreFields[key] = {
        arrayValue: {
          values: value.map(v => {
            if (typeof v === 'string') return { stringValue: v };
            if (typeof v === 'number') return { integerValue: v.toString() };
            return { stringValue: String(v) };
          }),
        },
      };
    } else if (typeof value === 'object' && value !== null) {
      // Handle nested objects (like permissions)
      const mapFields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        if (typeof v === 'string') {
          mapFields[k] = { stringValue: v };
        } else if (typeof v === 'boolean') {
          mapFields[k] = { booleanValue: v };
        } else if (Array.isArray(v)) {
          mapFields[k] = {
            arrayValue: {
              values: v.map(item => {
                if (typeof item === 'string') return { stringValue: item };
                return { stringValue: String(item) };
              }),
            },
          };
        } else if (typeof v === 'object' && v !== null) {
          // Deeper nesting for permission objects
          const innerFields: Record<string, unknown> = {};
          for (const [ik, iv] of Object.entries(v)) {
            if (typeof iv === 'string') {
              innerFields[ik] = { stringValue: iv };
            } else if (Array.isArray(iv)) {
              innerFields[ik] = {
                arrayValue: {
                  values: iv.map(item => ({ stringValue: String(item) })),
                },
              };
            }
          }
          mapFields[k] = { mapValue: { fields: innerFields } };
        }
      }
      firestoreFields[key] = { mapValue: { fields: mapFields } };
    }
  }

  // Add timestamps
  const now = new Date().toISOString();
  firestoreFields['createdAt'] = { timestampValue: now };
  firestoreFields['updatedAt'] = { timestampValue: now };

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer owner', // Bypass security rules in emulator
    },
    body: JSON.stringify({ fields: firestoreFields }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to seed ${collection}/${docId}: ${errorText}`);
  }
}

async function globalSetup(_config: FullConfig) {
  // Skip auth setup if not using emulators
  if (process.env.VITE_USE_EMULATORS !== 'true') {
    console.log('Skipping auth setup - emulators not enabled');
    return;
  }

  console.log('Starting E2E global setup...');

  try {
    // Check if emulators are running
    try {
      const response = await fetch(`${AUTH_EMULATOR_URL}/`);
      if (!response.ok) {
        throw new Error('Auth emulator not responding');
      }
    } catch {
      console.error('Firebase emulators are not running. Please start them with: npm run emulators');
      throw new Error('Firebase emulators not available');
    }

    // Seed roles using Firestore REST API
    console.log('Seeding system roles...');
    for (const role of SYSTEM_ROLES) {
      await seedFirestoreDocument('roles', role.id, {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions: role.permissions,
      });
      console.log(`  Seeded role: ${role.id}`);
    }

    // Create test users using Auth Emulator REST API
    console.log('Creating test users...');
    const roles: TestUserRole[] = ['superuser', 'analyst', 'projectManager', 'financeIncharge', 'qaManager'];

    for (const role of roles) {
      const userData = TEST_USERS[role];
      try {
        const uid = await createUserInEmulator(
          userData.email,
          userData.password,
          userData.displayName
        );

        // Create user document in Firestore
        await seedFirestoreDocument('users', uid, {
          email: userData.email,
          displayName: userData.displayName,
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${role}`,
          role: userData.role,
          projects: [],
          isActive: true,
        });

        console.log(`  Created user: ${userData.email} (uid: ${uid})`);
      } catch (error) {
        console.error(`  Failed to create user ${userData.email}:`, error);
        throw error;
      }
    }

    // Create auth state directory
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    // Create placeholder storage state files
    for (const role of roles) {
      const statePath = path.join(AUTH_DIR, `${role}.json`);
      fs.writeFileSync(statePath, JSON.stringify({
        cookies: [],
        origins: [],
      }));
    }

    console.log('E2E global setup complete!');
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;
