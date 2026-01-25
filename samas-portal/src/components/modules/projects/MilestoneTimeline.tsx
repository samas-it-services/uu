import { FC, useState } from 'react';
import { format } from 'date-fns';
import {
  Flag,
  CheckCircle,
  Circle,
  Clock,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate: Timestamp;
  completedAt?: Timestamp | null;
  isCompleted: boolean;
}

interface MilestoneTimelineProps {
  milestones: Milestone[];
  onAdd?: (milestone: Omit<Milestone, 'id'>) => Promise<void>;
  onToggleComplete?: (milestoneId: string, completed: boolean) => Promise<void>;
  onDelete?: (milestoneId: string) => Promise<void>;
  canEdit?: boolean;
}

export const MilestoneTimeline: FC<MilestoneTimelineProps> = ({
  milestones,
  onAdd,
  onToggleComplete,
  onDelete,
  canEdit = false,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', dueDate: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedMilestones = [...milestones].sort(
    (a, b) => a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime()
  );

  const completedCount = milestones.filter((m) => m.isCompleted).length;
  const progress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  const handleAdd = async () => {
    if (!onAdd || !newMilestone.title || !newMilestone.dueDate) return;

    setIsAdding(true);
    try {
      await onAdd({
        title: newMilestone.title,
        dueDate: Timestamp.fromDate(new Date(newMilestone.dueDate)),
        isCompleted: false,
        completedAt: null,
      });
      setNewMilestone({ title: '', dueDate: '' });
      setShowAddForm(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (milestone: Milestone) => {
    if (!onToggleComplete) return;

    setTogglingId(milestone.id);
    try {
      await onToggleComplete(milestone.id, !milestone.isCompleted);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (milestoneId: string) => {
    if (!onDelete) return;

    setDeletingId(milestoneId);
    try {
      await onDelete(milestoneId);
    } finally {
      setDeletingId(null);
    }
  };

  const isOverdue = (milestone: Milestone) =>
    !milestone.isCompleted && milestone.dueDate.toDate() < new Date();

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Milestones
          </h3>
          <Badge variant="secondary">
            {completedCount}/{milestones.length}
          </Badge>
        </div>
        {canEdit && onAdd && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {milestones.length > 0 && (
        <div className="mb-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {Math.round(progress)}% complete
          </p>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
          <Input
            placeholder="Milestone title"
            value={newMilestone.title}
            onChange={(e) =>
              setNewMilestone({ ...newMilestone, title: e.target.value })
            }
          />
          <Input
            type="date"
            value={newMilestone.dueDate}
            onChange={(e) =>
              setNewMilestone({ ...newMilestone, dueDate: e.target.value })
            }
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={isAdding || !newMilestone.title || !newMilestone.dueDate}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Add Milestone'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {milestones.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No milestones yet
        </p>
      ) : (
        <div className="space-y-4">
          {sortedMilestones.map((milestone, index) => (
            <div key={milestone.id} className="flex gap-3">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleToggle(milestone)}
                  disabled={!canEdit || togglingId === milestone.id}
                  className={cn(
                    'h-6 w-6 rounded-full flex items-center justify-center transition-colors',
                    milestone.isCompleted
                      ? 'bg-green-500 text-white'
                      : isOverdue(milestone)
                      ? 'bg-red-100 text-red-500 border-2 border-red-500'
                      : 'bg-gray-100 text-gray-400 border-2 border-gray-300'
                  )}
                >
                  {togglingId === milestone.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : milestone.isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </button>
                {index < sortedMilestones.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 flex-1 mt-1',
                      milestone.isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <h4
                    className={cn(
                      'font-medium',
                      milestone.isCompleted && 'line-through text-gray-500'
                    )}
                  >
                    {milestone.title}
                  </h4>
                  {canEdit && onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(milestone.id)}
                      disabled={deletingId === milestone.id}
                      className="text-red-500 hover:text-red-600"
                    >
                      {deletingId === milestone.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <Clock
                    className={cn(
                      'h-3 w-3',
                      isOverdue(milestone) ? 'text-red-500' : 'text-gray-400'
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs',
                      isOverdue(milestone)
                        ? 'text-red-500 font-medium'
                        : 'text-gray-500'
                    )}
                  >
                    {format(milestone.dueDate.toDate(), 'MMM d, yyyy')}
                    {isOverdue(milestone) && ' (Overdue)'}
                  </span>
                  {milestone.isCompleted && milestone.completedAt && (
                    <span className="text-xs text-green-600">
                      Completed {format(milestone.completedAt.toDate(), 'MMM d')}
                    </span>
                  )}
                </div>

                {milestone.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {milestone.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
