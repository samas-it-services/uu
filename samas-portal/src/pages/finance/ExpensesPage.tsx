import { FC, useState, useMemo } from 'react';
import { Plus, Search, Receipt, Loader2 } from 'lucide-react';
import { ExpenseStatus, ExpenseCategory } from '@/types/expense';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ExpenseCard } from '@/components/finance/ExpenseCard';
import { ExpenseModal } from '@/components/finance/ExpenseModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import {
  useExpenses,
  useDeleteExpense,
  useSubmitExpense,
  useApproveExpense,
  useRejectExpense,
  useMarkExpensePaid,
  useExpenseStats,
} from '@/hooks/useExpenses';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { Expense } from '@/types/expense';

const statusOptions: { value: ExpenseStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'paid', label: 'Paid' },
];

const categoryOptions: { value: ExpenseCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'software', label: 'Software' },
  { value: 'services', label: 'Services' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
];

export const ExpensesPage: FC = () => {
  const { user } = useAuth();
  const { hasPermission, canAccessSensitiveData } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingExpenseId, setRejectingExpenseId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filters = useMemo(() => ({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
  }), [statusFilter, categoryFilter]);

  const { data, isLoading } = useExpenses(filters);
  const { data: stats } = useExpenseStats();
  const deleteExpense = useDeleteExpense();
  const submitExpense = useSubmitExpense();
  const approveExpense = useApproveExpense();
  const rejectExpense = useRejectExpense();
  const markPaid = useMarkExpensePaid();

  const canCreate = hasPermission('finance', 'create');
  const canApprove = hasPermission('finance', 'update') && canAccessSensitiveData;
  const isFinanceManager = canAccessSensitiveData;

  const filteredExpenses = useMemo(() => {
    const allExpenses = data?.pages.flatMap((page) => page.expenses) || [];
    let result = allExpenses;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (expense) =>
          expense.title.toLowerCase().includes(query) ||
          expense.description.toLowerCase().includes(query) ||
          expense.submittedByName.toLowerCase().includes(query)
      );
    }

    // Filter sensitive expenses for non-finance users
    if (!isFinanceManager) {
      result = result.filter(
        (expense) => !expense.isSensitive || expense.submittedBy === user?.id
      );
    }

    return result;
  }, [data, searchQuery, isFinanceManager, user?.id]);

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowExpenseModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense.mutateAsync(id);
    }
  };

  const handleSubmit = async (id: string) => {
    await submitExpense.mutateAsync(id);
  };

  const handleApprove = async (id: string) => {
    await approveExpense.mutateAsync(id);
  };

  const handleRejectClick = (id: string) => {
    setRejectingExpenseId(id);
    setRejectReason('');
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (rejectingExpenseId && rejectReason.trim()) {
      await rejectExpense.mutateAsync({
        id: rejectingExpenseId,
        reason: rejectReason.trim(),
      });
      setShowRejectDialog(false);
      setRejectingExpenseId(null);
      setRejectReason('');
    }
  };

  const handleMarkPaid = async (id: string) => {
    await markPaid.mutateAsync(id);
  };

  const handleAddNew = () => {
    setSelectedExpense(null);
    setShowExpenseModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Expenses
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage and track expense submissions
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Expense
          </Button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-500">{formatCurrency(stats.totalAmount)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-yellow-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-yellow-600">{formatCurrency(stats.pendingAmount)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-green-600">Approved</div>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-green-600">{formatCurrency(stats.approvedAmount)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-blue-600">Paid</div>
            <div className="text-2xl font-bold text-blue-600">{stats.paid}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as ExpenseStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(value as ExpenseCategory | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Expense List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredExpenses.length === 0 ? (
        <Card className="p-12 text-center">
          <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No expenses found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first expense to get started'}
          </p>
          {canCreate && !searchQuery && statusFilter === 'all' && categoryFilter === 'all' && (
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Expense
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={() => handleEdit(expense)}
              onDelete={() => handleDelete(expense.id)}
              onSubmit={() => handleSubmit(expense.id)}
              onApprove={() => handleApprove(expense.id)}
              onReject={() => handleRejectClick(expense.id)}
              onMarkPaid={() => handleMarkPaid(expense.id)}
              isApprover={canApprove}
              isFinanceManager={isFinanceManager}
            />
          ))}

        </div>
      )}

      {/* Expense Modal */}
      <ExpenseModal
        open={showExpenseModal}
        onOpenChange={setShowExpenseModal}
        expense={selectedExpense}
      />

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Please provide a reason for rejecting this expense.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-gray-100"
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim() || rejectExpense.isPending}
              >
                {rejectExpense.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Reject Expense'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
