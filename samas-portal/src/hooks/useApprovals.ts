import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsApi, CreateApprovalData } from '@/services/api/approvals';
import { ApprovalFilters, ApprovalEntityType } from '@/types/approval';
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/utils/auditLog';
import { useAuth } from '@/hooks/useAuth';

const APPROVALS_QUERY_KEY = 'approvals';

export const useApprovals = (filters?: ApprovalFilters) => {
  return useQuery({
    queryKey: [APPROVALS_QUERY_KEY, filters],
    queryFn: () => approvalsApi.getAll(filters),
  });
};

export const useApproval = (id: string) => {
  return useQuery({
    queryKey: [APPROVALS_QUERY_KEY, id],
    queryFn: () => approvalsApi.getById(id),
    enabled: !!id,
  });
};

export const usePendingApprovalsForUser = (userId: string) => {
  return useQuery({
    queryKey: [APPROVALS_QUERY_KEY, 'pending', 'approver', userId],
    queryFn: () => approvalsApi.getPendingForApprover(userId),
    enabled: !!userId,
  });
};

export const useMyPendingApprovals = (userId: string) => {
  return useQuery({
    queryKey: [APPROVALS_QUERY_KEY, 'pending', 'requester', userId],
    queryFn: () => approvalsApi.getPendingByUser(userId),
    enabled: !!userId,
  });
};

export const useEntityApproval = (entityId: string, entityType: ApprovalEntityType) => {
  return useQuery({
    queryKey: [APPROVALS_QUERY_KEY, 'entity', entityId, entityType],
    queryFn: () => approvalsApi.getByEntity(entityId, entityType),
    enabled: !!entityId && !!entityType,
  });
};

export const useApprovalStats = () => {
  return useQuery({
    queryKey: [APPROVALS_QUERY_KEY, 'stats'],
    queryFn: () => approvalsApi.getStats(),
  });
};

export const useCreateApproval = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateApprovalData) => {
      const id = await approvalsApi.create(data);
      if (currentUser) {
        await createAuditLog({
          action: 'approval.created',
          entityType: 'approval',
          entityId: id,
          entityName: data.entityName,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: { after: data as unknown as Record<string, unknown> },
        });
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPROVALS_QUERY_KEY] });
      success('Approval request created');
    },
    onError: (err) => {
      error(`Failed to create approval: ${err.message}`);
    },
  });
};

export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments?: string }) => {
      if (!currentUser) throw new Error('User not authenticated');
      const approval = await approvalsApi.getById(id);
      await approvalsApi.approve(id, currentUser.id, currentUser.displayName, comments);
      if (approval) {
        await createAuditLog({
          action: 'approval.approved',
          entityType: 'approval',
          entityId: id,
          entityName: approval.entityName,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: { after: { comments } },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPROVALS_QUERY_KEY] });
      success('Request approved');
    },
    onError: (err) => {
      error(`Failed to approve: ${err.message}`);
    },
  });
};

export const useRejectRequest = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!currentUser) throw new Error('User not authenticated');
      const approval = await approvalsApi.getById(id);
      await approvalsApi.reject(id, currentUser.id, currentUser.displayName, reason);
      if (approval) {
        await createAuditLog({
          action: 'approval.rejected',
          entityType: 'approval',
          entityId: id,
          entityName: approval.entityName,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: { after: { reason } },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPROVALS_QUERY_KEY] });
      success('Request rejected');
    },
    onError: (err) => {
      error(`Failed to reject: ${err.message}`);
    },
  });
};

export const useCancelApproval = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      if (!currentUser) throw new Error('User not authenticated');
      const approval = await approvalsApi.getById(id);
      await approvalsApi.cancel(id, currentUser.id, currentUser.displayName, reason);
      if (approval) {
        await createAuditLog({
          action: 'approval.cancelled',
          entityType: 'approval',
          entityId: id,
          entityName: approval.entityName,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPROVALS_QUERY_KEY] });
      success('Request cancelled');
    },
    onError: (err) => {
      error(`Failed to cancel: ${err.message}`);
    },
  });
};

export const useAddApprovalComment = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      if (!currentUser) throw new Error('User not authenticated');
      await approvalsApi.addComment(id, currentUser.id, currentUser.displayName, comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPROVALS_QUERY_KEY] });
      success('Comment added');
    },
    onError: (err) => {
      error(`Failed to add comment: ${err.message}`);
    },
  });
};
