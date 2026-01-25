import { FC } from 'react';
import { format } from 'date-fns';
import {
  Clock,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Approval, ApprovalStatus, ApprovalPriority, ApprovalType } from '@/types/approval';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface ApprovalCardProps {
  approval: Approval;
  onApprove?: () => void;
  onReject?: () => void;
  onView?: () => void;
  showActions?: boolean;
  isApprover?: boolean;
}

const statusConfig: Record<ApprovalStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
  escalated: { label: 'Escalated', variant: 'warning' },
};

const priorityConfig: Record<ApprovalPriority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'text-gray-500' },
  medium: { label: 'Medium', className: 'text-blue-500' },
  high: { label: 'High', className: 'text-orange-500' },
  urgent: { label: 'Urgent', className: 'text-red-500' },
};

const typeLabels: Record<ApprovalType, string> = {
  expense: 'Expense',
  purchase_order: 'Purchase Order',
  leave: 'Leave Request',
  document: 'Document',
  project: 'Project',
  other: 'Other',
};

const typeIcons: Record<ApprovalType, typeof FileText> = {
  expense: DollarSign,
  purchase_order: FileText,
  leave: Calendar,
  document: FileText,
  project: FileText,
  other: FileText,
};

export const ApprovalCard: FC<ApprovalCardProps> = ({
  approval,
  onApprove,
  onReject,
  onView,
  showActions = true,
  isApprover = false,
}) => {
  const statusInfo = statusConfig[approval.status];
  const priorityInfo = priorityConfig[approval.priority];
  const TypeIcon = typeIcons[approval.type];

  const formattedAmount = approval.amount
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: approval.currency || 'USD',
      }).format(approval.amount)
    : null;

  const currentApprover = approval.approvers.find(
    (a) => a.level === approval.currentApproverLevel && a.status === 'pending'
  );

  const isOverdue = approval.dueDate && approval.dueDate.toDate() < new Date();

  return (
    <Card
      className={cn(
        'p-4 hover:shadow-md transition-shadow cursor-pointer',
        isOverdue && approval.status === 'pending' && 'border-red-300 dark:border-red-700'
      )}
      onClick={onView}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <TypeIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 uppercase font-medium">
              {typeLabels[approval.type]}
            </span>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            {approval.priority !== 'medium' && (
              <span className={cn('text-xs font-medium', priorityInfo.className)}>
                {priorityInfo.label}
              </span>
            )}
            {isOverdue && approval.status === 'pending' && (
              <Badge variant="destructive">Overdue</Badge>
            )}
          </div>

          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">
            {approval.entityName}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {approval.description}
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            {formattedAmount && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formattedAmount}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{approval.requestedByName}</span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {format(approval.requestedAt.toDate(), 'MMM d, yyyy')}
              </span>
            </div>

            {approval.dueDate && (
              <div className={cn(
                'flex items-center gap-1',
                isOverdue && 'text-red-500'
              )}>
                <AlertCircle className="h-4 w-4" />
                <span>Due: {format(approval.dueDate.toDate(), 'MMM d')}</span>
              </div>
            )}
          </div>

          {/* Approvers */}
          {approval.status === 'pending' && currentApprover && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-500">Awaiting:</span>
              <div className="flex items-center gap-2">
                <Avatar size="sm" fallback={currentApprover.userName} />
                <span className="font-medium">{currentApprover.userName}</span>
              </div>
            </div>
          )}

          {/* Approval progress */}
          <div className="mt-3 flex items-center gap-1">
            {approval.approvers.map((approver) => (
              <div
                key={approver.userId}
                className={cn(
                  'h-2 flex-1 rounded-full',
                  approver.status === 'approved'
                    ? 'bg-green-500'
                    : approver.status === 'rejected'
                    ? 'bg-red-500'
                    : approver.status === 'pending' && approver.level === approval.currentApproverLevel
                    ? 'bg-yellow-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                )}
                title={`${approver.userName}: ${approver.status}`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2">
          {showActions && isApprover && approval.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove?.();
                }}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onReject?.();
                }}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </Card>
  );
};
