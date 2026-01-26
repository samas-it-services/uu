import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { User, UserRole } from '@/types/user';

const USERS_COLLECTION = 'users';

export interface CreateUserData {
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  projects?: string[];
  isActive?: boolean;
}

export interface UpdateUserData {
  displayName?: string;
  photoURL?: string;
  role?: UserRole;
  projects?: string[];
  isActive?: boolean;
}

export const usersApi = {
  async getAll(): Promise<User[]> {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, orderBy('displayName', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  },

  async getById(id: string): Promise<User | null> {
    const docRef = doc(db, USERS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as User;
  },

  async getByEmail(email: string): Promise<User | null> {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const userDoc = snapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as User;
  },

  async getActiveUsers(): Promise<User[]> {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('isActive', '==', true), orderBy('displayName', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  },

  async create(data: CreateUserData): Promise<string> {
    const usersRef = collection(db, USERS_COLLECTION);
    const now = Timestamp.now();
    const docRef = await addDoc(usersRef, {
      ...data,
      photoURL: data.photoURL || '',
      projects: data.projects || [],
      isActive: data.isActive ?? true,
      status: 'offline',
      statusMessage: '',
      preferences: {
        theme: 'system',
        notifications: {
          email: true,
          push: true,
          desktop: true,
        },
        emailDigest: 'daily',
      },
      createdAt: now,
      updatedAt: now,
      lastLogin: now,
      lastSeen: now,
    });
    return docRef.id;
  },

  async update(id: string, data: UpdateUserData): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  async deactivate(id: string): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, id);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: Timestamp.now(),
    });
  },

  async activate(id: string): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, id);
    await updateDoc(docRef, {
      isActive: true,
      updatedAt: Timestamp.now(),
    });
  },

  async assignRole(id: string, roleId: UserRole): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, id);
    await updateDoc(docRef, {
      role: roleId,
      updatedAt: Timestamp.now(),
    });
  },

  async assignProjects(id: string, projects: string[]): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, id);
    await updateDoc(docRef, {
      projects,
      updatedAt: Timestamp.now(),
    });
  },
};
