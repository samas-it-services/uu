# Changelog

All notable changes to this project will be documented in this file.
The format is inspired by [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Format
- **Reverse chronological order** (newest at top)
- **Header format:** `<semantic version> - YYYY-MM-DD | <category>: <title>`
- **Categories:** 🚀 feat | 🐛 fix | 📘 docs | 🧹 chore

---

## 0.5.6 - 2026-01-27 | 🐛 fix: Select component and Firestore superuser check

### 📄 Summary
Fixed broken dropdown menus (Status/Priority filters) on Projects page by rewriting the Select component to follow shadcn/ui patterns. Updated Firestore rules to check superuser by email in addition to role field. Added comprehensive README with CI badges and roadmap.

### 📁 Files Changed
**Modified Files:**
- `src/components/ui/Select.tsx` - Complete rewrite with properly styled exports (SelectTrigger, SelectContent, SelectValue, etc.)
- `src/pages/admin/AuditLogsPage.tsx` - Updated to use new Select component pattern
- `firestore.rules` - Added email-based superuser check for hardcoded admin emails

**New Files:**
- `README.md` - Project documentation with CI badges, tech stack, setup guide, and roadmap

### 🧠 Rationale
1. **Select component broken**: Exported raw Radix primitives without styling. ProjectsPage passed SelectTrigger/SelectContent as children to Select, but the old component already rendered its own. Result: broken nested components with no styling.
2. **Superuser not working**: Firestore rules only checked `role == 'superuser'` in database, but didn't know about hardcoded SUPER_ADMINS list in frontend. If user doc didn't have role set, access was denied.
3. **Missing README**: No project documentation existed for onboarding or CI status visibility.

### 🔄 Behavior / Compatibility Implications
- **Select component API changed**: Now follows shadcn/ui pattern (separate Trigger/Content components)
- **Superuser detection improved**: Email check happens first, then falls back to role field
- **Requires Firestore deployment**: Run `firebase deploy --only firestore:rules`

### 🧪 Testing Recommendations
1. Verify Status/Priority dropdowns render and function on Projects page
2. Verify superuser (bill@samas.tech) can see all projects after rules deployment
3. Verify folders appear in Documents page after rules deployment
4. Run `npm test` - all 102 tests should pass
5. Run `npm run lint` and `npm run typecheck`

### 📌 Follow-ups
- Deploy Firestore rules (`firebase login --reauth && firebase deploy --only firestore:rules`)
- Implement Pluggable Modules Platform (see roadmap in README)

---

## 0.5.5 - 2026-01-27 | 🚀 feat: Project-level RBAC and Production Fixes

### 📄 Summary
Implemented project-specific roles with custom permissions using an additive model. Fixed production issues including superuser role detection, dialog accessibility, and document stats labeling.

### 📁 Files Changed
**New Files:**
- `src/types/projectRole.ts` - ProjectRole type with 4 default role templates
- `src/services/api/projectRoles.ts` - CRUD API for `projects/{projectId}/roles` subcollection
- `src/hooks/useProjectRoles.ts` - React Query hooks for project roles
- `src/components/modules/projects/ProjectRoleModal.tsx` - Modal for create/edit roles
- `src/components/modules/projects/ProjectRolesSettings.tsx` - Settings tab content
- `scripts/fixSuperuserRoles.ts` - Admin script to fix user roles in Firestore

**Modified Files:**
- `src/types/project.ts` - Added `projectRoleId`, `projectRoleName` to TeamMember
- `src/hooks/usePermissions.ts` - Added `hasProjectPermission()`, `getUserProjectRole()`
- `src/hooks/useProjects.ts` - Added `useUpdateTeamMemberProjectRole` hook
- `src/services/api/projects.ts` - Auto-creates default roles on project creation
- `src/components/modules/projects/TeamMemberSelect.tsx` - Dynamic project role dropdown
- `src/pages/projects/ProjectDetailPage.tsx` - Added Settings tab for superusers
- `src/pages/documents/DocumentsPage.tsx` - Clarified stats as system-wide totals
- `firestore.rules` - Added rules for project roles subcollection
- `src/services/api/auditLogs.ts` - Added new audit action types
- 9 dialog components - Added `DialogDescription` for WCAG accessibility

### 🧠 Rationale
1. **Project-level RBAC**: Project team roles (manager, lead, member, viewer) had no permissions. Now each project can define custom roles with granular permissions.
2. **Additive model**: Project roles ADD to system roles, not replace them. User can access a resource if they have permission via system role OR project role.
3. **Production fixes**: Users weren't seeing data because their Firestore document lacked `role: 'superuser'`. Dialog warnings appeared due to missing DialogDescription.

### 🔄 Behavior / Compatibility Implications
- **New projects**: Automatically get 4 default roles (Project Admin, Developer, Reviewer, Observer)
- **Existing projects**: Need migration to create roles subcollection
- **Team members**: Can now have `projectRoleId` in addition to legacy `role` field
- **Backward compatible**: Legacy role field still works; projectRoleId is optional

### 🧪 Testing Recommendations
1. Create new project - verify 4 default roles in Settings tab
2. Add team member - select from project roles dropdown
3. Edit project role permissions - verify changes persist
4. Test permission boundaries - user with Observer role should be read-only
5. Run `npm test` and `npm run test:e2e`

### 📌 Follow-ups
- Create migration script for existing projects
- Add E2E tests for project roles management
- Add integration tests for useProjectRoles hook

---

## 0.5.4 - 2026-01-27 | 🐛 fix: E2E authentication with Firebase emulators

### 📄 Summary
Fixed E2E test authentication so tests properly authenticate against Firebase emulators. The root cause was an API key mismatch between the injected auth state (`test-api-key`) and the app's environment (`VITE_FIREBASE_API_KEY`).

### 📁 Files Changed
- `.env.test` - Created test-specific Firebase config with emulator-compatible values
- `playwright.config.ts` - Changed webServer command to use `vite --mode test` for loading `.env.test`
- `tests/e2e/fixtures/auth.fixture.ts` - Added navigation + wait for auth state after injecting localStorage
- `.gitignore` - Added `.env.test.local` to ignore list with clarifying comments

### 🧠 Rationale
Firebase Auth stores session state with a key format: `firebase:authUser:<API_KEY>:[DEFAULT]`. When the auth fixture injected state with `test-api-key` but the app used a different API key from `.env`, Firebase couldn't find the session. The fix ensures both use `test-api-key` by:
1. Creating `.env.test` with `VITE_FIREBASE_API_KEY=test-api-key`
2. Using Vite's mode system (`--mode test`) to load this config during E2E tests

### 🔄 Behavior / Compatibility Implications
- E2E tests now run with a dedicated `.env.test` configuration
- No impact on production or development builds
- The app connects to emulators when `VITE_USE_EMULATORS=true` is set

### 🧪 Testing Recommendations
1. Start emulators: `firebase emulators:start --only auth,firestore,storage`
2. Run E2E tests: `VITE_USE_EMULATORS=true npx playwright test`
3. Verify global setup creates 5 test users
4. Verify tests navigate to authenticated pages successfully

### 📌 Follow-ups
- Add more authenticated E2E test coverage
- Consider IndexedDB injection for full Firebase SDK compatibility
- Add CI workflow for emulator-based E2E tests

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
