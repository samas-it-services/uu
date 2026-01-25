# Product Requirements Document (PRD)
## SaMas IT Services Portal v1.0

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-24 | System | Initial PRD |
| 1.1 | 2025-01-24 | System | Added Google integrations, Kanban, presence |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Objectives](#3-goals--objectives)
4. [User Personas](#4-user-personas)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Feature Specifications](#6-feature-specifications)
7. [Google Workspace Integration](#7-google-workspace-integration)
8. [User Experience Requirements](#8-user-experience-requirements)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Success Metrics](#10-success-metrics)
11. [Out of Scope](#11-out-of-scope)
12. [Appendix](#12-appendix)

---

## 1. Executive Summary

### 1.1 Product Vision
Create a comprehensive, secure company portal for SaMas IT Services (uu.samas.tech) that centralizes business operations including finance management, document management, project tracking, asset management, task management, and company communications—all integrated with Google Workspace for seamless productivity.

### 1.2 Key Differentiators
- **Project-Scoped Security**: Each project has isolated assets, documents, and sensitive data
- **Role-Based Data Access**: Granular permissions prevent unauthorized access to sensitive information
- **Google Workspace Native**: Deep integration with Drive, Calendar, and Meet
- **Real-Time Collaboration**: Live presence, activity feeds, and instant updates
- **Mobile-First PWA**: Full functionality on any device without native app installation

### 1.3 Target Launch
- **Alpha**: Week 4 (internal testing)
- **Beta**: Week 5 (selected users)
- **Production**: Week 6 (full rollout)

---

## 2. Problem Statement

### 2.1 Current Challenges
1. **Scattered Information**: Documents spread across email, personal drives, and local storage
2. **No Visibility**: Lack of real-time insight into project status and team activities
3. **Manual Processes**: Expense tracking, approvals, and reporting done manually
4. **Security Gaps**: No centralized access control for sensitive project data
5. **Communication Silos**: Important announcements lost in email threads

### 2.2 Business Impact
- 15+ hours/week lost to searching for documents
- Delayed expense reimbursements (avg. 2 weeks)
- No audit trail for financial decisions
- Risk of sensitive data exposure
- Missed deadlines due to poor task visibility

---

## 3. Goals & Objectives

### 3.1 Primary Goals
| Goal | Metric | Target |
|------|--------|--------|
| Centralize operations | Active daily users | 100% of employees |
| Reduce document search time | Time to find document | < 30 seconds |
| Accelerate expense processing | Approval turnaround | < 48 hours |
| Improve project visibility | Real-time status accuracy | 95% |
| Secure sensitive data | Unauthorized access incidents | Zero |

### 3.2 Secondary Goals
- Enable remote work with full functionality
- Reduce meeting overhead with async updates
- Create audit trail for compliance
- Standardize business processes

---

## 4. User Personas

### 4.1 Syed (CEO/Super Admin)
- **Role**: Strategic oversight, final approvals
- **Needs**: Dashboard with KPIs, quick access to all data, audit capabilities
- **Pain Points**: Too many systems to check, lack of consolidated view
- **Success**: Single dashboard showing company health

### 4.2 Samina (Finance Manager)
- **Role**: Expense approvals, budget management, financial reporting
- **Needs**: Approval queue, budget tracking, export capabilities
- **Pain Points**: Chasing receipts, manual Excel reports
- **Success**: Automated expense workflow, one-click reports

### 4.3 Shahneela (Project Manager)
- **Role**: Project delivery, team coordination, client communication
- **Needs**: Project overview, task assignment, timeline tracking
- **Pain Points**: No visibility into team workload, scattered files
- **Success**: Kanban board, integrated calendar, file organization
- **Restriction**: Cannot access sensitive financial data of other projects

### 4.4 Team Member (Employee)
- **Role**: Task execution, time tracking, collaboration
- **Needs**: Clear task list, easy file access, status updates
- **Pain Points**: Unclear priorities, can't find documents
- **Success**: Personal dashboard, notification system

### 4.5 External Stakeholder (Client/Vendor)
- **Role**: View shared project progress, documents
- **Needs**: Limited, secure access to specific projects
- **Pain Points**: Requires frequent status update meetings
- **Success**: Self-service project status view

---

## 5. User Roles & Permissions

### 5.1 Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPER ADMIN                               │
│  (Full system access, all projects, all sensitive data)         │
├─────────────────────────────────────────────────────────────────┤
│     FINANCE MANAGER          │        PROJECT MANAGER            │
│  (Finance module full access │  (Project scope only, NO access   │
│   Read-only other modules)   │   to other project sensitive data)│
├─────────────────────────────────────────────────────────────────┤
│                          EMPLOYEE                                │
│  (Assigned projects/tasks only, submit expenses)                │
├─────────────────────────────────────────────────────────────────┤
│                      EXTERNAL VIEWER                             │
│  (Read-only, specific shared projects only)                     │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Detailed Permission Matrix

#### Global Permissions
| Module | Super Admin | Finance Manager | Project Manager | Employee | External |
|--------|-------------|-----------------|-----------------|----------|----------|
| Dashboard | Full | Finance View | Project View | Personal | Limited |
| User Management | CRUD | - | - | - | - |
| Role Management | CRUD | - | - | - | - |
| Audit Logs | Read | - | - | - | - |
| System Settings | CRUD | - | - | - | - |

#### Finance Module
| Action | Super Admin | Finance Manager | Project Manager | Employee | External |
|--------|-------------|-----------------|-----------------|----------|----------|
| View All Expenses | ✅ | ✅ | ❌ Own Project Only | ❌ Own Only | ❌ |
| Submit Expense | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approve/Reject | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Budgets | ✅ | ✅ | ✅ Own Project | ❌ | ❌ |
| Export Reports | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sensitive Financial Data | ✅ | ✅ | ❌ | ❌ | ❌ |

#### Document Module
| Action | Super Admin | Finance Manager | Project Manager | Employee | External |
|--------|-------------|-----------------|-----------------|----------|----------|
| View All Docs | ✅ | ✅ Company Docs | ✅ Own Projects | ✅ Assigned | ✅ Shared |
| Upload | ✅ | ✅ Finance Folder | ✅ Own Projects | ✅ Assigned | ❌ |
| Delete | ✅ | ✅ Own Uploads | ✅ Own Projects | ❌ | ❌ |
| Share Externally | ✅ | ❌ | ✅ Own Projects | ❌ | ❌ |

#### Project Module
| Action | Super Admin | Finance Manager | Project Manager | Employee | External |
|--------|-------------|-----------------|-----------------|----------|----------|
| View All Projects | ✅ | ✅ Read Only | ❌ Own Only | ❌ Assigned | ❌ Shared |
| Create Project | ✅ | ❌ | ✅ | ❌ | ❌ |
| Edit Project | ✅ | ❌ | ✅ Own Only | ❌ | ❌ |
| Delete Project | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Sensitive Data | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign Members | ✅ | ❌ | ✅ Own Only | ❌ | ❌ |

#### Task Module
| Action | Super Admin | Finance Manager | Project Manager | Employee | External |
|--------|-------------|-----------------|-----------------|----------|----------|
| View All Tasks | ✅ | ✅ Read Only | ✅ Own Projects | ✅ Assigned | ✅ Shared |
| Create Task | ✅ | ❌ | ✅ Own Projects | ❌ | ❌ |
| Edit Task | ✅ | ❌ | ✅ Own Projects | ✅ Own Only | ❌ |
| Delete Task | ✅ | ❌ | ✅ Own Projects | ❌ | ❌ |
| Change Status | ✅ | ❌ | ✅ Own Projects | ✅ Assigned | ❌ |

#### Asset Module
| Action | Super Admin | Finance Manager | Project Manager | Employee | External |
|--------|-------------|-----------------|-----------------|----------|----------|
| View All Assets | ✅ | ✅ Read Only | ✅ Own Projects | ✅ Assigned | ❌ |
| Create Asset | ✅ | ❌ | ✅ Own Projects | ❌ | ❌ |
| Assign Asset | ✅ | ❌ | ✅ Own Projects | ❌ | ❌ |
| Delete Asset | ✅ | ❌ | ❌ | ❌ | ❌ |

### 5.3 Project-Scoped Security Model

**Critical Requirement**: Project Managers can ONLY access data within their assigned projects.

```
┌─────────────────────────────────────────────────────────────────┐
│                     PROJECT BOUNDARY                             │
├─────────────────────────────────────────────────────────────────┤
│  Project: Alpha                                                  │
│  ├── Manager: Shahneela                                         │
│  ├── Members: [Employee1, Employee2]                            │
│  ├── Assets: [Laptop-001, License-XYZ]                          │
│  ├── Documents: [specs.pdf, contracts/]                         │
│  ├── Tasks: [Task1, Task2, Task3]                               │
│  └── Budget: $50,000 (visible to manager)                       │
│                                                                  │
│  ⛔ SENSITIVE DATA (Hidden from Project Manager):               │
│  ├── Profit Margins                                             │
│  ├── Client Payment Terms                                       │
│  ├── Internal Cost Breakdown                                    │
│  └── Salary/Contractor Rates                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Predefined Users

| Email | Name | Role | Access |
|-------|------|------|--------|
| bill@samas.tech | Syed A Bilgrami | Super Admin | Full |
| bilgrami@gmail.com | Syed A Bilgrami | Super Admin | Full |
| saminas.samas@gmail.com | Samina Mukhtar | Finance Manager | Finance + Read |
| shahneela.samas@gmail.com | Shahneela Chaudhry | Project Manager | Own Projects |

---

## 6. Feature Specifications

### 6.1 Authentication & Session Management

#### 6.1.1 Google Sign-In
- **Provider**: Google OAuth 2.0
- **Supported Accounts**: Google Workspace (@samas.tech) + Gmail
- **Session Duration**: 7 days (refresh on activity)
- **Multi-Device**: Allowed, sync across devices

#### 6.1.2 First-Time User Flow
```
User clicks "Sign in with Google"
    ↓
Google OAuth consent screen
    ↓
Redirect back with credentials
    ↓
Check if user exists in Firestore
    ↓
[New User]                    [Existing User]
    ↓                              ↓
Create user document          Update lastLogin
Assign default role           Load permissions
Notify admins                 Redirect to dashboard
    ↓                              ↓
Onboarding wizard         ←────────┘
```

#### 6.1.3 Session & Presence
- Real-time online status (online/away/offline)
- Last seen timestamp
- Current activity indicator
- Session timeout: 30 minutes idle

### 6.2 Dashboard

#### 6.2.1 Super Admin Dashboard
- **Company Overview Cards**:
  - Total Active Projects (with trend)
  - Pending Expenses (count + amount)
  - Active Users Online
  - Tasks Due This Week
- **Quick Actions**: Create Project, Add User, View Reports
- **Activity Feed**: Recent system-wide activities
- **Alerts**: Overdue items, pending approvals

#### 6.2.2 Finance Manager Dashboard
- Pending Approval Queue
- Budget vs. Actual by Project
- Expense Trends Chart
- Recent Transactions
- Quick Export Buttons

#### 6.2.3 Project Manager Dashboard
- My Projects Overview
- Team Workload Distribution
- Upcoming Deadlines
- Recent Activity (own projects)
- Kanban Quick View

#### 6.2.4 Employee Dashboard
- My Tasks (Today/This Week)
- Recent Documents
- Team Activity
- Personal Stats
- Announcements

### 6.3 Finance Module

#### 6.3.1 Expense Management
**Create Expense**:
- Amount (required, decimal)
- Currency (default: USD)
- Category (dropdown: Travel, Equipment, Software, Services, Other)
- Project (optional, links expense to project)
- Description (required, 10-500 chars)
- Receipt Upload (required, max 10MB, jpg/png/pdf)
- Date (default: today, can backdate 30 days)

**Expense Statuses**:
```
[Draft] → [Submitted] → [Under Review] → [Approved/Rejected]
                              ↓
                    [Needs More Info] → [Resubmitted]
```

**Approval Workflow**:
1. Employee submits expense
2. Notification sent to Finance Manager
3. Finance Manager reviews:
   - Approve: Expense marked approved, employee notified
   - Reject: Reason required, employee notified
   - Request Info: Comment added, employee notified
4. Audit log created for all actions

#### 6.3.2 Budget Management
- Project-level budgets
- Category allocations
- Spend tracking (real-time)
- Alerts at 80%, 90%, 100% thresholds
- Budget vs. Actual reports

#### 6.3.3 Financial Reports
- Monthly Expense Summary
- Category Breakdown
- Project Cost Analysis
- Year-over-Year Comparison
- Export: PDF, Excel, CSV

#### 6.3.4 Sensitive Financial Data (Hidden from Project Managers)
- Profit margins
- Client billing rates
- Internal cost structures
- Salary information
- Contractor rates

### 6.4 Document Management

#### 6.4.1 Document Structure
```
/documents
├── /company              (Company-wide docs)
│   ├── /policies
│   ├── /templates
│   └── /forms
├── /projects
│   └── /{projectId}      (Project-scoped)
│       ├── /specs
│       ├── /contracts    (Sensitive - restricted)
│       ├── /deliverables
│       └── /assets
└── /personal
    └── /{userId}         (Personal workspace)
```

#### 6.4.2 File Operations
- **Upload**: Drag-drop, multi-file, max 50MB per file
- **Download**: Single file, bulk zip
- **Preview**: PDF, images, text, Office docs (via Google Docs viewer)
- **Share**: Internal users, external link with expiry
- **Version Control**: Automatic versioning, restore previous

#### 6.4.3 Access Control
- Inherit from folder or custom per file
- Access levels: View, Comment, Edit, Admin
- Share with: Users, Roles, Projects, External (link)
- Expiring access for sensitive docs

#### 6.4.4 Google Drive Integration
- Link existing Drive folders
- Two-way sync option
- Import from Drive
- Open in Google Docs/Sheets/Slides

### 6.5 Project Management

#### 6.5.1 Project Structure
```typescript
interface Project {
  id: string;
  name: string;
  code: string;              // e.g., "PRJ-001"
  description: string;
  status: ProjectStatus;
  
  // Team
  managerId: string;
  teamMembers: string[];
  
  // Timeline
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  
  // Budget (visible to manager)
  budget: number;
  spent: number;
  
  // Sensitive (hidden from manager)
  sensitiveData: {
    profitMargin: number;
    clientRate: number;
    internalCost: number;
  };
  
  // Integrations
  googleDriveFolderId?: string;
  googleCalendarId?: string;
  
  // Assets & Files
  assets: string[];          // Asset IDs
  documents: string[];       // Document IDs
}
```

#### 6.5.2 Project Statuses
- **Planning**: Initial setup, team assignment
- **Active**: In progress, tracking enabled
- **On Hold**: Paused, reason required
- **Completed**: Delivered, read-only
- **Archived**: Hidden from default views

#### 6.5.3 Milestones
- Name, description, due date
- Status: Pending, In Progress, Completed, Missed
- Dependencies (optional)
- Linked tasks
- Notifications on due/overdue

#### 6.5.4 Project Dashboard
- Progress overview (% complete)
- Timeline visualization
- Team workload
- Budget status
- Recent activity
- Upcoming milestones

### 6.6 Task Management (Trello-Style Kanban)

#### 6.6.1 Kanban Board
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   BACKLOG   │    TODO     │ IN PROGRESS │    DONE     │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │
│ │ Task 1  │ │ │ Task 2  │ │ │ Task 4  │ │ │ Task 6  │ │
│ │ 🔴 High │ │ │ 🟡 Med  │ │ │ @John   │ │ │ ✓ Done  │ │
│ │ Dec 25  │ │ │ Dec 28  │ │ │ 50%     │ │ │ Dec 20  │ │
│ └─────────┘ │ └─────────┘ │ └─────────┘ │ └─────────┘ │
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │             │
│ │ Task 3  │ │ │ Task 5  │ │ │ Task 7  │ │             │
│ │ 🟢 Low  │ │ │ 🔴 High │ │ │ @Jane   │ │             │
│ └─────────┘ │ └─────────┘ │ └─────────┘ │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### 6.6.2 Task Card Features
- **Header**: Title, Priority indicator, Labels
- **Body**: Description preview, Checklist progress
- **Footer**: Assignee avatar, Due date, Comment count, Attachment count
- **Quick Actions**: Drag to move, Click to open detail

#### 6.6.3 Task Detail Modal
```
┌─────────────────────────────────────────────────────────┐
│ Task: Implement User Authentication            [Close X]│
├─────────────────────────────────────────────────────────┤
│ Project: SaMas Portal    Status: In Progress            │
├─────────────────────────────────────────────────────────┤
│ Description:                                            │
│ Set up Firebase Auth with Google Sign-In...             │
├─────────────────────────────────────────────────────────┤
│ Checklist:                                    [Add Item]│
│ ☑ Configure Firebase project                            │
│ ☑ Set up Google OAuth                                   │
│ ☐ Create AuthContext                                    │
│ ☐ Build login page                                      │
├─────────────────────────────────────────────────────────┤
│ Assignee: @shahneela     Due: Jan 25, 2025              │
│ Priority: High 🔴        Labels: [Frontend] [Auth]      │
├─────────────────────────────────────────────────────────┤
│ Attachments:                                  [Add File]│
│ 📎 auth-flow.pdf    📎 wireframes.png                   │
├─────────────────────────────────────────────────────────┤
│ Activity & Comments:                                    │
│ ┌─────────────────────────────────────────────────────┐│
│ │ @shahneela: Started working on this         2h ago  ││
│ │ @bill: Please prioritize this task          5h ago  ││
│ └─────────────────────────────────────────────────────┘│
│ [Write a comment...                           ] [Send] │
└─────────────────────────────────────────────────────────┘
```

#### 6.6.4 Task Features
- **Drag & Drop**: Move between columns, reorder within column
- **Filters**: By assignee, priority, label, due date
- **Views**: Kanban, List, Calendar, Timeline
- **Bulk Actions**: Multi-select, bulk move, bulk assign
- **Keyboard Shortcuts**: 'n' new task, 'e' edit, arrow keys navigate

#### 6.6.5 Task Statuses (Customizable per Project)
Default columns:
1. **Backlog**: Not yet planned
2. **Todo**: Planned for current sprint
3. **In Progress**: Being worked on
4. **Review**: Awaiting review/approval
5. **Done**: Completed

#### 6.6.6 Labels & Categories
- Custom labels with colors
- Predefined: Bug, Feature, Enhancement, Documentation
- Filter by multiple labels
- Label management (admin/PM only)

### 6.7 Asset Management

#### 6.7.1 Asset Types
- **Hardware**: Laptops, Monitors, Phones, Peripherals
- **Software**: Licenses, Subscriptions
- **Equipment**: Office equipment, Tools
- **Vehicles**: Company vehicles
- **Other**: Custom types

#### 6.7.2 Asset Lifecycle
```
[Procurement] → [Available] → [Assigned] → [Maintenance] → [Retired]
                     ↑             ↓
                     └─────────────┘
```

#### 6.7.3 Project-Scoped Assets
- Assets can be assigned to projects
- Project managers see only their project's assets
- Transfer between projects (admin only)
- Asset utilization by project

#### 6.7.4 QR Code System
- Auto-generated QR for each asset
- Scan to view asset details
- Mobile-friendly asset lookup
- Print QR labels (batch)

#### 6.7.5 Maintenance Tracking
- Scheduled maintenance
- Maintenance history
- Cost tracking
- Vendor management

### 6.8 Announcements & Communication

#### 6.8.1 Announcement Types
- **Company-Wide**: All users
- **Department**: Specific roles
- **Project**: Project team only
- **Targeted**: Specific users

#### 6.8.2 Announcement Features
- Rich text editor (formatting, links, images)
- File attachments
- Schedule for future publish
- Pin important announcements
- Expiration date (auto-archive)
- Read receipts

#### 6.8.3 Notification Channels
- In-app notifications
- Push notifications (PWA)
- Email digest (configurable)

### 6.9 Online Activity & Presence

#### 6.9.1 Presence States
- 🟢 **Online**: Active in last 5 minutes
- 🟡 **Away**: Idle 5-30 minutes
- 🔴 **Busy**: Do not disturb (manual)
- ⚫ **Offline**: No activity 30+ minutes

#### 6.9.2 Activity Indicators
- Currently viewing (page/document)
- Currently editing (with live cursors in future)
- Last seen timestamp
- Current task (if shared)

#### 6.9.3 Activity Feed
- Real-time updates
- Filter by: Project, User, Action type
- Grouped by time (Today, Yesterday, This Week)

#### 6.9.4 Status Updates
- Custom status message
- Preset statuses: In a meeting, On vacation, Working remotely
- Auto-clear after duration
- Visible in team views

---

## 7. Google Workspace Integration

### 7.1 Google Drive Integration

#### 7.1.1 Features
- **Link Folders**: Connect existing Drive folders to projects
- **Sync Documents**: Two-way sync between portal and Drive
- **Preview**: View Google Docs/Sheets/Slides inline
- **Edit**: Open in Google editor, changes sync back
- **Import**: Bulk import from Drive

#### 7.1.2 Permission Mapping
| Portal Permission | Google Drive Permission |
|-------------------|------------------------|
| View | Reader |
| Comment | Commenter |
| Edit | Writer |
| Admin | Owner |

#### 7.1.3 Folder Structure
```
SaMas Portal (Shared Drive)
├── Company Documents/
│   ├── Policies/
│   └── Templates/
└── Projects/
    ├── PRJ-001-Alpha/
    │   ├── Specifications/
    │   ├── Contracts/
    │   └── Deliverables/
    └── PRJ-002-Beta/
```

### 7.2 Google Calendar Integration

#### 7.2.1 Features
- **Project Calendars**: Each project has linked calendar
- **Milestone Sync**: Milestones appear as calendar events
- **Task Deadlines**: Due dates sync to calendar
- **Meeting Scheduling**: Create events from portal
- **Availability**: View team availability

#### 7.2.2 Event Types
- 📅 Milestone Due
- ✅ Task Deadline
- 📞 Meeting
- 📋 Review
- 🎉 Project Event

#### 7.2.3 Calendar Views
- Personal calendar (my events)
- Project calendar (project events)
- Team calendar (team availability)

### 7.3 Google Meet Integration

#### 7.3.1 Features
- **Quick Meet**: Generate instant meeting link
- **Scheduled Meets**: Create from calendar
- **Task Discussions**: Start meet from task
- **Project Meetings**: Recurring project syncs
- **Meet History**: Track meeting notes/recordings

#### 7.3.2 Meeting Flow
```
Click "Start Meet" on Task
    ↓
Generate Meet link
    ↓
Optionally invite team members
    ↓
Open Meet in new tab
    ↓
After meeting:
    - Add notes to task
    - Record action items
    - Update task status
```

### 7.4 Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SaMas Portal                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Drive     │  │  Calendar   │  │    Meet     │         │
│  │  Service    │  │  Service    │  │  Service    │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                 Google Workspace APIs                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Drive API  │  │Calendar API │  │  Meet API   │         │
│  │   v3        │  │    v3       │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. User Experience Requirements

### 8.1 Design Principles
1. **Clarity**: Clear visual hierarchy, obvious actions
2. **Efficiency**: Minimum clicks to complete tasks
3. **Consistency**: Same patterns throughout
4. **Feedback**: Instant response to all actions
5. **Accessibility**: WCAG 2.1 AA compliance

### 8.2 Responsive Breakpoints
| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, bottom nav |
| Tablet | 640-1024px | Two column, collapsible sidebar |
| Desktop | > 1024px | Full layout, fixed sidebar |

### 8.3 Navigation Structure

#### Desktop
```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 SaMas Portal          🔍 Search...    🔔 👤 Settings    │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│ 📊 Dashboard│                                               │
│ 💰 Finance │              Main Content Area                 │
│ 📁 Documents│                                               │
│ 📋 Projects │                                               │
│ ✅ Tasks   │                                                │
│ 🖥️ Assets  │                                                │
│ 📢 News    │                                                │
│ ─────────  │                                                │
│ ⚙️ Admin   │                                                │
│            │                                                │
└────────────┴────────────────────────────────────────────────┘
```

#### Mobile
```
┌─────────────────────┐
│ ≡  SaMas Portal  🔔 │
├─────────────────────┤
│                     │
│   Main Content      │
│                     │
│                     │
│                     │
├─────────────────────┤
│ 🏠  📋  ✅  📁  ⋯  │
└─────────────────────┘
```

### 8.4 Color System

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | #2563eb | Buttons, links, active states |
| Secondary | #7c3aed | Accents, secondary actions |
| Success | #10b981 | Positive actions, confirmations |
| Warning | #f59e0b | Cautions, pending states |
| Danger | #ef4444 | Errors, destructive actions |
| Neutral | #64748b | Text, borders, backgrounds |

### 8.5 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Inter | 30px | Bold |
| H2 | Inter | 24px | Semibold |
| H3 | Inter | 20px | Semibold |
| Body | Inter | 16px | Regular |
| Small | Inter | 14px | Regular |
| Caption | Inter | 12px | Regular |

### 8.6 Component Library
- Buttons (Primary, Secondary, Ghost, Danger)
- Inputs (Text, Select, Checkbox, Radio, Date)
- Cards (Basic, Interactive, Stat)
- Tables (Sortable, Filterable, Selectable)
- Modals (Dialog, Drawer, Full-screen)
- Notifications (Toast, Banner, Alert)
- Navigation (Sidebar, Tabs, Breadcrumbs)

---

## 9. Non-Functional Requirements

### 9.1 Performance
| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3.0s |
| API Response Time | < 500ms |
| Real-time Update Latency | < 100ms |
| Lighthouse Performance Score | > 90 |

### 9.2 Scalability
- Support 100 concurrent users
- Handle 10,000 documents
- Store 5 years of transaction history
- 99.9% uptime SLA

### 9.3 Security
- HTTPS only (TLS 1.3)
- Firebase Security Rules
- Input validation & sanitization
- XSS prevention
- CSRF protection
- Rate limiting
- Audit logging

### 9.4 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast ≥ 4.5:1
- Focus indicators
- Alt text for images

### 9.5 Browser Support
| Browser | Minimum Version |
|---------|-----------------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |

### 9.6 PWA Requirements
- Installable on iOS/Android
- Offline functionality (view cached data)
- Push notifications
- App-like experience
- Home screen icon
- Splash screen

---

## 10. Success Metrics

### 10.1 Adoption Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Active Users | 100% employees | Analytics |
| Feature Adoption | 80% using 3+ modules | Usage tracking |
| Mobile Installs | 50% of users | Install events |

### 10.2 Efficiency Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| Document Search Time | 15 min | 30 sec |
| Expense Approval Time | 2 weeks | 48 hours |
| Task Status Update | Manual | Real-time |

### 10.3 Quality Metrics
| Metric | Target |
|--------|--------|
| System Uptime | 99.9% |
| Error Rate | < 0.1% |
| User Satisfaction | > 4.5/5 |
| Support Tickets | < 5/week |

---

## 10.5 Custom Fields System (Enterprise Feature)

### 10.5.1 Overview
A flexible metadata system allowing administrators to define custom fields for tasks and other entities, inspired by enterprise tools like Jira, Asana, and ServiceNow.

### 10.5.2 Custom Field Types
| Type | Description | Example |
|------|-------------|---------|
| **text** | Free text input | Goal, Notes |
| **number** | Numeric values with precision | Estimated Hours |
| **enum** | Single-select dropdown | Task Type, Priority |
| **multi_enum** | Multi-select tags | Labels, Categories |
| **date** | Date/datetime picker | Due Date, Completion Date |
| **person** | User reference | Assignee, Reviewer |
| **checkbox** | Boolean toggle | Is Blocked, Requires Approval |
| **url** | URL with validation | External Link |

### 10.5.3 Field Scopes
- **Global**: Available across all projects, managed by admin
- **Project-scoped**: Available only in specific project, managed by project manager

### 10.5.4 Core Task Extensions
Built-in fields added to Task entity:
- `taskType`: growth | experimentation | operational | maintenance | bug | feature
- `category`: seo | marketing | engineering | design | content | analytics | other
- `phase`: Project phase identifier
- `sprint`: Sprint/week identifier
- `goal`: Task goal description
- `acceptanceCriteria`: Completion criteria
- `successMetrics`: How to measure success
- `notes`: Additional context
- `completionDate`: When task was completed
- `externalId`: Reference to external system (CSV import, Jira, etc.)

### 10.5.5 Admin UI
- Create/edit/delete custom field definitions
- Set required vs optional fields
- Define default values
- Configure dropdown options for enum types
- Reorder fields
- Enable/disable fields without deletion

### 10.5.6 Data Import
Support for importing tasks from external sources:
- CSV import with field mapping
- Automatic creation of custom fields for unmapped columns
- Source system tracking for audit

---

## 11. Out of Scope

### 11.1 Version 1.0 Exclusions
- Multi-language support
- Advanced BI/Analytics dashboard
- Slack/Teams integration
- Custom branding per tenant
- Native mobile apps (using PWA)
- Time tracking
- Invoicing/Billing
- CRM features
- HR/Payroll integration

### 11.2 Future Considerations (v2.0+)
- AI-powered insights
- Automated workflows
- Third-party integrations marketplace
- White-label solution
- Advanced reporting builder

---

## 12. Appendix

### 12.1 Glossary
| Term | Definition |
|------|------------|
| RBAC | Role-Based Access Control |
| PWA | Progressive Web App |
| FCM | Firebase Cloud Messaging |
| CRUD | Create, Read, Update, Delete |

### 12.2 References
- Firebase Documentation: https://firebase.google.com/docs
- Google Workspace APIs: https://developers.google.com/workspace
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Tailwind CSS: https://tailwindcss.com/docs

### 12.3 Revision History
| Date | Version | Changes |
|------|---------|---------|
| 2025-01-24 | 1.0 | Initial document |
| 2025-01-24 | 1.1 | Added Google integrations, Kanban, presence features |
| 2025-01-25 | 1.2 | Added Custom Fields System (Section 10.5), task extensions |
