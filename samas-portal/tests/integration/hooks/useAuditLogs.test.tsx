/**
 * useAuditLogs Hook Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import {
  useAuditLogs,
  useAuditLog,
  useAuditLogsByEntity,
  useAuditLogsByPerformer,
  useAuditLogsByAction,
} from '@/hooks/useAuditLogs';
import { createMockSuperAdmin } from '@/test-utils/factories/user.factory';
import { User } from '@/types/user';
import { Role } from '@/types/role';
import { AuditLog } from '@/types';

// Mock Firebase modules
vi.mock('firebase/auth');
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(() => ({})),
    doc: vi.fn(() => ({})),
    getDocs: vi.fn(() => Promise.resolve({ docs: [], empty: true, size: 0 })),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => undefined })),
    query: vi.fn(() => ({})),
    where: vi.fn(() => ({})),
    orderBy: vi.fn(() => ({})),
    limit: vi.fn(() => ({})),
    startAfter: vi.fn(() => ({})),
    Timestamp: {
      now: () => ({ toDate: () => new Date() }),
      fromDate: (date: Date) => ({ toDate: () => date }),
    },
  };
});
vi.mock('@/services/firebase/config', () => ({
  auth: {},
  db: {},
  googleProvider: {},
}));

// Create mock audit log
const createMockAuditLog = (overrides: Partial<AuditLog> = {}): AuditLog => ({
  id: `audit-${Date.now()}`,
  action: 'user.created',
  entityType: 'user',
  entityId: 'user-123',
  entityName: 'Test User',
  performedBy: {
    id: 'admin-1',
    email: 'admin@example.com',
    displayName: 'Admin User',
  },
  timestamp: new Date(),
  ipAddress: '127.0.0.1',
  userAgent: 'Test Agent',
  ...overrides,
});

// Mock the audit logs API
vi.mock('@/services/api/auditLogs', () => ({
  auditLogsApi: {
    getAll: vi.fn(() => Promise.resolve([])),
    getById: vi.fn(() => Promise.resolve(null)),
    getPaginated: vi.fn(() => Promise.resolve({ logs: [], hasMore: false, lastDoc: null })),
    getByEntity: vi.fn(() => Promise.resolve([])),
    getByPerformer: vi.fn(() => Promise.resolve([])),
    getByAction: vi.fn(() => Promise.resolve([])),
    getByDateRange: vi.fn(() => Promise.resolve([])),
    search: vi.fn(() => Promise.resolve([])),
    create: vi.fn(() => Promise.resolve('new-id')),
  },
}));

const createWrapper = (user: User | null = null, roles: Role[] = []) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          user,
          firebaseUser: user ? { uid: user.id } : null,
          roles,
          loading: false,
          signInWithGoogle: vi.fn(),
          signOut: vi.fn(),
        }}
      >
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );

  return Wrapper;
};

describe('useAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAuditLogs hook', () => {
    it('should fetch audit logs', async () => {
      const mockLogs = [
        createMockAuditLog({ action: 'user.created' }),
        createMockAuditLog({ action: 'user.updated' }),
        createMockAuditLog({ action: 'role.created' }),
      ];

      const { auditLogsApi } = await import('@/services/api/auditLogs');
      vi.mocked(auditLogsApi.getAll).mockResolvedValue(mockLogs);

      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(3);
      expect(auditLogsApi.getAll).toHaveBeenCalledWith(50);
    });

    it('should respect custom page size', async () => {
      const { auditLogsApi } = await import('@/services/api/auditLogs');
      vi.mocked(auditLogsApi.getAll).mockResolvedValue([]);

      const { result } = renderHook(() => useAuditLogs(100), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(auditLogsApi.getAll).toHaveBeenCalledWith(100);
    });
  });

  describe('useAuditLog hook', () => {
    it('should fetch a single audit log by ID', async () => {
      const mockLog = createMockAuditLog({ id: 'audit-123' });

      const { auditLogsApi } = await import('@/services/api/auditLogs');
      vi.mocked(auditLogsApi.getById).mockResolvedValue(mockLog);

      const { result } = renderHook(() => useAuditLog('audit-123'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockLog);
      expect(auditLogsApi.getById).toHaveBeenCalledWith('audit-123');
    });

    it('should not fetch when ID is empty', async () => {
      const { auditLogsApi } = await import('@/services/api/auditLogs');

      const { result } = renderHook(() => useAuditLog(''), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      expect(result.current.isFetching).toBe(false);
      expect(auditLogsApi.getById).not.toHaveBeenCalled();
    });
  });

  describe('useAuditLogsByEntity hook', () => {
    it('should fetch logs for a specific entity', async () => {
      const mockLogs = [
        createMockAuditLog({ entityType: 'user', entityId: 'user-456', action: 'user.created' }),
        createMockAuditLog({ entityType: 'user', entityId: 'user-456', action: 'user.updated' }),
      ];

      const { auditLogsApi } = await import('@/services/api/auditLogs');
      vi.mocked(auditLogsApi.getByEntity).mockResolvedValue(mockLogs);

      const { result } = renderHook(() => useAuditLogsByEntity('user', 'user-456'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(auditLogsApi.getByEntity).toHaveBeenCalledWith('user', 'user-456');
    });

    it('should not fetch when entity type or ID is empty', async () => {
      const { auditLogsApi } = await import('@/services/api/auditLogs');

      renderHook(() => useAuditLogsByEntity('', ''), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      expect(auditLogsApi.getByEntity).not.toHaveBeenCalled();
    });
  });

  describe('useAuditLogsByPerformer hook', () => {
    it('should fetch logs for a specific performer', async () => {
      const mockLogs = [
        createMockAuditLog({ performedBy: { id: 'admin-1', email: 'admin@test.com', displayName: 'Admin' } }),
      ];

      const { auditLogsApi } = await import('@/services/api/auditLogs');
      vi.mocked(auditLogsApi.getByPerformer).mockResolvedValue(mockLogs);

      const { result } = renderHook(() => useAuditLogsByPerformer('admin-1'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(auditLogsApi.getByPerformer).toHaveBeenCalledWith('admin-1');
    });
  });

  describe('useAuditLogsByAction hook', () => {
    it('should fetch logs for a specific action', async () => {
      const mockLogs = [
        createMockAuditLog({ action: 'user.created' }),
        createMockAuditLog({ action: 'user.created' }),
      ];

      const { auditLogsApi } = await import('@/services/api/auditLogs');
      vi.mocked(auditLogsApi.getByAction).mockResolvedValue(mockLogs);

      const { result } = renderHook(() => useAuditLogsByAction('user.created'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.every((log) => log.action === 'user.created')).toBe(true);
      expect(auditLogsApi.getByAction).toHaveBeenCalledWith('user.created');
    });

    it('should handle different action types', async () => {
      const { auditLogsApi } = await import('@/services/api/auditLogs');
      vi.mocked(auditLogsApi.getByAction).mockResolvedValue([]);

      const actionTypes = [
        'user.created',
        'user.updated',
        'user.deleted',
        'role.created',
        'role.updated',
        'expense.approved',
        'expense.rejected',
      ];

      for (const action of actionTypes) {
        renderHook(() => useAuditLogsByAction(action as typeof actionTypes[number]), {
          wrapper: createWrapper(createMockSuperAdmin(), []),
        });
      }

      expect(auditLogsApi.getByAction).toHaveBeenCalledTimes(actionTypes.length);
    });
  });

  describe('Audit Log Content', () => {
    it('should include changes for update actions', async () => {
      const mockLog = createMockAuditLog({
        action: 'user.updated',
        changes: {
          before: { displayName: 'Old Name' },
          after: { displayName: 'New Name' },
        },
      });

      const { auditLogsApi } = await import('@/services/api/auditLogs');
      vi.mocked(auditLogsApi.getById).mockResolvedValue(mockLog);

      const { result } = renderHook(() => useAuditLog('audit-123'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.changes?.before).toEqual({ displayName: 'Old Name' });
      expect(result.current.data?.changes?.after).toEqual({ displayName: 'New Name' });
    });

    it('should include performer information', async () => {
      const mockLog = createMockAuditLog({
        performedBy: {
          id: 'super-admin-1',
          email: 'bill@samas.tech',
          displayName: 'Bill Admin',
        },
      });

      const { auditLogsApi } = await import('@/services/api/auditLogs');
      vi.mocked(auditLogsApi.getById).mockResolvedValue(mockLog);

      const { result } = renderHook(() => useAuditLog('audit-123'), {
        wrapper: createWrapper(createMockSuperAdmin(), []),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.performedBy.email).toBe('bill@samas.tech');
      expect(result.current.data?.performedBy.displayName).toBe('Bill Admin');
    });
  });
});
