# Uu Portal

[![CI/CD](https://github.com/samas-it-services/uu/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/samas-it-services/uu/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/samas-it-services/uu/branch/main/graph/badge.svg)](https://codecov.io/gh/samas-it-services/uu)

Task management and project collaboration portal for saMas IT Services.

## Features

- **Project Management** - Kanban boards, task tracking, team collaboration
- **Role-Based Access Control (RBAC)** - System-level and project-level permissions
- **Document Management** - File uploads, versioning, folder organization
- **Finance & Expense Tracking** - Expense submissions, approvals, reporting
- **Asset Management** - Track company assets assigned to projects/users
- **Announcements** - Real-time notifications and project announcements
- **Audit Logging** - Immutable activity logs for compliance

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui, Radix UI |
| **Backend** | Firebase (Auth, Firestore, Storage, Functions) |
| **State Management** | React Query, Zustand |
| **Forms** | React Hook Form, Zod |
| **Drag & Drop** | @dnd-kit |
| **Testing** | Vitest, Playwright |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Firebase CLI (`npm install -g firebase-tools`)

### Installation

```bash
# Clone the repository
git clone https://github.com/samas-it-services/uu.git
cd uu/samas-portal

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase config
```

### Development

```bash
# Start development server
npm run dev

# Start Firebase emulators (for local development)
npm run firebase:emulators

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Lint and typecheck
npm run lint
npm run typecheck
```

### Deployment

```bash
# Build for production
npm run build

# Deploy to Firebase
npm run firebase:deploy

# Deploy only Firestore/Storage rules
npm run firebase:deploy:rules
```

## Project Structure

```
samas-portal/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── ui/         # Base UI primitives (Button, Input, etc.)
│   │   └── modules/    # Feature-specific components
│   ├── contexts/       # React contexts (Auth, Theme)
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API and Firebase services
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── tests/
│   ├── integration/    # Integration tests (Vitest)
│   └── e2e/            # End-to-end tests (Playwright)
├── firestore.rules     # Firestore security rules
├── storage.rules       # Storage security rules
└── firebase.json       # Firebase configuration
```

## RBAC System

### System Roles

| Role | Description |
|------|-------------|
| `superuser` | Full system access |
| `finance_incharge` | Finance management, view all projects |
| `project_manager` | Manage assigned projects |
| `qa_manager` | Quality assurance tasks |
| `analyst` | View and analyze data |

### Super Admins

- bill@samas.tech
- bilgrami@gmail.com

## Roadmap: Pluggable Modules Platform

### Vision

Build a platform where developers can publish **workflow modules** (automations) and **UI modules** (screens/apps) that project admins can install per-project.

### Planned Features

- **Module Registry** - Catalog of workflow and UI modules with versioning
- **Per-Project Installation** - Enable/disable modules per project with configuration
- **Workflow Engine** - Manual runs, scheduled cron jobs, webhook triggers
- **UI Module Integration** - Dynamic menu items via micro-frontend/iframe
- **Fine-grained RBAC** - Module-level permissions (Runner, Editor, Viewer)
- **Scheduling & Cron** - Timezone-aware job scheduling with execution history
- **Secrets Management** - Google Secret Manager integration
- **Audit Logs** - Immutable run history with inputs/outputs

### Module Types

| Type | Description |
|------|-------------|
| `workflow` | Background automation jobs (n8n-style) |
| `ui` | Embedded UI screens and apps |
| `hybrid` | Both workflow and UI components |

### Data Model (Preview)

```
/moduleRegistry/{moduleId}       # Global module catalog
/uiAppRegistry/{appId}           # UI app registry
/projects/{projectId}
  /enabledModules/{moduleId}     # Per-project module config
  /enabledUiApps/{appId}         # Per-project UI apps
  /runs/{runId}                  # Workflow execution history
/workflowDefs/{moduleId}         # Workflow definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

AGPL-3.0 License
