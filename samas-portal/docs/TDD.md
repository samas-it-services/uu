# Technical Design Document - saMas Portal

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Pages     │  │ Components  │  │   Hooks     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│           │              │               │                  │
│           └──────────────┴───────────────┘                  │
│                          │                                  │
│                  React Query Cache                          │
│                          │                                  │
│              ┌───────────┴───────────┐                     │
│              │    Services/API       │                     │
└──────────────┴───────────┬───────────┴──────────────────────┘
                           │
              ┌────────────┴────────────┐
              │    Firebase Backend     │
              │  ┌────┐ ┌────┐ ┌────┐  │
              │  │Auth│ │FS  │ │Stor│  │
              │  └────┘ └────┘ └────┘  │
              └─────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite |
| **Styling** | Tailwind CSS + shadcn/ui |
| **State** | React Query (server) + Zustand (client) |
| **Forms** | React Hook Form + Zod validation |
| **Backend** | Firebase (Auth, Firestore, Storage) |
| **Testing** | Vitest (unit) + Playwright (E2E) |

---

## Data Models

### User

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'superuser' | 'project_manager' | 'qa_manager' | 'analyst' | 'finance_incharge';
  isActive: boolean;
  projects: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Role (System)

```typescript
interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: RolePermissions;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Permission {
  actions: ('create' | 'read' | 'update' | 'delete')[];
  scope: 'global' | 'project' | 'own' | 'none';
}

interface RolePermissions {
  finance: Permission;
  documents: Permission;
  projects: Permission;
  assets: Permission;
  tasks: Permission;
  announcements: Permission;
  rbac: Permission;
}
```

### ProjectRole

```typescript
interface ProjectRole {
  id: string;
  projectId: string;
  name: string;
  description: string;
  isDefault: boolean;
  permissions: RolePermissions;
  color: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Project

```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  code: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  deadline: Timestamp | null;
  managerId: string;
  managerName: string;
  teamMembers: TeamMember[];
  budget: ProjectBudget | null;
  tags: string[];
  isArchived: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface TeamMember {
  userId: string;
  userName: string;
  userPhotoURL: string;
  role: 'manager' | 'lead' | 'member' | 'viewer'; // Legacy
  projectRoleId?: string;    // New RBAC
  projectRoleName?: string;  // Denormalized
  joinedAt: Timestamp;
}
```

### Task

```typescript
interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  assignedToName: string;
  dueDate: Timestamp | null;
  tags: string[];
  customFields: Record<string, unknown>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Expense

```typescript
interface Expense {
  id: string;
  projectId: string | null;
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';
  receipts: Receipt[];
  approvedBy: string | null;
  paidAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## RBAC System

### Permission Checking Flow

```
hasPermission(module, action, projectId?)
    │
    ├── isSuperAdmin? ──────────────────────> ALLOW
    │
    ├── Check system role permission
    │   └── userRole.permissions[module].actions.includes(action)?
    │           │
    │           └── YES ───────────────────> ALLOW
    │
    └── projectId provided?
        │
        └── Check project role permission
            └── projectRole.permissions[module].actions.includes(action)?
                    │
                    └── YES ───────────────> ALLOW
                    │
                    └── NO ────────────────> DENY
```

### Additive Model

```typescript
function hasProjectPermission(
  module: Module,
  action: Action,
  project: Project,
  projectRoles: ProjectRole[]
): boolean {
  // Super admin always has access
  if (isSuperAdmin) return true;

  // Check system role
  if (checkSystemRolePermission(module, action)) return true;

  // Check project role
  const membership = project.teamMembers.find(m => m.userId === user.id);
  if (membership?.projectRoleId) {
    const role = projectRoles.find(r => r.id === membership.projectRoleId);
    if (role && checkPermissionActions(role.permissions, module, action)) {
      return true;
    }
  }

  return false;
}
```

---

## Firestore Structure

```
/users/{userId}
/roles/{roleId}
/projects/{projectId}
  /roles/{roleId}        # Project-specific roles
  /activities/{activityId}
/tasks/{taskId}
  /comments/{commentId}
/expenses/{expenseId}
/documents/{documentId}
/folders/{folderId}
/auditLogs/{logId}
```

---

## Security Rules

### Project Roles Subcollection

```javascript
match /projects/{projectId}/roles/{roleId} {
  allow read: if isAuthenticated() && (
    isSuperuser() || isProjectMember(projectId)
  );
  allow create, update, delete: if isSuperuser() || (
    isProjectManager() && isProjectMember(projectId)
  );
}
```

### Key Helper Functions

```javascript
function isSuperuser() {
  return isAuthenticated() &&
         userDocExists() &&
         getUserData().role == 'superuser';
}

function isProjectMember(projectId) {
  return isAuthenticated() &&
         userDocExists() &&
         projectId in getUserData().projects;
}
```

---

## API Layer

### Service Files

| File | Purpose |
|------|---------|
| `src/services/api/users.ts` | User CRUD operations |
| `src/services/api/roles.ts` | System roles CRUD |
| `src/services/api/projectRoles.ts` | Project roles CRUD |
| `src/services/api/projects.ts` | Projects CRUD + team management |
| `src/services/api/tasks.ts` | Tasks CRUD |
| `src/services/api/expenses.ts` | Expenses CRUD + approval workflow |
| `src/services/api/documents.ts` | Documents CRUD + versioning |
| `src/services/api/auditLogs.ts` | Audit log creation + querying |

### React Query Hooks Pattern

```typescript
// Query key factory
const projectRoleKeys = {
  all: ['projectRoles'] as const,
  lists: () => [...projectRoleKeys.all, 'list'] as const,
  list: (projectId: string) => [...projectRoleKeys.lists(), projectId] as const,
  detail: (projectId: string, roleId: string) =>
    [...projectRoleKeys.all, 'detail', projectId, roleId] as const,
};

// Query hook
function useProjectRoles(projectId: string | undefined) {
  return useQuery({
    queryKey: projectRoleKeys.list(projectId || ''),
    queryFn: () => projectRolesApi.getAll(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

// Mutation hook
function useCreateProjectRole(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => projectRolesApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectRoleKeys.list(projectId) });
    },
  });
}
```

---

## Testing Strategy

### Unit Tests (Vitest)
- Test utilities and pure functions
- Test custom hooks with mock providers
- Test form validation schemas

### Integration Tests (Vitest + React Testing Library)
- Test API hooks with mocked Firebase
- Test component behavior with context
- Test permission checking logic

### E2E Tests (Playwright)
- Test full user flows
- Test authentication with Firebase emulators
- Test permission boundaries

---

## Roadmap: Pluggable Modules Platform

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Main App Shell                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Navigation │  │  Project    │  │  Module     │              │
│  │  (Dynamic)  │  │  Context    │  │  Loader     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  UI Modules   │  │   Workflow    │  │   Module      │
│  (iframe/MFE) │  │   Engine      │  │   Registry    │
└───────────────┘  └───────────────┘  └───────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Firebase Backend                             │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │
│  │  Auth  │  │Firestore│  │Storage │  │Functions│  │ Tasks  │    │
│  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Module Registry Data Model

```typescript
interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  type: 'workflow' | 'ui' | 'hybrid';
  status: 'draft' | 'approved' | 'deprecated';

  // Entry points
  workflowDefRef?: string;           // Reference to workflow definition
  uiEntryUrl?: string;               // URL for UI module (iframe/MFE)

  // Configuration
  configSchema: JSONSchema;          // Schema for module config
  requiredPermissions: string[];     // Permissions needed to run

  // Metadata
  author: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface EnabledModule {
  moduleId: string;
  projectId: string;
  enabled: boolean;
  config: Record<string, unknown>;   // Module-specific config
  schedule?: CronSchedule;           // Optional cron schedule
  menuLabel?: string;                // Custom menu label
  menuOrder?: number;                // Menu position

  // RBAC
  allowedRoles: string[];            // Project roles that can run

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface WorkflowRun {
  id: string;
  moduleId: string;
  projectId: string;

  // Execution
  trigger: 'manual' | 'schedule' | 'webhook' | 'event';
  status: 'queued' | 'running' | 'completed' | 'failed';
  startedAt: Timestamp;
  completedAt?: Timestamp;

  // Data
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: string;
  logs: ExecutionLog[];

  // Initiator
  initiatedBy: string;
  initiatedByName: string;
}
```

### Workflow Execution Flow

```
Manual Run / Schedule / Webhook
            │
            ▼
    ┌───────────────┐
    │  Validate     │ ─── Check RBAC, config, module status
    │  Request      │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │  Create Run   │ ─── Insert run document with status='queued'
    │  Document     │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │  Enqueue via  │ ─── Cloud Tasks for async execution
    │  Cloud Tasks  │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │  Cloud Run    │ ─── Execute workflow nodes
    │  Worker       │ ─── Resolve secrets, make HTTP calls
    └───────┬───────┘ ─── Persist logs, outputs
            │
            ▼
    ┌───────────────┐
    │  Update Run   │ ─── status='completed'|'failed'
    │  Document     │ ─── Store outputs or error
    └───────────────┘
```

### UI Module Integration

```typescript
// Route pattern for UI modules
// /projects/{projectId}/apps/{appId}

interface UIModuleProps {
  projectId: string;
  moduleId: string;
  authToken: string;
  config: Record<string, unknown>;
}

// Shell passes context to UI module via:
// 1. URL params (projectId, moduleId)
// 2. PostMessage (authToken, config)
// 3. Query params (limited data)

// UI module can:
// 1. Call Firebase APIs with passed token
// 2. Call custom backend APIs
// 3. Interact with shell via PostMessage
```

### RBAC for Modules

```typescript
// Module-level roles (additive to project roles)
interface ModulePermission {
  moduleId: string;
  roles: {
    runner: string[];    // Can run the module
    editor: string[];    // Can configure the module
    viewer: string[];    // Can view run history
  };
}

// Permission check flow:
// 1. Is user superuser? → Allow all
// 2. Is user project admin? → Allow all for project modules
// 3. Is user in module.roles[action]? → Allow
// 4. Deny
```
