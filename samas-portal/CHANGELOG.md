# Changelog

All notable changes to the SaMas Portal project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-25

### Added - Phase 1: Foundation & Firebase Setup

#### Project Infrastructure
- Initialized Vite + React 18 + TypeScript project
- Configured ESLint and Prettier
- Set up Tailwind CSS with custom theme and CSS variables
- Configured path aliases (@/)
- Created project directory structure (src/services, src/hooks, src/components, src/contexts, src/types, src/pages)

#### Firebase Integration
- Created Firebase project (uu-portal-60426)
- Enabled Google Authentication provider
- Created Firestore database with security rules
- Configured Cloud Storage
- Set up Firebase Hosting with custom domain (uu.samas.tech)
- Created `.env` and `.env.production` environment files

#### Authentication System
- Implemented AuthContext provider with full Google OAuth flow
- Created useAuth hook
- Implemented Google Sign-In with popup
- Added OAuth token storage for Google APIs (Drive, Calendar)
- Created protected route component
- Implemented session persistence
- Created login page UI with branding
- Handle new user creation flow with automatic document creation
- Auto-assign super admin role to predefined emails (bill@samas.tech, bilgrami@gmail.com)

#### TypeScript Types
- Created comprehensive interfaces for: User, Role, Project, Task, Expense, Document, Asset, Announcement, Presence
- Defined Permission and Module types for RBAC

#### Security Rules
- Implemented Firestore security rules for all collections
- Added helper functions: isAuthenticated, userDocExists, isSuperAdmin, isFinanceManager, isProjectManager
- Implemented project-scoped access control (canAccessProject, isProjectOwner, isProjectMember)
- Protected sensitive data subcollections
- Added user existence checks to prevent errors for new users

#### UI Framework
- Created base UI components (Button, Card, Input, Avatar, Badge, Spinner)
- Created MainLayout component with responsive design
- Created Sidebar navigation with permission-based filtering
- Created Header with user menu
- Implemented dark mode toggle with system preference detection
- Created toast notification system with multiple variants
- Set up responsive navigation for mobile

#### PWA Setup
- Configured Vite PWA plugin with manifest
- Generated PWA icons (72x72 to 512x512)
- Configured service worker with caching strategies
- Set up offline fallback

### Fixed
- Fixed Tailwind CSS configuration for CSS variable-based colors (border-border issue)
- Fixed Firebase project ID in .firebaserc
- Added COOP headers (Cross-Origin-Opener-Policy: same-origin-allow-popups) for Google Sign-in popup
- Fixed Firestore security rules to handle new users without existing documents
- **Fixed Active Users display** - Dashboard now shows real user count from Firestore instead of hardcoded value

### Testing Infrastructure
- Created Vitest test setup with Firebase mocks (`src/test-utils/setup.ts`)
- Created test factories for User, Role, Expense, Project, Task
- Created Firebase mock utilities (auth, firestore, storage)
- Created TestProviders wrapper and custom render utilities
- **90 integration tests** for all hooks (useAuth, usePermissions, useUsers, useRoles, useAuditLogs, useExpenses, useProjects, useTasks)
- **28 E2E tests** for Phases 1-4 (auth, dashboard, navigation, users, roles, audit logs, expenses, projects, kanban) with Playwright

### Deployment
- Deployed to Firebase Hosting
- Configured custom domain: https://uu.samas.tech
- SSL certificate provisioned
- DNS configured via CNAME to Firebase

---

## [0.4.0] - 2025-01-25

### Added - Phase 4: Project & Task Management

#### Project Module
- Created useProjects hook with React Query (CRUD, filtering, stats, team management)
- Created projects API service (`src/services/api/projects.ts`)
- Built ProjectsPage with filtering by status/priority, search, archive toggle
- Built ProjectDetailPage with tabs (Overview, Team, Tasks, Documents)
- Created ProjectCard component with stats and actions
- Created ProjectModal for create/edit with validation
- Implemented team member management (add/remove)
- Created MilestoneTimeline component for milestone visualization

#### Task Module with Kanban Board
- Created useTasks hook with drag-drop support (CRUD, status changes, comments, attachments)
- Created tasks API service (`src/services/api/tasks.ts`)
- Built KanbanPage with project selection and task filtering
- **Implemented KanbanBoard with @dnd-kit library** (drag between columns, reorder within)
- Created KanbanColumn component (droppable)
- Created TaskCard component (draggable) with priority indicators, assignee avatars
- Built TaskModal with full details (title, description, status, assignee, priority, due date)
- Created TaskComments component for comment threads
- Created TaskAttachments component for file uploads
- 5-column workflow: Backlog, To Do, In Progress, Review, Done

#### Google Calendar Integration
- Created calendar service (`src/services/google/calendar.ts`)
- Implemented createMeeting with automatic Google Meet links
- Created createMilestoneEvent for all-day milestone events
- Created createDeadlineEvent for project deadlines
- Created createTaskEvent for task due dates
- Built MeetingScheduler component with attendee management
- Built CalendarSync component for milestone/deadline sync

---

## [0.3.0] - 2025-01-25

### Added - Phase 3: Finance & Document Modules

#### Expense Module
- Created useExpenses hook with React Query (CRUD, filtering, stats, approval workflow)
- Created expenses API service (`src/services/api/expenses.ts`)
- Built ExpensesPage with filtering by status/category, stats cards
- Created ExpenseCard component with action buttons
- Created ExpenseModal for create/edit with receipt upload
- Implemented expense workflow: draft → pending → approved/rejected → paid
- Created ExpenseChart component with multiple chart types (category, status, monthly, trend)
- Created BudgetSummary component for category breakdown
- Created ReceiptUpload component

#### Approval Module
- Created useApprovals hook for approval workflow (pending queue, approve/reject, comments)
- Created approvals API service (`src/services/api/approvals.ts`)
- Built ApprovalsPage with tabs (Pending/All), filtering by status/type/priority
- Created ApprovalCard component with approve/reject actions
- Implemented approval with audit logging

#### Reports Module
- Built ReportsPage with date range selection and charts
- Implemented export to Excel (xlsx)
- Implemented export to PDF (jspdf)
- Financial summaries and category breakdown

#### Document Module
- Created useDocuments hook (CRUD, folder navigation, versioning, sharing, search)
- Created documents API service (`src/services/api/documents.ts`)
- Built DocumentsPage with folder hierarchy, grid/list view toggle
- Created DocumentCard component with preview, download, delete actions
- Created DocumentUpload component with drag-drop support
- Created DocumentViewer modal for previews
- Implemented folder tree navigation with breadcrumbs
- Implemented document versioning with notes
- Implemented document sharing with access control

#### Google Drive Integration
- Created drive service (`src/services/google/drive.ts`) framework
- Created GoogleDrivePicker component
- Created DriveSync component

---

## [0.2.0] - 2025-01-25

### Added - Phase 2: RBAC Management System

#### Permission System
- Created usePermissions hook with granular module/action permissions
- Implemented hasPermission(module, action) function
- Implemented canAccessProject(projectId) function
- Implemented canAccessSensitiveData() function
- Created isSuperAdmin, isFinanceManager, isProjectManager helpers
- Created PermissionGuard component for permission-based access control
- Created RoleGuard component for role-based access control

#### User Management
- Created useUsers hook with React Query (CRUD, role assignment, project assignment)
- Created users API service (`src/services/api/users.ts`)
- Built UsersPage with search, filtering by role/status
- Created user list with pagination
- Implemented role assignment interface
- Implemented project assignment for managers
- Implemented user status toggle (active/inactive)

#### Role Management
- Created useRoles hook (CRUD, permission management, data access settings)
- Created roles API service (`src/services/api/roles.ts`)
- Built RolesPage with role list and permission count display
- Created permission matrix component
- Implemented dataAccess settings (allProjects, sensitiveFinancials, globalAssets)
- Protected system roles from deletion

#### Audit Logging
- Created useAuditLogs hook with infinite scroll and filtering
- Created auditLogs API service (`src/services/api/auditLogs.ts`)
- Built AuditLogsPage with expandable entries showing before/after changes
- Implemented filtering by action type, user, date range
- All CRUD operations log changes with before/after snapshots

---

## Upcoming

### [0.5.0] - Phase 5: Asset Management & Announcements
- Asset tracking with QR codes
- Maintenance scheduling
- Rich text announcements
- Targeting and read receipts
- *(Types defined, implementation pending)*

### [1.0.0] - Phase 6: PWA, Presence, Testing & Deployment
- Online presence system
- Activity feed
- Push notifications
- Comprehensive testing (Vitest + Playwright)
- CI/CD pipeline (GitHub Actions)
- *(PWA config and CI/CD pipeline complete, tests pending)*
