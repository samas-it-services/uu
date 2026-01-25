# Agent 2: Authentication Agent Checklist
## Authentication & Authorization Specialist

---

## Role Overview

**Responsibilities**: Google Sign-In implementation, user session management, RBAC context implementation, permission checking hooks, auth state persistence.

**Files Owned**:
- `src/contexts/AuthContext.tsx`
- `src/hooks/useAuth.ts`
- `src/hooks/usePermissions.ts`
- `src/services/firebase/auth.ts`
- `src/services/firebase/config.ts`
- `src/pages/auth/**`
- `src/components/auth/**`

---

## Phase 1 Tasks

### Firebase Configuration
- [ ] Create `src/services/firebase/config.ts`
- [ ] Initialize Firebase app
- [ ] Export auth, db, storage instances
- [ ] Handle environment variables
- [ ] Add error handling for missing config

### Auth Context Implementation
- [ ] Create `src/contexts/AuthContext.tsx`
- [ ] Define AuthContext interface:
  ```typescript
  interface AuthContextValue {
    user: User | null;
    loading: boolean;
    error: Error | null;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
  }
  ```
- [ ] Implement AuthProvider component
- [ ] Handle onAuthStateChanged subscription
- [ ] Manage loading states properly
- [ ] Handle auth errors gracefully

### Google Sign-In
- [ ] Configure GoogleAuthProvider
- [ ] Add required OAuth scopes:
  - [ ] `https://www.googleapis.com/auth/drive`
  - [ ] `https://www.googleapis.com/auth/calendar`
- [ ] Implement signInWithPopup
- [ ] Extract and store Google OAuth tokens
- [ ] Handle popup blocked scenarios
- [ ] Handle auth errors

### User Document Management
- [ ] Create getOrCreateUser function
- [ ] Check if user exists in Firestore
- [ ] Create new user document if not exists
- [ ] Assign default 'employee' role
- [ ] Auto-assign 'super_admin' for predefined emails:
  - [ ] bill@samas.tech
  - [ ] bilgrami@gmail.com
- [ ] Update lastLogin on sign in
- [ ] Store Google tokens in user document

### Session Management
- [ ] Implement session persistence (localStorage)
- [ ] Handle page refresh without re-auth
- [ ] Implement sign out functionality
- [ ] Clear local state on sign out
- [ ] Update presence on sign out

### useAuth Hook
- [ ] Create `src/hooks/useAuth.ts`
- [ ] Export user, loading, error states
- [ ] Export signInWithGoogle function
- [ ] Export signOut function
- [ ] Add isAuthenticated helper
- [ ] Add type-safe user access

### Protected Routes
- [ ] Create `src/components/auth/ProtectedRoute.tsx`
- [ ] Redirect to login if not authenticated
- [ ] Show loading state while checking auth
- [ ] Preserve intended destination for redirect

### Login Page
- [ ] Create `src/pages/auth/LoginPage.tsx`
- [ ] Design login UI with company branding
- [ ] Add Google Sign-In button
- [ ] Show loading state during auth
- [ ] Display auth errors
- [ ] Redirect to dashboard on success

---

## Phase 2 Tasks

### usePermissions Hook
- [ ] Create `src/hooks/usePermissions.ts`
- [ ] Load user's role definitions from Firestore
- [ ] Implement `hasPermission(module, action)`:
  ```typescript
  type Module = 'finance' | 'documents' | 'projects' | 'assets' | 'tasks' | 'announcements' | 'rbac';
  type Action = 'create' | 'read' | 'update' | 'delete';
  ```
- [ ] Implement `canAccessProject(projectId)`:
  - [ ] Super admin: always true
  - [ ] Finance manager: true (read-only)
  - [ ] Project manager: only if in managedProjects
  - [ ] Employee: only if in memberProjects
- [ ] Implement `canAccessSensitiveData()`:
  - [ ] Only super_admin and finance_manager
- [ ] Implement `canManageProject(projectId)`:
  - [ ] Super admin or project owner only
- [ ] Implement role check helpers:
  - [ ] `isSuperAdmin()`
  - [ ] `isFinanceManager()`
  - [ ] `isProjectManager()`

### Permission Guard Components
- [ ] Create `src/components/auth/PermissionGuard.tsx`:
  ```tsx
  <PermissionGuard module="finance" action="read">
    <FinanceContent />
  </PermissionGuard>
  ```
- [ ] Create `src/components/auth/RoleGuard.tsx`:
  ```tsx
  <RoleGuard roles={['super_admin', 'finance_manager']}>
    <AdminContent />
  </RoleGuard>
  ```
- [ ] Create `src/components/auth/ProjectGuard.tsx`:
  ```tsx
  <ProjectGuard projectId={id}>
    <ProjectContent />
  </ProjectGuard>
  ```
- [ ] Show fallback or redirect for unauthorized

### Google Token Management
- [ ] Implement token refresh logic
- [ ] Create `getGoogleAccessToken(userId)` function
- [ ] Check token expiration
- [ ] Refresh expired tokens
- [ ] Update tokens in Firestore

---

## Testing Requirements

### Unit Tests
- [ ] Test AuthContext provider
- [ ] Test useAuth hook
- [ ] Test usePermissions hook
- [ ] Test permission calculations
- [ ] Test project access logic
- [ ] Test sensitive data access logic
- [ ] Mock Firebase Auth

### Integration Tests
- [ ] Test sign-in flow end-to-end
- [ ] Test user document creation
- [ ] Test super admin auto-assignment
- [ ] Test permission enforcement

---

## Acceptance Criteria

- [ ] Users can sign in with Google (Workspace + Gmail)
- [ ] Super admins auto-assigned to predefined emails
- [ ] New users get default 'employee' role
- [ ] User document created in Firestore
- [ ] Auth state persists across page refresh
- [ ] Permissions correctly restrict access
- [ ] Project managers can only access their projects
- [ ] Project managers cannot access sensitive data
- [ ] Google tokens stored and refreshable
- [ ] Protected routes redirect unauthorized users

---

## Key Code Snippets

### Auth Context Structure
```typescript
// src/contexts/AuthContext.tsx
const SUPER_ADMINS = ['bill@samas.tech', 'bilgrami@gmail.com'];

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  // ... implementation
  
  const getOrCreateUser = async (firebaseUser: FirebaseUser): Promise<User> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as User;
    }
    
    // Create new user
    const isSuperAdmin = SUPER_ADMINS.includes(firebaseUser.email || '');
    const newUser: Omit<User, 'id'> = {
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || '',
      roles: isSuperAdmin ? ['super_admin'] : ['employee'],
      managedProjects: [],
      memberProjects: [],
      isActive: true,
      // ... other fields
    };
    
    await setDoc(userRef, newUser);
    return { id: firebaseUser.uid, ...newUser };
  };
};
```

### Permission Check
```typescript
// src/hooks/usePermissions.ts
const canAccessProject = useCallback((projectId: string): boolean => {
  if (!user) return false;
  if (user.roles.includes('super_admin')) return true;
  if (user.roles.includes('finance_manager')) return true; // Read-only
  
  return user.managedProjects.includes(projectId) || 
         user.memberProjects.includes(projectId);
}, [user]);

const canAccessSensitiveData = useCallback((): boolean => {
  if (!user) return false;
  return user.roles.includes('super_admin') || 
         user.roles.includes('finance_manager');
}, [user]);
```

---

## Handoff Notes

Provide to UI/UX Agent:
- AuthContext API documentation
- useAuth hook usage examples
- usePermissions hook usage examples
- Guard component usage examples

Provide to all module agents:
- Permission checking patterns
- Project access checking patterns
- Sensitive data access patterns
