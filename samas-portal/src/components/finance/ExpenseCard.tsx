import { FC } from 'react';
import { format } from 'date-fns';
import {
  Receipt,
  Calendar,
  User,
  Folder,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  DollarSign,
  Eye,
} from 'lucide-react';
import { Expense, ExpenseStatus } from '@/types/expense';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: () => void;
  onDelete?: () => void;
  onSubmit?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onMarkPaid?: () => void;
  onView?: () => void;
  showActions?: boolean;
  isApprover?: boolean;
  isFinanceManager?: boolean;
}

const statusConfig: Record<ExpenseStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  pending: { label: 'Pending', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  paid: { label: 'Paid', variant: 'default' },
};

const categoryLabels: Record<string, string> = {
  travel: 'Travel',
  meals: 'Meals',
  supplies: 'Supplies',
  equipment: 'Equipment',
  software: 'Software',
  services: 'Services',
  marketing: 'Marketing',
  training: 'Training',
  other: 'Other',
};

export const ExpenseCard: FC<ExpenseCardProps> = ({
  expense,
  onEdit,
  onDelete,
  onSubmit,
  onApprove,
  onReject,
  onMarkPaid,
  onView,
  showActions = true,
  isApprover = false,
  isFinanceManager = false,
}) => {
  const statusInfo = statusConfig[expense.status];
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: expense.currency,
  }).format(expense.amount);

  const canEdit = expense.status === 'draft';
  const canDelete = expense.status === 'draft';
  const canSubmit = expense.status === 'draft';
  const canApprove = expense.status === 'pending' && isApprover;
  const canReject = expense.status === 'pending' && isApprover;
  const canMarkPaid = expense.status === 'approved' && isFinanceManager;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {expense.title}
            </h3>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            {expense.isSensitive && (
              <Badge variant="destructive">Sensitive</Badge>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {expense.description}
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formattedAmount}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Receipt className="h-4 w-4" />
              <span>{categoryLabels[expense.category]}</span>
            </div>

            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{expense.submittedByName}</span>
            </div>

            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {format(expense.createdAt.toDate(), 'MMM d, yyyy')}
              </span>
            </div>

            {expense.projectId && (
              <div className="flex items-center gap-1">
                <Folder className="h-4 w-4" />
                <span>Project assigned</span>
              </div>
            )}

            {expense.receipts.length > 0 && (
              <div className="flex items-center gap-1">
                <Receipt className="h-4 w-4" />
                <span>{expense.receipts.length} receipt(s)</span>
              </div>
            )}
          </div>

          {expense.status === 'rejected' && expense.rejectionReason && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
              <strong>Rejection reason:</strong> {expense.rejectionReason}
            </div>
          )}

          {expense.status === 'approved' && expense.approvedByName && (
            <div className="mt-3 text-sm text-green-600 dark:text-green-400">
              Approved by {expense.approvedByName}{' '}
              {expense.approvedAt && (
                <>on {format(expense.approvedAt.toDate(), 'MMM d, yyyy')}</>
              )}
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex flex-col gap-2">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onView}
                title="View details"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}

            {canEdit && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {canSubmit && onSubmit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSubmit}
                title="Submit for approval"
                className="text-blue-600 hover:text-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}

            {canApprove && onApprove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onApprove}
                title="Approve"
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}

            {canReject && onReject && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReject}
                title="Reject"
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}

            {canMarkPaid && onMarkPaid && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkPaid}
                title="Mark as paid"
                className="text-emerald-600 hover:text-emerald-700"
              >
                <DollarSign className="h-4 w-4" />
              </Button>
            )}

            {canDelete && onDelete && (
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
