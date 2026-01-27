# Changelog

All notable changes to this project will be documented in this file.
The format is inspired by [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Format
- **Reverse chronological order** (newest at top)
- **Header format:** `<semantic version> - YYYY-MM-DD | <category>: <title>`
- **Categories:** 🚀 feat | 🐛 fix | 📘 docs | 🧹 chore

---

## 0.5.3 - 2026-01-27 | 🐛 fix: Runtime errors and folder permissions

### 📄 Summary
Fixed two critical issues: (1) TypeError on /admin/users page when checking permissions, and (2) folder creation failing due to missing Firestore security rules.

### 📁 Files Changed
- `src/hooks/usePermissions.ts` - Added optional chaining for `permission.actions`
- `firestore.rules` - Added security rules for `folders` collection

### 🧠 Rationale
1. **Permission check crash**: The `hasPermission` function didn't handle cases where `permission.actions` was undefined (legacy/incomplete role data).
2. **Folder creation denied**: The documents API uses a `folders` collection, but no corresponding Firestore security rules existed.

### 🔄 Behavior / Compatibility Implications
- No behavior change for permissions - returns `false` for undefined (same as no permission)
- Folder creation now works for authenticated users with appropriate roles
- Rules follow same pattern as documents collection

### 🧪 Testing Recommendations
- Visit /admin/users page - should load without errors
- Create folder in documents section - should succeed
- Run `npm test` and `npm run test:e2e`

### 📌 Follow-ups
- Seed production database with new role format
- Add integration tests for document upload (`useDocuments.test.tsx`)
- Implement skipped E2E tests for receipt upload in `expenses.spec.ts`
- Add runtime validation for role documents on load

---

## 0.5.2 - 2026-01-26 | 🐛 fix: Storage upload permissions and RBAC test failures

### 📄 Summary
Fixed two critical issues: (1) Document uploads failing with permission errors due to storage path mismatch, and (2) Integration tests failing due to RBAC structure changes not reflected in test files.

### 📁 Files Changed
- `src/services/api/documents.ts` - Fixed storage path to match rules (3 segments instead of 2)
- `tests/integration/hooks/useRoles.test.tsx` - Updated for new RBAC structure (userRole, permission format)
- `tests/integration/hooks/useAuth.test.tsx` - Changed from `roles[]` to `userRole`, updated expectations
- `tests/integration/hooks/usePermissions.test.tsx` - Fixed context wrapper and permission checks
- `cors.json` - Created CORS configuration for Firebase Storage (custom domain support)

### 🧠 Rationale
1. **Storage path mismatch**: Code generated `documents/{category}/{timestamp}-{filename}` (2 segments) but `storage.rules` expected `documents/{category}/{documentId}/{fileName}` (3 segments), causing permission denied errors.
2. **Test failures**: Tests still used old RBAC structure (`roles[]` array, boolean permission flags) while codebase was updated to new structure (`userRole` singular, `{ actions[], scope }` permissions).

### 🔄 Behavior / Compatibility Implications
- Document uploads now work from custom domain (uu.samas.tech)
- Storage paths changed from `documents/general/123-file.csv` to `documents/general/123/file.csv`
- CORS configured for localhost:5173, localhost:5174, and uu.samas.tech

### 🧪 Testing Recommendations
- Run `npm test` - all 89 tests should pass
- Run `npm run lint` - should pass with 0 warnings
- Test document upload at https://uu.samas.tech/documents

### 📌 Follow-ups
- Add integration tests for document upload (`useDocuments.test.tsx`)
- Implement skipped E2E tests for receipt upload in `expenses.spec.ts`

---

## 0.5.1 - 2026-01-26 | 🐛 fix: RBAC permission type system build failures

### 📄 Summary
Fixed CI lint and e2e test failures caused by the RBAC system overhaul. The new permission structure `{ actions: PermissionAction[], scope: PermissionScope }` was not fully propagated across all components, hooks, and utilities.

### 📁 Files Changed
- `scripts/seedRolesAndUsers.ts` - Fixed `any` type errors with proper `unknown` handling
- `src/hooks/useUsers.ts` - Added missing `useAssignUserRoles` hook, fixed audit action type
- `src/hooks/useRoles.ts` - Removed deprecated `DataAccess` import and hook
- `src/types/role.ts` - Added `Action` alias and `DataAccess` interface for compatibility
- `src/services/api/roles.ts` - Updated to new permission format, removed `defaultDataAccess`
- `src/services/api/index.ts` - Removed `defaultDataAccess` export
- `src/utils/seedRoles.ts` - Rewrote with new permission structure
- `src/components/admin/PermissionMatrix.tsx` - Complete rewrite with actions checkboxes + scope selector
- `src/components/admin/RoleModal.tsx` - Removed `dataAccess` references
- `src/components/admin/RoleAssignment.tsx` - Use `user.role` (singular) not `user.roles`
- `src/pages/admin/RolesPage.tsx` - Updated permission counting, removed `dataAccess` display
- `src/pages/admin/UsersPage.tsx` - Fixed prop name, default role to `analyst`
- `src/test-utils/factories/role.factory.ts` - Updated to new permission format

### 🧠 Rationale
The RBAC overhaul changed the Permission type from boolean flags (`create`, `read`, `update`, `delete`) to an actions array with scope (`{ actions: PermissionAction[], scope: PermissionScope }`). Many files still used the old structure, causing TypeScript errors and build failures.

### 🔄 Behavior / Compatibility Implications
- **PermissionMatrix UI** now shows a scope dropdown (Global/Project/Own/None) per module
- **Single role system** - Users have one role, not multiple
- **Role assignment** modal allows only one role selection at a time
- New users default to `analyst` role

### 🧪 Testing Recommendations
- Run `npm run lint` - should pass with 0 warnings
- Run `npm run typecheck` - should pass with no errors
- Run `npm run test:e2e` - 56 tests pass (350 skipped require auth)

### 📌 Follow-ups
- Update E2E tests that depend on old permission structure
- Seed production database with new role format
- Update user documentation for new role assignment flow

---

## 0.5.0 - 2026-01-26 | 🚀 feat: RBAC system overhaul

### 📄 Summary
Complete overhaul of the RBAC system to simplify user roles and permissions. Changed from multi-role to single-role model, and from boolean permission flags to actions array with scope.

### 📁 Files Changed
- `src/types/user.ts` - `roles: string[]` → `role: string`
- `src/types/role.ts` - New `Permission` type with `actions[]` and `scope`
- `firestore.rules` - Updated security rules for new RBAC model
- `docs/rbac.md` - Complete RBAC documentation
- `scripts/seedRolesAndUsers.ts` - New seeding script

### 🧠 Rationale
- Simplified mental model: one user = one role
- More granular permissions with scope (global/project/own/none)
- 5 clearly defined roles: `superuser`, `project_manager`, `qa_manager`, `analyst`, `finance_incharge`

### 🔄 Behavior / Compatibility Implications
- **Breaking**: Users with multiple roles need migration to single role
- **Breaking**: Permission checks now use `actions.includes(action)` not boolean flags
- Project managers can only access their assigned projects

### 🧪 Testing Recommendations
- Verify role assignment in admin UI
- Test permission boundaries for each role
- Verify project-scoped access for project managers

### 📌 Follow-ups
- Migrate existing users to new role format
- Update seed scripts for all environments

---

## 0.4.1 - 2026-01-25 | 🚀 feat: Custom Fields System (Phase 7)

### 📄 Summary
Added enterprise-grade custom fields system for tasks with dynamic field definitions.

### 📁 Files Changed
- `src/types/customField.ts` - CustomFieldType, CustomFieldValue, CustomFieldDefinition
- `src/types/task.ts` - Extended with TaskType, TaskCategory, 12 new fields
- `src/services/api/customFields.ts` - CRUD operations
- `src/hooks/useCustomFields.ts` - React Query hooks
- `src/components/tasks/TaskModal.tsx` - Collapsible sections
- `src/components/tasks/TaskCard.tsx` - Type/category badges

### 🧠 Rationale
Enterprise customers need customizable task fields for their workflows.

### 🔄 Behavior / Compatibility Implications
- Tasks now support additional metadata fields
- Backward compatible - existing tasks work without custom fields

### 🧪 Testing Recommendations
- Create tasks with custom fields
- Verify field persistence and display

### 📌 Follow-ups
- Admin UI for field management
- Field validation rules

---

## 0.4.0 - 2025-01-25 | 🚀 feat: Project & Task Management (Phase 4)

### 📄 Summary
Project management with team collaboration and Kanban board with drag-drop.

### 📁 Files Changed
- `src/services/api/projects.ts`, `src/services/api/tasks.ts`
- `src/hooks/useProjects.ts`, `src/hooks/useTasks.ts`
- `src/pages/projects/*`, `src/pages/tasks/*`
- `src/components/projects/*`, `src/components/tasks/*`

### 🧠 Rationale
Core project and task management functionality for team collaboration.

### 🔄 Behavior / Compatibility Implications
- Projects have team members with roles
- Tasks flow through 5-column Kanban: Backlog → To Do → In Progress → Review → Done

### 🧪 Testing Recommendations
- Drag tasks between columns
- Add/remove team members
- Filter by status/priority

### 📌 Follow-ups
- Google Calendar integration for milestones

---

## 0.3.0 - 2025-01-25 | 🚀 feat: Finance & Document Modules (Phase 3)

### 📄 Summary
Expense management with approval workflow and document management with versioning.

### 📁 Files Changed
- `src/services/api/expenses.ts`, `src/services/api/documents.ts`
- `src/hooks/useExpenses.ts`, `src/hooks/useDocuments.ts`
- `src/pages/finance/*`, `src/pages/documents/*`

### 🧠 Rationale
Financial tracking and document collaboration for business operations.

### 🔄 Behavior / Compatibility Implications
- Expense workflow: draft → pending → approved/rejected → paid
- Documents support versioning and sharing

### 🧪 Testing Recommendations
- Submit and approve expenses
- Upload and version documents

### 📌 Follow-ups
- Excel/PDF export for reports

---

## 0.2.0 - 2025-01-25 | 🚀 feat: RBAC Management System (Phase 2)

### 📄 Summary
Role-based access control with permission management, user management, and audit logging.

### 📁 Files Changed
- `src/hooks/usePermissions.ts`, `src/hooks/useUsers.ts`, `src/hooks/useRoles.ts`
- `src/services/api/users.ts`, `src/services/api/roles.ts`, `src/services/api/auditLogs.ts`
- `src/pages/admin/*`

### 🧠 Rationale
Enterprise security requirements for granular access control.

### 🔄 Behavior / Compatibility Implications
- All CRUD operations logged to audit trail
- Permission-based UI visibility

### 🧪 Testing Recommendations
- Assign roles and verify access
- Check audit logs for changes

### 📌 Follow-ups
- Role inheritance (later)

---

## 0.1.0 - 2025-01-25 | 🚀 feat: Foundation & Firebase Setup (Phase 1)

### 📄 Summary
Project foundation with Firebase integration, authentication, and UI framework.

### 📁 Files Changed
- Initial project setup
- Firebase config, Firestore rules
- Auth context, protected routes
- Base UI components, layouts

### 🧠 Rationale
Establish solid foundation for enterprise portal.

### 🔄 Behavior / Compatibility Implications
- Google OAuth authentication
- PWA-enabled with offline support

### 🧪 Testing Recommendations
- Login flow with Google
- Verify protected routes redirect

### 📌 Follow-ups
- Additional auth providers (later)
