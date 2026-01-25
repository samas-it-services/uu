# Agent 9: RBAC Admin Agent Checklist
## User & Role Management Specialist

---

## Role Overview

**Responsibilities**: User management, role management, permission matrix, project assignments, audit logs.

**Files Owned**:
- `src/pages/admin/**`
- `src/components/modules/admin/**`
- `src/services/api/users.ts`
- `src/services/api/roles.ts`
- `src/services/api/auditLogs.ts`
- `src/hooks/useUsers.ts`
- `src/hooks/useRoles.ts`
- `src/hooks/useAuditLogs.ts`
- `src/types/role.ts`

---

## Phase 2 Tasks

### Data Models
- [ ] Create `src/types/role.ts`:
  ```typescript
  interface Role {
    id: string;
    name: string;
    description: string;
    isSystem: boolean;
    permissions: {
      finance: Permission;
      documents: Permission;
      projects: Permission;
      assets: Permission;
      tasks: Permission;
      announcements: Permission;
      rbac: Permission;
    };
    dataAccess: {
      allProjects: boolean;
      sensitiveFinancials: boolean;
      globalAssets: boolean;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }
  
  interface Permission {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  }
  ```

### Users API Service
- [ ] Create `src/services/api/users.ts`
- [ ] `getUsers(filters)` - with pagination
- [ ] `getUserById(id)`
- [ ] `updateUser(id, data)`
- [ ] `deactivateUser(id)`
- [ ] `activateUser(id)`
- [ ] `assignRole(userId, roleId)`
- [ ] `removeRole(userId, roleId)`
- [ ] `assignProjectManager(userId, projectId)`
- [ ] `removeProjectManager(userId, projectId)`
- [ ] `assignProjectMember(userId, projectId)`
- [ ] `importUsers(csvData)` - bulk import

### Roles API Service
- [ ] Create `src/services/api/roles.ts`
- [ ] `getRoles()`
- [ ] `getRoleById(id)`
- [ ] `createRole(data)`
- [ ] `updateRole(id, data)`
- [ ] `deleteRole(id)` - protect system roles
- [ ] `duplicateRole(id, newName)`

### Audit Logs API
- [ ] Create `src/services/api/auditLogs.ts`
- [ ] `getAuditLogs(filters)`
- [ ] `createAuditLog(data)` - utility
- [ ] Log all user changes
- [ ] Log all role changes
- [ ] Log all permission changes

### React Query Hooks
- [ ] Create `src/hooks/useUsers.ts`
- [ ] `useUsers(filters)`
- [ ] `useUser(id)`
- [ ] `useUpdateUser()` - mutation
- [ ] `useAssignRole()` - mutation
- [ ] `useAssignProject()` - mutation

- [ ] Create `src/hooks/useRoles.ts`
- [ ] `useRoles()`
- [ ] `useRole(id)`
- [ ] `useCreateRole()` - mutation
- [ ] `useUpdateRole()` - mutation
- [ ] `useDeleteRole()` - mutation

- [ ] Create `src/hooks/useAuditLogs.ts`
- [ ] `useAuditLogs(filters)`

### Admin Dashboard
- [ ] Create `src/pages/admin/AdminDashboardPage.tsx`
- [ ] User count stats
- [ ] Role distribution chart
- [ ] Recent activity
- [ ] Quick actions

### Users List Page
- [ ] Create `src/pages/admin/UsersPage.tsx`
- [ ] Users table with pagination
- [ ] Search by name/email
- [ ] Filter by role
- [ ] Filter by status (active/inactive)
- [ ] Quick actions (edit, deactivate)
- [ ] Bulk actions (optional)

### User Detail Page
- [ ] Create `src/pages/admin/UserDetailPage.tsx`
- [ ] User info display
- [ ] Profile photo
- [ ] Role badges
- [ ] Assigned projects
- [ ] Activity history
- [ ] Last login

### User Edit Form
- [ ] Edit display name
- [ ] Role assignment (multi-select)
- [ ] Project assignment (for PMs)
- [ ] Status toggle
- [ ] Save with audit log

### Role Assignment
- [ ] Role picker component
- [ ] Show available roles
- [ ] Assign/remove roles
- [ ] Warning for sensitive roles

### Project Assignment
- [ ] For Project Managers: managedProjects
- [ ] For Employees: memberProjects
- [ ] Project picker with search
- [ ] Show current assignments

### Roles List Page
- [ ] Create `src/pages/admin/RolesPage.tsx`
- [ ] Roles table
- [ ] Show user count per role
- [ ] System role indicator
- [ ] Edit/delete actions
- [ ] Duplicate action

### Role Edit Form
- [ ] Role name and description
- [ ] Permission matrix (grid)
- [ ] dataAccess toggles:
  - [ ] allProjects
  - [ ] sensitiveFinancials
  - [ ] globalAssets
- [ ] Protect system roles from edit
- [ ] Save with audit log

### Permission Matrix Component
- [ ] Grid of modules × actions
- [ ] Checkbox for each permission
- [ ] Select all row
- [ ] Select all column
- [ ] Visual indicators

### Data Access Controls
- [ ] allProjects: see all projects
- [ ] sensitiveFinancials: see profit/rates
- [ ] globalAssets: see all assets

### Audit Logs Page
- [ ] Create `src/pages/admin/AuditLogsPage.tsx`
- [ ] Logs table with pagination
- [ ] Filter by module
- [ ] Filter by user
- [ ] Filter by action
- [ ] Filter by date range
- [ ] Export to CSV

### Audit Log Entry
- [ ] Display user, action, module
- [ ] Show before/after diff
- [ ] Timestamp
- [ ] Resource link (optional)

### Default Role Seeding
- [ ] Cloud Function to seed roles
- [ ] Default roles:
  - [ ] super_admin (all permissions, all data access)
  - [ ] finance_manager (finance full, others read, sensitiveFinancials)
  - [ ] project_manager (projects/tasks full, own projects only)
  - [ ] employee (basic read, own items)
  - [ ] external (read-only shared projects)

### User Import
- [ ] CSV upload component
- [ ] Parse CSV file
- [ ] Validate data
- [ ] Create user documents
- [ ] Send invites (optional)
- [ ] Import summary report

---

## Testing Requirements

- [ ] Test user CRUD
- [ ] Test role CRUD
- [ ] Test role assignment
- [ ] Test project assignment
- [ ] Test permission matrix
- [ ] Test audit logging
- [ ] Test system role protection

---

## Acceptance Criteria

- [ ] Super admin can view all users
- [ ] Super admin can edit users
- [ ] Super admin can assign roles
- [ ] Super admin can assign projects to PMs
- [ ] **Permission matrix correctly displays**
- [ ] System roles cannot be deleted
- [ ] Permissions correctly restrict access
- [ ] **Project managers only access own projects**
- [ ] **Project managers cannot see sensitive data**
- [ ] All changes create audit logs
- [ ] Audit log viewer works with filters
