/**
 * Project Factory
 * Creates mock project data for testing
 */

import { Project, ProjectStatus, ProjectPriority, TeamMember, ProjectBudget, ProjectSettings } from '@/types/project';

let projectCounter = 0;

const mockTimestamp = {
  toDate: () => new Date(),
  seconds: Math.floor(Date.now() / 1000),
  nanoseconds: 0,
};

const defaultSettings: ProjectSettings = {
  allowExternalViewers: false,
  requireTaskApproval: false,
  enableTimeTracking: true,
  defaultTaskPriority: 'medium',
  notifyOnTaskComplete: true,
  notifyOnBudgetThreshold: true,
  budgetThreshold: 80,
};

export interface TeamMemberOptions {
  userId?: string;
  userName?: string;
  userPhotoURL?: string;
  role?: 'manager' | 'lead' | 'member' | 'viewer';
}

export function createMockTeamMember(options: TeamMemberOptions = {}): TeamMember {
  return {
    userId: options.userId || `user-${Math.random().toString(36).substr(2, 9)}`,
    userName: options.userName || 'Team Member',
    userPhotoURL: options.userPhotoURL || 'https://example.com/avatar.jpg',
    role: options.role || 'member',
    joinedAt: mockTimestamp as TeamMember['joinedAt'],
  };
}

export interface ProjectFactoryOptions {
  id?: string;
  name?: string;
  description?: string;
  code?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: Date | null;
  endDate?: Date | null;
  deadline?: Date | null;
  managerId?: string;
  managerName?: string;
  teamMembers?: TeamMember[];
  budget?: ProjectBudget | null;
  tags?: string[];
  color?: string;
  icon?: string;
  isArchived?: boolean;
  settings?: Partial<ProjectSettings>;
}

export function createMockProject(options: ProjectFactoryOptions = {}): Project {
  projectCounter++;
  const id = options.id || `project-${projectCounter}`;

  return {
    id,
    name: options.name || `Project ${projectCounter}`,
    description: options.description || `Description for project ${projectCounter}`,
    code: options.code || `PRJ-${String(projectCounter).padStart(3, '0')}`,
    status: options.status || 'active',
    priority: options.priority || 'medium',
    startDate: options.startDate ? (mockTimestamp as Project['startDate']) : null,
    endDate: options.endDate ? (mockTimestamp as Project['endDate']) : null,
    deadline: options.deadline ? (mockTimestamp as Project['deadline']) : null,
    managerId: options.managerId || 'manager-1',
    managerName: options.managerName || 'Project Manager',
    teamMembers: options.teamMembers || [
      createMockTeamMember({ userId: options.managerId || 'manager-1', role: 'manager' }),
    ],
    budget: options.budget ?? { total: 10000, spent: 0, currency: 'USD' },
    tags: options.tags || [],
    color: options.color || '#3B82F6',
    icon: options.icon || 'folder',
    isArchived: options.isArchived ?? false,
    settings: {
      ...defaultSettings,
      ...options.settings,
    },
    createdAt: mockTimestamp as Project['createdAt'],
    updatedAt: mockTimestamp as Project['updatedAt'],
  };
}

export function createMockActiveProject(options: ProjectFactoryOptions = {}): Project {
  return createMockProject({ ...options, status: 'active' });
}

export function createMockPlanningProject(options: ProjectFactoryOptions = {}): Project {
  return createMockProject({ ...options, status: 'planning' });
}

export function createMockCompletedProject(options: ProjectFactoryOptions = {}): Project {
  return createMockProject({ ...options, status: 'completed' });
}

export function createMockArchivedProject(options: ProjectFactoryOptions = {}): Project {
  return createMockProject({ ...options, isArchived: true });
}

export function createMockProjectWithTeam(
  options: ProjectFactoryOptions = {},
  teamSize: number = 3
): Project {
  const teamMembers = Array.from({ length: teamSize }, (_, i) =>
    createMockTeamMember({
      userId: `team-member-${i + 1}`,
      userName: `Team Member ${i + 1}`,
      role: i === 0 ? 'manager' : 'member',
    })
  );

  return createMockProject({
    ...options,
    teamMembers,
    managerId: teamMembers[0].userId,
    managerName: teamMembers[0].userName,
  });
}

// Create multiple projects
export function createMockProjects(count: number, options: ProjectFactoryOptions = {}): Project[] {
  return Array.from({ length: count }, () => createMockProject(options));
}

// Reset counter for tests
export function resetProjectFactory() {
  projectCounter = 0;
}
