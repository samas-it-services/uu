# Agent 5: Documents Module Agent Checklist
## Document Management & Google Drive Integration Specialist

---

## Role Overview

**Responsibilities**: File upload/download, folder management, version control, access control, Google Drive integration, document search.

**Files Owned**:
- `src/pages/documents/**`
- `src/components/modules/documents/**`
- `src/services/api/documents.ts`
- `src/services/google/drive.ts`
- `src/hooks/useDocuments.ts`
- `src/types/document.ts`

---

## Phase 3 Tasks

### Data Models
- [ ] Create `src/types/document.ts`:
  ```typescript
  interface Document {
    id: string;
    projectId?: string;
    folderId?: string;
    name: string;
    path: string;
    mimeType: string;
    size: number;
    category: DocumentCategory;
    tags: string[];
    description?: string;
    version: number;
    versions: DocumentVersion[];
    accessLevel: AccessLevel;
    accessList: string[];
    googleDriveFileId?: string;
    isSensitive: boolean;
    uploadedBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }
  
  type DocumentCategory = 'policy' | 'template' | 'form' | 'contract' | 'spec' | 'deliverable' | 'other';
  type AccessLevel = 'private' | 'project' | 'company' | 'public';
  ```

### API Service
- [ ] Create `src/services/api/documents.ts`
- [ ] Implement `getDocuments(folderId, projectId)`
- [ ] Implement `getDocumentById(id)`
- [ ] Implement `searchDocuments(query)` - full-text search
- [ ] Implement `createDocument(data, file)`
- [ ] Implement `updateDocument(id, data)`
- [ ] Implement `deleteDocument(id)`
- [ ] Implement `createFolder(name, parentId, projectId)`
- [ ] Implement `moveDocument(id, targetFolderId)`
- [ ] Implement `copyDocument(id, targetFolderId)`
- [ ] Implement `shareDocument(id, users, accessLevel)`

### React Query Hooks
- [ ] Create `src/hooks/useDocuments.ts`
- [ ] `useDocuments(folderId, projectId)`
- [ ] `useDocument(id)`
- [ ] `useDocumentSearch(query)`
- [ ] `useFolders(parentId, projectId)`
- [ ] `useUploadDocument()` - mutation
- [ ] `useCreateFolder()` - mutation
- [ ] `useDeleteDocument()` - mutation
- [ ] `useMoveDocument()` - mutation

### File Upload Service
- [ ] Create `uploadDocument(file, metadata)` function
- [ ] Validate file type
- [ ] Validate file size (max 50MB)
- [ ] Generate unique storage path
- [ ] Upload to Firebase Storage
- [ ] Create Firestore document
- [ ] Handle upload progress callback
- [ ] Support multi-file upload
- [ ] Handle upload cancellation

### Document Library Page
- [ ] Create `src/pages/documents/DocumentsPage.tsx`
- [ ] Implement folder tree sidebar
- [ ] Implement file grid/list view
- [ ] Add view toggle (grid/list)
- [ ] Add sort options (name, date, size)
- [ ] Add search input
- [ ] Add category filter
- [ ] Show breadcrumb navigation
- [ ] Handle empty states

### File Operations UI
- [ ] Implement drag-and-drop upload zone
- [ ] Show upload progress
- [ ] File preview modal (images, PDFs)
- [ ] Google Docs viewer integration for Office files
- [ ] Download single file
- [ ] Download multiple as ZIP
- [ ] Rename file/folder
- [ ] Move file/folder (drag or modal)
- [ ] Delete with confirmation

### Version Control
- [ ] Auto-increment version on re-upload
- [ ] Store previous versions in subcollection
- [ ] Create version history viewer
- [ ] Allow restore previous version
- [ ] Show version comparison (optional)
- [ ] Limit versions retained (e.g., last 10)

### Access Control
- [ ] Implement access level selection on upload
- [ ] Create share modal with user picker
- [ ] Generate external share links with expiry
- [ ] Show access indicator on files
- [ ] Respect project-scoped access
- [ ] Mark sensitive documents
- [ ] Hide sensitive docs from non-privileged users

### Folder Management
- [ ] Create folder tree component
- [ ] Implement folder CRUD
- [ ] Support nested folders
- [ ] Drag to move into folders
- [ ] Show folder file counts
- [ ] Folder-level access control

### Document Search
- [ ] Implement search input with debounce
- [ ] Search by filename
- [ ] Search by tags
- [ ] Search by description
- [ ] Filter search results
- [ ] Highlight matches

### Google Drive Integration
- [ ] Create `src/services/google/drive.ts`
- [ ] Implement `createProjectFolder(projectName)`
- [ ] Implement `listFiles(folderId)`
- [ ] Implement `uploadFile(folderId, file)`
- [ ] Implement `downloadFile(fileId)`
- [ ] Implement `deleteFile(fileId)`
- [ ] Link project folders to Drive
- [ ] Two-way sync (optional)
- [ ] "Import from Drive" feature
- [ ] "Open in Google Docs" link

### Project-Scoped Documents
- [ ] Ensure project documents isolated
- [ ] Project managers see only their project docs
- [ ] Company documents visible to all
- [ ] Personal documents private by default

---

## Testing Requirements

- [ ] Test file upload (various types/sizes)
- [ ] Test folder operations
- [ ] Test version control
- [ ] Test access control enforcement
- [ ] Test search functionality
- [ ] Test Google Drive integration
- [ ] Test project-scoped access

---

## Acceptance Criteria

- [ ] Documents upload via drag & drop
- [ ] Multi-file upload works
- [ ] Upload progress shown
- [ ] Folder navigation works
- [ ] Version history maintained
- [ ] Previous versions restorable
- [ ] Search returns relevant results
- [ ] Access control per document enforced
- [ ] Project documents scoped correctly
- [ ] Sensitive documents hidden from non-privileged
- [ ] Google Drive folders link to projects
- [ ] Files open in Google Docs viewer
