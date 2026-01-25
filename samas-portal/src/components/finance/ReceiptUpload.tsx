import { FC, useCallback, useState } from 'react';
import { Upload, X, File, Image, FileText, Loader2 } from 'lucide-react';
import { ExpenseReceipt } from '@/types/expense';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ReceiptUploadProps {
  receipts: ExpenseReceipt[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (receiptId: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type === 'application/pdf') return FileText;
  return File;
};

export const ReceiptUpload: FC<ReceiptUploadProps> = ({
  receipts,
  onUpload,
  onDelete,
  disabled = false,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = ['image/*', 'application/pdf'],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const canUploadMore = receipts.length < maxFiles;

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    const isAccepted = acceptedTypes.some((type) => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return 'File type not supported. Please upload images or PDFs.';
    }

    return null;
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!canUploadMore) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      setError(null);
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }

        if (receipts.length + 1 > maxFiles) {
          setError(`Maximum ${maxFiles} files allowed`);
          break;
        }

        try {
          setUploading(true);
          await onUpload(file);
        } catch {
          setError('Failed to upload file');
        } finally {
          setUploading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canUploadMore, maxFiles, onUpload, receipts.length]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!disabled && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [disabled, handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        e.target.value = '';
      }
    },
    [handleFiles]
  );

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600',
          disabled || !canUploadMore
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'
        )}
      >
        <input
          type="file"
          id="receipt-upload"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          disabled={disabled || !canUploadMore || uploading}
          className="hidden"
        />
        <label
          htmlFor="receipt-upload"
          className={cn(
            'flex flex-col items-center gap-2',
            !disabled && canUploadMore && 'cursor-pointer'
          )}
        >
          {uploading ? (
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          ) : (
            <Upload className="h-10 w-10 text-gray-400" />
          )}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {uploading ? (
              'Uploading...'
            ) : canUploadMore ? (
              <>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  Click to upload
                </span>{' '}
                or drag and drop
              </>
            ) : (
              'Maximum number of files reached'
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Images or PDFs up to {maxSizeMB}MB ({receipts.length}/{maxFiles} files)
          </div>
        </label>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {/* Uploaded files */}
      {receipts.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploaded receipts
          </div>
          <div className="space-y-2">
            {receipts.map((receipt) => {
              const FileIcon = getFileIcon(receipt.type);
              return (
                <div
                  key={receipt.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  {receipt.type.startsWith('image/') ? (
                    <img
                      src={receipt.url}
                      alt={receipt.name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <FileIcon className="h-10 w-10 text-gray-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <a
                      href={receipt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block"
                    >
                      {receipt.name}
                    </a>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(receipt.size)}
                    </div>
                  </div>
                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(receipt.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
