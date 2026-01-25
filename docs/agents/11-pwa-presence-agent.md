# Agent 11: PWA & Presence Agent Checklist
## Progressive Web App & Real-Time Features Specialist

---

## Role Overview

**Responsibilities**: PWA configuration, service worker, offline support, push notifications, online presence, activity tracking.

**Files Owned**:
- `vite.config.ts` (PWA config)
- `public/manifest.json`
- `public/icons/**`
- `src/sw.ts`
- `src/services/notifications.ts`
- `src/services/api/presence.ts`
- `src/hooks/usePresence.ts`
- `src/hooks/useOnlineUsers.ts`
- `src/hooks/useActivityFeed.ts`
- `src/contexts/PresenceContext.tsx`
- `src/components/modules/presence/**`

---

## Phase 6 Tasks

### PWA Configuration
- [ ] Install `vite-plugin-pwa`
- [ ] Configure Vite PWA plugin:
  ```typescript
  VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'SaMas IT Services Portal',
      short_name: 'SaMas Portal',
      description: 'Company portal for SaMas IT Services',
      theme_color: '#2563eb',
      background_color: '#ffffff',
      display: 'standalone',
      // ... icons
    },
    workbox: {
      // caching strategies
    }
  })
  ```
- [ ] Generate PWA icons (all sizes)
- [ ] Create manifest.json
- [ ] Configure app scope and start_url

### PWA Icons
- [ ] 72x72 icon
- [ ] 96x96 icon
- [ ] 128x128 icon
- [ ] 144x144 icon
- [ ] 152x152 icon
- [ ] 192x192 icon
- [ ] 384x384 icon
- [ ] 512x512 icon (maskable)
- [ ] Apple touch icon
- [ ] Favicon

### Service Worker
- [ ] Configure Workbox caching:
  - [ ] Cache app shell (HTML, CSS, JS)
  - [ ] Cache static assets
  - [ ] Network-first for API calls
  - [ ] Cache-first for images
- [ ] Create offline fallback page
- [ ] Handle update notifications

### Offline Support
- [ ] Cache recently viewed data
- [ ] Show cached data when offline
- [ ] Queue actions for sync
- [ ] Offline indicator banner
- [ ] Sync when back online

### Push Notifications
- [ ] Set up Firebase Cloud Messaging
- [ ] Request notification permission
- [ ] Handle permission denied gracefully
- [ ] Store FCM token in user document
- [ ] Handle token refresh
- [ ] Create notification service
- [ ] Handle foreground notifications
- [ ] Handle background notifications
- [ ] Deep link from notification

### Cloud Functions for Notifications
- [ ] Task assignment notification
- [ ] Expense status change notification
- [ ] New announcement notification
- [ ] Comment mention notification
- [ ] Maintenance reminder notification

### Presence Data Model
- [ ] Create `src/types/presence.ts`:
  ```typescript
  interface Presence {
    id: string;
    status: PresenceStatus;
    statusMessage?: string;
    statusEmoji?: string;
    statusExpiry?: Timestamp;
    lastSeen: Timestamp;
    currentPage: string;
    currentProject?: string;
    currentTask?: string;
    device: DeviceInfo;
    heartbeat: Timestamp;
  }
  
  type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';
  ```

### Presence Service
- [ ] Create `src/services/api/presence.ts`
- [ ] `updatePresence(data)`
- [ ] `getOnlineUsers()`
- [ ] `getPresence(userId)`
- [ ] `setStatus(status, message?, expiry?)`
- [ ] `clearStatus()`

### usePresence Hook
- [ ] Create `src/hooks/usePresence.ts`
- [ ] Update presence on mount
- [ ] Heartbeat every 30 seconds
- [ ] Track current page
- [ ] Idle detection (5 min → away)
- [ ] Offline detection (30 min)
- [ ] Cleanup on unmount
- [ ] Set offline on tab close

### useOnlineUsers Hook
- [ ] Create `src/hooks/useOnlineUsers.ts`
- [ ] Query users with recent heartbeat
- [ ] Real-time subscription
- [ ] Refresh every 30 seconds
- [ ] Group by status

### useActivityFeed Hook
- [ ] Create `src/hooks/useActivityFeed.ts`
- [ ] Real-time subscription to activities
- [ ] Filter by project (optional)
- [ ] Limit and pagination

### Presence Context
- [ ] Create `src/contexts/PresenceContext.tsx`
- [ ] Provide current user presence
- [ ] Provide online users list
- [ ] Provide presence actions

### Presence Components
- [ ] `OnlineIndicator` - status dot (green/yellow/red/gray)
- [ ] `PresenceAvatar` - avatar with status indicator
- [ ] `TeamPresence` - list of online team members
- [ ] `StatusSelector` - dropdown to change status
- [ ] `StatusBadge` - current status display
- [ ] `LastSeen` - "Last seen 5 min ago"

### Activity Components
- [ ] `ActivityFeed` - real-time activity list
- [ ] `ActivityItem` - single activity entry
- [ ] `ActivityIcon` - action-based icon
- [ ] `ActivityFilters` - filter controls

### Activity Types
- [ ] Task created/updated/completed
- [ ] Comment added
- [ ] Document uploaded
- [ ] Expense submitted/approved
- [ ] Announcement published
- [ ] User joined project
- [ ] Asset assigned

### Dashboard Integration
- [ ] Add online users widget
- [ ] Add activity feed widget
- [ ] Show user's current status
- [ ] Status quick-change

### Project Integration
- [ ] Show online project members
- [ ] Project activity feed
- [ ] Who's viewing what

### PWA Install Prompt
- [ ] Detect installability
- [ ] Show install banner
- [ ] "Install" button
- [ ] Track install events
- [ ] Hide after install

### Update Prompt
- [ ] Detect new version
- [ ] Show update banner
- [ ] "Update" button
- [ ] Refresh to update

---

## Testing Requirements

- [ ] Test PWA installability
- [ ] Test offline mode
- [ ] Test push notifications
- [ ] Test presence updates
- [ ] Test activity feed real-time
- [ ] Test on mobile devices

---

## Acceptance Criteria

- [ ] **PWA installable on iOS and Android**
- [ ] PWA icon on home screen
- [ ] Offline shows cached content
- [ ] **Push notifications work on mobile**
- [ ] Notification permission requested
- [ ] **Online status shows correctly**
- [ ] Away/offline auto-detection works
- [ ] Custom status can be set
- [ ] **Activity feed updates real-time**
- [ ] Install prompt appears
- [ ] Update prompt appears
- [ ] Lighthouse PWA score > 90
