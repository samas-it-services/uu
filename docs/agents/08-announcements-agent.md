# Agent 8: Announcements Module Agent Checklist
## Communications & Notification Specialist

---

## Role Overview

**Responsibilities**: Announcements with rich text, targeting, read receipts, push notifications, news feed.

**Files Owned**:
- `src/pages/announcements/**`
- `src/components/modules/announcements/**`
- `src/services/api/announcements.ts`
- `src/hooks/useAnnouncements.ts`
- `src/types/announcement.ts`

---

## Phase 5 Tasks

### Data Models
- [ ] Create `src/types/announcement.ts`:
  ```typescript
  interface Announcement {
    id: string;
    title: string;
    content: string;        // HTML from rich text
    excerpt: string;        // Plain text preview
    targetType: TargetType;
    targetRoles?: string[];
    targetProjects?: string[];
    targetUsers?: string[];
    coverImage?: string;
    attachments: Attachment[];
    category: AnnouncementCategory;
    isPinned: boolean;
    priority: Priority;
    publishedAt: Timestamp;
    expiresAt?: Timestamp;
    readBy: string[];
    readCount: number;
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }
  
  type TargetType = 'all' | 'role' | 'project' | 'users';
  type AnnouncementCategory = 'general' | 'hr' | 'it' | 'finance' | 'urgent';
  ```

### API Service
- [ ] Create `src/services/api/announcements.ts`
- [ ] `getAnnouncements(filters)` - respects targeting
- [ ] `getAnnouncementById(id)`
- [ ] `createAnnouncement(data)`
- [ ] `updateAnnouncement(id, data)`
- [ ] `deleteAnnouncement(id)`
- [ ] `pinAnnouncement(id)`
- [ ] `unpinAnnouncement(id)`
- [ ] `markAsRead(id)`
- [ ] `getUnreadCount()`

### React Query Hooks
- [ ] Create `src/hooks/useAnnouncements.ts`
- [ ] `useAnnouncements(filters)`
- [ ] `useAnnouncement(id)`
- [ ] `useUnreadCount()`
- [ ] `useCreateAnnouncement()` - mutation
- [ ] `useUpdateAnnouncement()` - mutation
- [ ] `useMarkAsRead()` - mutation
- [ ] `useTogglePin()` - mutation

### Rich Text Editor
- [ ] Set up TipTap editor
- [ ] Configure toolbar:
  - [ ] Bold, Italic, Underline
  - [ ] Headings (H1, H2, H3)
  - [ ] Lists (bullet, numbered)
  - [ ] Links
  - [ ] Images (inline)
  - [ ] Blockquotes
- [ ] Output HTML content
- [ ] Store excerpt (plain text)

### Announcements Feed Page
- [ ] Create `src/pages/announcements/AnnouncementsPage.tsx`
- [ ] List announcements as cards
- [ ] Pinned announcements at top
- [ ] Filter by category
- [ ] Filter by read/unread
- [ ] Search by title/content
- [ ] Mark as read on view
- [ ] Infinite scroll or pagination

### Announcement Detail Page
- [ ] Create `src/pages/announcements/AnnouncementDetailPage.tsx`
- [ ] Render rich text content
- [ ] Display cover image
- [ ] Show attachments
- [ ] Show read receipts (admin/author)
- [ ] Mark as read automatically
- [ ] Edit button (if author/admin)

### New Announcement Form
- [ ] Create `src/pages/announcements/NewAnnouncementPage.tsx`
- [ ] Title input
- [ ] Rich text editor for content
- [ ] Cover image upload
- [ ] File attachments
- [ ] Category selection
- [ ] Priority selection
- [ ] Targeting section:
  - [ ] All users (default)
  - [ ] Specific roles
  - [ ] Specific projects
  - [ ] Specific users
- [ ] Schedule publish date
- [ ] Set expiration date
- [ ] Pin checkbox
- [ ] Preview before publish

### Targeting System
- [ ] All users (company-wide)
- [ ] By role (multi-select roles)
- [ ] By project (multi-select projects)
- [ ] By users (user picker)
- [ ] Filter query in getAnnouncements

### Read Receipts
- [ ] Track readBy array
- [ ] Increment readCount
- [ ] Show read status on list
- [ ] Show read receipt list (admin view)
- [ ] Who read, when

### Pin/Unpin
- [ ] Pin action (admin/author)
- [ ] Pinned always at top
- [ ] Max pinned limit (e.g., 5)
- [ ] Unpin automatically when limit reached

### Scheduling & Expiration
- [ ] publishedAt for future publish
- [ ] expiresAt for auto-archive
- [ ] Cloud Function for auto-archive
- [ ] Show scheduled announcements (author)

### Dashboard Widget
- [ ] Latest announcements card
- [ ] Unread count badge
- [ ] Quick link to full list

### Notifications
- [ ] Send push notification for urgent
- [ ] Send email for urgent (optional)
- [ ] Notification on new announcement

---

## Testing Requirements

- [ ] Test CRUD operations
- [ ] Test targeting filters
- [ ] Test read receipts
- [ ] Test pin/unpin
- [ ] Test scheduling
- [ ] Test expiration

---

## Acceptance Criteria

- [ ] Announcements with rich text work
- [ ] Cover images uploadable
- [ ] File attachments work
- [ ] **Targeting filters announcements correctly**
- [ ] Read receipts tracked
- [ ] Pin/unpin works
- [ ] Scheduled publishing works
- [ ] Auto-archive on expiration
- [ ] Push notifications for urgent
- [ ] Dashboard widget shows latest
