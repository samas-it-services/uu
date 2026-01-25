# Changelog

All notable changes to the SaMas Portal project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-25

### Added - Phase 1: Foundation & Firebase Setup

#### Project Infrastructure
- Initialized Vite + React 18 + TypeScript project
- Configured ESLint and Prettier
- Set up Tailwind CSS with custom theme and CSS variables
- Configured path aliases (@/)
- Created project directory structure (src/services, src/hooks, src/components, src/contexts, src/types, src/pages)

#### Firebase Integration
- Created Firebase project (uu-portal-60426)
- Enabled Google Authentication provider
- Created Firestore database with security rules
- Configured Cloud Storage
- Set up Firebase Hosting with custom domain (uu.samas.tech)
- Created `.env` and `.env.production` environment files

#### Authentication System
- Implemented AuthContext provider with full Google OAuth flow
- Created useAuth hook
- Implemented Google Sign-In with popup
- Added OAuth token storage for Google APIs (Drive, Calendar)
- Created protected route component
- Implemented session persistence
- Created login page UI with branding
- Handle new user creation flow with automatic document creation
- Auto-assign super admin role to predefined emails (bill@samas.tech, bilgrami@gmail.com)

#### TypeScript Types
- Created comprehensive interfaces for: User, Role, Project, Task, Expense, Document, Asset, Announcement, Presence
- Defined Permission and Module types for RBAC

#### Security Rules
- Implemented Firestore security rules for all collections
- Added helper functions: isAuthenticated, userDocExists, isSuperAdmin, isFinanceManager, isProjectManager
- Implemented project-scoped access control (canAccessProject, isProjectOwner, isProjectMember)
- Protected sensitive data subcollections
- Added user existence checks to prevent errors for new users

#### UI Framework
- Created base UI components (Button, Card, Input, Avatar, Badge, Spinner)
- Created MainLayout component with responsive design
- Created Sidebar navigation with permission-based filtering
- Created Header with user menu
- Implemented dark mode toggle with system preference detection
- Created toast notification system with multiple variants
- Set up responsive navigation for mobile

#### PWA Setup
- Configured Vite PWA plugin with manifest
- Generated PWA icons (72x72 to 512x512)
- Configured service worker with caching strategies
- Set up offline fallback

### Fixed
- Fixed Tailwind CSS configuration for CSS variable-based colors (border-border issue)
- Fixed Firebase project ID in .firebaserc
- Added COOP headers (Cross-Origin-Opener-Policy: same-origin-allow-popups) for Google Sign-in popup
- Fixed Firestore security rules to handle new users without existing documents

### Deployment
- Deployed to Firebase Hosting
- Configured custom domain: https://uu.samas.tech
- SSL certificate provisioned
- DNS configured via CNAME to Firebase

---

## Upcoming

### [0.2.0] - Phase 2: RBAC Management System
- Permission System Core
- User Management (CRUD, role assignment)
- Role Management (custom roles, permission matrix)
- Audit Logging System

### [0.3.0] - Phase 3: Finance & Document Modules
- Expense CRUD with receipt upload
- Approval workflow
- Financial reports
- Document library with version control
- Google Drive integration

### [0.4.0] - Phase 4: Project & Task Management
- Project CRUD with milestones
- Kanban board (Trello-style)
- Task management with drag-drop
- Google Calendar/Meet integration

### [0.5.0] - Phase 5: Asset Management & Announcements
- Asset tracking with QR codes
- Maintenance scheduling
- Rich text announcements
- Targeting and read receipts

### [1.0.0] - Phase 6: PWA, Presence, Testing & Deployment
- Online presence system
- Activity feed
- Push notifications
- Comprehensive testing
- CI/CD pipeline
