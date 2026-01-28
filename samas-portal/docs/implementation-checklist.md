# Implementation Checklist - saMas Portal

## Phase 1: Foundation & Firebase Setup

- [x] Project scaffolding (Vite + React + TypeScript)
- [x] Tailwind CSS + shadcn/ui setup
- [x] Firebase configuration (Auth, Firestore, Storage)
- [x] Environment configuration (.env files)
- [x] Google OAuth authentication
- [x] Protected routes with auth guard
- [x] Base layout with sidebar navigation
- [x] Core UI components (Button, Card, Dialog, etc.)
- [x] PWA manifest and service worker

## Phase 2: RBAC Management System

- [x] User type and schema
- [x] Role type with permissions matrix
- [x] System roles (superuser, project_manager, qa_manager, analyst, finance_incharge)
- [x] Permission checking hooks (usePermissions)
- [x] Users management page (/admin/users)
- [x] Roles management page (/admin/roles)
- [x] Permission matrix UI component
- [x] Role assignment modal
- [x] Audit logging service
- [x] Audit logs page (/admin/audit-logs)
- [x] Firestore security rules
- [x] **Project-level roles** (v0.5.5)
  - [x] ProjectRole type and default templates
  - [x] projectRoles API service
  - [x] useProjectRoles hooks
  - [x] hasProjectPermission function
  - [x] ProjectRoleModal component
  - [x] ProjectRolesSettings component
  - [x] Settings tab in ProjectDetailPage
  - [x] Firestore rules for project roles subcollection

## Phase 3: Finance & Documents

### Finance Module
- [x] Expense type and schema
- [x] Expenses API service
- [x] useExpenses hooks
- [x] Expenses list page (/finance/expenses)
- [x] Expense modal (create/edit)
- [x] Approval workflow (submit, approve, reject)
- [x] Receipt upload functionality
- [x] Expense filtering and search

### Documents Module
- [x] Document type and schema
- [x] Documents API service
- [x] useDocuments hooks
- [x] Documents page (/documents)
- [x] Document upload component
- [x] Document viewer modal
- [x] Folder management
- [x] Version tracking
- [x] Google Drive integration
- [x] **Stats labels clarification** (v0.5.5)

## Phase 4: Projects & Tasks

### Projects Module
- [x] Project type and schema
- [x] Projects API service
- [x] useProjects hooks
- [x] Projects list page (/projects)
- [x] Project detail page (/projects/:id)
- [x] Project modal (create/edit)
- [x] Team member management
- [x] Project status management
- [x] Project archiving
- [x] **Team member project role assignment** (v0.5.5)

### Tasks Module
- [x] Task type and schema
- [x] Tasks API service
- [x] useTasks hooks
- [x] Kanban board page (/tasks)
- [x] Task modal (create/edit)
- [x] Drag-and-drop with @dnd-kit
- [x] Task filtering by project/status
- [x] Task comments

## Phase 5: Assets & Announcements

- [x] Asset type and schema
- [x] Assets API service
- [x] Assets page (/assets)
- [x] Announcement type and schema
- [x] Announcements API service

## Phase 6: Testing

### Integration Tests
- [x] useAuth.test.tsx
- [x] usePermissions.test.tsx
- [x] useRoles.test.tsx
- [x] useUsers.test.tsx
- [x] useProjects.test.tsx
- [x] useTasks.test.tsx
- [x] useExpenses.test.tsx
- [x] useAuditLogs.test.tsx
- [x] **useProjectRoles.test.tsx** (13 tests)

### E2E Tests
- [x] auth.spec.ts
- [x] navigation.spec.ts
- [x] dashboard.spec.ts
- [x] users.spec.ts
- [x] roles.spec.ts
- [x] audit-logs.spec.ts
- [x] expenses.spec.ts
- [x] projects.spec.ts
- [x] kanban.spec.ts
- [x] **project-roles.spec.ts** (requires emulators)

## Phase 7: Custom Fields

- [x] CustomFieldDefinition type
- [x] Custom fields API service
- [x] useCustomFields hooks
- [x] Task extended fields (type, category, etc.)
- [x] Task modal with collapsible sections

## Production Fixes (v0.5.5)

- [x] fixSuperuserRoles.ts script
- [x] DialogDescription added to 9 dialog components
- [x] Documents stats labels clarified as system-wide totals

## Bug Fixes & Documentation (v0.5.6)

- [x] Select component rewrite (shadcn/ui pattern)
- [x] Firestore rules email-based superuser check
- [x] AuditLogsPage Select usage update
- [x] README.md with CI badges and roadmap

## Phase 8: Pluggable Modules Platform (Future)

### Module Registry
- [ ] ModuleDefinition type and schema
- [ ] moduleRegistry API service
- [ ] useModuleRegistry hooks
- [ ] Module catalog page (/admin/modules)
- [ ] Module approval workflow

### Per-Project Installation
- [ ] EnabledModule type and schema
- [ ] Project modules settings tab
- [ ] Module configuration UI
- [ ] Menu injection for enabled modules

### Workflow Engine
- [ ] WorkflowDefinition type
- [ ] Workflow runner service (Cloud Functions)
- [ ] Cloud Tasks integration for async execution
- [ ] WorkflowRun type and execution tracking
- [ ] Run history page

### UI Modules
- [ ] UIApp type and schema
- [ ] Iframe/micro-frontend loader component
- [ ] PostMessage bridge for auth/context
- [ ] Dynamic route registration

### Scheduling
- [ ] CronSchedule type
- [ ] Schedule management UI
- [ ] Cloud Scheduler integration
- [ ] Timezone support

### Secrets Management
- [ ] Google Secret Manager integration
- [ ] Secrets configuration UI (admin only)
- [ ] Secret reference resolution in workflows

### Module RBAC
- [ ] Module-level roles (runner, editor, viewer)
- [ ] Permission check integration
- [ ] Firestore rules for modules

---

## Legend

- [x] Completed
- [ ] Pending
- 🔄 In Progress

---

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 0.1.0 | 2025-01-25 | Foundation & Firebase setup |
| 0.2.0 | 2025-01-25 | RBAC Management System |
| 0.3.0 | 2025-01-25 | Finance & Documents |
| 0.4.0 | 2025-01-25 | Projects & Tasks |
| 0.4.1 | 2025-01-25 | Custom Fields |
| 0.5.0 | 2026-01-26 | RBAC overhaul (single role model) |
| 0.5.1 | 2026-01-26 | RBAC type fixes |
| 0.5.2 | 2026-01-26 | Storage + test fixes |
| 0.5.3 | 2026-01-27 | Runtime + folder permission fixes |
| 0.5.4 | 2026-01-27 | E2E auth fix |
| 0.5.5 | 2026-01-27 | Project-level RBAC + production fixes |
| 0.5.6 | 2026-01-27 | Select component fix + Firestore rules + README |
