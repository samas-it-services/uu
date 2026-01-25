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
- [ ] Create `src/types/project.ts`:
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
- [ ] Create `src/types/task.ts`:
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
- [ ] Create `src/services/api/projects.ts`
- [ ] `getProjects(filters)` - respects user access
- [ ] `getProjectById(id)` - check access
- [ ] `getMyProjects()` - managed + member projects
- [ ] `createProject(data)` - creates Drive folder, Calendar
- [ ] `updateProject(id, data)`
- [ ] `deleteProject(id)` - super admin only
- [ ] `addTeamMember(projectId, userId)`
- [ ] `removeTeamMember(projectId, userId)`
- [ ] `updateMilestone(projectId, milestone)`

### Project Sensitive Data API
- [ ] `getSensitiveData(projectId)` - finance/admin only
- [ ] `updateSensitiveData(projectId, data)`
- [ ] Verify access before returning data

### Task API Service
- [ ] Create `src/services/api/tasks.ts`
- [ ] `getProjectTasks(projectId)` - all tasks for project
- [ ] `getTasksByStatus(projectId, status)` - for Kanban
- [ ] `getTaskById(id)`
- [ ] `getMyTasks()` - assigned to current user
- [ ] `createTask(data)`
- [ ] `updateTask(id, data)`
- [ ] `deleteTask(id)`
- [ ] `updateTaskStatus(id, status, order)` - for drag
- [ ] `reorderTasks(taskIds, startOrder)` - batch update
- [ ] `addComment(taskId, comment)`
- [ ] `addAttachment(taskId, file)`

### React Query Hooks - Projects
- [ ] Create `src/hooks/useProjects.ts`
- [ ] `useProjects(filters)`
- [ ] `useProject(id)`
- [ ] `useMyProjects()`
- [ ] `useProjectSensitiveData(id)` - protected
- [ ] `useCreateProject()` - mutation
- [ ] `useUpdateProject()` - mutation
- [ ] `useDeleteProject()` - mutation

### React Query Hooks - Tasks
- [ ] Create `src/hooks/useTasks.ts`
- [ ] `useProjectTasks(projectId)`
- [ ] `useTask(id)`
- [ ] `useMyTasks()`
- [ ] `useTaskComments(taskId)`
- [ ] `useCreateTask()` - mutation
- [ ] `useUpdateTask()` - mutation
- [ ] `useMoveTask()` - mutation with optimistic update

### Kanban Board Hook
- [ ] Create `src/hooks/useTaskBoard.ts`
- [ ] Real-time subscription to tasks
- [ ] Handle task changes (add/modify/remove)
- [ ] Optimistic updates for drag operations
- [ ] Rollback on error

### Project List Page
- [ ] Create `src/pages/projects/ProjectsPage.tsx`
- [ ] Show projects as cards or table
- [ ] Filter by status
- [ ] Search by name
- [ ] Different views based on role:
  - [ ] Super Admin: all projects
  - [ ] Finance: all projects (read-only)
  - [ ] Project Manager: managed projects only
  - [ ] Employee: member projects only

### Project Detail Page
- [ ] Create `src/pages/projects/ProjectDetailPage.tsx`
- [ ] Tabbed interface: Overview, Tasks, Board, Files, Calendar, Team, Settings
- [ ] Overview: stats, milestones, activity
- [ ] Show budget (hide sensitive from PM)

### New/Edit Project Form
- [ ] Create project form with validation
- [ ] Auto-generate project code (PRJ-001)
- [ ] Team member selection
- [ ] Milestone management
- [ ] Budget input (only for admin/finance)
- [ ] Integration toggles (Drive, Calendar)

### Milestone Management
- [ ] Create milestone form
- [ ] Display milestone timeline
- [ ] Update milestone status
- [ ] Link milestones to tasks
- [ ] Sync to Google Calendar

### Team Management
- [ ] List team members
- [ ] Add/remove members
- [ ] Show workload per member
- [ ] Role within project (optional)

### Kanban Board Implementation
- [ ] Set up @dnd-kit
- [ ] Create `KanbanBoard` component
- [ ] Create `KanbanColumn` component (droppable)
- [ ] Create `TaskCard` component (draggable)
- [ ] Drag between columns (status change)
- [ ] Drag within column (reorder)
- [ ] Add task inline
- [ ] WIP limits per column (optional)
- [ ] Column management (add/edit/delete)
- [ ] Smooth animations
- [ ] Mobile touch support

### Task Card Features
- [ ] Title with edit on click
- [ ] Priority indicator (color)
- [ ] Labels/tags
- [ ] Assignee avatars
- [ ] Due date with overdue styling
- [ ] Checklist progress bar
- [ ] Comment count
- [ ] Attachment indicator
- [ ] Quick actions menu

### Task Detail Modal
- [ ] Full task details
- [ ] Editable title/description
- [ ] Status dropdown
- [ ] Assignee picker (multi-select)
- [ ] Priority picker
- [ ] Label picker
- [ ] Due date picker
- [ ] Checklist management (add/toggle/delete)
- [ ] Attachments (upload/view/delete)
- [ ] Comments with @mentions
- [ ] Activity history
- [ ] "Start Meet" button

### Task Views
- [ ] Kanban board (default)
- [ ] List view (sortable table)
- [ ] Calendar view (tasks by due date)
- [ ] Timeline/Gantt view (optional)
- [ ] My Tasks page (personal view)

### Task Filters
- [ ] Filter by assignee
- [ ] Filter by priority
- [ ] Filter by label
- [ ] Filter by due date (overdue, today, week)
- [ ] Filter by status
- [ ] Clear all filters

### Comments System
- [ ] Real-time comments
- [ ] @mention users
- [ ] Parse mentions and notify
- [ ] Attachment in comments
- [ ] Edit own comments
- [ ] Delete own comments

### Google Calendar Integration
- [ ] Create `src/services/google/calendar.ts`
- [ ] Create project calendar on project create
- [ ] Sync milestones as events
- [ ] Sync task due dates (optional)
- [ ] Display calendar in project view
- [ ] Create events from portal
- [ ] Show team availability

### Google Meet Integration
- [ ] Create `src/services/google/meet.ts`
- [ ] Generate instant Meet link
- [ ] "Start Meet" on task detail
- [ ] "Start Meet" on project
- [ ] Invite team members
- [ ] Save meeting notes to task

### Project-Scoped Access
- [ ] Verify users can only see their projects
- [ ] Hide sensitive data from project managers
- [ ] Project assets only visible to project team
- [ ] Project documents scoped

---

## Testing Requirements

- [ ] Test project CRUD
- [ ] Test task CRUD
- [ ] Test Kanban drag operations
- [ ] Test real-time updates
- [ ] Test project access control
- [ ] Test sensitive data protection
- [ ] Test calendar sync
- [ ] Test Meet link generation

---

## Acceptance Criteria

- [ ] Projects can be created with milestones
- [ ] Team members can be assigned
- [ ] Project managers only see their projects
- [ ] Sensitive data hidden from project managers
- [ ] Budget tracking works
- [ ] Tasks can be created and assigned
- [ ] **Kanban board drag-drop works smoothly**
- [ ] **Real-time updates on task changes**
- [ ] Comments sync in real-time
- [ ] @mentions notify users
- [ ] Google Calendar synced
- [ ] Google Meet links generated
