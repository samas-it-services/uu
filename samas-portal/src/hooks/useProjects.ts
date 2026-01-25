import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  projectsApi,
  CreateProjectData,
  UpdateProjectData,
  ProjectFilters,
  ProjectListResult,
} from '@/services/api/projects';
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/utils/auditLog';
import { useAuth } from '@/hooks/useAuth';
import { TeamMember } from '@/types/project';

const PROJECTS_QUERY_KEY = 'projects';

export const useProjects = (filters?: ProjectFilters) => {
  return useQuery<ProjectListResult>({
    queryKey: [PROJECTS_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await projectsApi.getAll(filters, 100);
      return result;
    },
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: [PROJECTS_QUERY_KEY, id],
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });
};

export const useManagerProjects = (managerId: string) => {
  return useQuery({
    queryKey: [PROJECTS_QUERY_KEY, 'manager', managerId],
    queryFn: () => projectsApi.getByManager(managerId),
    enabled: !!managerId,
  });
};

export const useActiveProjects = () => {
  return useQuery({
    queryKey: [PROJECTS_QUERY_KEY, 'active'],
    queryFn: () => projectsApi.getActive(),
  });
};

export const useProjectStats = (projectId: string) => {
  return useQuery({
    queryKey: [PROJECTS_QUERY_KEY, 'stats', projectId],
    queryFn: () => projectsApi.getProjectStats(projectId),
    enabled: !!projectId,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const id = await projectsApi.create(data);
      if (currentUser) {
        await createAuditLog({
          action: 'project.created',
          entityType: 'project',
          entityId: id,
          entityName: data.name,
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
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      success('Project created successfully');
    },
    onError: (err) => {
      error(`Failed to create project: ${err.message}`);
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProjectData }) => {
      const existingProject = await projectsApi.getById(id);
      await projectsApi.update(id, data);
      if (currentUser && existingProject) {
        await createAuditLog({
          action: 'project.updated',
          entityType: 'project',
          entityId: id,
          entityName: existingProject.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: existingProject as unknown as Record<string, unknown>,
            after: data as unknown as Record<string, unknown>,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      success('Project updated successfully');
    },
    onError: (err) => {
      error(`Failed to update project: ${err.message}`);
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const existingProject = await projectsApi.getById(id);
      await projectsApi.delete(id);
      if (currentUser && existingProject) {
        await createAuditLog({
          action: 'project.deleted',
          entityType: 'project',
          entityId: id,
          entityName: existingProject.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: { before: existingProject as unknown as Record<string, unknown> },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      success('Project deleted successfully');
    },
    onError: (err) => {
      error(`Failed to delete project: ${err.message}`);
    },
  });
};

export const useArchiveProject = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const project = await projectsApi.getById(id);
      await projectsApi.archive(id);
      if (currentUser && project) {
        await createAuditLog({
          action: 'project.archived',
          entityType: 'project',
          entityId: id,
          entityName: project.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      success('Project archived');
    },
    onError: (err) => {
      error(`Failed to archive project: ${err.message}`);
    },
  });
};

export const useUnarchiveProject = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await projectsApi.unarchive(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      success('Project unarchived');
    },
    onError: (err) => {
      error(`Failed to unarchive project: ${err.message}`);
    },
  });
};

export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
    }) => {
      const project = await projectsApi.getById(id);
      await projectsApi.updateStatus(id, status);
      if (currentUser && project) {
        await createAuditLog({
          action: 'project.status_changed',
          entityType: 'project',
          entityId: id,
          entityName: project.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: {
            before: { status: project.status },
            after: { status },
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      success('Project status updated');
    },
    onError: (err) => {
      error(`Failed to update status: ${err.message}`);
    },
  });
};

export const useAddTeamMember = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({
      projectId,
      member,
    }: {
      projectId: string;
      member: TeamMember;
    }) => {
      const project = await projectsApi.getById(projectId);
      await projectsApi.addTeamMember(projectId, member);
      if (currentUser && project) {
        await createAuditLog({
          action: 'project.team_member_added',
          entityType: 'project',
          entityId: projectId,
          entityName: project.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: { after: { member: member.userName, role: member.role } },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      success('Team member added');
    },
    onError: (err) => {
      error(`Failed to add team member: ${err.message}`);
    },
  });
};

export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
      userName,
    }: {
      projectId: string;
      userId: string;
      userName: string;
    }) => {
      const project = await projectsApi.getById(projectId);
      await projectsApi.removeTeamMember(projectId, userId);
      if (currentUser && project) {
        await createAuditLog({
          action: 'project.team_member_removed',
          entityType: 'project',
          entityId: projectId,
          entityName: project.name,
          performedBy: {
            id: currentUser.id,
            email: currentUser.email,
            displayName: currentUser.displayName,
          },
          changes: { before: { member: userName } },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      success('Team member removed');
    },
    onError: (err) => {
      error(`Failed to remove team member: ${err.message}`);
    },
  });
};

export const useUpdateTeamMemberRole = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
      role,
    }: {
      projectId: string;
      userId: string;
      role: TeamMember['role'];
    }) => {
      await projectsApi.updateTeamMemberRole(projectId, userId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      success('Team member role updated');
    },
    onError: (err) => {
      error(`Failed to update role: ${err.message}`);
    },
  });
};

export const useUpdateProjectBudget = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({
      projectId,
      budget,
    }: {
      projectId: string;
      budget: { total: number; spent: number; currency: string };
    }) => {
      await projectsApi.updateBudget(projectId, budget);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      success('Budget updated');
    },
    onError: (err) => {
      error(`Failed to update budget: ${err.message}`);
    },
  });
};
