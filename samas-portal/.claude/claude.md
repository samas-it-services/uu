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
