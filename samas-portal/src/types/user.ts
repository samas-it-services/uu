import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  roles: string[];
  managedProjects: string[];
  memberProjects: string[];
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
