# Agent 3: UI/UX Agent Checklist
## Design System & Component Library Lead

---

## Role Overview

**Responsibilities**: Design system implementation, component library creation, responsive layouts, dark mode, accessibility compliance.

**Files Owned**:
- `src/components/ui/**`
- `src/components/layout/**`
- `tailwind.config.js`
- `src/styles/**`
- `src/contexts/ThemeContext.tsx`

---

## Phase 1 Tasks

### Tailwind Configuration
- [ ] Configure custom color palette:
  ```js
  colors: {
    primary: { 50-950 shades of #2563eb },
    secondary: { 50-950 shades of #7c3aed },
    success: { shades of #10b981 },
    warning: { shades of #f59e0b },
    danger: { shades of #ef4444 },
  }
  ```
- [ ] Configure typography (Inter font)
- [ ] Set up responsive breakpoints
- [ ] Configure dark mode (class strategy)
- [ ] Add custom animations

### Base UI Components
- [ ] `Button` - Primary, Secondary, Ghost, Danger, sizes
- [ ] `Input` - Text, with icon, with error state
- [ ] `Select` - Dropdown with search
- [ ] `Checkbox` - With label
- [ ] `Radio` - With group
- [ ] `Switch` - Toggle
- [ ] `Textarea` - With character count
- [ ] `Label` - Form labels
- [ ] `Badge` - Status indicators
- [ ] `Avatar` - With fallback initials
- [ ] `Spinner` - Loading indicator
- [ ] `Skeleton` - Content loading placeholder

### Card Components
- [ ] `Card` - Base card with header, body, footer
- [ ] `StatCard` - For dashboard statistics
- [ ] `InteractiveCard` - Hoverable, clickable

### Feedback Components
- [ ] `Toast` - Success, error, warning, info
- [ ] `Alert` - Inline alerts
- [ ] `Modal` - Dialog with overlay
- [ ] `Drawer` - Slide-in panel
- [ ] `ConfirmDialog` - Confirmation modal
- [ ] `Tooltip` - Hover tooltips
- [ ] `Popover` - Click popovers

### Theme Context
- [ ] Create `ThemeContext.tsx`
- [ ] Implement theme toggle (light/dark/system)
- [ ] Persist theme preference
- [ ] Apply theme to document

### Layout Components
- [ ] `MainLayout` - App shell with sidebar
- [ ] `Sidebar` - Collapsible navigation
- [ ] `Header` - Top bar with user menu
- [ ] `PageHeader` - Page title with breadcrumbs
- [ ] `Container` - Max-width wrapper
- [ ] `Grid` - Responsive grid system

### Navigation Components
- [ ] `Breadcrumbs` - Path navigation
- [ ] `Tabs` - Tab navigation
- [ ] `NavItem` - Sidebar navigation item
- [ ] `MobileNav` - Bottom navigation for mobile
- [ ] `UserMenu` - Dropdown with user actions

---

## Phase 2 Tasks

### Data Display Components
- [ ] `Table` - Sortable, selectable rows
- [ ] `DataTable` - With pagination, filters
- [ ] `EmptyState` - No data placeholder
- [ ] `List` - Vertical list
- [ ] `DescriptionList` - Key-value pairs

### Form Components
- [ ] `Form` - With React Hook Form integration
- [ ] `FormField` - Label + Input + Error
- [ ] `SearchInput` - With clear button
- [ ] `DatePicker` - Single date selection
- [ ] `DateRangePicker` - Range selection
- [ ] `FileUpload` - Drag and drop zone
- [ ] `ImageUpload` - With preview

---

## Phase 3 Tasks

### Finance Module Components
- [ ] `ExpenseCard` - Expense summary card
- [ ] `ApprovalBadge` - Status badge
- [ ] `ReceiptViewer` - Image/PDF preview
- [ ] `AmountDisplay` - Currency formatting

### Document Module Components
- [ ] `FolderTree` - Hierarchical navigation
- [ ] `FileCard` - File preview card
- [ ] `FileIcon` - Type-based icons
- [ ] `DropZone` - File upload area
- [ ] `DocumentPreview` - Inline preview

---

## Phase 4 Tasks

### Project Module Components
- [ ] `ProjectCard` - Project summary
- [ ] `MilestoneTimeline` - Visual timeline
- [ ] `TeamAvatars` - Stacked avatars
- [ ] `ProgressBar` - With percentage
- [ ] `BudgetMeter` - Budget visualization

### Task/Kanban Components
- [ ] `KanbanBoard` - Board container
- [ ] `KanbanColumn` - Droppable column
- [ ] `TaskCard` - Draggable task card
- [ ] `TaskBadge` - Priority/label badges
- [ ] `ChecklistProgress` - Checklist completion
- [ ] `DueDate` - Date with overdue styling
- [ ] `AssigneeSelect` - User picker
- [ ] `LabelSelect` - Multi-label picker
- [ ] `PrioritySelect` - Priority dropdown

### Calendar Components
- [ ] `Calendar` - Month view
- [ ] `CalendarEvent` - Event indicator
- [ ] `EventPopover` - Event details

---

## Phase 5 Tasks

### Asset Module Components
- [ ] `AssetCard` - Asset summary
- [ ] `QRCodeDisplay` - QR code viewer
- [ ] `AssetStatusBadge` - Status indicator
- [ ] `MaintenanceAlert` - Upcoming maintenance

### Announcement Components
- [ ] `AnnouncementCard` - News card
- [ ] `RichTextEditor` - TipTap editor
- [ ] `ReadReceipt` - Read status indicator
- [ ] `PinnedBadge` - Pinned indicator

---

## Phase 6 Tasks

### Presence Components
- [ ] `OnlineIndicator` - Status dot
- [ ] `PresenceAvatar` - Avatar with status
- [ ] `TeamPresence` - Team online list
- [ ] `StatusSelector` - Status picker
- [ ] `ActivityFeed` - Real-time feed
- [ ] `ActivityItem` - Single activity

### PWA Components
- [ ] `InstallPrompt` - PWA install banner
- [ ] `OfflineBanner` - Offline indicator
- [ ] `UpdatePrompt` - New version available

---

## Accessibility Requirements

- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] Color contrast ≥ 4.5:1
- [ ] ARIA labels on icons
- [ ] Screen reader announcements
- [ ] Skip to main content link
- [ ] Form error announcements
- [ ] Modal focus trap

---

## Responsive Requirements

| Breakpoint | Layout Changes |
|------------|----------------|
| < 640px | Single column, bottom nav, collapsed sidebar |
| 640-1024px | Two column, collapsible sidebar |
| > 1024px | Full layout, fixed sidebar |

---

## Acceptance Criteria

- [ ] All components follow design system
- [ ] Dark mode works correctly
- [ ] Responsive on all breakpoints
- [ ] WCAG 2.1 AA compliant
- [ ] Components documented with examples
- [ ] No CSS conflicts or specificity issues
- [ ] Consistent spacing and typography
- [ ] Loading states for all async operations
