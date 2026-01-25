import { FC, useState } from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { calendarService } from '@/services/google/calendar';
import { useToast } from '@/hooks/useToast';

interface CalendarSyncProps {
  projectName: string;
  deadline?: Timestamp | null;
  milestones?: {
    id: string;
    title: string;
    dueDate: Timestamp;
    isCompleted: boolean;
    calendarEventId?: string;
  }[];
}

interface SyncStatus {
  milestonesSynced: number;
  deadlineSynced: boolean;
  lastSyncedAt: Date | null;
}

export const CalendarSync: FC<CalendarSyncProps> = ({
  projectName,
  deadline,
  milestones = [],
}) => {
  const { success, error } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    milestonesSynced: 0,
    deadlineSynced: false,
    lastSyncedAt: null,
  });

  const handleConnect = async () => {
    try {
      await calendarService.reauthenticate();
      setIsConnected(true);
      success('Connected to Google Calendar');
    } catch (err) {
      error('Failed to connect to Google Calendar');
    }
  };

  const handleSyncAll = async () => {
    if (!isConnected) {
      await handleConnect();
    }

    setIsSyncing(true);
    let synced = 0;
    let deadlineSynced = false;

    try {
      // Sync deadline
      if (deadline) {
        try {
          await calendarService.createDeadlineEvent(
            projectName,
            deadline.toDate()
          );
          deadlineSynced = true;
        } catch (err) {
          console.error('Failed to sync deadline:', err);
        }
      }

      // Sync milestones
      for (const milestone of milestones) {
        if (!milestone.isCompleted && !milestone.calendarEventId) {
          try {
            await calendarService.createMilestoneEvent(
              milestone.title,
              milestone.dueDate.toDate(),
              projectName
            );
            synced++;
          } catch (err) {
            console.error(`Failed to sync milestone ${milestone.title}:`, err);
          }
        }
      }

      setSyncStatus({
        milestonesSynced: synced,
        deadlineSynced,
        lastSyncedAt: new Date(),
      });

      success(`Synced ${synced} milestone(s) and ${deadlineSynced ? '1 deadline' : '0 deadlines'} to Google Calendar`);
    } catch (err) {
      error('Failed to sync with Google Calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncMilestone = async (milestone: {
    id: string;
    title: string;
    dueDate: Timestamp;
  }) => {
    if (!isConnected) {
      await handleConnect();
    }

    setIsSyncing(true);
    try {
      await calendarService.createMilestoneEvent(
        milestone.title,
        milestone.dueDate.toDate(),
        projectName
      );
      success(`"${milestone.title}" added to Google Calendar`);
    } catch (err) {
      error('Failed to add milestone to calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncDeadline = async () => {
    if (!deadline) return;

    if (!isConnected) {
      await handleConnect();
    }

    setIsSyncing(true);
    try {
      await calendarService.createDeadlineEvent(
        projectName,
        deadline.toDate()
      );
      setSyncStatus((prev) => ({
        ...prev,
        deadlineSynced: true,
        lastSyncedAt: new Date(),
      }));
      success('Deadline added to Google Calendar');
    } catch (err) {
      error('Failed to add deadline to calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  const upcomingMilestones = milestones.filter(
    (m) => !m.isCompleted && m.dueDate.toDate() > new Date()
  );

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Calendar Sync
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Connected
            </Badge>
          )}
          <Button
            onClick={handleSyncAll}
            size="sm"
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync All
          </Button>
        </div>
      </div>

      {!isConnected && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Connect to Google Calendar to sync project milestones and deadlines.
          </p>
          <Button onClick={handleConnect} variant="outline" size="sm">
            <CalendarCheck className="h-4 w-4 mr-2" />
            Connect Google Calendar
          </Button>
        </div>
      )}

      {/* Deadline */}
      {deadline && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">
            Project Deadline
          </h4>
          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">
                {format(deadline.toDate(), 'MMM d, yyyy')}
              </span>
            </div>
            <Button
              onClick={handleSyncDeadline}
              size="sm"
              variant="ghost"
              disabled={isSyncing || syncStatus.deadlineSynced}
            >
              {syncStatus.deadlineSynced ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  Synced
                </>
              ) : (
                <>
                  <CalendarPlus className="h-4 w-4 mr-1" />
                  Add to Calendar
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Milestones */}
      {upcomingMilestones.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">
            Upcoming Milestones
          </h4>
          <div className="space-y-2">
            {upcomingMilestones.slice(0, 5).map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium">{milestone.title}</p>
                  <p className="text-xs text-gray-500">
                    {format(milestone.dueDate.toDate(), 'MMM d, yyyy')}
                  </p>
                </div>
                <Button
                  onClick={() => handleSyncMilestone(milestone)}
                  size="sm"
                  variant="ghost"
                  disabled={isSyncing || !!milestone.calendarEventId}
                >
                  {milestone.calendarEventId ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      Synced
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="h-4 w-4 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!deadline && upcomingMilestones.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No deadlines or milestones to sync
        </p>
      )}

      {/* Last synced info */}
      {syncStatus.lastSyncedAt && (
        <p className="text-xs text-gray-400 mt-4 text-center">
          Last synced: {format(syncStatus.lastSyncedAt, 'MMM d, h:mm a')}
        </p>
      )}
    </Card>
  );
};
