# Agent 1: Architecture Agent Checklist
## System Architect & Infrastructure Lead

---

## Role Overview

**Responsibilities**: Firebase project configuration, Firestore data modeling, security rules implementation, Cloud Functions architecture, CI/CD pipeline setup.

**Files Owned**:
- `firebase.json`
- `firestore.rules`
- `storage.rules`
- `firestore.indexes.json`
- `.github/workflows/*`
- `functions/**`
- `docs/Architecture.md`

---

## Phase 1 Tasks

### Firebase Project Setup
- [ ] Create Firebase project in Google Cloud Console
- [ ] Enable required Firebase services:
  - [ ] Authentication
  - [ ] Firestore
  - [ ] Storage
  - [ ] Functions
  - [ ] Hosting
  - [ ] Cloud Messaging
- [ ] Configure project settings (location, billing)
- [ ] Create `.firebaserc` with project alias

### Firebase CLI Configuration
- [ ] Install Firebase CLI globally
- [ ] Login to Firebase CLI
- [ ] Initialize Firebase in project:
  ```bash
  firebase init firestore functions hosting storage
  ```
- [ ] Configure emulators for local development
- [ ] Test emulator startup

### Firestore Setup
- [ ] Create database in production mode
- [ ] Define collection structure
- [ ] Create `firestore.indexes.json` with required indexes:
  - [ ] tasks: projectId + status + statusOrder
  - [ ] tasks: assignedTo + dueDate
  - [ ] expenses: status + createdAt
  - [ ] expenses: projectId + createdAt
  - [ ] documents: projectId + folderId + name
  - [ ] announcements: isPinned + publishedAt
  - [ ] auditLogs: module + timestamp
  - [ ] presence: status + heartbeat
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes`

### Storage Setup
- [ ] Create storage bucket
- [ ] Configure CORS settings
- [ ] Set storage rules for receipts, documents, assets

### Cloud Functions Setup
- [ ] Initialize Functions with TypeScript
- [ ] Configure `functions/package.json`
- [ ] Set up Firebase Admin SDK
- [ ] Create function templates
- [ ] Configure environment variables

---

## Phase 2 Tasks

### Security Rules - Users & Roles
- [ ] Implement `isAuthenticated()` helper
- [ ] Implement `getUserData()` helper
- [ ] Implement `isSuperAdmin()` helper
- [ ] Implement `isFinanceManager()` helper
- [ ] Implement `isProjectManager()` helper
- [ ] Write rules for `users` collection
- [ ] Write rules for `roles` collection
- [ ] Test rules with emulator

### Security Rules - Project Access
- [ ] Implement `canAccessProject(projectId)` function
- [ ] Implement `isProjectMember(projectId)` function
- [ ] Implement `isProjectOwner(projectId)` function
- [ ] Write rules for `projects` collection
- [ ] Write rules for `projects/{id}/sensitiveData` subcollection
- [ ] Write rules for `projects/{id}/assets` subcollection
- [ ] Write rules for `projects/{id}/activities` subcollection
- [ ] Ensure project managers CANNOT access sensitiveData
- [ ] Test project-scoped access rules

---

## Phase 3 Tasks

### Security Rules - Finance & Documents
- [ ] Write rules for `expenses` collection:
  - [ ] Users can read own expenses
  - [ ] Finance can read all
  - [ ] Project owners can read project expenses
  - [ ] Users can create own expenses
  - [ ] Finance can update all
  - [ ] Users can update own draft/needs_info
- [ ] Write rules for `documents` collection:
  - [ ] Respect accessLevel (private, project, company, public)
  - [ ] Respect accessList for specific users
  - [ ] Check isSensitive flag
  - [ ] Project members can access project docs

### Storage Rules
- [ ] Write rules for `/receipts/{userId}/{expenseId}/*`
- [ ] Write rules for `/documents/{category}/{documentId}/*`
- [ ] Write rules for `/projects/{projectId}/attachments/*`
- [ ] Test file upload/download permissions

---

## Phase 4 Tasks

### Security Rules - Tasks
- [ ] Write rules for `tasks` collection:
  - [ ] Read: user can access task if can access project
  - [ ] Create: only project owners
  - [ ] Update: project owners OR assigned users
  - [ ] Delete: only project owners
- [ ] Write rules for `tasks/{taskId}/comments` subcollection
- [ ] Test task access for different roles

---

## Phase 5 Tasks

### Security Rules - Assets & Announcements
- [ ] Write rules for `assets` collection:
  - [ ] Project managers can only see project-assigned assets
  - [ ] Only super admin can create/delete
- [ ] Write rules for `announcements` collection:
  - [ ] Respect targeting (all, roles, projects, users)
  - [ ] Allow users to mark as read

### Storage Rules - Assets
- [ ] Write rules for `/assets/qr-codes/*`
- [ ] Write rules for `/assets/images/*`
- [ ] Write rules for `/announcements/{id}/*`

---

## Phase 6 Tasks

### Security Rules - Presence & Audit
- [ ] Write rules for `presence` collection:
  - [ ] Users can read all presence
  - [ ] Users can only write own presence
- [ ] Write rules for `auditLogs` collection:
  - [ ] Only super admin can read
  - [ ] Authenticated users can create
  - [ ] No updates or deletes allowed

### CI/CD Pipeline
- [ ] Create `.github/workflows/ci.yml`:
  - [ ] Lint job
  - [ ] TypeScript check job
  - [ ] Unit test job
  - [ ] Build job
  - [ ] Upload coverage to Codecov
- [ ] Create `.github/workflows/deploy.yml`:
  - [ ] Preview deployment on PR
  - [ ] Production deployment on main merge
  - [ ] Deploy hosting
  - [ ] Deploy functions
  - [ ] Deploy rules
- [ ] Configure GitHub secrets:
  - [ ] `FIREBASE_SERVICE_ACCOUNT`
  - [ ] `FIREBASE_PROJECT_ID`
  - [ ] All `VITE_FIREBASE_*` variables
- [ ] Test pipeline with test PR

### Architecture Documentation
- [ ] Complete `docs/Architecture.md`:
  - [ ] High-level system diagram (Mermaid)
  - [ ] Authentication flow diagram
  - [ ] Data flow diagram
  - [ ] RBAC permission flow diagram
  - [ ] Module architecture diagram
  - [ ] PWA architecture diagram
  - [ ] Firestore data model diagram
  - [ ] Deployment pipeline diagram
- [ ] Use collapsible sections for diagrams
- [ ] Add directory structure

### Production Deployment
- [ ] Configure Firebase Hosting for production
- [ ] Set up custom domain (uu.samas.tech)
- [ ] Configure SSL certificate
- [ ] Deploy all rules to production
- [ ] Verify rules in production
- [ ] Monitor Cloud Functions logs

---

## Acceptance Criteria

### Security
- [ ] All Firestore security rules deployed
- [ ] All Storage security rules deployed
- [ ] Project managers CANNOT access sensitiveData
- [ ] Project managers CANNOT access other projects
- [ ] Finance managers CAN access all financial data
- [ ] Super admins have full access
- [ ] Audit logs are immutable

### Infrastructure
- [ ] Firebase project fully configured
- [ ] Emulators work for local development
- [ ] CI/CD pipeline passes on all commits
- [ ] Preview deployments work on PRs
- [ ] Production deployment automated

### Documentation
- [ ] Architecture.md complete with all diagrams
- [ ] All diagrams in collapsible format
- [ ] Security rules documented

---

## Commands Reference

```bash
# Firebase CLI
firebase login
firebase use --add
firebase emulators:start
firebase deploy
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only firestore:indexes
firebase deploy --only functions
firebase deploy --only hosting

# Testing rules
firebase emulators:start
# Then run tests against emulator

# View function logs
firebase functions:log
```

---

## Handoff Notes

After completing Phase 1, provide to Auth Agent:
- Firebase project ID and configuration
- Emulator ports and setup instructions
- Security rules status

After completing Phase 6, provide to all:
- Production deployment status
- CI/CD pipeline documentation
- Monitoring dashboard access
