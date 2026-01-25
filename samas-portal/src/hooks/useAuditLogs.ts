import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { auditLogsApi, AuditLogFilters, AuditAction } from '@/services/api/auditLogs';
import { DocumentSnapshot } from 'firebase/firestore';

const AUDIT_LOGS_QUERY_KEY = 'auditLogs';

export const useAuditLogs = (pageSize = 50) => {
  return useQuery({
    queryKey: [AUDIT_LOGS_QUERY_KEY, pageSize],
    queryFn: () => auditLogsApi.getAll(pageSize),
  });
};

export const useAuditLogsInfinite = (pageSize = 50) => {
  return useInfiniteQuery({
    queryKey: [AUDIT_LOGS_QUERY_KEY, 'infinite', pageSize],
    queryFn: async ({ pageParam }) => {
      return auditLogsApi.getPaginated(pageSize, pageParam as DocumentSnapshot | undefined);
    },
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.lastDoc : undefined),
  });
};

export const useAuditLog = (id: string) => {
  return useQuery({
    queryKey: [AUDIT_LOGS_QUERY_KEY, id],
    queryFn: () => auditLogsApi.getById(id),
    enabled: !!id,
  });
};

export const useAuditLogsByEntity = (entityType: string, entityId: string) => {
  return useQuery({
    queryKey: [AUDIT_LOGS_QUERY_KEY, 'entity', entityType, entityId],
    queryFn: () => auditLogsApi.getByEntity(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
};

export const useAuditLogsByPerformer = (performerId: string) => {
  return useQuery({
    queryKey: [AUDIT_LOGS_QUERY_KEY, 'performer', performerId],
    queryFn: () => auditLogsApi.getByPerformer(performerId),
    enabled: !!performerId,
  });
};

export const useAuditLogsByAction = (action: AuditAction) => {
  return useQuery({
    queryKey: [AUDIT_LOGS_QUERY_KEY, 'action', action],
    queryFn: () => auditLogsApi.getByAction(action),
    enabled: !!action,
  });
};

export const useAuditLogsByDateRange = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: [AUDIT_LOGS_QUERY_KEY, 'dateRange', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => auditLogsApi.getByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
};

export const useSearchAuditLogs = (filters: AuditLogFilters, pageSize = 50) => {
  return useQuery({
    queryKey: [AUDIT_LOGS_QUERY_KEY, 'search', filters, pageSize],
    queryFn: () => auditLogsApi.search(filters, pageSize),
    enabled: Object.values(filters).some((v) => v !== undefined),
  });
};
