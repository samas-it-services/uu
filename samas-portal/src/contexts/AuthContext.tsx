import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '@/services/firebase/config';
import { User } from '@/types/user';
import { Role } from '@/types/role';

import { UserRole } from '@/types/user';

const SUPER_ADMINS = ['bill@samas.tech', 'bilgrami@gmail.com'];
const DEFAULT_ROLES: Record<string, UserRole> = {
  'bill@samas.tech': 'superuser',
  'hinas.samas@gmail.com': 'analyst',
  'saminas.samas@gmail.com': 'finance_incharge',
  'asmaaslam.samas@gmail.com': 'analyst',
  'shamsa.samas0@gmail.com': 'analyst',
  'shahneela.samas@gmail.com': 'project_manager',
};

interface AuthContextValue {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  userRole: Role | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (!fbUser) {
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      // Fetch or create user document
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create new user document
        const email = fbUser.email || '';
        const isSuperAdmin = SUPER_ADMINS.includes(email);
        const predefinedRole = DEFAULT_ROLES[email];

        let userRoleId: UserRole;
        if (isSuperAdmin) {
          userRoleId = 'superuser';
        } else if (predefinedRole) {
          userRoleId = predefinedRole;
        } else {
          userRoleId = 'analyst'; // Default role
        }

        const newUser = {
          email,
          displayName: fbUser.displayName || '',
          photoURL: fbUser.photoURL || '',
          role: userRoleId,
          projects: [] as string[],
          isActive: true,
          status: 'online' as const,
          statusMessage: '',
          lastSeen: serverTimestamp(),
          preferences: {
            theme: 'system' as const,
            notifications: { email: true, push: true, desktop: true },
            emailDigest: 'daily' as const,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        };

        await setDoc(userRef, newUser);
      } else {
        // Update last login
        await updateDoc(userRef, {
          lastLogin: serverTimestamp(),
          status: 'online',
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to user document changes
  useEffect(() => {
    if (!firebaseUser) return;

    const userRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribe = onSnapshot(userRef, async (snap) => {
      if (snap.exists()) {
        const userData = { id: snap.id, ...snap.data() } as User;
        setUser(userData);

        // Fetch the user's role
        if (userData.role) {
          const roleRef = doc(db, 'roles', userData.role);
          const roleSnap = await getDoc(roleRef);
          if (roleSnap.exists()) {
            setUserRole({ id: roleSnap.id, ...roleSnap.data() } as Role);
          } else {
            setUserRole(null);
          }
        } else {
          setUserRole(null);
        }
      }
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (credential && result.user.email) {
        // Store OAuth tokens for future Google API calls
        const tokens = {
          accessToken: credential.accessToken || '',
          refreshToken: '', // Only available with offline access
          expiresAt: serverTimestamp(),
        };

        const userRef = doc(db, 'users', result.user.uid);
        await updateDoc(userRef, {
          googleTokens: tokens,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (firebaseUser) {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        status: 'offline',
        lastSeen: serverTimestamp(),
      });
    }
    await firebaseSignOut(auth);
  }, [firebaseUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        userRole,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

