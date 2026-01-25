import { FC, useRef, useState } from 'react';
import { format } from 'date-fns';
import {
  Upload,
  File,
  Image,
  FileText,
  Trash2,
  Download,
  Loader2,
} from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/services/firebase/config';
import { TaskAttachment } from '@/types/task';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useAddAttachment, useRemoveAttachment } from '@/hooks/useTasks';

interface TaskAttachmentsProps {
  taskId: string;
  attachments: TaskAttachment[];
  canEdit?: boolean;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.includes('pdf') || type.includes('document')) return FileText;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const TaskAttachments: FC<TaskAttachmentsProps> = ({
  taskId,
  attachments,
  canEdit = false,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const addAttachment = useAddAttachment();
  const removeAttachment = useRemoveAttachment();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Max file size: 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const storageRef = ref(
        storage,
        `tasks/${taskId}/${Date.now()}_${file.name}`
      );

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          alert('Failed to upload file');
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addAttachment.mutateAsync({
            taskId,
            name: file.name,
            url: downloadURL,
            type: file.type,
            size: file.size,
          });
          setUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async (attachmentId: string) => {
    if (confirm('Are you sure you want to remove this attachment?')) {
      await removeAttachment.mutateAsync({ taskId, attachmentId });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          Attachments ({attachments.length})
        </h4>
        {canEdit && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {uploading ? `${Math.round(uploadProgress)}%` : 'Upload'}
            </Button>
          </>
        )}
      </div>

      {uploading && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {attachments.map((attachment) => {
          const FileIcon = getFileIcon(attachment.type);
          const isImage = attachment.type.startsWith('image/');

          return (
            <Card
              key={attachment.id}
              className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {isImage ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="h-10 w-10 object-cover rounded"
                />
              ) : (
                <div className="h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                  <FileIcon className="h-5 w-5 text-gray-500" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.name}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(attachment.size)} &bull;{' '}
                  {format(attachment.uploadedAt.toDate(), 'MMM d, yyyy')}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={attachment.name}
                >
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(attachment.id)}
                    disabled={removeAttachment.isPending}
                    className="text-red-500 hover:text-red-600"
                  >
                    {removeAttachment.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}

        {attachments.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No attachments yet
          </p>
        )}
      </div>
    </div>
  );
};
