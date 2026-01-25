# Agent 7: Assets Module Agent Checklist
## Asset & Inventory Management Specialist

---

## Role Overview

**Responsibilities**: Asset inventory, project-scoped assets, QR code generation, assignment workflow, maintenance tracking.

**Files Owned**:
- `src/pages/assets/**`
- `src/components/modules/assets/**`
- `src/services/api/assets.ts`
- `src/hooks/useAssets.ts`
- `src/types/asset.ts`

---

## Phase 5 Tasks

### Data Models
- [ ] Create `src/types/asset.ts`:
  ```typescript
  interface Asset {
    id: string;
    name: string;
    type: AssetType;
    category: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    status: AssetStatus;
    assignedTo?: string;
    assignedToProject?: string;
    assignedAt?: Timestamp;
    assignmentHistory: AssetAssignment[];
    purchaseDate: Timestamp;
    purchasePrice: number;
    currentValue: number;
    depreciationRate: number;
    lastMaintenance?: Timestamp;
    nextMaintenance?: Timestamp;
    maintenanceHistory: MaintenanceRecord[];
    qrCodeURL: string;
    images: string[];
    notes: string;
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }
  
  type AssetType = 'laptop' | 'phone' | 'monitor' | 'license' | 'equipment' | 'vehicle' | 'other';
  type AssetStatus = 'available' | 'assigned' | 'maintenance' | 'retired';
  ```

### API Service
- [ ] Create `src/services/api/assets.ts`
- [ ] `getAssets(filters)` - respects role access
- [ ] `getAssetById(id)`
- [ ] `getProjectAssets(projectId)` - project-scoped
- [ ] `getUserAssets(userId)` - assigned to user
- [ ] `createAsset(data)` - generates QR
- [ ] `updateAsset(id, data)`
- [ ] `deleteAsset(id)` - admin only
- [ ] `assignAsset(id, userId?, projectId?)`
- [ ] `unassignAsset(id)`
- [ ] `transferAsset(id, newProjectId)`
- [ ] `scheduleMaintenance(id, date, type)`
- [ ] `recordMaintenance(id, record)`

### React Query Hooks
- [ ] Create `src/hooks/useAssets.ts`
- [ ] `useAssets(filters)`
- [ ] `useAsset(id)`
- [ ] `useProjectAssets(projectId)`
- [ ] `useMyAssets()`
- [ ] `useCreateAsset()` - mutation
- [ ] `useUpdateAsset()` - mutation
- [ ] `useAssignAsset()` - mutation
- [ ] `useScheduleMaintenance()` - mutation

### QR Code Generation
- [ ] Install `qrcode` library
- [ ] Create `generateQRCode(assetId)` function
- [ ] QR links to asset detail page
- [ ] Upload QR image to Storage
- [ ] Store QR URL in asset document
- [ ] Regenerate QR if needed

### Asset List Page
- [ ] Create `src/pages/assets/AssetsPage.tsx`
- [ ] Grid view with asset cards
- [ ] List view with table
- [ ] Filter by type
- [ ] Filter by status
- [ ] Filter by project
- [ ] Search by name/serial
- [ ] Different views per role:
  - [ ] Super Admin: all assets
  - [ ] Finance: all assets (read-only)
  - [ ] Project Manager: only project assets
  - [ ] Employee: only assigned assets

### Asset Detail Page
- [ ] Create `src/pages/assets/AssetDetailPage.tsx`
- [ ] Display all asset info
- [ ] Show images gallery
- [ ] Display QR code
- [ ] Assignment history timeline
- [ ] Maintenance history
- [ ] Current value calculation
- [ ] Edit form (if authorized)

### New Asset Form
- [ ] Create `src/pages/assets/NewAssetPage.tsx`
- [ ] All asset fields
- [ ] Image upload (multiple)
- [ ] Auto-generate QR on create
- [ ] Form validation

### Project-Scoped Assets
- [ ] Create `projects/{id}/assets` subcollection
- [ ] Assign assets to projects
- [ ] Project managers see only their project assets
- [ ] Filter global list by project
- [ ] Transfer asset between projects

### Assignment Workflow
- [ ] "Assign" button on available assets
- [ ] User picker modal
- [ ] Project picker (optional)
- [ ] Record assignment with timestamp
- [ ] Notification to assignee
- [ ] "Return" button on assigned assets
- [ ] Assignment history tracking

### QR Code Features
- [ ] Display QR on asset card
- [ ] Enlarge QR modal
- [ ] Download QR as image
- [ ] Print single QR
- [ ] Batch print QR codes (multiple assets)
- [ ] QR scanner on mobile (PWA)
- [ ] Scan opens asset detail

### Maintenance Tracking
- [ ] Schedule future maintenance
- [ ] Show upcoming maintenance
- [ ] Dashboard widget for due maintenance
- [ ] Record maintenance when done
- [ ] Maintenance cost tracking
- [ ] Maintenance history view

### Depreciation
- [ ] Calculate current value
- [ ] Depreciation rate input
- [ ] Show depreciation over time
- [ ] Value chart (optional)

---

## Testing Requirements

- [ ] Test asset CRUD
- [ ] Test QR code generation
- [ ] Test assignment workflow
- [ ] Test project-scoped access
- [ ] Test maintenance scheduling

---

## Acceptance Criteria

- [ ] Assets can be created with all details
- [ ] Images upload correctly
- [ ] QR codes generated automatically
- [ ] QR codes downloadable/printable
- [ ] Assets assignable to users and projects
- [ ] **Project managers see only their project's assets**
- [ ] Assignment history tracked
- [ ] Maintenance scheduling works
- [ ] Depreciation calculates correctly
