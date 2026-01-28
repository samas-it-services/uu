import { FC, useState, useEffect } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Link,
  Unlink,
  Check,
  AlertCircle,
  Loader2,
  FolderSync,
  Settings,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { driveService, DriveFile } from '@/services/google/drive';
import { GoogleDrivePicker } from './GoogleDrivePicker';
import { cn } from '@/lib/utils';

interface DriveSyncProps {
  projectId?: string;
  onSyncComplete?: () => void;
}

interface SyncConfig {
  enabled: boolean;
  driveFolderId: string | null;
  driveFolderName: string | null;
  autoSync: boolean;
  syncInterval: number; // in minutes
  lastSyncAt: Date | null;
}

export const DriveSync: FC<DriveSyncProps> = ({
  projectId: _projectId,
  onSyncComplete,
}) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [syncConfig, setSyncConfig] = useState<SyncConfig>({
    enabled: false,
    driveFolderId: null,
    driveFolderName: null,
    autoSync: false,
    syncInterval: 60,
    lastSyncAt: null,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [storageQuota, setStorageQuota] = useState<{
    limit: number;
    usage: number;
  } | null>(null);

  useEffect(() => {
    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAccess = async () => {
    const access = await driveService.checkAccess();
    setHasAccess(access);

    if (access) {
      loadStorageQuota();
    }
  };

  const loadStorageQuota = async () => {
    try {
      const quota = await driveService.getStorageQuota();
      setStorageQuota({
        limit: quota.limit,
        usage: quota.usage,
      });
    } catch (err) {
      console.error('Error loading storage quota:', err);
    }
  };

  const handleConnect = async () => {
    try {
      await driveService.reauthenticate();
      setHasAccess(true);
      loadStorageQuota();
    } catch (err) {
      setError('Failed to connect to Google Drive');
    }
  };

  const handleDisconnect = () => {
    setSyncConfig({
      ...syncConfig,
      enabled: false,
      driveFolderId: null,
      driveFolderName: null,
    });
    setHasAccess(false);
  };

  const handleFolderSelect = (files: DriveFile[]) => {
    if (files.length > 0) {
      const folder = files[0];
      setSyncConfig({
        ...syncConfig,
        enabled: true,
        driveFolderId: folder.id,
        driveFolderName: folder.name,
      });
    }
    setShowPicker(false);
  };

  const handleSync = async () => {
    if (!syncConfig.driveFolderId) return;

    setIsSyncing(true);
    setSyncStatus('syncing');
    setError(null);

    try {
      // Get files from Drive folder
      await driveService.listFiles(syncConfig.driveFolderId);

      // Here you would implement the actual sync logic:
      // 1. Compare Drive files with local documents
      // 2. Download new/updated files from Drive
      // 3. Upload new/updated local files to Drive
      // 4. Update metadata in Firestore

      // For now, just simulate the sync
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSyncConfig({
        ...syncConfig,
        lastSyncAt: new Date(),
      });
      setSyncStatus('success');

      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (err) {
      console.error('Sync error:', err);
      setSyncStatus('error');
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatStorageSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const usagePercent = storageQuota
    ? (storageQuota.usage / storageQuota.limit) * 100
    : 0;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold">Google Drive Sync</h3>
          {syncConfig.enabled && (
            <Badge variant="success" className="text-xs">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {hasAccess === false ? (
        <div className="text-center py-4">
          <CloudOff className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-3">
            Connect to Google Drive to sync your documents
          </p>
          <Button onClick={handleConnect}>
            <Link className="h-4 w-4 mr-2" />
            Connect Drive
          </Button>
        </div>
      ) : syncConfig.enabled ? (
        <div className="space-y-4">
          {/* Linked folder */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <FolderSync className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="font-medium text-sm">
                  {syncConfig.driveFolderName}
                </div>
                <div className="text-xs text-gray-500">
                  {syncConfig.lastSyncAt
                    ? `Last synced: ${syncConfig.lastSyncAt.toLocaleString()}`
                    : 'Never synced'}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPicker(true)}
            >
              Change
            </Button>
          </div>

          {/* Sync status */}
          {syncStatus === 'success' && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Sync completed successfully
            </div>
          )}
          {syncStatus === 'error' && error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Storage quota */}
          {storageQuota && (
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Storage used</span>
                <span>
                  {formatStorageSize(storageQuota.usage)} of{' '}
                  {formatStorageSize(storageQuota.limit)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    usagePercent > 90
                      ? 'bg-red-500'
                      : usagePercent > 70
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  )}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Sync button */}
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-3">
            Select a Google Drive folder to sync with this project
          </p>
          <Button onClick={() => setShowPicker(true)}>
            <FolderSync className="h-4 w-4 mr-2" />
            Select Folder
          </Button>
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drive Sync Settings</DialogTitle>
            <DialogDescription className="sr-only">
              Configure Google Drive synchronization settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto Sync</div>
                <div className="text-sm text-gray-500">
                  Automatically sync changes
                </div>
              </div>
              <Checkbox
                checked={syncConfig.autoSync}
                onCheckedChange={(checked) =>
                  setSyncConfig({ ...syncConfig, autoSync: checked as boolean })
                }
              />
            </div>

            {syncConfig.autoSync && (
              <div>
                <label className="text-sm font-medium">
                  Sync Interval (minutes)
                </label>
                <Input
                  type="number"
                  min={5}
                  max={1440}
                  value={syncConfig.syncInterval}
                  onChange={(e) =>
                    setSyncConfig({
                      ...syncConfig,
                      syncInterval: parseInt(e.target.value) || 60,
                    })
                  }
                  className="mt-1"
                />
              </div>
            )}

            {syncConfig.enabled && (
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  className="w-full"
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect Drive
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Folder Picker */}
      <GoogleDrivePicker
        open={showPicker}
        onOpenChange={setShowPicker}
        onSelect={handleFolderSelect}
        fileTypes={['application/vnd.google-apps.folder']}
      />
    </Card>
  );
};
