/**
 * Firebase Storage Mocks
 */

import { vi } from 'vitest';

export const mockStorageRef = vi.fn((_storage: unknown, path: string) => ({
  fullPath: path,
  name: path.split('/').pop() || '',
}));

export const mockUploadBytes = vi.fn((ref, file) =>
  Promise.resolve({
    ref,
    metadata: {
      name: ref.name,
      fullPath: ref.fullPath,
      size: file.size || 1024,
      contentType: file.type || 'application/octet-stream',
    },
  })
);

export const mockGetDownloadURL = vi.fn((ref) =>
  Promise.resolve(`https://storage.example.com/${ref.fullPath}`)
);

export const mockDeleteObject = vi.fn(() => Promise.resolve());

export const mockListAll = vi.fn(() =>
  Promise.resolve({
    items: [],
    prefixes: [],
  })
);

// Helper to setup storage mock with specific files
export const setupMockStorage = (files: Array<{ path: string; url: string }>) => {
  mockGetDownloadURL.mockImplementation((ref) => {
    const file = files.find((f) => f.path === ref.fullPath);
    return Promise.resolve(file?.url || `https://storage.example.com/${ref.fullPath}`);
  });
};

// Reset all mocks
export const resetStorageMocks = () => {
  mockStorageRef.mockClear();
  mockUploadBytes.mockClear();
  mockGetDownloadURL.mockClear();
  mockDeleteObject.mockClear();
  mockListAll.mockClear();
};
