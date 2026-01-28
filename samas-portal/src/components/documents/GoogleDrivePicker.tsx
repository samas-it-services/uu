import { FC, useState, useEffect, useCallback } from 'react';
import {
  Search,
  Folder,
  File,
  FileText,
  FileSpreadsheet,
  Presentation,
  ChevronRight,
  Home,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { driveService, DriveFile } from '@/services/google/drive';
import { cn } from '@/lib/utils';

interface GoogleDrivePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (files: DriveFile[]) => void;
  multiple?: boolean;
  fileTypes?: string[];
}

const getFileIcon = (mimeType: string) => {
  if (mimeType === 'application/vnd.google-apps.folder') return Folder;
  if (mimeType === 'application/vnd.google-apps.document') return FileText;
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return FileSpreadsheet;
  if (mimeType === 'application/vnd.google-apps.presentation') return Presentation;
  return File;
};

const getFileColor = (mimeType: string) => {
  if (mimeType === 'application/vnd.google-apps.folder') return 'text-yellow-500';
  if (mimeType === 'application/vnd.google-apps.document') return 'text-blue-500';
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return 'text-green-500';
  if (mimeType === 'application/vnd.google-apps.presentation') return 'text-orange-500';
  return 'text-gray-500';
};

const formatFileSize = (bytes: string | undefined): string => {
  if (!bytes) return '';
  const size = parseInt(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const GoogleDrivePicker: FC<GoogleDrivePickerProps> = ({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  fileTypes,
}) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<DriveFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [folderPath, setFolderPath] = useState<{ id: string | undefined; name: string }[]>([
    { id: undefined, name: 'My Drive' },
  ]);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const loadFiles = useCallback(async (folderId?: string, search?: string) => {
    setLoading(true);
    setError(null);

    try {
      let result;
      if (search) {
        result = await driveService.searchFiles(search);
      } else {
        result = await driveService.listFiles(folderId);
      }

      let filteredFiles = result.files;

      // Filter by file types if specified
      if (fileTypes && fileTypes.length > 0) {
        filteredFiles = filteredFiles.filter(
          (file) =>
            file.mimeType === 'application/vnd.google-apps.folder' ||
            fileTypes.some((type) => file.mimeType.includes(type))
        );
      }

      setFiles(filteredFiles);
    } catch (err) {
      console.error('Error loading Drive files:', err);
      if (err instanceof Error && err.message.includes('sign in')) {
        setHasAccess(false);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load files');
      }
    } finally {
      setLoading(false);
    }
  }, [fileTypes]);

  useEffect(() => {
    if (open) {
      checkAccess();
    } else {
      setSelectedFiles([]);
      setSearchQuery('');
      setCurrentFolderId(undefined);
      setFolderPath([{ id: undefined, name: 'My Drive' }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const checkAccess = async () => {
    const access = await driveService.checkAccess();
    setHasAccess(access);
    if (access) {
      loadFiles();
    }
  };

  const handleReauthenticate = async () => {
    try {
      setLoading(true);
      await driveService.reauthenticate();
      setHasAccess(true);
      loadFiles();
    } catch (err) {
      setError('Failed to authenticate with Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      loadFiles(undefined, query);
    } else if (query.length === 0) {
      loadFiles(currentFolderId);
    }
  };

  const handleFolderClick = (folder: DriveFile) => {
    setCurrentFolderId(folder.id);
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSearchQuery('');
    loadFiles(folder.id);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(newPath[newPath.length - 1].id);
    setSearchQuery('');
    loadFiles(newPath[newPath.length - 1].id);
  };

  const handleFileClick = (file: DriveFile) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      handleFolderClick(file);
      return;
    }

    if (multiple) {
      setSelectedFiles((prev) => {
        const exists = prev.some((f) => f.id === file.id);
        if (exists) {
          return prev.filter((f) => f.id !== file.id);
        }
        return [...prev, file];
      });
    } else {
      setSelectedFiles([file]);
    }
  };

  const handleSelect = () => {
    onSelect(selectedFiles);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img
              src="https://www.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png"
              alt="Google Drive"
              className="h-6 w-6"
            />
            Select from Google Drive
          </DialogTitle>
          <DialogDescription className="sr-only">
            Browse and select files from your Google Drive
          </DialogDescription>
        </DialogHeader>

        {hasAccess === false ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Connect to Google Drive
            </h3>
            <p className="text-gray-500 mb-4">
              Allow access to your Google Drive to browse and select files.
            </p>
            <Button onClick={handleReauthenticate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Google Drive'
              )}
            </Button>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm py-2 overflow-x-auto">
              {folderPath.map((item, index) => (
                <div key={item.id || 'root'} className="flex items-center flex-shrink-0">
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
                  )}
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className={cn(
                      'flex items-center gap-1 hover:text-blue-600',
                      index === folderPath.length - 1
                        ? 'font-medium text-gray-900 dark:text-gray-100'
                        : 'text-gray-500'
                    )}
                  >
                    {index === 0 && <Home className="h-4 w-4" />}
                    {item.name}
                  </button>
                </div>
              ))}
            </div>

            {/* File list */}
            <div className="flex-1 overflow-y-auto min-h-[300px] border rounded-lg">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Spinner size="lg" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                  <p className="text-red-600 mb-2">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadFiles(currentFolderId)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Folder className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500">
                    {searchQuery ? 'No files found' : 'This folder is empty'}
                  </p>
                </div>
              ) : (
                <div className="divide-y dark:divide-gray-700">
                  {files.map((file) => {
                    const Icon = getFileIcon(file.mimeType);
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    const isSelected = selectedFiles.some((f) => f.id === file.id);

                    return (
                      <div
                        key={file.id}
                        onClick={() => handleFileClick(file)}
                        className={cn(
                          'flex items-center gap-3 p-3 cursor-pointer transition-colors',
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                      >
                        {file.thumbnailLink && !isFolder ? (
                          <img
                            src={file.thumbnailLink}
                            alt={file.name}
                            className="h-10 w-10 object-cover rounded"
                          />
                        ) : (
                          <Icon className={cn('h-10 w-10', getFileColor(file.mimeType))} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{file.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                            {file.modifiedTime && (
                              <> - Modified {new Date(file.modifiedTime).toLocaleDateString()}</>
                            )}
                          </div>
                        </div>
                        {isFolder && (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-500">
                {selectedFiles.length > 0 && (
                  <>{selectedFiles.length} file(s) selected</>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSelect}
                  disabled={selectedFiles.length === 0}
                >
                  Select
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
