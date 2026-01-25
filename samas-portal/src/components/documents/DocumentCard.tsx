import { FC } from 'react';
import { format } from 'date-fns';
import {
  File,
  FileText,
  FileSpreadsheet,
  Presentation,
  FormInput,
  Folder,
  Download,
  Share2,
  Trash2,
  Edit,
  Eye,
  Lock,
  Users,
} from 'lucide-react';
import { Document, DocumentType } from '@/types/document';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface DocumentCardProps {
  document: Document;
  onView?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  showActions?: boolean;
  view?: 'grid' | 'list';
}

const typeConfig: Record<DocumentType, { icon: typeof File; color: string; label: string }> = {
  file: { icon: File, color: 'text-gray-500', label: 'File' },
  folder: { icon: Folder, color: 'text-yellow-500', label: 'Folder' },
  google_doc: { icon: FileText, color: 'text-blue-500', label: 'Google Doc' },
  google_sheet: { icon: FileSpreadsheet, color: 'text-green-500', label: 'Google Sheet' },
  google_slide: { icon: Presentation, color: 'text-orange-500', label: 'Google Slides' },
  google_form: { icon: FormInput, color: 'text-purple-500', label: 'Google Form' },
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const getFileIcon = (mimeType: string, type: DocumentType) => {
  if (type !== 'file') {
    return typeConfig[type].icon;
  }

  if (mimeType.startsWith('image/')) return File;
  if (mimeType === 'application/pdf') return FileText;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return Presentation;
  return File;
};

export const DocumentCard: FC<DocumentCardProps> = ({
  document,
  onView,
  onEdit,
  onShare,
  onDelete,
  onDownload,
  showActions = true,
  view = 'list',
}) => {
  const config = typeConfig[document.type];
  const Icon = getFileIcon(document.mimeType, document.type);

  if (view === 'grid') {
    return (
      <Card
        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={onView}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={cn(
              'h-16 w-16 rounded-lg flex items-center justify-center mb-3',
              'bg-gray-100 dark:bg-gray-800'
            )}
          >
            <Icon className={cn('h-8 w-8', config.color)} />
          </div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate w-full mb-1">
            {document.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(document.size)}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {document.isSensitive && (
              <Lock className="h-3 w-3 text-red-500" />
            )}
            {document.sharedWith.length > 0 && (
              <Users className="h-3 w-3 text-blue-500" />
            )}
            {document.version > 1 && (
              <Badge variant="secondary" className="text-xs">
                v{document.version}
              </Badge>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onView}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className={cn(
            'h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0',
            'bg-gray-100 dark:bg-gray-800'
          )}
        >
          <Icon className={cn('h-6 w-6', config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {document.name}
            </h3>
            {document.isSensitive && (
              <Badge variant="destructive" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Sensitive
              </Badge>
            )}
            {document.version > 1 && (
              <Badge variant="secondary" className="text-xs">
                v{document.version}
              </Badge>
            )}
          </div>

          {document.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
              {document.description}
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>{formatFileSize(document.size)}</span>
            <span>{document.uploadedByName}</span>
            <span>{format(document.updatedAt.toDate(), 'MMM d, yyyy')}</span>
            {document.sharedWith.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {document.sharedWith.length} shared
              </span>
            )}
          </div>

          {document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {document.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {document.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{document.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {onView && (
              <Button variant="ghost" size="sm" onClick={onView} title="View">
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onShare && (
              <Button variant="ghost" size="sm" onClick={onShare} title="Share">
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit} title="Edit">
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                title="Delete"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
