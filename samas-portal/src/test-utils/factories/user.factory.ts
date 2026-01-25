/**
 * User Factory
 * Creates mock user data for testing
 */

import { User, PresenceStatus, UserPreferences } from '@/types/user';

let userCounter = 0;

const defaultPreferences: UserPreferences = {
  theme: 'system',
  notifications: {
    email: true,
    push: true,
    desktop: false,
  },
  emailDigest: 'daily',
};

const mockTimestamp = {
  toDate: () => new Date(),
  seconds: Math.floor(Date.now() / 1000),
  nanoseconds: 0,
};

export interface UserFactoryOptions {
  id?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  roles?: string[];
  managedProjects?: string[];
  memberProjects?: string[];
  isActive?: boolean;
  status?: PresenceStatus;
  statusMessage?: string;
  preferences?: Partial<UserPreferences>;
}

export function createMockUser(options: UserFactoryOptions = {}): User {
  userCounter++;
  const id = options.id || `user-${userCounter}`;

  return {
    id,
    email: options.email || `user${userCounter}@example.com`,
    displayName: options.displayName || `Test User ${userCounter}`,
    photoURL: options.photoURL || `https://example.com/avatar${userCounter}.jpg`,
    roles: options.roles || ['employee'],
    managedProjects: options.managedProjects || [],
    memberProjects: options.memberProjects || [],
    isActive: options.isActive ?? true,
    status: options.status || 'offline',
    statusMessage: options.statusMessage || '',
    lastSeen: mockTimestamp as User['lastSeen'],
    preferences: {
      ...defaultPreferences,
      ...options.preferences,
    },
    createdAt: mockTimestamp as User['createdAt'],
    updatedAt: mockTimestamp as User['updatedAt'],
    lastLogin: mockTimestamp as User['lastLogin'],
  };
}

export function createMockSuperAdmin(options: UserFactoryOptions = {}): User {
  return createMockUser({
    ...options,
    email: options.email || 'bill@samas.tech',
    displayName: options.displayName || 'Bill Admin',
    roles: ['super_admin'],
  });
}

export function createMockFinanceManager(options: UserFactoryOptions = {}): User {
  return createMockUser({
    ...options,
    displayName: options.displayName || 'Finance Manager',
    roles: ['finance_manager'],
  });
}

export function createMockProjectManager(options: UserFactoryOptions = {}): User {
  return createMockUser({
    ...options,
    displayName: options.displayName || 'Project Manager',
    roles: ['project_manager'],
    managedProjects: options.managedProjects || ['project-1'],
  });
}

export function createMockEmployee(options: UserFactoryOptions = {}): User {
  return createMockUser({
    ...options,
    displayName: options.displayName || 'Employee',
    roles: ['employee'],
    memberProjects: options.memberProjects || ['project-1'],
  });
}

// Create multiple users
export function createMockUsers(count: number, options: UserFactoryOptions = {}): User[] {
  return Array.from({ length: count }, () => createMockUser(options));
}

// Reset counter for tests
export function resetUserFactory() {
  userCounter = 0;
}
