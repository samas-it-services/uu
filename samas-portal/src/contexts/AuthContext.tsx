import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
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
import { User, GoogleTokens } from '@/types/user';
import { Role } from '@/types/role';

const SUPER_ADMINS = ['bill@samas.tech', 'bilgrami@gmail.com'];
const DEFAULT_ROLES: Record<string, string[]> = {
  'saminas.samas@gmail.com': ['finance_manager'],
  'shahneela.samas@gmail.com': ['project_manager'],
};

interface AuthContextValue {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  roles: Role[];
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (!fbUser) {
        setUser(null);
        setRoles([]);
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
        const predefinedRoles = DEFAULT_ROLES[email];

        let userRoles: string[];
        if (isSuperAdmin) {
          userRoles = ['super_admin'];
        } else if (predefinedRoles) {
          userRoles = predefinedRoles;
        } else {
          userRoles = ['employee'];
        }

        const newUser: Omit<User, 'id'> = {
          email,
          displayName: fbUser.displayName || '',
          photoURL: fbUser.photoURL || '',
          roles: userRoles,
          managedProjects: [],
          memberProjects: [],
          isActive: true,
          status: 'online',
          statusMessage: '',
          lastSeen: serverTimestamp() as any,
          preferences: {
            theme: 'system',
            notifications: { email: true, push: true, desktop: true },
            emailDigest: 'daily',
          },
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any,
          lastLogin: serverTimestamp() as any,
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

        // Fetch roles
        const rolePromises = userData.roles.map(async (roleId) => {
          const roleRef = doc(db, 'roles', roleId);
          const roleSnap = await getDoc(roleRef);
          if (roleSnap.exists()) {
            return { id: roleSnap.id, ...roleSnap.data() } as Role;
          }
          return null;
        });

        const fetchedRoles = await Promise.all(rolePromises);
        setRoles(fetchedRoles.filter(Boolean) as Role[]);
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
        const tokens: GoogleTokens = {
          accessToken: credential.accessToken || '',
          refreshToken: '', // Only available with offline access
          expiresAt: serverTimestamp() as any,
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
        roles,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
