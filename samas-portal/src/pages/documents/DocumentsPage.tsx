import { FC, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  FolderPlus,
  Upload,
  Grid,
  List,
  File,
  ChevronRight,
  Home,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentViewer } from '@/components/documents/DocumentViewer';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import {
  useFolderDocuments,
  useProjectDocuments,
  useFolders,
  useDeleteDocument,
  useCreateFolder,
  useDeleteFolder,
  useDocumentStats,
} from '@/hooks/useDocuments';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { Document } from '@/types/document';

export const DocumentsPage: FC = () => {
  const { user } = useAuth();
  const { hasPermission, canAccessSensitiveData } = usePermissions();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project') || '';

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: projectId ? 'Project Documents' : 'Documents' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  // Update breadcrumb root name when projectId changes
  useEffect(() => {
    setFolderPath([{ id: null, name: projectId ? 'Project Documents' : 'Documents' }]);
    setCurrentFolderId(null);
  }, [projectId]);

  const canCreate = hasPermission('documents', 'create');
  const canDelete = hasPermission('documents', 'delete');
  const canSeeSensitive = canAccessSensitiveData;

  // When project filter is active, get project documents; otherwise get folder documents
  const { data: projectDocs, isLoading: projectDocsLoading } = useProjectDocuments(projectId);
  const { data: folderDocs, isLoading: folderDocsLoading } = useFolderDocuments(currentFolderId);

  const documents = projectId ? projectDocs : folderDocs;
  const docsLoading = projectId ? projectDocsLoading : folderDocsLoading;

  const { data: folders, isLoading: foldersLoading } = useFolders(currentFolderId, projectId || undefined);
  const { data: stats } = useDocumentStats(projectId || undefined);
  const deleteDocument = useDeleteDocument();
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();

  const isLoading = docsLoading || foldersLoading;

  const filteredDocuments = useMemo(() => {
    let result = documents || [];

    // Filter sensitive documents
    if (!canSeeSensitive) {
      result = result.filter((d) => !d.isSensitive || d.uploadedBy === user?.id);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.description.toLowerCase().includes(query) ||
          d.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return result;
  }, [documents, searchQuery, canSeeSensitive, user?.id]);

  const filteredFolders = useMemo(() => {
    if (!folders) return [];
    if (!searchQuery) return folders;

    const query = searchQuery.toLowerCase();
    return folders.filter((f) => f.name.toLowerCase().includes(query));
  }, [folders, searchQuery]);

  const navigateToFolder = (folderId: string | null, folderName: string) => {
    setCurrentFolderId(folderId);
    if (folderId === null) {
      setFolderPath([{ id: null, name: projectId ? 'Project Documents' : 'Documents' }]);
    } else {
      setFolderPath((prev) => [...prev, { id: folderId, name: folderName }]);
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(newPath[newPath.length - 1].id);
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShowViewer(true);
  };

  const handleDownload = (doc: Document) => {
    window.open(doc.url, '_blank');
  };

  const handleDeleteDocument = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocument.mutateAsync(id);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !user) return;

    await createFolder.mutateAsync({
      name: newFolderName.trim(),
      parentId: currentFolderId,
      createdBy: user.id,
    });

    setNewFolderName('');
    setShowFolderModal(false);
  };

  const handleDeleteFolder = async (id: string) => {
    if (confirm('Are you sure you want to delete this folder and all its contents?')) {
      await deleteFolder.mutateAsync(id);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Documents
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage and organize your files
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <>
              <Button variant="outline" onClick={() => setShowFolderModal(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats - System-wide totals */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              All Documents
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-gray-400">System total</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Storage
            </div>
            <div className="text-2xl font-bold">
              {formatFileSize(stats.totalSize)}
            </div>
            <div className="text-xs text-gray-400">System total</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Uploaded Files</div>
            <div className="text-2xl font-bold">{stats.byType.file}</div>
            <div className="text-xs text-gray-400">System total</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Google Drive
            </div>
            <div className="text-2xl font-bold">
              {stats.byType.google_doc +
                stats.byType.google_sheet +
                stats.byType.google_slide}
            </div>
            <div className="text-xs text-gray-400">System total</div>
          </Card>
        </div>
      )}

      {/* Breadcrumb and search */}
      <div className="flex items-center justify-between gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm">
          {folderPath.map((item, index) => (
            <div key={item.id || 'root'} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
              )}
              <button
                onClick={() => navigateToBreadcrumb(index)}
                className={`flex items-center gap-1 hover:text-blue-600 ${
                  index === folderPath.length - 1
                    ? 'font-medium text-gray-900 dark:text-gray-100'
                    : 'text-gray-500'
                }`}
              >
                {index === 0 && <Home className="h-4 w-4" />}
                {item.name}
              </button>
            </div>
          ))}
        </div>

        {/* Search and view toggle */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredFolders.length === 0 && filteredDocuments.length === 0 ? (
        <Card className="p-12 text-center">
          <File className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {searchQuery ? 'No documents found' : 'This folder is empty'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Upload documents or create folders to get started'}
          </p>
          {canCreate && !searchQuery && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => setShowFolderModal(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
              : 'space-y-2'
          }
        >
          {/* Folders */}
          {filteredFolders.map((folder) => (
            <Card
              key={folder.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigateToFolder(folder.id, folder.name)}
            >
              <div
                className={
                  viewMode === 'grid'
                    ? 'flex flex-col items-center text-center'
                    : 'flex items-center gap-4'
                }
              >
                <div
                  className={`${
                    viewMode === 'grid' ? 'h-16 w-16 mb-3' : 'h-12 w-12'
                  } rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center`}
                >
                  <FolderPlus
                    className={`${
                      viewMode === 'grid' ? 'h-8 w-8' : 'h-6 w-6'
                    } text-yellow-500`}
                  />
                </div>
                <div className={viewMode === 'grid' ? '' : 'flex-1'}>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {folder.name}
                  </h3>
                </div>
                {canDelete && viewMode === 'list' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ))}

          {/* Documents */}
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              view={viewMode}
              onView={() => handleViewDocument(doc)}
              onDownload={() => handleDownload(doc)}
              onDelete={canDelete ? () => handleDeleteDocument(doc.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <DocumentUpload
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        folderId={currentFolderId}
      />

      {/* New Folder Modal */}
      <Dialog open={showFolderModal} onOpenChange={setShowFolderModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription className="sr-only">
              Create a new folder to organize your documents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="folderName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Folder Name
              </label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                }}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setNewFolderName('');
                  setShowFolderModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || createFolder.isPending}
              >
                {createFolder.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Folder'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Viewer */}
      <DocumentViewer
        document={selectedDocument}
        open={showViewer}
        onOpenChange={setShowViewer}
        onDownload={() => selectedDocument && handleDownload(selectedDocument)}
      />
    </div>
  );
};
