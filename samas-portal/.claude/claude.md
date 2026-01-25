# Claude Code Instructions - SaMas Portal

## Critical Rules

1. **Never mention AI names** (Claude, ChatGPT, etc.) in any generated content
2. **Always read PRD.md and TDD.md** before implementing any feature
3. **Update CHANGELOG.md** after completing any feature
4. **Run tests** before committing: `npm test`
5. **Follow the security model** - project managers cannot access sensitive data

## Project Overview

SaMas IT Services Portal - A comprehensive company portal with:
- Role-based access control (RBAC)
- Project-scoped security (PMs only see their projects)
- Sensitive data protection (only admin/finance see financials)
- Trello-style Kanban board
- Google Workspace integration (Drive, Calendar, Meet)
- Real-time presence and activity

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **State**: React Query + Zustand
- **Forms**: React Hook Form + Zod
- **DnD**: @dnd-kit
- **Testing**: Vitest + Playwright

## File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (useAuth.ts)
- Services: `camelCase.ts`
- Types: `camelCase.ts`
- Utils: `camelCase.ts`

## Component Template

```tsx
import { FC } from 'react';
import { cn } from '@/utils/cn';

interface ComponentNameProps {
  className?: string;
}

export const ComponentName: FC<ComponentNameProps> = ({ className }) => {
  return (
    <div className={cn('', className)}>
      {/* content */}
    </div>
  );
};
```

## RBAC Rules

| Role | Projects | Sensitive Data | Assets |
|------|----------|----------------|--------|
| Super Admin | All | Yes | All |
| Finance Manager | All (read) | Yes | All (read) |
| Project Manager | **Own only** | **No** | **Own project only** |
| Employee | Assigned | No | Assigned |

## Super Admins

- bill@samas.tech
- bilgrami@gmail.com

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Lint code
npm run typecheck    # Check types
firebase emulators:start  # Start Firebase emulators
```

## Git Commits

Format: `type(scope): description`

Types: feat, fix, docs, style, refactor, test, chore

Examples:
- `feat(tasks): add Kanban drag-drop`
- `fix(auth): handle token refresh`
- `docs(readme): update setup instructions`

---

## Documentation References

Always read these files before implementing features:
- `docs/PRD.md` - Product requirements
- `docs/TDD.md` - Technical design
- `docs/implementation-checklist.md` - Progress tracking
- `docs/agents/*.md` - Agent-specific checklists (12 files)

## Agent Files (docs/agents/)

Each phase has specific agent files to reference:

| Phase | Primary Agent(s) |
|-------|------------------|
| 1 (Auth) | 02-authentication-agent.md |
| 2 (RBAC) | 09-rbac-admin-agent.md |
| 3 (Finance) | 04-finance-agent.md, 05-documents-agent.md |
| 4 (Projects) | 06-projects-tasks-agent.md |
| 5 (Assets) | 07-assets-agent.md, 08-announcements-agent.md |
| 6 (Testing) | 10-testing-agent.md, 11-pwa-presence-agent.md |

## Testing Workflow

**No phase is complete until E2E and integration tests pass.**

For each phase:
1. Write tests (E2E + Integration)
2. Run tests: `npm test` and `npm run test:e2e`
3. If tests FAIL → Review code → Fix bugs → Run tests again
4. If tests PASS → Update docs:
   - Update agent file (check off completed items)
   - Update `docs/implementation-checklist.md`
   - Update `CHANGELOG.md`

## After Each Feature

Per rule #3, always:
1. Update CHANGELOG.md
2. Run tests: `npm test`
3. Update relevant agent file in docs/agents/
