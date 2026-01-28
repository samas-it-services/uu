import { FC, useState } from 'react';
import { format } from 'date-fns';
import {
  Download,
  Share2,
  Clock,
  User,
  Folder,
  Tag,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Upload,
  History,
} from 'lucide-react';
import { Document } from '@/types/document';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

interface DocumentViewerProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: () => void;
  onShare?: () => void;
  onUploadNewVersion?: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const isPreviewable = (mimeType: string): boolean => {
  return (
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/')
  );
};

export const DocumentViewer: FC<DocumentViewerProps> = ({
  document,
  open,
  onOpenChange,
  onDownload,
  onShare,
  onUploadNewVersion,
}) => {
  const [showVersions, setShowVersions] = useState(false);

  if (!document) return null;

  const canPreview = isPreviewable(document.mimeType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {document.name}
              {document.isSensitive && (
                <Badge variant="destructive">
                  <Lock className="h-3 w-3 mr-1" />
                  Sensitive
                </Badge>
              )}
              {document.version > 1 && (
                <Badge variant="secondary">v{document.version}</Badge>
              )}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            View document details, preview content, and manage sharing
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Preview area */}
          <div className="flex-1 min-w-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            {canPreview ? (
              <div className="h-full flex items-center justify-center p-4">
                {document.mimeType.startsWith('image/') ? (
                  <img
                    src={document.url}
                    alt={document.name}
                    className="max-w-full max-h-[500px] object-contain"
                  />
                ) : document.mimeType === 'application/pdf' ? (
                  <iframe
                    src={document.url}
                    className="w-full h-[500px] border-0"
                    title={document.name}
                  />
                ) : document.mimeType.startsWith('video/') ? (
                  <video
                    src={document.url}
                    controls
                    className="max-w-full max-h-[500px]"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : document.mimeType.startsWith('audio/') ? (
                  <audio src={document.url} controls>
                    Your browser does not support the audio element.
                  </audio>
                ) : (
                  <iframe
                    src={document.url}
                    className="w-full h-[500px] border-0"
                    title={document.name}
                  />
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="text-gray-400 mb-4">
                  Preview not available for this file type
                </div>
                <Button onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download to view
                </Button>
              </div>
            )}
          </div>

          {/* Details sidebar */}
          <div className="w-72 flex-shrink-0 overflow-y-auto">
            {/* Actions */}
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              {document.googleDriveId && (
                <a
                  href={`https://drive.google.com/file/d/${document.googleDriveId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>

            {/* Description */}
            {document.description && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {document.description}
                </p>
              </div>
            )}

            {/* Details */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <User className="h-4 w-4" />
                <span>Uploaded by {document.uploadedByName}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>
                  {format(document.createdAt.toDate(), 'MMM d, yyyy h:mm a')}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Folder className="h-4 w-4" />
                <span>{formatFileSize(document.size)}</span>
              </div>

              {document.tags.length > 0 && (
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {document.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Shared with */}
            {document.sharedWith.length > 0 && (
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Shared with ({document.sharedWith.length})
                </div>
                <div className="space-y-2">
                  {document.sharedWith.map((share) => (
                    <div
                      key={share.userId}
                      className="flex items-center gap-2"
                    >
                      <Avatar size="sm" fallback={share.userName} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{share.userName}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {share.permission}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Version history */}
            {document.previousVersions.length > 0 && (
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <button
                  onClick={() => setShowVersions(!showVersions)}
                  className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <span className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Version History ({document.version} versions)
                  </span>
                  {showVersions ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {showVersions && (
                  <div className="mt-2 space-y-2">
                    {/* Current version */}
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">v{document.version} (Current)</span>
                        <span className="text-gray-500">
                          {format(document.updatedAt.toDate(), 'MMM d')}
                        </span>
                      </div>
                      <div className="text-gray-500">{formatFileSize(document.size)}</div>
                    </div>

                    {/* Previous versions */}
                    {document.previousVersions
                      .slice()
                      .reverse()
                      .map((version) => (
                        <div
                          key={version.version}
                          className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">v{version.version}</span>
                            <span className="text-gray-500">
                              {format(version.uploadedAt.toDate(), 'MMM d')}
                            </span>
                          </div>
                          <div className="text-gray-500">{formatFileSize(version.size)}</div>
                          {version.notes && (
                            <div className="mt-1 text-gray-600 dark:text-gray-400">
                              {version.notes}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Upload new version button */}
            {onUploadNewVersion && (
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUploadNewVersion}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Version
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
