# SaMas Portal Architecture

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-25 | System | Initial architecture documentation |

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Component Architecture](#2-component-architecture)
3. [Data Flow](#3-data-flow)
4. [Custom Fields Architecture](#4-custom-fields-architecture)
5. [Integration Architecture](#5-integration-architecture)
6. [Security Architecture](#6-security-architecture)

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
│                    (CDN, SSL, Custom Domain: uu.samas.tech)                 │
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

### 1.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript + Vite | UI and build |
| Styling | Tailwind CSS + shadcn/ui | Design system |
| State | TanStack Query + Zustand | Server/client state |
| Database | Cloud Firestore | NoSQL document DB |
| Auth | Firebase Auth + Google OAuth | Authentication |
| Storage | Cloud Storage | File storage |
| Hosting | Firebase Hosting | CDN + SSL |
| APIs | Google Workspace APIs | Drive, Calendar integration |

---

## 2. Component Architecture

### 2.1 Layer Diagram

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
│  │  ┌──────────┐ ┌──────────┐                                       │     │
│  │  │useCustom │ │useAudit  │                                       │     │
│  │  │ Fields   │ │  Logs    │                                       │     │
│  │  └──────────┘ └──────────┘                                       │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                    │                                        │
│  ┌─────────────────────────────────┼─────────────────────────────────┐     │
│  │                        SERVICE LAYER                               │     │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │     │
│  │  │   Firebase   │ │   Google     │ │   Storage    │               │     │
│  │  │   Services   │ │   Services   │ │   Services   │               │     │
│  │  └──────────────┘ └──────────────┘ └──────────────┘               │     │
│  │  ┌──────────────┐ ┌──────────────┐                                │     │
│  │  │  API Services│ │ Custom Fields│                                │     │
│  │  │  (CRUD)      │ │   Service    │                                │     │
│  │  └──────────────┘ └──────────────┘                                │     │
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

### 2.2 Directory Structure

```
src/
├── components/
│   ├── ui/              # Base UI components (Button, Card, Input, etc.)
│   ├── layout/          # MainLayout, Sidebar, Header
│   ├── forms/           # Form components, DynamicFieldRenderer
│   ├── guards/          # PermissionGuard, RoleGuard
│   ├── modules/         # Feature-specific components
│   │   ├── tasks/       # TaskCard, TaskModal, KanbanBoard
│   │   ├── projects/    # ProjectCard, ProjectModal
│   │   ├── expenses/    # ExpenseCard, ExpenseModal
│   │   └── documents/   # DocumentCard, DocumentViewer
│   └── admin/           # Admin UI components
├── contexts/            # React contexts (Auth, Theme, Toast)
├── hooks/               # Custom hooks (useAuth, useTasks, useCustomFields)
├── pages/               # Page components
│   ├── admin/           # Admin pages (Users, Roles, CustomFields)
│   └── ...              # Feature pages
├── services/
│   ├── api/             # API service modules
│   ├── firebase/        # Firebase config and utilities
│   └── google/          # Google APIs (Drive, Calendar)
├── types/               # TypeScript types/interfaces
└── utils/               # Utility functions
```

---

## 3. Data Flow

### 3.1 Authentication Flow

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  User    │───▶│  Login Page  │───▶│ Google OAuth│───▶│ Firebase Auth│
│  Clicks  │    │              │    │   Popup     │    │              │
└──────────┘    └──────────────┘    └─────────────┘    └──────────────┘
                                                              │
                                                              ▼
┌──────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  AuthContext │◀───│  User Doc    │◀───│  Firestore  │◀───│ Create/Get   │
│  Updated     │    │  Loaded      │    │   Query     │    │ User Doc     │
└──────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  App renders with user context, roles loaded, permissions checked         │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Permission Checking Flow

```
┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Component   │───▶│ usePermissions│───▶│  User Roles │
│  Renders     │    │    Hook       │    │   Check     │
└──────────────┘    └──────────────┘    └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Permission   │
                    │ Matrix Lookup│
                    └──────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ Module     │  │ Data Access│  │ Project    │
    │ Permission │  │ Permission │  │ Scope      │
    │ Check      │  │ Check      │  │ Check      │
    └────────────┘  └────────────┘  └────────────┘
           │               │               │
           └───────────────┼───────────────┘
                           ▼
                    ┌──────────────┐
                    │ Allow/Deny   │
                    └──────────────┘
```

### 3.3 Data Mutation Flow (React Query)

```
┌──────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  User        │───▶│  Component   │───▶│ useMutation │───▶│  API Service │
│  Action      │    │  Handler     │    │   Hook      │    │  (Firestore) │
└──────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
                                                                  │
                                                                  ▼
┌──────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  UI Updated  │◀───│  Query Cache │◀───│ onSuccess   │◀───│  Audit Log   │
│  Optimistic  │    │  Invalidated │    │ Callback    │    │  Created     │
└──────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

---

## 4. Custom Fields Architecture

### 4.1 Overview

The Custom Fields system allows administrators to define dynamic fields for tasks without code changes. This design is inspired by enterprise tools like Jira, Asana, and ServiceNow.

### 4.2 Data Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     customFieldDefinitions (Collection)                  │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  {fieldId}                                                         │ │
│  │    name: "Phase"                                                   │ │
│  │    type: "enum"                                                    │ │
│  │    options: ["Search & Discovery", "Viral Loop", ...]             │ │
│  │    projectId: null  (global) | "project-123" (scoped)             │ │
│  │    required: false                                                 │ │
│  │    order: 1                                                        │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Referenced by key
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           tasks (Collection)                             │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  {taskId}                                                          │ │
│  │    title: "Implement SEO optimization"                             │ │
│  │    status: "in_progress"                                           │ │
│  │    ...core fields...                                               │ │
│  │    customFields: {                                                 │ │
│  │      "phase": "Search & Discovery",                                │ │
│  │      "opportunity": "High potential for organic traffic",          │ │
│  │      "scalingNotes": "Can be replicated across all pages"         │ │
│  │    }                                                               │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Field Types

| Type | Storage | UI Rendering | Validation |
|------|---------|--------------|------------|
| `text` | string | TextInput | Max length |
| `number` | number | NumberInput | Min/max, precision |
| `enum` | string | Select dropdown | Must be valid option |
| `multi_enum` | string[] | Multi-select | All must be valid options |
| `date` | { date, time? } | DatePicker | Valid date format |
| `person` | { userId, displayName } | UserPicker | Valid user ID |
| `checkbox` | boolean | Checkbox | Boolean |
| `url` | string | URLInput | Valid URL format |

### 4.4 Component Flow

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  TaskModal       │───▶│ useCustomFields  │───▶│ customFields API │
│  (Form)          │    │ Hook             │    │ Service          │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                       │
         │                       ▼
         │              ┌──────────────────┐
         │              │ Field Definitions│
         │              │ (for project)    │
         │              └──────────────────┘
         │                       │
         ▼                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     DynamicFieldRenderer                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ Text Field  │ │ Enum Field  │ │ Date Field  │ │ Person Field│        │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
└──────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐    ┌──────────────────┐
│  Task Updated    │───▶│ Firestore        │
│  with values     │    │ (tasks collection)│
└──────────────────┘    └──────────────────┘
```

### 4.5 Admin UI Flow

```
Admin: CustomFieldsPage
         │
         ├──▶ View all field definitions
         │
         ├──▶ Create new field definition
         │         │
         │         ▼
         │    CustomFieldEditor
         │         │
         │         ├──▶ Set name, key, type
         │         ├──▶ Configure options (for enum)
         │         ├──▶ Set scope (global/project)
         │         └──▶ Save to Firestore
         │
         ├──▶ Edit existing field
         │
         └──▶ Delete field (with confirmation)
```

---

## 5. Integration Architecture

### 5.1 Google Workspace Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SaMas Portal                                      │
│                                                                          │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐           │
│  │ OAuth Token   │    │ Drive Service │    │ Calendar      │           │
│  │ (stored in    │───▶│               │    │ Service       │           │
│  │  user doc)    │    │ - listFiles() │    │               │           │
│  └───────────────┘    │ - uploadFile()│    │ - createEvent()│           │
│                       │ - shareFile() │    │ - createMeet() │           │
│                       └───────────────┘    └───────────────┘           │
│                              │                    │                     │
└──────────────────────────────┼────────────────────┼─────────────────────┘
                               │                    │
                               ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Google Workspace APIs                                 │
│                                                                          │
│  ┌─────────────────────┐         ┌─────────────────────┐               │
│  │   Google Drive API  │         │ Google Calendar API │               │
│  │   v3                │         │ v3                  │               │
│  └─────────────────────┘         └─────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 External Data Import

```
External Systems                          SaMas Portal
┌─────────────┐                    ┌──────────────────────┐
│ CSV Export  │                    │                      │
│ (Jira,      │───┐                │   Seed Script        │
│  Asana,     │   │                │   (not committed)    │
│  Workday)   │   │                │                      │
└─────────────┘   │                │   - Parse CSV        │
                  │                │   - Map fields       │
                  └───────────────▶│   - Validate data    │
                                   │   - Create tasks     │
                                   │                      │
                                   └──────────────────────┘
                                            │
                                            ▼
                                   ┌──────────────────────┐
                                   │  Firestore           │
                                   │  - tasks collection  │
                                   │  - projects collection│
                                   └──────────────────────┘
```

---

## 6. Security Architecture

### 6.1 RBAC Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Role-Based Access Control                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │ Super Admin  │    │   Finance    │    │   Project    │              │
│  │              │    │   Manager    │    │   Manager    │              │
│  │ ALL access   │    │              │    │              │              │
│  │ ALL projects │    │ View ALL     │    │ OWN projects │              │
│  │ Sensitive ✓  │    │ Sensitive ✓  │    │ Sensitive ✗  │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                          │
│  Permission Matrix:                                                      │
│  ┌─────────────┬──────────┬──────────┬──────────┬──────────┐           │
│  │ Module      │ View     │ Create   │ Edit     │ Delete   │           │
│  ├─────────────┼──────────┼──────────┼──────────┼──────────┤           │
│  │ projects    │ scoped   │ admin    │ own      │ admin    │           │
│  │ tasks       │ scoped   │ member   │ member   │ admin    │           │
│  │ expenses    │ scoped   │ own      │ own      │ admin    │           │
│  │ users       │ admin    │ admin    │ admin    │ admin    │           │
│  │ roles       │ admin    │ admin    │ admin    │ admin    │           │
│  └─────────────┴──────────┴──────────┴──────────┴──────────┘           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Firestore Security Rules Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Client      │───▶│  Firestore   │───▶│  Security    │
│  Request     │    │  API         │    │  Rules       │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                           ┌───────────────────┼───────────────────┐
                           ▼                   ▼                   ▼
                    ┌────────────┐      ┌────────────┐      ┌────────────┐
                    │ isAuth()   │      │ hasRole()  │      │ canAccess  │
                    │ Check      │      │ Check      │      │ Project()  │
                    └────────────┘      └────────────┘      └────────────┘
                           │                   │                   │
                           └───────────────────┼───────────────────┘
                                               ▼
                                        ┌────────────┐
                                        │ Allow/Deny │
                                        └────────────┘
```

---

## References

- [PRD.md](./PRD.md) - Product requirements
- [TDD.md](./TDD.md) - Technical design details
- [implementation-checklist.md](./implementation-checklist.md) - Progress tracking
