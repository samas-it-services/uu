import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
  startAfter,
  DocumentSnapshot,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { projectRolesApi } from './projectRoles';
import {
  Project,
  ProjectStatus,
  ProjectPriority,
  TeamMember,
  ProjectBudget,
  ProjectSettings,
} from '@/types/project';

const PROJECTS_COLLECTION = 'projects';

export interface CreateProjectData {
  name: string;
  description: string;
  code: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: Date | null;
  endDate?: Date | null;
  deadline?: Date | null;
  managerId: string;
  managerName: string;
  budget?: ProjectBudget | null;
  tags?: string[];
  color?: string;
  icon?: string;
  settings?: Partial<ProjectSettings>;
}

export interface UpdateProjectData {
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
  budget?: ProjectBudget | null;
  tags?: string[];
  color?: string;
  icon?: string;
  isArchived?: boolean;
  settings?: Partial<ProjectSettings>;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  priority?: ProjectPriority;
  managerId?: string;
  isArchived?: boolean;
  search?: string;
}

export interface ProjectListResult {
  projects: Project[];
  lastDoc: DocumentSnapshot | null;
}

const defaultSettings: ProjectSettings = {
  allowExternalViewers: false,
  requireTaskApproval: false,
  enableTimeTracking: true,
  defaultTaskPriority: 'medium',
  notifyOnTaskComplete: true,
  notifyOnBudgetThreshold: true,
  budgetThreshold: 80,
};

export const projectsApi = {
  async getAll(
    filters?: ProjectFilters,
    pageSize = 50,
    lastDoc?: DocumentSnapshot
  ): Promise<ProjectListResult> {
    const projectsRef = collection(db, PROJECTS_COLLECTION);
    let q = query(projectsRef, orderBy('createdAt', 'desc'));

    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters?.priority) {
      q = query(q, where('priority', '==', filters.priority));
    }
    if (filters?.managerId) {
      q = query(q, where('managerId', '==', filters.managerId));
    }
    if (filters?.isArchived !== undefined) {
      q = query(q, where('isArchived', '==', filters.isArchived));
    }

    q = query(q, limit(pageSize));

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const projects = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];

    const newLastDoc =
      snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1]
        : null;

    return { projects, lastDoc: newLastDoc };
  },

  async getById(id: string): Promise<Project | null> {
    const docRef = doc(db, PROJECTS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Project;
  },

  async getByManager(managerId: string): Promise<Project[]> {
    const projectsRef = collection(db, PROJECTS_COLLECTION);
    const q = query(
      projectsRef,
      where('managerId', '==', managerId),
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
  },

  async getByTeamMember(userId: string): Promise<Project[]> {
    const projectsRef = collection(db, PROJECTS_COLLECTION);
    const q = query(
      projectsRef,
      where('teamMembers', 'array-contains', { userId }),
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
  },

  async getActive(): Promise<Project[]> {
    const projectsRef = collection(db, PROJECTS_COLLECTION);
    const q = query(
      projectsRef,
      where('status', 'in', ['planning', 'active']),
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
  },

  async create(data: CreateProjectData): Promise<string> {
    const projectsRef = collection(db, PROJECTS_COLLECTION);
    const now = Timestamp.now();

    const docRef = await addDoc(projectsRef, {
      name: data.name,
      description: data.description,
      code: data.code,
      status: data.status || 'planning',
      priority: data.priority || 'medium',
      startDate: data.startDate ? Timestamp.fromDate(data.startDate) : null,
      endDate: data.endDate ? Timestamp.fromDate(data.endDate) : null,
      deadline: data.deadline ? Timestamp.fromDate(data.deadline) : null,
      managerId: data.managerId,
      managerName: data.managerName,
      teamMembers: [
        {
          userId: data.managerId,
          userName: data.managerName,
          userPhotoURL: '',
          role: 'manager',
          joinedAt: now,
        },
      ],
      budget: data.budget || null,
      tags: data.tags || [],
      color: data.color || '#3B82F6',
      icon: data.icon || 'folder',
      isArchived: false,
      settings: { ...defaultSettings, ...data.settings },
      createdAt: now,
      updatedAt: now,
    });

    // Create default project roles in the subcollection
    await projectRolesApi.createDefaultRoles(docRef.id);

    // Update the manager's team member record with their project role
    const adminRole = await projectRolesApi.getAdminRole(docRef.id);
    if (adminRole) {
      const projectDoc = doc(db, PROJECTS_COLLECTION, docRef.id);
      await updateDoc(projectDoc, {
        teamMembers: [
          {
            userId: data.managerId,
            userName: data.managerName,
            userPhotoURL: '',
            role: 'manager',
            projectRoleId: adminRole.id,
            projectRoleName: adminRole.name,
            joinedAt: now,
          },
        ],
      });
    }

    return docRef.id;
  },

  async update(id: string, data: UpdateProjectData): Promise<void> {
    const docRef = doc(db, PROJECTS_COLLECTION, id);
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    // Convert dates to Timestamps
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate
        ? Timestamp.fromDate(data.startDate)
        : null;
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate
        ? Timestamp.fromDate(data.endDate)
        : null;
    }
    if (data.deadline !== undefined) {
      updateData.deadline = data.deadline
        ? Timestamp.fromDate(data.deadline)
        : null;
    }

    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, PROJECTS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  async archive(id: string): Promise<void> {
    const docRef = doc(db, PROJECTS_COLLECTION, id);
    await updateDoc(docRef, {
      isArchived: true,
      updatedAt: Timestamp.now(),
    });
  },

  async unarchive(id: string): Promise<void> {
    const docRef = doc(db, PROJECTS_COLLECTION, id);
    await updateDoc(docRef, {
      isArchived: false,
      updatedAt: Timestamp.now(),
    });
  },

  async updateStatus(id: string, status: ProjectStatus): Promise<void> {
    const docRef = doc(db, PROJECTS_COLLECTION, id);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  },

  async addTeamMember(id: string, member: TeamMember): Promise<void> {
    const docRef = doc(db, PROJECTS_COLLECTION, id);
    await updateDoc(docRef, {
      teamMembers: arrayUnion(member),
      updatedAt: Timestamp.now(),
    });
  },

  async removeTeamMember(id: string, userId: string): Promise<void> {
    const project = await this.getById(id);
    if (!project) return;

    const memberToRemove = project.teamMembers.find((m) => m.userId === userId);
    if (!memberToRemove) return;

    const docRef = doc(db, PROJECTS_COLLECTION, id);
    await updateDoc(docRef, {
      teamMembers: arrayRemove(memberToRemove),
      updatedAt: Timestamp.now(),
    });
  },

  async updateTeamMemberRole(
    id: string,
    userId: string,
    role: TeamMember['role']
  ): Promise<void> {
    const project = await this.getById(id);
    if (!project) return;

    const updatedMembers = project.teamMembers.map((m) =>
      m.userId === userId ? { ...m, role } : m
    );

    const docRef = doc(db, PROJECTS_COLLECTION, id);
    await updateDoc(docRef, {
      teamMembers: updatedMembers,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Update a team member's project role (new RBAC system)
   */
  async updateTeamMemberProjectRole(
    projectId: string,
    userId: string,
    projectRoleId: string,
    projectRoleName: string
  ): Promise<void> {
    const project = await this.getById(projectId);
    if (!project) return;

    const updatedMembers = project.teamMembers.map((m) =>
      m.userId === userId
        ? { ...m, projectRoleId, projectRoleName }
        : m
    );

    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(docRef, {
      teamMembers: updatedMembers,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Add a team member with a project role
   */
  async addTeamMemberWithRole(
    projectId: string,
    member: Omit<TeamMember, 'joinedAt'>,
    projectRoleId: string,
    projectRoleName: string
  ): Promise<void> {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    const now = Timestamp.now();
    await updateDoc(docRef, {
      teamMembers: arrayUnion({
        ...member,
        projectRoleId,
        projectRoleName,
        joinedAt: now,
      }),
      updatedAt: now,
    });
  },

  async updateBudget(id: string, budget: ProjectBudget): Promise<void> {
    const docRef = doc(db, PROJECTS_COLLECTION, id);
    await updateDoc(docRef, {
      budget,
      updatedAt: Timestamp.now(),
    });
  },

  async getProjectStats(id: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    totalExpenses: number;
    teamSize: number;
  }> {
    const project = await this.getById(id);
    if (!project) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        totalExpenses: 0,
        teamSize: 0,
      };
    }

    // Get tasks count
    const tasksRef = collection(db, 'tasks');
    const tasksQuery = query(tasksRef, where('projectId', '==', id));
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map((doc) => doc.data());

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) =>
        t.dueDate &&
        t.status !== 'done' &&
        t.dueDate.toDate() < now
    ).length;

    // Get expenses total
    const expensesRef = collection(db, 'expenses');
    const expensesQuery = query(
      expensesRef,
      where('projectId', '==', id),
      where('status', 'in', ['approved', 'paid'])
    );
    const expensesSnapshot = await getDocs(expensesQuery);
    const totalExpenses = expensesSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      totalExpenses,
      teamSize: project.teamMembers.length,
    };
  },
};
