/**
 * User Factory
 * Creates mock user data for testing
 */

import { User, PresenceStatus, UserPreferences, UserRole } from '@/types/user';

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
  role?: UserRole;
  projects?: string[];
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
    role: options.role || 'analyst',
    projects: options.projects || [],
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

export function createMockSuperuser(options: UserFactoryOptions = {}): User {
  return createMockUser({
    ...options,
    email: options.email || 'bill@samas.tech',
    displayName: options.displayName || 'Syed Bilgrami',
    role: 'superuser',
  });
}

export function createMockFinanceIncharge(options: UserFactoryOptions = {}): User {
  return createMockUser({
    ...options,
    email: options.email || 'saminas.samas@gmail.com',
    displayName: options.displayName || 'Samina Mukhtar',
    role: 'finance_incharge',
  });
}

export function createMockProjectManager(options: UserFactoryOptions = {}): User {
  return createMockUser({
    ...options,
    email: options.email || 'shahneela.samas@gmail.com',
    displayName: options.displayName || 'Shahneela Chaudhry',
    role: 'project_manager',
    projects: options.projects || ['project-1'],
  });
}

export function createMockQAManager(options: UserFactoryOptions = {}): User {
  return createMockUser({
    ...options,
    displayName: options.displayName || 'QA Manager',
    role: 'qa_manager',
    projects: options.projects || ['project-1'],
  });
}

export function createMockAnalyst(options: UserFactoryOptions = {}): User {
  return createMockUser({
    ...options,
    displayName: options.displayName || 'Analyst',
    role: 'analyst',
    projects: options.projects || ['project-1'],
  });
}

// Legacy aliases for backward compatibility
export const createMockSuperAdmin = createMockSuperuser;
export const createMockFinanceManager = createMockFinanceIncharge;
export const createMockEmployee = createMockAnalyst;

// Create multiple users
export function createMockUsers(count: number, options: UserFactoryOptions = {}): User[] {
  return Array.from({ length: count }, () => createMockUser(options));
}

// Reset counter for tests
export function resetUserFactory() {
  userCounter = 0;
}
