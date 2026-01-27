/**
 * E2E Authentication Helpers
 *
 * Provides utilities for authenticating test users against Firebase emulators.
 */

import { Page } from '@playwright/test';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  Timestamp,
  Firestore,
} from 'firebase/firestore';

// Test user credentials for different roles
export const TEST_USERS = {
  superuser: {
    email: 'test-super@test.local',
    password: 'TestPassword123!',
    displayName: 'Test Super Admin',
    role: 'superuser',
  },
  analyst: {
    email: 'test-analyst@test.local',
    password: 'TestPassword123!',
    displayName: 'Test Analyst',
    role: 'analyst',
  },
  projectManager: {
    email: 'test-pm@test.local',
    password: 'TestPassword123!',
    displayName: 'Test Project Manager',
    role: 'project_manager',
  },
  financeIncharge: {
    email: 'test-finance@test.local',
    password: 'TestPassword123!',
    displayName: 'Test Finance Manager',
    role: 'finance_incharge',
  },
  qaManager: {
    email: 'test-qa@test.local',
    password: 'TestPassword123!',
    displayName: 'Test QA Manager',
    role: 'qa_manager',
  },
} as const;

export type TestUserRole = keyof typeof TEST_USERS;

// Firebase app instance for tests
let testApp: FirebaseApp | null = null;
let testAuth: Auth | null = null;
let testDb: Firestore | null = null;

/**
 * Initialize Firebase for testing with emulators
 */
export function initializeTestFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (testApp && testAuth && testDb) {
    return { app: testApp, auth: testAuth, db: testDb };
  }

  testApp = initializeApp({
    apiKey: 'test-api-key',
    authDomain: 'localhost',
    projectId: 'demo-test-project',
    storageBucket: 'demo-test-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abc123',
  }, 'test-app');

  testAuth = getAuth(testApp);
  testDb = getFirestore(testApp);

  // Connect to emulators
  connectAuthEmulator(testAuth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(testDb, 'localhost', 8080);

  return { app: testApp, auth: testAuth, db: testDb };
}

/**
 * Clean up Firebase test instance
 */
export async function cleanupTestFirebase(): Promise<void> {
  if (testApp) {
    await deleteApp(testApp);
    testApp = null;
    testAuth = null;
    testDb = null;
  }
}

/**
 * Create a test user in Firebase Auth and Firestore
 */
export async function createTestUser(role: TestUserRole): Promise<string> {
  const { auth, db } = initializeTestFirebase();
  const userData = TEST_USERS[role];

  try {
    // Create auth user
    const credential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    const uid = credential.user.uid;

    // Create user document in Firestore
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      email: userData.email,
      displayName: userData.displayName,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${role}`,
      role: userData.role,
      projects: [],
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log(`Created test user: ${userData.email} (${role})`);
    return uid;
  } catch (error: unknown) {
    // User might already exist
    if (error instanceof Error && 'code' in error && error.code === 'auth/email-already-in-use') {
      console.log(`Test user already exists: ${userData.email}`);
      const credential = await signInWithEmailAndPassword(auth, userData.email, userData.password);
      return credential.user.uid;
    }
    throw error;
  }
}

/**
 * Create all test users
 */
export async function createAllTestUsers(): Promise<void> {
  const roles: TestUserRole[] = ['superuser', 'analyst', 'projectManager', 'financeIncharge', 'qaManager'];

  for (const role of roles) {
    await createTestUser(role);
  }
}

/**
 * Seed system roles in Firestore
 */
export async function seedSystemRoles(): Promise<void> {
  const { db } = initializeTestFirebase();

  const roles = [
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

  for (const role of roles) {
    const roleRef = doc(db, 'roles', role.id);
    await setDoc(roleRef, {
      ...role,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`Seeded role: ${role.id}`);
  }
}

/**
 * Authenticate as a test user and save storage state
 */
export async function authenticateAndSaveState(
  page: Page,
  role: TestUserRole,
  statePath: string
): Promise<void> {
  const userData = TEST_USERS[role];

  // Navigate to login page
  await page.goto('/login');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Since we're using Google OAuth normally, we need to inject auth state
  // For emulator testing, we'll use a test login endpoint or inject tokens

  // Sign in via emulator - inject auth state directly
  const { auth } = initializeTestFirebase();

  try {
    await signInWithEmailAndPassword(auth, userData.email, userData.password);

    // Get the ID token
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Failed to get current user after sign in');
    }

    const idToken = await currentUser.getIdToken();

    // Inject the auth state into the browser
    await page.evaluate(
      ({ token, user }) => {
        // Store auth state in localStorage (Firebase Auth SDK format)
        const authKey = `firebase:authUser:test-api-key:[DEFAULT]`;
        localStorage.setItem(authKey, JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          stsTokenManager: {
            accessToken: token,
            expirationTime: Date.now() + 3600000,
          },
        }));
      },
      {
        token: idToken,
        user: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
        },
      }
    );

    // Navigate to trigger auth check
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Save the storage state
    await page.context().storageState({ path: statePath });
    console.log(`Saved auth state for ${role} to ${statePath}`);
  } finally {
    await firebaseSignOut(auth);
  }
}

/**
 * Sign out the current user
 */
export async function signOut(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Clear Firebase auth state from localStorage
    Object.keys(localStorage)
      .filter(key => key.startsWith('firebase:'))
      .forEach(key => localStorage.removeItem(key));
  });
  await page.goto('/login');
}
