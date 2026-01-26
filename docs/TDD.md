# Technical Design Document (TDD)
## SaMas IT Services Portal v1.0

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-24 | System | Initial TDD |
| 1.1 | 2025-01-24 | System | Added Google APIs, Kanban, Presence |
| 1.2 | 2025-01-25 | System | Added Custom Fields System, Extended Task Interface |
| 1.3 | 2025-01-25 | System | Added Cloud Storage CORS Configuration (Section 10.2) |
| 1.4 | 2025-01-25 | System | Updated RBAC system with new roles (superuser, project_manager, qa_manager, analyst, finance_incharge) |

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Database Design](#3-database-design)
4. [API Design](#4-api-design)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Google Workspace Integration](#6-google-workspace-integration)
7. [Real-Time Features](#7-real-time-features)
8. [Frontend Architecture](#8-frontend-architecture)
9. [PWA Implementation](#9-pwa-implementation)
10. [Security Design](#10-security-design)
11. [Testing Strategy](#11-testing-strategy)
12. [Deployment Architecture](#12-deployment-architecture)
13. [Monitoring & Logging](#13-monitoring--logging)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐       │
│  │   Web Browser     │  │    PWA Mobile     │  │    PWA Desktop    │       │
│  │   (React SPA)     │  │   (Installed)     │  │   (Installed)     │       │
│  └─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘       │
└────────────┼────────────────────────┼────────────────────────┼──────────────┘
             │                        │                        │
             └────────────────────────┼────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FIREBASE HOSTING                                   │
│                    (CDN, SSL, Custom Domain)                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FIREBASE SERVICES                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Firestore  │  │   Storage   │  │    Auth     │  │    FCM      │        │
│  │  (Database) │  │   (Files)   │  │  (Google)   │  │   (Push)    │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐        │
│  │                    Cloud Functions                              │        │
│  │  (Triggers, Scheduled Jobs, API Endpoints)                     │        │
│  └────────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GOOGLE WORKSPACE APIs                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │
│  │  Drive API  │  │ Calendar API│  │   Admin SDK │                         │
│  │    v3       │  │     v3      │  │             │                         │
│  └─────────────┘  └─────────────┘  └─────────────┘                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REACT APPLICATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         ROUTING LAYER                                │   │
│  │  React Router v6 (Protected Routes, Lazy Loading)                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────┼─────────────────────────────────┐     │
│  │                         CONTEXT LAYER                              │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│     │
│  │  │  Auth    │ │  Theme   │ │ Presence │ │  Toast   │ │  Modal   ││     │
│  │  │ Context  │ │ Context  │ │ Context  │ │ Context  │ │ Context  ││     │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘│     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                    │                                        │
│  ┌─────────────────────────────────┼─────────────────────────────────┐     │
│  │                          HOOK LAYER                                │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │     │
│  │  │ useAuth  │ │usePermis-│ │useFirestore│ │useGoogle │             │     │
│  │  │          │ │  sions   │ │          │ │  APIs    │             │     │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘             │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │     │
│  │  │useExpenses│ │useTasks │ │useProjects│ │usePresence│             │     │
│  │  │          │ │          │ │          │ │          │             │     │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘             │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                    │                                        │
│  ┌─────────────────────────────────┼─────────────────────────────────┐     │
│  │                        SERVICE LAYER                               │     │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │     │
│  │  │   Firebase   │ │   Google     │ │   Storage    │               │     │
│  │  │   Services   │ │   Services   │ │   Services   │               │     │
│  │  └──────────────┘ └──────────────┘ └──────────────┘               │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                    │                                        │
│  ┌─────────────────────────────────┼─────────────────────────────────┐     │
│  │                      COMPONENT LAYER                               │     │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │     │
│  │  │   UI   │ │ Layout │ │ Forms  │ │ Charts │ │ Modals │          │     │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘          │     │
│  │  ┌────────────────────────────────────────────────────┐          │     │
│  │  │              Module Components                      │          │     │
│  │  │  Finance | Documents | Projects | Tasks | Assets   │          │     │
│  │  └────────────────────────────────────────────────────┘          │     │
│  └───────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | React | 18.x | UI library |
| Language | TypeScript | 5.x | Type safety |
| Build Tool | Vite | 5.x | Fast builds, HMR |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| UI Components | shadcn/ui | latest | Accessible components |
| State (Server) | TanStack Query | 5.x | Server state management |
| State (Client) | Zustand | 4.x | Client state |
| Forms | React Hook Form | 7.x | Form handling |
| Validation | Zod | 3.x | Schema validation |
| Routing | React Router | 6.x | Navigation |
| Date Handling | date-fns | 3.x | Date utilities |
| Icons | Lucide React | latest | Icon library |
| Rich Text | TipTap | 2.x | Rich text editor |
| DnD | @dnd-kit | 6.x | Drag and drop |
| Charts | Recharts | 2.x | Data visualization |
| PDF Export | jsPDF | 2.x | PDF generation |
| Excel Export | SheetJS | 0.18.x | Excel generation |
| QR Codes | qrcode | 1.x | QR generation |

### 2.2 Backend (Firebase)

| Service | Purpose |
|---------|---------|
| Firebase Auth | Authentication (Google OAuth) |
| Cloud Firestore | NoSQL database |
| Cloud Storage | File storage |
| Cloud Functions | Server-side logic |
| Firebase Hosting | Web hosting with CDN |
| Firebase Cloud Messaging | Push notifications |

### 2.3 Google APIs

| API | Version | Purpose |
|-----|---------|---------|
| Google Drive API | v3 | Document integration |
| Google Calendar API | v3 | Calendar integration |
| Google Meet | - | Video conferencing links |
| Google Identity | - | OAuth & user info |

### 2.4 Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Prettier | Code formatting |
| Vitest | Unit testing |
| Playwright | E2E testing |
| GitHub Actions | CI/CD |
| Firebase Emulators | Local development |

---

## 3. Database Design

### 3.1 Firestore Collections Overview

```
firestore/
├── users/                    # User profiles
├── roles/                    # Role definitions
├── projects/                 # Project data
│   └── {projectId}/
│       ├── sensitiveData/    # Subcollection (restricted)
│       ├── assets/           # Project-scoped assets
│       └── activities/       # Project activity log
├── tasks/                    # Task records
├── expenses/                 # Expense records
├── documents/                # Document metadata
├── assets/                   # Global assets
├── announcements/            # Announcements
├── auditLogs/               # System audit logs
└── presence/                 # User presence data
```

### 3.2 Collection Schemas

#### users
```typescript
/**
 * User Document
 * See docs/rbac.md for role definitions
 */
interface User {
  id: string;                          // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL: string;
  role: string;                        // Single role: 'superuser' | 'project_manager' | 'qa_manager' | 'analyst' | 'finance_incharge'
  projects: string[];                  // Array of projectIds user is member of
  isActive: boolean;
  
  // Presence
  status: 'online' | 'away' | 'busy' | 'offline';
  statusMessage: string;
  lastSeen: Timestamp;
  currentPage: string;                 // Current location in app
  
  // Google Integration
  googleTokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Timestamp;
  };
  
  // Preferences
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      desktop: boolean;
    };
    emailDigest: 'none' | 'daily' | 'weekly';
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin: Timestamp;
}
```

#### roles
```typescript
/**
 * RBAC Role Definitions
 * See docs/rbac.md for complete specification
 *
 * Available roles:
 * - superuser: Full system access, RBAC management
 * - project_manager: Manage assigned projects
 * - qa_manager: QA lead with announcement creation
 * - analyst: Standard team member
 * - finance_incharge: Finance team with global finance access
 */
interface Role {
  id: string;                          // e.g., "superuser", "project_manager"
  name: string;
  description: string;
  isSystem: boolean;                   // Cannot be deleted

  permissions: {
    finance: Permission;
    documents: Permission;
    projects: Permission;
    assets: Permission;
    tasks: Permission;
    announcements: Permission;
    rbac: Permission;
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Permission {
  actions: string[];                   // ['create', 'read', 'update', 'delete']
  scope: string;                       // 'global' | 'project' | 'own' | 'none'
}
```

#### projects
```typescript
interface Project {
  id: string;
  code: string;                        // e.g., "PRJ-001"
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  
  // Team
  managerId: string;                   // User ID of project manager
  teamMembers: string[];               // User IDs
  
  // Timeline
  startDate: Timestamp;
  endDate: Timestamp;
  milestones: Milestone[];
  
  // Budget (visible to project manager)
  budget: {
    total: number;
    spent: number;
    currency: string;
  };
  
  // Google Integration
  integrations: {
    googleDriveFolderId?: string;
    googleCalendarId?: string;
  };
  
  // Settings
  settings: {
    taskStatuses: string[];            // Custom Kanban columns
    labels: Label[];
    isPublic: boolean;                 // Visible to external viewers
  };
  
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Subcollection: projects/{projectId}/sensitiveData
interface ProjectSensitiveData {
  profitMargin: number;                // Percentage
  clientBillingRate: number;           // Per hour
  internalCostRate: number;            // Per hour
  contractValue: number;
  paymentTerms: string;
  notes: string;                       // Internal notes
  updatedBy: string;
  updatedAt: Timestamp;
}

// Subcollection: projects/{projectId}/assets
interface ProjectAsset {
  assetId: string;                     // Reference to global asset
  assignedAt: Timestamp;
  assignedBy: string;
  notes: string;
}

// Subcollection: projects/{projectId}/activities
interface ProjectActivity {
  id: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  timestamp: Timestamp;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  status: 'pending' | 'in_progress' | 'completed' | 'missed';
  completedAt?: Timestamp;
  linkedTasks: string[];
}

interface Label {
  id: string;
  name: string;
  color: string;
}
```

#### customFieldDefinitions (v1.2)
```typescript
/**
 * Custom Field Definitions - Enterprise metadata system
 * Allows administrators to define custom fields for tasks.
 * Inspired by Jira, Asana, and ServiceNow custom field systems.
 */

// Supported field types
type CustomFieldType =
  | 'text'        // Free text input
  | 'number'      // Numeric values with precision
  | 'enum'        // Single-select dropdown
  | 'multi_enum'  // Multi-select tags
  | 'date'        // Date/datetime picker
  | 'person'      // User reference (picker)
  | 'checkbox'    // Boolean toggle
  | 'url';        // URL with validation

// Field value can be multiple types based on field definition
type CustomFieldValue =
  | string                                    // text, enum, url
  | number                                    // number
  | boolean                                   // checkbox
  | string[]                                  // multi_enum
  | { date: string; time?: string }           // date/datetime
  | { userId: string; displayName: string };  // person reference

interface CustomFieldDefinition {
  id: string;
  name: string;                          // Display name (e.g., "Task Type")
  key: string;                           // Machine key (e.g., "taskType")
  description?: string;                  // Help text for users
  type: CustomFieldType;

  // For enum/multi_enum types
  options?: CustomFieldOption[];

  // Validation
  required: boolean;
  defaultValue?: CustomFieldValue;

  // Scope
  projectId?: string | null;             // null = global, string = project-scoped

  // Display
  order: number;                         // Sort order in forms
  section?: string;                      // Group fields into sections
  placeholder?: string;

  // State
  enabled: boolean;

  // Audit
  createdBy: string;
  createdAt: Timestamp;
  updatedBy?: string;
  updatedAt: Timestamp;
}

interface CustomFieldOption {
  value: string;
  label: string;
  color?: string;                        // For visual indicators
  order: number;
}
```

#### tasks
```typescript
// Controlled vocabularies for task categorization
type TaskType = 'growth' | 'experimentation' | 'operational' | 'maintenance' | 'bug' | 'feature';
type TaskCategory = 'seo' | 'marketing' | 'engineering' | 'design' | 'content' | 'analytics' | 'other';

interface Task {
  id: string;
  projectId: string;                   // Required - tasks are project-scoped

  // Content
  title: string;
  description: string;

  // Status (Kanban)
  status: string;                      // Matches project.settings.taskStatuses
  statusOrder: number;                 // Order within column

  // Assignment
  assignedTo: string[];                // Can have multiple assignees
  assignedBy: string;

  // Priority & Labels
  priority: 'low' | 'medium' | 'high' | 'critical';
  labels: string[];                    // Label IDs

  // Timeline
  dueDate?: Timestamp;
  startDate?: Timestamp;
  completedAt?: Timestamp;

  // === NEW: Lifecycle (v1.2) ===
  completionDate?: Timestamp | null;   // User-defined completion date (from imports)
  actualCompletionDate?: Timestamp;    // System-recorded actual completion

  // === NEW: Categorization (v1.2) ===
  taskType?: TaskType;                 // growth, experimentation, operational, etc.
  category?: TaskCategory;             // seo, marketing, engineering, etc.
  phase?: string;                      // Project phase (e.g., "Search & Discovery")
  sprint?: string;                     // Sprint/week identifier (e.g., "Week 1")

  // === NEW: Goals & Criteria (v1.2) ===
  goal?: string;                       // What this task aims to achieve
  acceptanceCriteria?: string;         // How to know task is complete
  successMetrics?: string;             // How to measure performance

  // === NEW: Additional Context (v1.2) ===
  notes?: string;                      // General notes

  // === NEW: External Integration (v1.2) ===
  externalId?: string;                 // Task # from external system (CSV, Jira)
  externalUrl?: string;                // Link to external ticket
  sourceSystem?: string;               // "csv_import", "jira", "asana", etc.

  // === NEW: Custom Fields (v1.2) ===
  customFields?: Record<string, CustomFieldValue>;  // Dynamic custom fields

  // Checklist
  checklist: ChecklistItem[];

  // Attachments
  attachments: Attachment[];

  // Dependencies
  dependencies: string[];              // Task IDs that must complete first

  // Time tracking
  estimatedHours?: number;
  actualHours?: number;

  // Comments stored in subcollection
  commentCount: number;

  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Subcollection: tasks/{taskId}/comments
interface TaskComment {
  id: string;
  userId: string;
  content: string;
  mentions: string[];                  // User IDs mentioned
  attachments: Attachment[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: Timestamp;
  completedBy?: string;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Timestamp;
}
```

#### expenses
```typescript
interface Expense {
  id: string;
  userId: string;
  projectId?: string;                  // Optional - can be company expense
  
  // Amount
  amount: number;
  currency: string;
  
  // Details
  category: string;
  description: string;
  expenseDate: Timestamp;
  
  // Receipt
  receiptURL: string;
  receiptPath: string;                 // Storage path
  
  // Workflow
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'needs_info';
  
  // Approval
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  rejectionReason?: string;
  comments: ExpenseComment[];
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ExpenseComment {
  id: string;
  userId: string;
  content: string;
  createdAt: Timestamp;
}
```

#### documents
```typescript
interface Document {
  id: string;
  
  // Location
  projectId?: string;                  // null = company document
  folderId?: string;                   // Parent folder
  
  // File info
  name: string;
  path: string;                        // Storage path
  mimeType: string;
  size: number;
  
  // Metadata
  category: 'policy' | 'template' | 'form' | 'contract' | 'spec' | 'deliverable' | 'other';
  tags: string[];
  description?: string;
  
  // Versioning
  version: number;
  versions: DocumentVersion[];
  
  // Access control
  accessLevel: 'private' | 'project' | 'company' | 'public';
  accessList: string[];                // Specific user IDs
  
  // Google Drive link
  googleDriveFileId?: string;
  
  // Sensitivity
  isSensitive: boolean;                // Hidden from non-privileged users
  
  uploadedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface DocumentVersion {
  version: number;
  path: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Timestamp;
  notes?: string;
}
```

#### assets
```typescript
interface Asset {
  id: string;
  
  // Details
  name: string;
  type: 'laptop' | 'phone' | 'monitor' | 'license' | 'equipment' | 'vehicle' | 'other';
  category: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  
  // Status
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  
  // Assignment
  assignedTo?: string;                 // User ID
  assignedToProject?: string;          // Project ID
  assignedAt?: Timestamp;
  assignmentHistory: AssetAssignment[];
  
  // Financial
  purchaseDate: Timestamp;
  purchasePrice: number;
  currentValue: number;
  depreciationRate: number;            // Annual percentage
  
  // Maintenance
  lastMaintenance?: Timestamp;
  nextMaintenance?: Timestamp;
  maintenanceHistory: MaintenanceRecord[];
  
  // QR Code
  qrCodeURL: string;
  
  // Images
  images: string[];                    // Storage URLs
  
  notes: string;
  
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface AssetAssignment {
  userId?: string;
  projectId?: string;
  assignedBy: string;
  assignedAt: Timestamp;
  returnedAt?: Timestamp;
  notes?: string;
}

interface MaintenanceRecord {
  id: string;
  date: Timestamp;
  type: string;
  description: string;
  cost: number;
  performedBy: string;
}
```

#### announcements
```typescript
interface Announcement {
  id: string;
  
  // Content
  title: string;
  content: string;                     // HTML from rich text editor
  excerpt: string;                     // Plain text preview
  
  // Targeting
  targetType: 'all' | 'role' | 'project' | 'users';
  targetRoles?: string[];
  targetProjects?: string[];
  targetUsers?: string[];
  
  // Media
  coverImage?: string;
  attachments: Attachment[];
  
  // Settings
  category: 'general' | 'hr' | 'it' | 'finance' | 'urgent';
  isPinned: boolean;
  priority: 'normal' | 'high' | 'urgent';
  
  // Schedule
  publishedAt: Timestamp;
  expiresAt?: Timestamp;
  
  // Tracking
  readBy: string[];                    // User IDs
  readCount: number;
  
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### presence
```typescript
interface Presence {
  id: string;                          // User ID
  
  status: 'online' | 'away' | 'busy' | 'offline';
  statusMessage?: string;
  statusEmoji?: string;
  statusExpiry?: Timestamp;
  
  lastSeen: Timestamp;
  currentPage: string;
  currentProject?: string;
  currentTask?: string;
  
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
  };
  
  // Heartbeat updated every 30 seconds
  heartbeat: Timestamp;
}
```

#### auditLogs
```typescript
interface AuditLog {
  id: string;
  
  userId: string;
  userEmail: string;
  
  action: string;                      // e.g., 'expense.approve'
  module: string;                      // e.g., 'finance'
  resourceType: string;                // e.g., 'expense'
  resourceId: string;
  
  // Changes
  before?: Record<string, any>;
  after?: Record<string, any>;
  
  // Context
  ipAddress?: string;
  userAgent?: string;
  
  timestamp: Timestamp;
}
```

### 3.3 Firestore Indexes

```json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "statusOrder", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assignedTo", "arrayConfig": "CONTAINS" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "documents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "folderId", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "announcements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isPinned", "order": "DESCENDING" },
        { "fieldPath": "publishedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "auditLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "module", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "presence",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "heartbeat", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 4. API Design

### 4.1 Service Layer Structure

```
src/services/
├── firebase/
│   ├── config.ts              # Firebase initialization
│   ├── auth.ts                # Authentication service
│   └── storage.ts             # File upload/download
├── google/
│   ├── config.ts              # Google API initialization
│   ├── drive.ts               # Drive operations
│   ├── calendar.ts            # Calendar operations
│   └── meet.ts                # Meet link generation
└── api/
    ├── users.ts               # User CRUD
    ├── roles.ts               # Role management
    ├── projects.ts            # Project operations
    ├── tasks.ts               # Task operations
    ├── expenses.ts            # Expense operations
    ├── documents.ts           # Document operations
    ├── assets.ts              # Asset operations
    ├── announcements.ts       # Announcement operations
    ├── presence.ts            # Presence management
    └── auditLogs.ts           # Audit logging
```

### 4.2 API Patterns

#### Standard CRUD Service
```typescript
// src/services/api/base.ts
export interface BaseService<T, CreateDTO, UpdateDTO> {
  getById(id: string): Promise<T | null>;
  getAll(filters?: QueryFilters): Promise<T[]>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<void>;
}

// src/services/api/tasks.ts
export const tasksService = {
  // Get tasks for a project
  getProjectTasks: async (projectId: string): Promise<Task[]> => {
    const q = query(
      collection(db, 'tasks'),
      where('projectId', '==', projectId),
      orderBy('statusOrder', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  },

  // Get tasks by status (for Kanban column)
  getTasksByStatus: async (projectId: string, status: string): Promise<Task[]> => {
    const q = query(
      collection(db, 'tasks'),
      where('projectId', '==', projectId),
      where('status', '==', status),
      orderBy('statusOrder', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  },

  // Update task status (Kanban drag)
  updateTaskStatus: async (
    taskId: string, 
    newStatus: string, 
    newOrder: number
  ): Promise<void> => {
    await updateDoc(doc(db, 'tasks', taskId), {
      status: newStatus,
      statusOrder: newOrder,
      updatedAt: serverTimestamp()
    });
  },

  // Reorder tasks in column
  reorderTasks: async (taskIds: string[], startOrder: number): Promise<void> => {
    const batch = writeBatch(db);
    taskIds.forEach((taskId, index) => {
      batch.update(doc(db, 'tasks', taskId), {
        statusOrder: startOrder + index,
        updatedAt: serverTimestamp()
      });
    });
    await batch.commit();
  }
};
```

### 4.3 React Query Keys

```typescript
// src/services/queryKeys.ts
export const queryKeys = {
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: UserFilters) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    presence: () => [...queryKeys.users.all, 'presence'] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: ProjectFilters) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    sensitive: (id: string) => [...queryKeys.projects.detail(id), 'sensitive'] as const,
    activities: (id: string) => [...queryKeys.projects.detail(id), 'activities'] as const,
  },

  // Tasks
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    byProject: (projectId: string) => [...queryKeys.tasks.lists(), { projectId }] as const,
    byStatus: (projectId: string, status: string) => 
      [...queryKeys.tasks.byProject(projectId), { status }] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
    comments: (taskId: string) => [...queryKeys.tasks.detail(taskId), 'comments'] as const,
  },

  // ... similar for other modules
};
```

---

## 5. Authentication & Authorization

### 5.1 Authentication Flow

```typescript
// src/contexts/AuthContext.tsx
export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get or create user document
        const userDoc = await getOrCreateUser(firebaseUser);
        setUser(userDoc);
        
        // Update last login
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastLogin: serverTimestamp()
        });
        
        // Set up presence
        await updatePresence(firebaseUser.uid, 'online');
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive');
    provider.addScope('https://www.googleapis.com/auth/calendar');
    
    const result = await signInWithPopup(auth, provider);
    
    // Store Google tokens for API access
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      await storeGoogleTokens(result.user.uid, credential);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 5.2 Permission System

```typescript
// src/hooks/usePermissions.ts
export const usePermissions = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);

  // Load user's roles
  useEffect(() => {
    if (user?.roles) {
      loadRoles(user.roles).then(setRoles);
    }
  }, [user?.roles]);

  const hasPermission = useCallback((module: Module, action: Action): boolean => {
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.roles.includes('super_admin')) return true;
    
    // Check each role for permission
    return roles.some(role => role.permissions[module]?.[action] === true);
  }, [user, roles]);

  const canAccessProject = useCallback((projectId: string): boolean => {
    if (!user) return false;
    if (user.roles.includes('super_admin')) return true;
    if (user.roles.includes('finance_manager')) return true; // Read-only access
    
    // Project manager or member
    return user.managedProjects.includes(projectId) || 
           user.memberProjects.includes(projectId);
  }, [user]);

  const canAccessSensitiveData = useCallback((): boolean => {
    if (!user) return false;
    
    // Only super admin and finance manager can see sensitive data
    return user.roles.includes('super_admin') || 
           user.roles.includes('finance_manager');
  }, [user]);

  const canManageProject = useCallback((projectId: string): boolean => {
    if (!user) return false;
    if (user.roles.includes('super_admin')) return true;
    
    // Only project manager can manage
    return user.managedProjects.includes(projectId);
  }, [user]);

  return {
    hasPermission,
    canAccessProject,
    canAccessSensitiveData,
    canManageProject,
    isSuperAdmin: () => user?.roles.includes('super_admin') ?? false,
    isFinanceManager: () => user?.roles.includes('finance_manager') ?? false,
    isProjectManager: () => user?.roles.includes('project_manager') ?? false,
  };
};
```

### 5.3 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ========== Helper Functions ==========
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isSuperAdmin() {
      return isAuthenticated() && 
             getUserData().roles.hasAny(['super_admin']);
    }
    
    function isFinanceManager() {
      return isAuthenticated() && 
             getUserData().roles.hasAny(['finance_manager', 'super_admin']);
    }
    
    function isProjectManager() {
      return isAuthenticated() && 
             getUserData().roles.hasAny(['project_manager', 'super_admin']);
    }
    
    function canAccessProject(projectId) {
      let userData = getUserData();
      return isSuperAdmin() ||
             userData.roles.hasAny(['finance_manager']) ||
             userData.managedProjects.hasAny([projectId]) ||
             userData.memberProjects.hasAny([projectId]);
    }
    
    function isProjectMember(projectId) {
      let userData = getUserData();
      return userData.managedProjects.hasAny([projectId]) ||
             userData.memberProjects.hasAny([projectId]);
    }
    
    function isProjectOwner(projectId) {
      let userData = getUserData();
      return isSuperAdmin() || userData.managedProjects.hasAny([projectId]);
    }
    
    // ========== Users Collection ==========
    
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isSuperAdmin() || 
                       (request.auth.uid == userId && 
                        !request.resource.data.diff(resource.data).affectedKeys()
                          .hasAny(['roles', 'managedProjects', 'memberProjects']));
      allow delete: if isSuperAdmin();
    }
    
    // ========== Roles Collection ==========
    
    match /roles/{roleId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }
    
    // ========== Projects Collection ==========
    
    match /projects/{projectId} {
      allow read: if canAccessProject(projectId);
      allow create: if isProjectManager();
      allow update: if isProjectOwner(projectId);
      allow delete: if isSuperAdmin();
      
      // Sensitive data subcollection - RESTRICTED
      match /sensitiveData/{docId} {
        allow read: if isSuperAdmin() || isFinanceManager();
        allow write: if isSuperAdmin() || isFinanceManager();
      }
      
      // Project assets subcollection
      match /assets/{assetId} {
        allow read: if canAccessProject(projectId);
        allow write: if isProjectOwner(projectId);
      }
      
      // Project activities subcollection
      match /activities/{activityId} {
        allow read: if canAccessProject(projectId);
        allow create: if isProjectMember(projectId);
        allow update, delete: if false; // Activities are immutable
      }
    }
    
    // ========== Tasks Collection ==========
    
    match /tasks/{taskId} {
      allow read: if isAuthenticated() && 
                    (isSuperAdmin() || 
                     canAccessProject(resource.data.projectId));
      
      allow create: if isAuthenticated() && 
                       canAccessProject(request.resource.data.projectId) &&
                       isProjectOwner(request.resource.data.projectId);
      
      allow update: if isAuthenticated() && 
                       canAccessProject(resource.data.projectId) &&
                       (isProjectOwner(resource.data.projectId) ||
                        resource.data.assignedTo.hasAny([request.auth.uid]));
      
      allow delete: if isProjectOwner(resource.data.projectId);
      
      // Task comments
      match /comments/{commentId} {
        allow read: if canAccessProject(get(/databases/$(database)/documents/tasks/$(taskId)).data.projectId);
        allow create: if canAccessProject(get(/databases/$(database)/documents/tasks/$(taskId)).data.projectId);
        allow update: if request.auth.uid == resource.data.userId;
        allow delete: if isSuperAdmin() || request.auth.uid == resource.data.userId;
      }
    }
    
    // ========== Expenses Collection ==========
    
    match /expenses/{expenseId} {
      // Users can read own expenses, finance can read all
      allow read: if isAuthenticated() && 
                    (isFinanceManager() || 
                     resource.data.userId == request.auth.uid ||
                     (resource.data.projectId != null && 
                      isProjectOwner(resource.data.projectId)));
      
      // Anyone can create their own expense
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid;
      
      // Finance can update any, users can update own draft/needs_info
      allow update: if isAuthenticated() && 
                       (isFinanceManager() ||
                        (resource.data.userId == request.auth.uid && 
                         resource.data.status in ['draft', 'needs_info']));
      
      allow delete: if isFinanceManager();
    }
    
    // ========== Documents Collection ==========
    
    match /documents/{documentId} {
      allow read: if isAuthenticated() && 
                    (isSuperAdmin() ||
                     resource.data.accessLevel == 'company' ||
                     (resource.data.projectId != null && 
                      canAccessProject(resource.data.projectId)) ||
                     resource.data.accessList.hasAny([request.auth.uid]));
      
      // Check sensitivity
      allow read: if isAuthenticated() && 
                    (!resource.data.isSensitive || 
                     isSuperAdmin() || 
                     isFinanceManager());
      
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
                       (isSuperAdmin() ||
                        resource.data.uploadedBy == request.auth.uid ||
                        (resource.data.projectId != null && 
                         isProjectOwner(resource.data.projectId)));
      allow delete: if isSuperAdmin() || 
                       resource.data.uploadedBy == request.auth.uid;
    }
    
    // ========== Assets Collection ==========
    
    match /assets/{assetId} {
      allow read: if isAuthenticated();
      allow create: if isSuperAdmin();
      allow update: if isSuperAdmin() || 
                       (isProjectManager() && 
                        resource.data.assignedToProject != null &&
                        isProjectOwner(resource.data.assignedToProject));
      allow delete: if isSuperAdmin();
    }
    
    // ========== Announcements Collection ==========
    
    match /announcements/{announcementId} {
      allow read: if isAuthenticated() && 
                    (resource.data.targetType == 'all' ||
                     resource.data.targetRoles.hasAny(getUserData().roles) ||
                     resource.data.targetUsers.hasAny([request.auth.uid]) ||
                     resource.data.targetProjects.hasAny(getUserData().managedProjects) ||
                     resource.data.targetProjects.hasAny(getUserData().memberProjects));
      
      allow create: if isSuperAdmin() || isProjectManager();
      allow update: if isSuperAdmin() || 
                       resource.data.createdBy == request.auth.uid ||
                       // Allow marking as read
                       request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readBy', 'readCount']);
      allow delete: if isSuperAdmin();
    }
    
    // ========== Presence Collection ==========
    
    match /presence/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // ========== Audit Logs Collection ==========
    
    match /auditLogs/{logId} {
      allow read: if isSuperAdmin();
      allow create: if isAuthenticated();
      allow update, delete: if false; // Immutable
    }
  }
}
```

---

## 6. Google Workspace Integration

### 6.1 OAuth Configuration

```typescript
// src/services/google/config.ts
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

export const getGoogleClient = async (userId: string) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  const tokens = userDoc.data()?.googleTokens;
  
  if (!tokens) {
    throw new Error('Google tokens not found');
  }
  
  // Check if token is expired
  if (tokens.expiresAt.toDate() < new Date()) {
    // Refresh token
    const newTokens = await refreshGoogleToken(tokens.refreshToken);
    await updateDoc(doc(db, 'users', userId), {
      googleTokens: newTokens
    });
    return newTokens.accessToken;
  }
  
  return tokens.accessToken;
};
```

### 6.2 Drive Service

```typescript
// src/services/google/drive.ts
export const driveService = {
  // Create project folder in Drive
  createProjectFolder: async (userId: string, projectName: string): Promise<string> => {
    const accessToken = await getGoogleClient(userId);
    
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    
    const folder = await response.json();
    return folder.id;
  },

  // List files in folder
  listFiles: async (userId: string, folderId: string): Promise<DriveFile[]> => {
    const accessToken = await getGoogleClient(userId);
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,modifiedTime,size)`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );
    
    const data = await response.json();
    return data.files;
  },

  // Upload file to Drive
  uploadFile: async (userId: string, folderId: string, file: File): Promise<DriveFile> => {
    const accessToken = await getGoogleClient(userId);
    
    const metadata = {
      name: file.name,
      parents: [folderId],
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);
    
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType',
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: form,
      }
    );
    
    return response.json();
  },
};
```

### 6.3 Calendar Service

```typescript
// src/services/google/calendar.ts
export const calendarService = {
  // Create project calendar
  createCalendar: async (userId: string, projectName: string): Promise<string> => {
    const accessToken = await getGoogleClient(userId);
    
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: `${projectName} - SaMas Portal`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    
    const calendar = await response.json();
    return calendar.id;
  },

  // Create event (milestone/deadline)
  createEvent: async (
    userId: string, 
    calendarId: string, 
    event: CalendarEvent
  ): Promise<string> => {
    const accessToken = await getGoogleClient(userId);
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
          start: { dateTime: event.startTime, timeZone: event.timeZone },
          end: { dateTime: event.endTime, timeZone: event.timeZone },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 60 },
              { method: 'email', minutes: 1440 },
            ],
          },
        }),
      }
    );
    
    const createdEvent = await response.json();
    return createdEvent.id;
  },

  // Get events for date range
  getEvents: async (
    userId: string, 
    calendarId: string, 
    timeMin: Date, 
    timeMax: Date
  ): Promise<CalendarEvent[]> => {
    const accessToken = await getGoogleClient(userId);
    
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );
    
    const data = await response.json();
    return data.items;
  },
};
```

### 6.4 Meet Service

```typescript
// src/services/google/meet.ts
export const meetService = {
  // Generate instant meeting link
  createMeeting: async (
    userId: string, 
    title: string,
    attendees?: string[]
  ): Promise<string> => {
    const accessToken = await getGoogleClient(userId);
    
    // Create a calendar event with conferenceData
    const event = {
      summary: title,
      start: {
        dateTime: new Date().toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      attendees: attendees?.map(email => ({ email })),
    };
    
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );
    
    const createdEvent = await response.json();
    return createdEvent.conferenceData?.entryPoints?.[0]?.uri || '';
  },
};
```

---

## 7. Real-Time Features

### 7.1 Presence System

```typescript
// src/hooks/usePresence.ts
export const usePresence = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    const presenceRef = doc(db, 'presence', user.id);
    
    // Initial presence update
    const setOnline = async () => {
      await setDoc(presenceRef, {
        status: 'online',
        lastSeen: serverTimestamp(),
        heartbeat: serverTimestamp(),
        currentPage: window.location.pathname,
        device: {
          type: getDeviceType(),
          browser: getBrowser(),
          os: getOS(),
        },
      }, { merge: true });
    };
    
    setOnline();
    
    // Heartbeat every 30 seconds
    const heartbeatInterval = setInterval(async () => {
      await updateDoc(presenceRef, {
        heartbeat: serverTimestamp(),
        currentPage: window.location.pathname,
      });
    }, 30000);
    
    // Idle detection
    let idleTimer: NodeJS.Timeout;
    const resetIdle = () => {
      clearTimeout(idleTimer);
      updateDoc(presenceRef, { status: 'online', lastSeen: serverTimestamp() });
      
      idleTimer = setTimeout(() => {
        updateDoc(presenceRef, { status: 'away' });
      }, 5 * 60 * 1000); // 5 minutes
    };
    
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keypress', resetIdle);
    
    // Cleanup on unmount/close
    const setOffline = () => {
      updateDoc(presenceRef, { 
        status: 'offline', 
        lastSeen: serverTimestamp() 
      });
    };
    
    window.addEventListener('beforeunload', setOffline);
    
    return () => {
      clearInterval(heartbeatInterval);
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keypress', resetIdle);
      window.removeEventListener('beforeunload', setOffline);
      setOffline();
    };
  }, [user]);
};

// src/hooks/useOnlineUsers.ts
export const useOnlineUsers = () => {
  return useQuery({
    queryKey: queryKeys.users.presence(),
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 60000); // 1 minute ago
      
      const q = query(
        collection(db, 'presence'),
        where('heartbeat', '>', Timestamp.fromDate(cutoff))
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        userId: doc.id,
        ...doc.data()
      }));
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
```

### 7.2 Real-Time Task Board

```typescript
// src/hooks/useTaskBoard.ts
export const useTaskBoard = (projectId: string) => {
  const queryClient = useQueryClient();
  
  // Real-time subscription to tasks
  useEffect(() => {
    const q = query(
      collection(db, 'tasks'),
      where('projectId', '==', projectId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const task = { id: change.doc.id, ...change.doc.data() } as Task;
        
        if (change.type === 'added' || change.type === 'modified') {
          queryClient.setQueryData<Task[]>(
            queryKeys.tasks.byProject(projectId),
            (old) => {
              if (!old) return [task];
              const index = old.findIndex(t => t.id === task.id);
              if (index >= 0) {
                const newTasks = [...old];
                newTasks[index] = task;
                return newTasks;
              }
              return [...old, task];
            }
          );
        }
        
        if (change.type === 'removed') {
          queryClient.setQueryData<Task[]>(
            queryKeys.tasks.byProject(projectId),
            (old) => old?.filter(t => t.id !== task.id) || []
          );
        }
      });
    });
    
    return () => unsubscribe();
  }, [projectId, queryClient]);
  
  // Optimistic update for drag & drop
  const moveTask = useMutation({
    mutationFn: async ({ taskId, newStatus, newOrder }: MoveTaskParams) => {
      await tasksService.updateTaskStatus(taskId, newStatus, newOrder);
    },
    onMutate: async ({ taskId, newStatus, newOrder }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.byProject(projectId) });
      
      const previousTasks = queryClient.getQueryData<Task[]>(
        queryKeys.tasks.byProject(projectId)
      );
      
      queryClient.setQueryData<Task[]>(
        queryKeys.tasks.byProject(projectId),
        (old) => old?.map(t => 
          t.id === taskId 
            ? { ...t, status: newStatus, statusOrder: newOrder }
            : t
        ) || []
      );
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          queryKeys.tasks.byProject(projectId),
          context.previousTasks
        );
      }
    },
  });
  
  return { moveTask };
};
```

### 7.3 Activity Feed

```typescript
// src/hooks/useActivityFeed.ts
export const useActivityFeed = (projectId?: string) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  
  useEffect(() => {
    let q;
    
    if (projectId) {
      q = query(
        collection(db, `projects/${projectId}/activities`),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
    } else {
      q = query(
        collection(db, 'auditLogs'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newActivities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
      
      setActivities(newActivities);
    });
    
    return () => unsubscribe();
  }, [projectId]);
  
  return activities;
};
```

---

## 8. Frontend Architecture

### 8.1 Routing Structure

```typescript
// src/routes/index.tsx
export const routes = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Public routes
      {
        path: 'login',
        element: <LoginPage />,
      },
      
      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '',
            element: <MainLayout />,
            children: [
              { index: true, element: <Navigate to="/dashboard" replace /> },
              { path: 'dashboard', element: <DashboardPage /> },
              
              // Finance
              { path: 'finance', element: <FinanceLayout />, children: [
                { index: true, element: <ExpensesPage /> },
                { path: 'expenses', element: <ExpensesPage /> },
                { path: 'expenses/new', element: <NewExpensePage /> },
                { path: 'expenses/:id', element: <ExpenseDetailPage /> },
                { path: 'approvals', element: <ApprovalsPage /> },
                { path: 'reports', element: <ReportsPage /> },
              ]},
              
              // Documents
              { path: 'documents', element: <DocumentsLayout />, children: [
                { index: true, element: <DocumentsPage /> },
                { path: ':folderId', element: <DocumentsPage /> },
              ]},
              
              // Projects
              { path: 'projects', element: <ProjectsLayout />, children: [
                { index: true, element: <ProjectsPage /> },
                { path: 'new', element: <NewProjectPage /> },
                { path: ':projectId', element: <ProjectDetailPage />, children: [
                  { index: true, element: <ProjectOverview /> },
                  { path: 'tasks', element: <ProjectTasksPage /> },
                  { path: 'board', element: <KanbanBoardPage /> },
                  { path: 'files', element: <ProjectFilesPage /> },
                  { path: 'calendar', element: <ProjectCalendarPage /> },
                  { path: 'team', element: <ProjectTeamPage /> },
                  { path: 'settings', element: <ProjectSettingsPage /> },
                ]},
              ]},
              
              // Tasks
              { path: 'tasks', element: <TasksLayout />, children: [
                { index: true, element: <MyTasksPage /> },
                { path: 'calendar', element: <TaskCalendarPage /> },
              ]},
              
              // Assets
              { path: 'assets', element: <AssetsLayout />, children: [
                { index: true, element: <AssetsPage /> },
                { path: 'new', element: <NewAssetPage /> },
                { path: ':assetId', element: <AssetDetailPage /> },
              ]},
              
              // Announcements
              { path: 'announcements', element: <AnnouncementsLayout />, children: [
                { index: true, element: <AnnouncementsPage /> },
                { path: 'new', element: <NewAnnouncementPage /> },
                { path: ':id', element: <AnnouncementDetailPage /> },
              ]},
              
              // Admin (Super Admin only)
              { path: 'admin', element: <AdminGuard />, children: [
                { index: true, element: <AdminDashboardPage /> },
                { path: 'users', element: <UsersPage /> },
                { path: 'users/:userId', element: <UserDetailPage /> },
                { path: 'roles', element: <RolesPage /> },
                { path: 'audit-logs', element: <AuditLogsPage /> },
              ]},
            ],
          },
        ],
      },
    ],
  },
];
```

### 8.2 Kanban Board Component

```typescript
// src/components/modules/tasks/KanbanBoard.tsx
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface KanbanBoardProps {
  projectId: string;
}

export const KanbanBoard: FC<KanbanBoardProps> = ({ projectId }) => {
  const { data: project } = useProject(projectId);
  const { data: tasks } = useProjectTasks(projectId);
  const { moveTask } = useTaskBoard(projectId);
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const columns = project?.settings.taskStatuses || DEFAULT_STATUSES;
  
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    columns.forEach(status => {
      grouped[status] = (tasks || [])
        .filter(t => t.status === status)
        .sort((a, b) => a.statusOrder - b.statusOrder);
    });
    return grouped;
  }, [tasks, columns]);
  
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks?.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    
    if (!over) return;
    
    const activeTask = tasks?.find(t => t.id === active.id);
    if (!activeTask) return;
    
    // Determine new status and order
    const overId = over.id as string;
    let newStatus: string;
    let newOrder: number;
    
    if (columns.includes(overId)) {
      // Dropped on column
      newStatus = overId;
      newOrder = (tasksByStatus[overId]?.length || 0) * 1000;
    } else {
      // Dropped on task
      const overTask = tasks?.find(t => t.id === overId);
      if (!overTask) return;
      
      newStatus = overTask.status;
      newOrder = overTask.statusOrder;
    }
    
    if (activeTask.status !== newStatus || activeTask.statusOrder !== newOrder) {
      moveTask.mutate({ taskId: activeTask.id, newStatus, newOrder });
    }
  };
  
  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status] || []}
          />
        ))}
      </div>
      
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  );
};

// KanbanColumn.tsx
interface KanbanColumnProps {
  status: string;
  tasks: Task[];
}

export const KanbanColumn: FC<KanbanColumnProps> = ({ status, tasks }) => {
  const { setNodeRef } = useDroppable({ id: status });
  
  return (
    <div className="flex-shrink-0 w-80">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {status}
          </h3>
          <span className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm">
            {tasks.length}
          </span>
        </div>
        
        <div 
          ref={setNodeRef}
          className="space-y-3 min-h-[200px]"
        >
          <SortableContext
            items={tasks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map(task => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
          </SortableContext>
        </div>
        
        <AddTaskButton status={status} />
      </div>
    </div>
  );
};
```

---

## 9. PWA Implementation

### 9.1 Vite PWA Configuration

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'SaMas IT Services Portal',
        short_name: 'SaMas Portal',
        description: 'Company portal for SaMas IT Services',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          },
          {
            urlPattern: /^https:\/\/storage\.googleapis\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'storage-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              }
            }
          }
        ]
      }
    })
  ]
});
```

### 9.2 Push Notifications

```typescript
// src/services/notifications.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export const initializeNotifications = async () => {
  const messaging = getMessaging();
  
  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('Notification permission denied');
    return;
  }
  
  // Get FCM token
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
  });
  
  // Save token to user document
  const { user } = useAuth();
  if (user) {
    await updateDoc(doc(db, 'users', user.id), {
      fcmTokens: arrayUnion(token)
    });
  }
  
  // Handle foreground messages
  onMessage(messaging, (payload) => {
    const { title, body, icon } = payload.notification || {};
    
    new Notification(title || 'SaMas Portal', {
      body,
      icon: icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png'
    });
  });
};

// Cloud Function to send notifications
// functions/src/notifications.ts
export const sendTaskAssignmentNotification = functions.firestore
  .document('tasks/{taskId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Check if assignment changed
    const newAssignees = after.assignedTo.filter(
      (id: string) => !before.assignedTo.includes(id)
    );
    
    if (newAssignees.length === 0) return;
    
    // Get assignee FCM tokens
    for (const userId of newAssignees) {
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      const tokens = userDoc.data()?.fcmTokens || [];
      
      if (tokens.length > 0) {
        await admin.messaging().sendMulticast({
          tokens,
          notification: {
            title: 'New Task Assigned',
            body: `You've been assigned to: ${after.title}`,
          },
          data: {
            type: 'task_assignment',
            taskId: context.params.taskId,
            projectId: after.projectId,
          }
        });
      }
    }
  });
```

---

## 10. Security Design

*See Section 5.3 for complete Firestore Security Rules*

### 10.1 Additional Security Measures

```typescript
// Input validation with Zod
import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  projectId: z.string().uuid(),
  assignedTo: z.array(z.string().uuid()),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  dueDate: z.date().optional(),
});

// XSS Prevention for rich text
import DOMPurify from 'dompurify';

export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
};
```

### 10.2 Cloud Storage CORS Configuration

For file uploads from custom domains, Firebase Storage requires explicit CORS configuration.

**Configuration File: `cors.json`**
```json
[
  {
    "origin": ["https://uu.samas.tech", "http://localhost:5173", "http://localhost:5174"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "User-Agent",
      "x-goog-resumable",
      "x-firebase-storage-version"
    ]
  }
]
```

**Apply CORS Configuration:**
```bash
# Using gsutil (Google Cloud SDK)
gsutil cors set cors.json gs://uu-portal-60426.firebasestorage.app

# Verify configuration
gsutil cors get gs://uu-portal-60426.firebasestorage.app
```

**Alternative:** Configure via Google Cloud Console:
1. Go to Cloud Console → Storage → Browser
2. Select the bucket `uu-portal-60426.firebasestorage.app`
3. Click "Edit CORS configuration" in the bucket settings
4. Paste the JSON configuration

---

## 11. Testing Strategy

*Detailed in separate test plan documents*

### 11.1 Test Coverage Targets

| Category | Target |
|----------|--------|
| Overall | > 80% |
| Critical Paths | 100% |
| Hooks | > 90% |
| Services | > 90% |
| Components | > 70% |

---

## 12. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEPLOYMENT FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Developer Push → GitHub → Actions CI/CD → Firebase Deploy

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   GitHub    │───►│   GitHub    │───►│   Build &   │───►│  Firebase   │
│    Push     │    │   Actions   │    │    Test     │    │   Deploy    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
                                            ┌───────────────────┼───────────────────┐
                                            │                   │                   │
                                            ▼                   ▼                   ▼
                                      ┌──────────┐       ┌──────────┐       ┌──────────┐
                                      │ Hosting  │       │Functions │       │ Rules    │
                                      │ (React)  │       │(Backend) │       │(Security)│
                                      └──────────┘       └──────────┘       └──────────┘
```

---

## 13. Monitoring & Logging

### 13.1 Firebase Analytics Events

```typescript
// Track key events
analytics.logEvent('task_created', { projectId, taskId });
analytics.logEvent('expense_submitted', { amount, category });
analytics.logEvent('document_uploaded', { type, size });
analytics.logEvent('kanban_task_moved', { from, to });
```

### 13.2 Error Tracking

```typescript
// src/utils/errorTracking.ts
export const trackError = (error: Error, context?: Record<string, any>) => {
  console.error('Error:', error);
  
  // Log to Firestore
  addDoc(collection(db, 'errorLogs'), {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: serverTimestamp(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  });
};
```
