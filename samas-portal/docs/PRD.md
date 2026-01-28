# Product Requirements Document - saMas Portal

## Product Vision

saMas IT Services Portal is a comprehensive company portal designed for managing projects, tasks, finances, and documents with enterprise-grade role-based access control.

---

## User Roles & Permissions

### System Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Superuser** | Full system access | All modules, all data |
| **Project Manager** | Manages assigned projects | Own projects only |
| **QA Manager** | Quality assurance lead | Assigned projects, read-only finance |
| **Analyst** | Data analyst | Read-only access, own documents |
| **Finance In-charge** | Financial operations | Full finance, read-only projects |

### Project-Specific Roles

Each project can define custom roles with granular permissions:

| Default Role | Description | Permissions |
|--------------|-------------|-------------|
| **Project Admin** | Full project access | All modules: CRUD within project |
| **Developer** | Build and document | Tasks/docs: CRUD, others: read |
| **Reviewer** | Review work | Tasks: read/update, others: read |
| **Observer** | View only | All modules: read only |

### Permission Model

- **Additive**: Project roles ADD to system roles (not replace)
- **Scope**: Permissions can be `global`, `project`, `own`, or `none`
- **Check flow**: `systemPermission OR projectPermission = access granted`

---

## Core Modules

### 1. Authentication
- **Provider**: Google OAuth via Firebase Auth
- **Session**: Persistent login with token refresh
- **Protection**: All routes require authentication

### 2. RBAC Management
- **System roles**: Pre-defined roles with permissions matrix
- **Project roles**: Custom per-project roles
- **User assignment**: Single role per user (system) + project role per project
- **Audit logging**: All permission changes tracked

### 3. Projects & Tasks
- **Projects**: CRUD with team management
- **Kanban board**: 5-column workflow (Backlog, To Do, In Progress, Review, Done)
- **Team members**: Assigned with project-specific roles
- **Milestones**: Timeline tracking

### 4. Finance (Expenses)
- **Expense tracking**: CRUD with receipt uploads
- **Approval workflow**: draft → pending → approved/rejected → paid
- **Project association**: Expenses linked to projects
- **Sensitive data**: Only superuser/finance can see financial details

### 5. Documents
- **Upload**: Direct upload to Firebase Storage
- **Versioning**: Track document versions
- **Folders**: Organize with folder structure
- **Visibility**: global, project, role, private
- **Google Drive**: Integration for sync

---

## Security Requirements

### Project-Scoped Access
- Project managers see only their assigned projects
- Team members see only projects they're members of
- Superuser/Finance can see all projects

### Sensitive Data Protection
- Financial data restricted to superuser + finance roles
- Sensitive documents marked and access-controlled
- Receipt uploads in secure storage paths

### Audit Logging
- All CRUD operations logged
- Permission changes tracked
- User actions with timestamps
- Immutable audit trail

---

## Non-Functional Requirements

### Performance
- Page load < 2 seconds
- Real-time updates via Firestore listeners
- Optimistic UI updates

### Accessibility
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation

### PWA Support
- Offline capability
- Install to home screen
- Push notifications (future)

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **State**: React Query + Zustand
- **Forms**: React Hook Form + Zod
- **DnD**: @dnd-kit
- **Testing**: Vitest + Playwright

---

## Roadmap: Pluggable Modules Platform

### Vision

Build a platform where developers can publish **workflow modules** (n8n-style automations) and **UI modules** (screens/apps) that project admins can install per-project.

### Must-Have Features

| Feature | Description |
|---------|-------------|
| **Module Registry** | Global catalog of workflow and UI modules with versioning |
| **Per-Project Installation** | Enable/disable modules per project with configuration |
| **Workflow Engine** | Manual runs, scheduled cron jobs, webhook/event triggers |
| **UI Module Integration** | Dynamic menu items via micro-frontend or iframe |
| **Fine-grained RBAC** | Module-level permissions (Runner, Editor, Viewer) |
| **Scheduling & Cron** | Timezone-aware job scheduling with execution history |
| **Secrets Management** | Google Secret Manager integration for secure credentials |
| **Audit Logs** | Immutable run history with inputs/outputs/errors |

### Nice-to-Have Features

- Visual workflow builder (n8n-style node editor)
- Marketplace for third-party modules
- Module signing / verification
- Billing and usage tracking
- Rate limits per module

### Module Types

| Type | Description |
|------|-------------|
| `workflow` | Background automation jobs (cron, webhook, manual) |
| `ui` | Embedded UI screens and apps |
| `hybrid` | Both workflow and UI components |

### Personas

| Persona | Responsibilities |
|---------|-----------------|
| **Platform Admin** | Approves modules, manages system permissions, reviews security |
| **Module Developer** | Publishes workflow/UI modules, manages versions |
| **Project Admin** | Enables modules per project, configures schedules/secrets |
| **Project Member** | Runs modules, views UI screens, views run history |

### Data Model (Preview)

```
/moduleRegistry/{moduleId}           # Global module catalog
/uiAppRegistry/{appId}               # UI app registry
/workflowDefs/{moduleId}             # Workflow definitions

/projects/{projectId}
  /enabledModules/{moduleId}         # Per-project module config
  /enabledUiApps/{appId}             # Per-project UI apps
  /runs/{runId}                      # Workflow execution history
```

### Security Considerations

- All writes validated server-side
- Runner enforces project scoping
- Node allowlists for workflow execution
- CSP headers for UI modules
- Domain allowlists for HTTP nodes
- Signed module manifests (future)
