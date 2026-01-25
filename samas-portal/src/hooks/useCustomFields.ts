import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customFieldsApi } from '@/services/api/customFields';
import {
  CustomFieldDefinition,
  CreateCustomFieldInput,
  UpdateCustomFieldInput,
} from '@/types/customField';
import { useAuth } from './useAuth';

const QUERY_KEYS = {
  all: ['customFields'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (projectId?: string | null) => [...QUERY_KEYS.lists(), projectId] as const,
  global: () => [...QUERY_KEYS.all, 'global'] as const,
  detail: (id: string) => [...QUERY_KEYS.all, 'detail', id] as const,
};

/**
 * Hook to fetch all custom field definitions
 */
export function useCustomFields(projectId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.list(projectId),
    queryFn: async () => {
      if (projectId) {
        return customFieldsApi.getByProject(projectId);
      }
      return customFieldsApi.getAll();
    },
  });
}

/**
 * Hook to fetch only global custom fields
 */
export function useGlobalCustomFields() {
  return useQuery({
    queryKey: QUERY_KEYS.global(),
    queryFn: () => customFieldsApi.getGlobal(),
  });
}

/**
 * Hook to fetch enabled custom fields for a project (for forms)
 */
export function useEnabledCustomFields(projectId: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.list(projectId), 'enabled'],
    queryFn: () => customFieldsApi.getEnabledByProject(projectId),
    enabled: !!projectId,
  });
}

/**
 * Hook to fetch a single custom field by ID
 */
export function useCustomField(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => customFieldsApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new custom field definition
 */
export function useCreateCustomField() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateCustomFieldInput) => {
      if (!user?.id) throw new Error('User not authenticated');
      return customFieldsApi.create(input, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook to update a custom field definition
 */
export function useUpdateCustomField() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateCustomFieldInput;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return customFieldsApi.update(id, input, user.id);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
    },
  });
}

/**
 * Hook to delete a custom field definition
 */
export function useDeleteCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customFieldsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook to reorder custom fields
 */
export function useReorderCustomFields() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (fieldIds: string[]) => {
      if (!user?.id) throw new Error('User not authenticated');
      return customFieldsApi.reorder(fieldIds, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook to toggle field enabled status
 */
export function useToggleCustomFieldEnabled() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      return customFieldsApi.toggleEnabled(id, user.id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
    },
  });
}

/**
 * Hook to duplicate a custom field
 */
export function useDuplicateCustomField() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, newKey }: { id: string; newKey: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return customFieldsApi.duplicate(id, newKey, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Group custom fields by section
 */
export function groupFieldsBySection(
  fields: CustomFieldDefinition[]
): Record<string, CustomFieldDefinition[]> {
  return fields.reduce(
    (acc, field) => {
      const section = field.section || 'Other';
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(field);
      return acc;
    },
    {} as Record<string, CustomFieldDefinition[]>
  );
}

/**
 * Get field type display info
 */
export function getFieldTypeInfo(type: CustomFieldDefinition['type']): {
  label: string;
  icon: string;
  description: string;
} {
  const typeInfo: Record<
    CustomFieldDefinition['type'],
    { label: string; icon: string; description: string }
  > = {
    text: {
      label: 'Text',
      icon: 'Type',
      description: 'Free text input',
    },
    number: {
      label: 'Number',
      icon: 'Hash',
      description: 'Numeric value',
    },
    enum: {
      label: 'Dropdown',
      icon: 'ChevronDown',
      description: 'Single select from options',
    },
    multi_enum: {
      label: 'Multi-select',
      icon: 'CheckSquare',
      description: 'Multiple selections',
    },
    date: {
      label: 'Date',
      icon: 'Calendar',
      description: 'Date picker',
    },
    person: {
      label: 'Person',
      icon: 'User',
      description: 'User reference',
    },
    checkbox: {
      label: 'Checkbox',
      icon: 'CheckCircle',
      description: 'Yes/No toggle',
    },
    url: {
      label: 'URL',
      icon: 'Link',
      description: 'Web link',
    },
  };

  return typeInfo[type];
}
