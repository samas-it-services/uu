import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { RolePermissions } from '@/types/role';
import { ProjectRole, DEFAULT_PROJECT_ROLE_TEMPLATES } from '@/types/projectRole';

/**
 * Project Roles API
 *
 * Manages project-specific roles stored in: projects/{projectId}/roles/{roleId}
 * Each project can have custom roles with their own permissions.
 */

export interface CreateProjectRoleData {
  name: string;
  description: string;
  permissions: RolePermissions;
  color?: string;
  isDefault?: boolean;
}

export interface UpdateProjectRoleData {
  name?: string;
  description?: string;
  permissions?: RolePermissions;
  color?: string;
}

/**
 * Get the roles subcollection reference for a project
 */
function getProjectRolesRef(projectId: string) {
  return collection(db, 'projects', projectId, 'roles');
}

/**
 * Get a specific role document reference
 */
function getProjectRoleDocRef(projectId: string, roleId: string) {
  return doc(db, 'projects', projectId, 'roles', roleId);
}

export const projectRolesApi = {
  /**
   * Get all roles for a project
   */
  async getAll(projectId: string): Promise<ProjectRole[]> {
    const rolesRef = getProjectRolesRef(projectId);
    const q = query(rolesRef, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      projectId,
      ...doc.data(),
    })) as ProjectRole[];
  },

  /**
   * Get a single role by ID
   */
  async getById(projectId: string, roleId: string): Promise<ProjectRole | null> {
    const docRef = getProjectRoleDocRef(projectId, roleId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return {
      id: snapshot.id,
      projectId,
      ...snapshot.data(),
    } as ProjectRole;
  },

  /**
   * Create a new project role
   */
  async create(projectId: string, data: CreateProjectRoleData): Promise<string> {
    const rolesRef = getProjectRolesRef(projectId);
    const now = Timestamp.now();
    const docRef = await addDoc(rolesRef, {
      name: data.name,
      description: data.description,
      permissions: data.permissions,
      color: data.color || '#6b7280',
      isDefault: data.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  /**
   * Update an existing project role
   */
  async update(
    projectId: string,
    roleId: string,
    data: UpdateProjectRoleData
  ): Promise<void> {
    const docRef = getProjectRoleDocRef(projectId, roleId);
    const role = await this.getById(projectId, roleId);

    // Prevent renaming default roles
    if (role?.isDefault && data.name) {
      delete data.name;
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Delete a project role
   */
  async delete(projectId: string, roleId: string): Promise<void> {
    const role = await this.getById(projectId, roleId);

    // Prevent deleting default roles
    if (role?.isDefault) {
      throw new Error('Cannot delete default project roles');
    }

    const docRef = getProjectRoleDocRef(projectId, roleId);
    await deleteDoc(docRef);
  },

  /**
   * Create default roles for a new project
   * Called when a project is created
   */
  async createDefaultRoles(projectId: string): Promise<void> {
    const now = Timestamp.now();
    const rolesRef = getProjectRolesRef(projectId);

    for (const template of DEFAULT_PROJECT_ROLE_TEMPLATES) {
      await addDoc(rolesRef, {
        ...template,
        createdAt: now,
        updatedAt: now,
      });
    }
  },

  /**
   * Check if a project has roles set up
   */
  async hasRoles(projectId: string): Promise<boolean> {
    const roles = await this.getAll(projectId);
    return roles.length > 0;
  },

  /**
   * Get the default "Observer" role for a project (for new members)
   */
  async getDefaultMemberRole(projectId: string): Promise<ProjectRole | null> {
    const roles = await this.getAll(projectId);
    // Return Observer role by default, or first available role
    return (
      roles.find((r) => r.name === 'Observer') ||
      roles.find((r) => r.name === 'Developer') ||
      roles[0] ||
      null
    );
  },

  /**
   * Get the admin role for a project
   */
  async getAdminRole(projectId: string): Promise<ProjectRole | null> {
    const roles = await this.getAll(projectId);
    return roles.find((r) => r.name === 'Project Admin') || roles[0] || null;
  },
};
