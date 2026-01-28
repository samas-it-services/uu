import { FC, useCallback, useState } from 'react';
import { Upload, X, File, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUploadDocument } from '@/hooks/useDocuments';

interface DocumentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string | null;
  projectId?: string | null;
  onSuccess?: (documentId: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DocumentUpload: FC<DocumentUploadProps> = ({
  open,
  onOpenChange,
  folderId,
  projectId,
  onSuccess,
}) => {
  const { user } = useAuth();
  const uploadDocument = useUploadDocument();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isSensitive, setIsSensitive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
      if (e.dataTransfer.files.length === 1) {
        setName(e.dataTransfer.files[0].name);
      }
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      if (e.target.files.length === 1) {
        setName(e.target.files[0].name);
      }
    }
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!user || selectedFiles.length === 0) return;

    setUploading(true);
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      for (const file of selectedFiles) {
        const docId = await uploadDocument.mutateAsync({
          file,
          data: {
            name: selectedFiles.length === 1 ? name || file.name : file.name,
            description,
            type: 'file',
            projectId,
            folderId,
            uploadedBy: user.id,
            uploadedByName: user.displayName,
            tags: tagList,
            isSensitive,
          },
        });

        if (onSuccess) {
          onSuccess(docId);
        }
      }

      // Reset form
      setSelectedFiles([]);
      setName('');
      setDescription('');
      setTags('');
      setIsSensitive(false);
      onOpenChange(false);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFiles([]);
      setName('');
      setDescription('');
      setTags('');
      setIsSensitive(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription className="sr-only">
            Upload one or more documents with optional metadata and tags
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          {selectedFiles.length === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              )}
            >
              <input
                type="file"
                id="document-upload"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              <label
                htmlFor="document-upload"
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <Upload className="h-12 w-12 text-gray-400" />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </div>
                <div className="text-xs text-gray-500">
                  Any file type up to 50MB
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Selected files
              </div>
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <File className="h-8 w-8 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                  {!uploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {!uploading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFiles([])}
                >
                  Clear all
                </Button>
              )}
            </div>
          )}

          {/* Form fields */}
          {selectedFiles.length > 0 && (
            <>
              {selectedFiles.length === 1 && (
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Document name"
                    disabled={uploading}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Add a description (optional)"
                  disabled={uploading}
                />
              </div>

              <div>
                <label
                  htmlFor="tags"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Tags
                </label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Enter tags separated by commas"
                  disabled={uploading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sensitive"
                  checked={isSensitive}
                  onCheckedChange={(checked) => setIsSensitive(checked as boolean)}
                  disabled={uploading}
                />
                <label
                  htmlFor="sensitive"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Mark as sensitive (restricted access)
                </label>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length > 1 ? `${selectedFiles.length} files` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
