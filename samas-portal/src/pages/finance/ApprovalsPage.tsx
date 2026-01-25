import { FC, useState, useMemo } from 'react';
import { Search, ClipboardCheck, Loader2 } from 'lucide-react';
import { ApprovalStatus, ApprovalType, ApprovalPriority } from '@/types/approval';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ApprovalCard } from '@/components/finance/ApprovalCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import {
  usePendingApprovalsForUser,
  useApprovals,
  useApproveRequest,
  useRejectRequest,
  useApprovalStats,
} from '@/hooks/useApprovals';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';

const statusOptions: { value: ApprovalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

const typeOptions: { value: ApprovalType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'expense', label: 'Expense' },
  { value: 'purchase_order', label: 'Purchase Order' },
  { value: 'leave', label: 'Leave Request' },
  { value: 'document', label: 'Document' },
  { value: 'project', label: 'Project' },
];

const priorityOptions: { value: ApprovalPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const ApprovalsPage: FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ApprovalType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ApprovalPriority | 'all'>('all');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingApprovalId, setRejectingApprovalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const canApprove = hasPermission('finance', 'update');

  const filters = useMemo(() => ({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
  }), [statusFilter, typeFilter, priorityFilter]);

  const { data: pendingApprovals, isLoading: pendingLoading } = usePendingApprovalsForUser(user?.id || '');
  const { data: allApprovals, isLoading: allLoading } = useApprovals(filters);
  const { data: stats } = useApprovalStats();
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();

  const displayedApprovals = activeTab === 'pending' ? pendingApprovals : allApprovals;
  const isLoading = activeTab === 'pending' ? pendingLoading : allLoading;

  const filteredApprovals = useMemo(() => {
    if (!displayedApprovals) return [];

    let result = displayedApprovals;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (approval) =>
          approval.entityName.toLowerCase().includes(query) ||
          approval.description.toLowerCase().includes(query) ||
          approval.requestedByName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [displayedApprovals, searchQuery]);

  const handleApprove = async (id: string) => {
    await approveRequest.mutateAsync({ id });
  };

  const handleRejectClick = (id: string) => {
    setRejectingApprovalId(id);
    setRejectReason('');
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (rejectingApprovalId && rejectReason.trim()) {
      await rejectRequest.mutateAsync({
        id: rejectingApprovalId,
        reason: rejectReason.trim(),
      });
      setShowRejectDialog(false);
      setRejectingApprovalId(null);
      setRejectReason('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Approvals
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Review and manage approval requests
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-yellow-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-green-600">Approved</div>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-red-600">Rejected</div>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'all')}>
        <TabsList className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <TabsTrigger
            value="pending"
            className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Pending Approvals
            {pendingApprovals && pendingApprovals.length > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                {pendingApprovals.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Approvals
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search approvals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {activeTab === 'all' && (
            <>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as ApprovalStatus | 'all')}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
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
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as ApprovalType | 'all')}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={priorityFilter}
                onValueChange={(value) => setPriorityFilter(value as ApprovalPriority | 'all')}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        {/* Content */}
        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredApprovals.length === 0 ? (
            <Card className="p-12 text-center">
              <ClipboardCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {activeTab === 'pending'
                  ? 'No pending approvals'
                  : 'No approvals found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {activeTab === 'pending'
                  ? "You're all caught up! No items are waiting for your approval."
                  : 'Try adjusting your filters'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApprovals.map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  onApprove={() => handleApprove(approval.id)}
                  onReject={() => handleRejectClick(approval.id)}
                  isApprover={canApprove && activeTab === 'pending'}
                  showActions={activeTab === 'pending'}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Please provide a reason for rejecting this request.
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
                disabled={!rejectReason.trim() || rejectRequest.isPending}
              >
                {rejectRequest.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Reject Request'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
