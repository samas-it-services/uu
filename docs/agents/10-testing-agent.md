# Agent 10: Testing Agent Checklist
## Quality Assurance & Testing Specialist

---

## Role Overview

**Responsibilities**: Unit testing, integration testing, E2E testing, test coverage, CI automation.

**Files Owned**:
- `tests/**`
- `vitest.config.ts`
- `playwright.config.ts`
- `src/test-utils/**`
- `.github/workflows/ci.yml` (test jobs)

---

## Phase 6 Tasks

### Test Infrastructure Setup
- [ ] Configure Vitest:
  ```typescript
  // vitest.config.ts
  export default defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test-utils/setup.ts'],
      coverage: {
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/', 'src/test-utils/'],
      },
    },
  });
  ```
- [ ] Create test setup file
- [ ] Configure test mocks
- [ ] Set up Firebase emulator connection
- [ ] Configure Playwright for E2E

### Test Utilities
- [ ] Create `src/test-utils/setup.ts`
- [ ] Create `src/test-utils/render.tsx` - custom render with providers
- [ ] Create `src/test-utils/mocks/firebase.ts`
- [ ] Create `src/test-utils/mocks/auth.ts`
- [ ] Create `src/test-utils/factories/` - test data factories
- [ ] Create `src/test-utils/helpers.ts`

### Firebase Mocks
- [ ] Mock Firestore operations
- [ ] Mock Auth operations
- [ ] Mock Storage operations
- [ ] Mock Cloud Functions calls

### Unit Tests - Hooks
- [ ] Test `useAuth` hook
  - [ ] Initial loading state
  - [ ] Sign in success
  - [ ] Sign in error
  - [ ] Sign out
  - [ ] User persistence
- [ ] Test `usePermissions` hook
  - [ ] hasPermission calculations
  - [ ] canAccessProject logic
  - [ ] canAccessSensitiveData logic
  - [ ] canManageProject logic
  - [ ] Role checks (isSuperAdmin, etc.)
- [ ] Test `useExpenses` hook
- [ ] Test `useDocuments` hook
- [ ] Test `useProjects` hook
- [ ] Test `useTasks` hook
- [ ] Test `useTaskBoard` hook
- [ ] Test `useAssets` hook
- [ ] Test `useAnnouncements` hook
- [ ] Test `usePresence` hook

### Unit Tests - Services
- [ ] Test `expensesService`
- [ ] Test `documentsService`
- [ ] Test `projectsService`
- [ ] Test `tasksService`
- [ ] Test `assetsService`
- [ ] Test `announcementsService`
- [ ] Test `auditLogsService`
- [ ] Test `driveService`
- [ ] Test `calendarService`
- [ ] Test `meetService`

### Unit Tests - Utilities
- [ ] Test date formatting utilities
- [ ] Test permission checking utilities
- [ ] Test validation schemas
- [ ] Test sanitization functions
- [ ] Test QR code generation

### Unit Tests - Components
- [ ] Test UI components (Button, Input, etc.)
- [ ] Test Form components
- [ ] Test Guard components
- [ ] Test Layout components

### Integration Tests - Auth Flow
- [ ] Test complete sign-in flow
- [ ] Test user document creation
- [ ] Test super admin auto-assignment
- [ ] Test role loading
- [ ] Test session persistence

### Integration Tests - RBAC
- [ ] Test permission enforcement
- [ ] Test project access control
- [ ] Test sensitive data access
- [ ] Test role assignment impact

### Integration Tests - Modules
- [ ] Test expense submission flow
- [ ] Test expense approval flow
- [ ] Test document upload flow
- [ ] Test project creation flow
- [ ] Test task creation flow
- [ ] Test Kanban operations
- [ ] Test asset assignment flow
- [ ] Test announcement creation flow

### E2E Tests Setup
- [ ] Configure Playwright
- [ ] Set up test database
- [ ] Create test accounts
- [ ] Set up page objects

### E2E Tests - Critical Flows
- [ ] Login flow
  - [ ] Sign in with Google
  - [ ] Redirect to dashboard
  - [ ] User menu displays
- [ ] Logout flow
  - [ ] Sign out
  - [ ] Redirect to login
- [ ] Expense flow
  - [ ] Create expense
  - [ ] Upload receipt
  - [ ] Submit for approval
  - [ ] Approve expense (as finance)
- [ ] Task flow
  - [ ] Create task
  - [ ] Drag on Kanban
  - [ ] Add comment
  - [ ] Complete task
- [ ] Project flow
  - [ ] Create project
  - [ ] Add team members
  - [ ] Create milestone
- [ ] Admin flow
  - [ ] View users
  - [ ] Edit user roles
  - [ ] Create custom role

### E2E Tests - Access Control
- [ ] Project manager cannot see other projects
- [ ] Project manager cannot see sensitive data
- [ ] Employee cannot access admin pages
- [ ] External cannot modify data

### Coverage Requirements
- [ ] Overall coverage > 80%
- [ ] Critical paths 100%
- [ ] Hooks > 90%
- [ ] Services > 90%
- [ ] Components > 70%

### CI Integration
- [ ] Add test job to GitHub Actions
- [ ] Run tests on PR
- [ ] Block merge if tests fail
- [ ] Upload coverage to Codecov
- [ ] Add coverage badge to README

### Test Documentation
- [ ] Document test patterns
- [ ] Document mock usage
- [ ] Document factory usage
- [ ] Create test writing guide

---

## Test Commands

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific file
npm test -- src/hooks/useAuth.test.ts

# Run E2E tests
npm run test:e2e

# Run E2E in headed mode
npm run test:e2e -- --headed

# Run E2E specific test
npm run test:e2e -- tests/expense.spec.ts
```

---

## Acceptance Criteria

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] **Coverage > 80%**
- [ ] Critical paths have 100% coverage
- [ ] Tests run in CI pipeline
- [ ] Coverage report generated
- [ ] Tests complete in < 5 minutes
