/**
 * Firebase Auth Mocks
 */

import { vi } from 'vitest';

export interface MockAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export const mockAuthUser: MockAuthUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true,
};

export const mockSuperAdminAuthUser: MockAuthUser = {
  uid: 'super-admin-id',
  email: 'bill@samas.tech',
  displayName: 'Bill Admin',
  photoURL: 'https://example.com/admin.jpg',
  emailVerified: true,
};

export const createMockAuth = (currentUser: MockAuthUser | null = null) => ({
  currentUser,
  onAuthStateChanged: vi.fn((callback: (user: MockAuthUser | null) => void) => {
    callback(currentUser);
    return vi.fn(); // unsubscribe function
  }),
  signOut: vi.fn(() => Promise.resolve()),
});

export const mockGoogleAuthProvider = () => ({
  addScope: vi.fn(),
  setCustomParameters: vi.fn(),
});

export const mockSignInWithPopup = vi.fn(() =>
  Promise.resolve({
    user: mockAuthUser,
    credential: {
      accessToken: 'mock-access-token',
      idToken: 'mock-id-token',
    },
  })
);

export const mockSignOut = vi.fn(() => Promise.resolve());

// Helper to setup authenticated state
export const setupAuthenticatedUser = (user: MockAuthUser = mockAuthUser) => {
  const auth = createMockAuth(user);
  return { auth, user };
};

// Helper to setup unauthenticated state
export const setupUnauthenticatedState = () => {
  return createMockAuth(null);
};
