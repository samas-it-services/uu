import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  documentsApi,
  CreateDocumentData,
  UpdateDocumentData,
  CreateFolderData,
  DocumentFilters,
} from '@/services/api/documents';
import { DocumentShare } from '@/types/document';
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/utils/auditLog';
import { useAuth } from '@/hooks/useAuth';

const DOCUMENTS_QUERY_KEY = 'documents';
const FOLDERS_QUERY_KEY = 'folders';

export const useDocuments = (filters?: DocumentFilters) => {
  return useQuery({
    queryKey: [DOCUMENTS_QUERY_KEY, filters],
    queryFn: () => documentsApi.getAll(filters),
  });
};

export const useDocument = (id: string) => {
  return useQuery({
    queryKey: [DOCUMENTS_QUERY_KEY, id],
    queryFn: () => documentsApi.getById(id),
    enabled: !!id,
  });
};

export const useFolderDocuments = (folderId: string | null) => {
  return useQuery({
    queryKey: [DOCUMENTS_QUERY_KEY, 'folder', folderId],
    queryFn: () => documentsApi.getByFolder(folderId),
  });
};

export const useProjectDocuments = (projectId: string) => {
  return useQuery({
    queryKey: [DOCUMENTS_QUERY_KEY, 'project', projectId],
    queryFn: () => documentsApi.getByProject(projectId),
    enabled: !!projectId,
  });
};

export const useSearchDocuments = (searchTerm: string) => {
  return useQuery({
    queryKey: [DOCUMENTS_QUERY_KEY, 'search', searchTerm],
    queryFn: () => documentsApi.search(searchTerm),
    enabled: searchTerm.length >= 2,
  });
};

export const useDocumentStats = (projectId?: string) => {
  return useQuery({
    queryKey: [DOCUMENTS_QUERY_KEY, 'stats', projectId],
    queryFn: () => documentsApi.getDocumentStats(projectId),
  });
};

export const useFolders = (parentId: string | null = null, projectId?: string) => {
  return useQuery({
    queryKey: [FOLDERS_QUERY_KEY, parentId, projectId],
    queryFn: () => documentsApi.getFolders(parentId, projectId),
  });
};

export const useFolder = (id: string) => {
  return useQuery({
    queryKey: [FOLDERS_QUERY_KEY, id],
    queryFn: () => documentsApi.getFolder(id),
    enabled: !!id,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ file, data }: { file: File; data: CreateDocumentData }) => {
      const id = await documentsApi.upload(file, data);
      if (currentUser) {
        await createAuditLog({
          action: 'document.uploaded',
          entityType: 'document',
          entityId: id,
          entityName: data.name || file.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
        });
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] });
      success('Document uploaded successfully');
    },
    onError: (err) => {
      error(`Failed to upload document: ${err.message}`);
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDocumentData }) => {
      const existingDoc = await documentsApi.getById(id);
      await documentsApi.update(id, data);
      if (currentUser && existingDoc) {
        await createAuditLog({
          action: 'document.updated',
          entityType: 'document',
          entityId: id,
          entityName: existingDoc.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: existingDoc as unknown as Record<string, unknown>,
            after: data as unknown as Record<string, unknown>,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] });
      success('Document updated successfully');
    },
    onError: (err) => {
      error(`Failed to update document: ${err.message}`);
    },
  });
};

export const useUploadNewVersion = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      file,
      notes,
    }: {
      id: string;
      file: File;
      notes?: string;
    }) => {
      if (!currentUser) throw new Error('User not authenticated');
      const existingDoc = await documentsApi.getById(id);
      await documentsApi.uploadNewVersion(id, file, currentUser.id, notes);
      if (existingDoc) {
        await createAuditLog({
          action: 'document.version_uploaded',
          entityType: 'document',
          entityId: id,
          entityName: existingDoc.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: { after: { notes } },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] });
      success('New version uploaded successfully');
    },
    onError: (err) => {
      error(`Failed to upload new version: ${err.message}`);
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const existingDoc = await documentsApi.getById(id);
      await documentsApi.delete(id);
      if (currentUser && existingDoc) {
        await createAuditLog({
          action: 'document.deleted',
          entityType: 'document',
          entityId: id,
          entityName: existingDoc.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] });
      success('Document deleted successfully');
    },
    onError: (err) => {
      error(`Failed to delete document: ${err.message}`);
    },
  });
};

export const useShareDocument = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      share,
    }: {
      id: string;
      share: Omit<DocumentShare, 'sharedAt'>;
    }) => {
      await documentsApi.share(id, share);
      const doc = await documentsApi.getById(id);
      if (currentUser && doc) {
        await createAuditLog({
          action: 'document.shared',
          entityType: 'document',
          entityId: id,
          entityName: doc.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: { after: share as unknown as Record<string, unknown> },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] });
      success('Document shared successfully');
    },
    onError: (err) => {
      error(`Failed to share document: ${err.message}`);
    },
  });
};

export const useUnshareDocument = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      await documentsApi.unshare(id, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] });
      success('Access removed');
    },
    onError: (err) => {
      error(`Failed to remove access: ${err.message}`);
    },
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateFolderData) => {
      const id = await documentsApi.createFolder(data);
      if (currentUser) {
        await createAuditLog({
          action: 'folder.created',
          entityType: 'folder',
          entityId: id,
          entityName: data.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
        });
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLDERS_QUERY_KEY] });
      success('Folder created successfully');
    },
    onError: (err) => {
      error(`Failed to create folder: ${err.message}`);
    },
  });
};

export const useUpdateFolder = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await documentsApi.updateFolder(id, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLDERS_QUERY_KEY] });
      success('Folder renamed successfully');
    },
    onError: (err) => {
      error(`Failed to rename folder: ${err.message}`);
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const folder = await documentsApi.getFolder(id);
      await documentsApi.deleteFolder(id);
      if (currentUser && folder) {
        await createAuditLog({
          action: 'folder.deleted',
          entityType: 'folder',
          entityId: id,
          entityName: folder.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLDERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] });
      success('Folder deleted successfully');
    },
    onError: (err) => {
      error(`Failed to delete folder: ${err.message}`);
    },
  });
};
