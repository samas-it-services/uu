import { Timestamp } from 'firebase/firestore';

/**
 * User Role Types
 * See docs/rbac.md for detailed permissions
 */
export type UserRole =
  | 'superuser'
  | 'project_manager'
  | 'qa_manager'
  | 'analyst'
  | 'finance_incharge';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  projects: string[];                  // Array of projectIds user is member of
  isActive: boolean;
  status: PresenceStatus;
  statusMessage: string;
  lastSeen: Timestamp;
  googleTokens?: GoogleTokens;
  preferences: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin: Timestamp;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Timestamp;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  emailDigest: 'none' | 'daily' | 'weekly';
}

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';
