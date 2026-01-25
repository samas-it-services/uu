# Agent 6: Projects & Tasks Agent Checklist
## Project Management & Kanban Board Specialist

---

## Role Overview

**Responsibilities**: Project CRUD, milestone tracking, team management, Kanban board implementation, task management, calendar integration, Google Meet integration.

**Files Owned**:
- `src/pages/projects/**`
- `src/pages/tasks/**`
- `src/components/modules/projects/**`
- `src/components/modules/tasks/**`
- `src/services/api/projects.ts`
- `src/services/api/tasks.ts`
- `src/services/google/calendar.ts`
- `src/services/google/meet.ts`
- `src/hooks/useProjects.ts`
- `src/hooks/useTasks.ts`
- `src/hooks/useTaskBoard.ts`
- `src/types/project.ts`
- `src/types/task.ts`

---

## Phase 4 Tasks

### Project Data Models
- [x] Create `src/types/project.ts`:
  ```typescript
  interface Project {
    id: string;
    code: string;
    name: string;
    description: string;
    status: ProjectStatus;
    managerId: string;
    teamMembers: string[];
    startDate: Timestamp;
    endDate: Timestamp;
    milestones: Milestone[];
    budget: { total: number; spent: number; currency: string; };
    integrations: {
      googleDriveFolderId?: string;
      googleCalendarId?: string;
    };
    settings: {
      taskStatuses: string[];
      labels: Label[];
      isPublic: boolean;
    };
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }
  
  // Subcollection: projects/{id}/sensitiveData
  interface ProjectSensitiveData {
    profitMargin: number;
    clientBillingRate: number;
    internalCostRate: number;
    contractValue: number;
    paymentTerms: string;
    notes: string;
  }
  ```

### Task Data Models
- [x] Create `src/types/task.ts`:
  ```typescript
  interface Task {
    id: string;
    projectId: string;
    title: string;
    description: string;
    status: string;
    statusOrder: number;
    assignedTo: string[];
    assignedBy: string;
    priority: Priority;
    labels: string[];
    dueDate?: Timestamp;
    startDate?: Timestamp;
    completedAt?: Timestamp;
    checklist: ChecklistItem[];
    attachments: Attachment[];
    dependencies: string[];
    estimatedHours?: number;
    actualHours?: number;
    commentCount: number;
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }
  ```

### Project API Service
- [x] Create `src/services/api/projects.ts`
- [x] `getProjects(filters)` - respects user access
- [x] `getProjectById(id)` - check access
- [x] `getMyProjects()` - managed + member projects
- [x] `createProject(data)` - creates Drive folder, Calendar
- [x] `updateProject(id, data)`
- [x] `deleteProject(id)` - super admin only
- [x] `addTeamMember(projectId, userId)`
- [x] `removeTeamMember(projectId, userId)`
- [ ] `updateMilestone(projectId, milestone)`

### Project Sensitive Data API
- [x] `getSensitiveData(projectId)` - finance/admin only
- [x] `updateSensitiveData(projectId, data)`
- [x] Verify access before returning data

### Task API Service
- [x] Create `src/services/api/tasks.ts`
- [x] `getProjectTasks(projectId)` - all tasks for project
- [x] `getTasksByStatus(projectId, status)` - for Kanban
- [x] `getTaskById(id)`
- [x] `getMyTasks()` - assigned to current user
- [x] `createTask(data)`
- [x] `updateTask(id, data)`
- [x] `deleteTask(id)`
- [x] `updateTaskStatus(id, status, order)` - for drag
- [x] `reorderTasks(taskIds, startOrder)` - batch update
- [x] `addComment(taskId, comment)`
- [x] `addAttachment(taskId, file)`

### React Query Hooks - Projects
- [x] Create `src/hooks/useProjects.ts`
- [x] `useProjects(filters)`
- [x] `useProject(id)`
- [x] `useMyProjects()`
- [x] `useProjectSensitiveData(id)` - protected
- [x] `useCreateProject()` - mutation
- [x] `useUpdateProject()` - mutation
- [x] `useDeleteProject()` - mutation

### React Query Hooks - Tasks
- [x] Create `src/hooks/useTasks.ts`
- [x] `useProjectTasks(projectId)`
- [x] `useTask(id)`
- [x] `useMyTasks()`
- [x] `useTaskComments(taskId)`
- [x] `useCreateTask()` - mutation
- [x] `useUpdateTask()` - mutation
- [x] `useMoveTask()` - mutation with optimistic update

### Kanban Board Hook
- [x] Create `src/hooks/useTaskBoard.ts`
- [x] Real-time subscription to tasks
- [x] Handle task changes (add/modify/remove)
- [x] Optimistic updates for drag operations
- [x] Rollback on error

### Project List Page
- [x] Create `src/pages/projects/ProjectsPage.tsx`
- [x] Show projects as cards or table
- [x] Filter by status
- [x] Search by name
- [x] Different views based on role:
  - [x] Super Admin: all projects
  - [x] Finance: all projects (read-only)
  - [x] Project Manager: managed projects only
  - [x] Employee: member projects only

### Project Detail Page
- [x] Create `src/pages/projects/ProjectDetailPage.tsx`
- [x] Tabbed interface: Overview, Tasks, Board, Files, Calendar, Team, Settings
- [x] Overview: stats, milestones, activity
- [x] Show budget (hide sensitive from PM)

### New/Edit Project Form
- [x] Create project form with validation
- [x] Auto-generate project code (PRJ-001)
- [x] Team member selection
- [x] Milestone management
- [x] Budget input (only for admin/finance)
- [x] Integration toggles (Drive, Calendar)

### Milestone Management
- [x] Create milestone form
- [x] Display milestone timeline
- [x] Update milestone status
- [x] Link milestones to tasks
- [x] Sync to Google Calendar

### Team Management
- [x] List team members
- [x] Add/remove members
- [ ] Show workload per member
- [ ] Role within project (optional)

### Kanban Board Implementation
- [x] Set up @dnd-kit
- [x] Create `KanbanBoard` component
- [x] Create `KanbanColumn` component (droppable)
- [x] Create `TaskCard` component (draggable)
- [x] Drag between columns (status change)
- [x] Drag within column (reorder)
- [x] Add task inline
- [ ] WIP limits per column (optional)
- [ ] Column management (add/edit/delete)
- [x] Smooth animations
- [x] Mobile touch support

### Task Card Features
- [x] Title with edit on click
- [x] Priority indicator (color)
- [x] Labels/tags
- [x] Assignee avatars
- [x] Due date with overdue styling
- [x] Checklist progress bar
- [x] Comment count
- [x] Attachment indicator
- [x] Quick actions menu

### Task Detail Modal
- [x] Full task details
- [x] Editable title/description
- [x] Status dropdown
- [x] Assignee picker (multi-select)
- [x] Priority picker
- [x] Label picker
- [x] Due date picker
- [x] Checklist management (add/toggle/delete)
- [x] Attachments (upload/view/delete)
- [x] Comments with @mentions
- [ ] Activity history
- [x] "Start Meet" button

### Task Views
- [x] Kanban board (default)
- [x] List view (sortable table)
- [ ] Calendar view (tasks by due date)
- [ ] Timeline/Gantt view (optional)
- [x] My Tasks page (personal view)

### Task Filters
- [x] Filter by assignee
- [x] Filter by priority
- [x] Filter by label
- [x] Filter by due date (overdue, today, week)
- [x] Filter by status
- [x] Clear all filters

### Comments System
- [x] Real-time comments
- [x] @mention users
- [ ] Parse mentions and notify
- [x] Attachment in comments
- [x] Edit own comments
- [x] Delete own comments

### Google Calendar Integration
- [x] Create `src/services/google/calendar.ts`
- [x] Create project calendar on project create
- [x] Sync milestones as events
- [x] Sync task due dates (optional)
- [x] Display calendar in project view
- [x] Create events from portal
- [ ] Show team availability

### Google Meet Integration
- [x] Create `src/services/google/meet.ts`
- [x] Generate instant Meet link
- [x] "Start Meet" on task detail
- [x] "Start Meet" on project
- [x] Invite team members
- [ ] Save meeting notes to task

### Project-Scoped Access
- [x] Verify users can only see their projects
- [x] Hide sensitive data from project managers
- [x] Project assets only visible to project team
- [x] Project documents scoped

---

## Testing Requirements

- [x] Test project CRUD
- [x] Test task CRUD
- [x] Test Kanban drag operations
- [ ] Test real-time updates
- [x] Test project access control
- [x] Test sensitive data protection
- [ ] Test calendar sync
- [ ] Test Meet link generation

---

## Acceptance Criteria

- [x] Projects can be created with milestones
- [x] Team members can be assigned
- [x] Project managers only see their projects
- [x] Sensitive data hidden from project managers
- [x] Budget tracking works
- [x] Tasks can be created and assigned
- [x] **Kanban board drag-drop works smoothly**
- [x] **Real-time updates on task changes**
- [x] Comments sync in real-time
- [ ] @mentions notify users
- [x] Google Calendar synced
- [x] Google Meet links generated

---

## Phase 7 Tasks (Custom Fields Extension)

### Custom Fields System
- [ ] Create `src/types/customField.ts`
- [ ] Create `src/services/api/customFields.ts`
- [ ] Create `src/hooks/useCustomFields.ts`
- [ ] Update TaskModal with dynamic custom fields section
- [ ] Update TaskCard with custom field badges
- [ ] Create CustomFieldsPage (admin)
- [ ] Create CustomFieldEditor component

### Extended Task Type
- [ ] Add `taskType` enum field (growth, experimentation, operational, etc.)
- [ ] Add `category` enum field (seo, marketing, engineering, etc.)
- [ ] Add `phase` field (project phase)
- [ ] Add `sprint` field (sprint identifier)
- [ ] Add `goal` field (task goal description)
- [ ] Add `acceptanceCriteria` field
- [ ] Add `successMetrics` field
- [ ] Add `completionDate` field (separate from completedAt)
- [ ] Add `externalId` field (external system reference)
- [ ] Add `customFields` map for dynamic fields
