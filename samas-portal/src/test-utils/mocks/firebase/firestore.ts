/**
 * Firebase Firestore Mocks
 */

import { vi } from 'vitest';

export interface MockDocumentSnapshot<T = unknown> {
  id: string;
  exists: () => boolean;
  data: () => T | undefined;
  ref: { id: string; path: string };
}

export interface MockQuerySnapshot<T = unknown> {
  docs: MockDocumentSnapshot<T>[];
  empty: boolean;
  size: number;
  forEach: (callback: (doc: MockDocumentSnapshot<T>) => void) => void;
}

// Create a mock document snapshot
export const createMockDocumentSnapshot = <T>(
  id: string,
  data: T | null,
  collection = 'collection'
): MockDocumentSnapshot<T> => ({
  id,
  exists: () => data !== null,
  data: () => data ?? undefined,
  ref: { id, path: `${collection}/${id}` },
});

// Create a mock query snapshot
export const createMockQuerySnapshot = <T>(
  docs: Array<{ id: string; data: T }>
): MockQuerySnapshot<T> => {
  const mockDocs = docs.map(({ id, data }) => createMockDocumentSnapshot(id, data));
  return {
    docs: mockDocs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback) => mockDocs.forEach(callback),
  };
};

// Mock Firestore functions
export const mockCollection = vi.fn((_db: unknown, path: string) => ({ path }));
export const mockDoc = vi.fn((collection: { path: string }, id: string) => ({ id, path: `${collection.path}/${id}` }));
export const mockGetDoc = vi.fn((_docRef?: unknown) => Promise.resolve(createMockDocumentSnapshot('id', null)));
export const mockGetDocs = vi.fn((_query?: unknown) => Promise.resolve(createMockQuerySnapshot([])));
export const mockSetDoc = vi.fn((_docRef?: unknown, _data?: unknown) => Promise.resolve());
export const mockUpdateDoc = vi.fn((_docRef?: unknown, _data?: unknown) => Promise.resolve());
export const mockDeleteDoc = vi.fn((_docRef?: unknown) => Promise.resolve());
export const mockQuery = vi.fn((collection: unknown, ...constraints: unknown[]) => ({ collection, constraints }));
export const mockWhere = vi.fn((field: string, op: string, value: unknown) => ({ field, op, value }));
export const mockOrderBy = vi.fn((field: string, direction = 'asc') => ({ field, direction }));
export const mockLimit = vi.fn((n: number) => ({ limit: n }));
export const mockStartAfter = vi.fn((doc: unknown) => ({ startAfter: doc }));

export const mockOnSnapshot = vi.fn((_query: unknown, callback: (snapshot: MockQuerySnapshot<unknown>) => void) => {
  callback(createMockQuerySnapshot([]));
  return vi.fn(); // unsubscribe function
});

export const mockServerTimestamp = vi.fn(() => ({ toDate: () => new Date() }));

export const mockTimestamp = {
  now: () => ({ toDate: () => new Date(), seconds: Date.now() / 1000 }),
  fromDate: (date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000 }),
};

// Helper to setup mock documents
export const setupMockDocuments = (
  documents: Array<{ id: string; data: unknown }>
) => {
  mockGetDocs.mockResolvedValue(createMockQuerySnapshot(documents as Array<{ id: string; data: unknown }>));

  // Override mockGetDoc for this test scenario
  (mockGetDoc as ReturnType<typeof vi.fn>).mockImplementation((docRef: unknown) => {
    const ref = docRef as { id: string } | undefined;
    const doc = ref ? documents.find((d) => d.id === ref.id) : undefined;
    return Promise.resolve(createMockDocumentSnapshot(ref?.id ?? 'unknown', doc?.data ?? null));
  });
};

// Reset all mocks
export const resetFirestoreMocks = () => {
  mockCollection.mockClear();
  mockDoc.mockClear();
  mockGetDoc.mockClear();
  mockGetDocs.mockClear();
  mockSetDoc.mockClear();
  mockUpdateDoc.mockClear();
  mockDeleteDoc.mockClear();
  mockQuery.mockClear();
  mockWhere.mockClear();
  mockOrderBy.mockClear();
  mockLimit.mockClear();
  mockStartAfter.mockClear();
  mockOnSnapshot.mockClear();
};
