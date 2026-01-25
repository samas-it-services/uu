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
} from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { Role, RolePermissions, DataAccess } from '@/types/role';

const ROLES_COLLECTION = 'roles';

export interface CreateRoleData {
  name: string;
  description: string;
  isSystem?: boolean;
  permissions: RolePermissions;
  dataAccess: DataAccess;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: RolePermissions;
  dataAccess?: DataAccess;
}

const defaultPermission = {
  create: false,
  read: false,
  update: false,
  delete: false,
};

export const defaultPermissions: RolePermissions = {
  finance: { ...defaultPermission },
  documents: { ...defaultPermission },
  projects: { ...defaultPermission },
  assets: { ...defaultPermission },
  tasks: { ...defaultPermission },
  announcements: { ...defaultPermission },
  rbac: { ...defaultPermission },
};

export const defaultDataAccess: DataAccess = {
  allProjects: false,
  sensitiveFinancials: false,
  globalAssets: false,
};

export const rolesApi = {
  async getAll(): Promise<Role[]> {
    const rolesRef = collection(db, ROLES_COLLECTION);
    const q = query(rolesRef, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Role[];
  },

  async getById(id: string): Promise<Role | null> {
    const docRef = doc(db, ROLES_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Role;
  },

  async getByIds(ids: string[]): Promise<Role[]> {
    if (ids.length === 0) return [];
    const roles: Role[] = [];
    for (const id of ids) {
      const role = await this.getById(id);
      if (role) roles.push(role);
    }
    return roles;
  },

  async getSystemRoles(): Promise<Role[]> {
    const rolesRef = collection(db, ROLES_COLLECTION);
    const q = query(rolesRef, where('isSystem', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Role[];
  },

  async getCustomRoles(): Promise<Role[]> {
    const rolesRef = collection(db, ROLES_COLLECTION);
    const q = query(rolesRef, where('isSystem', '==', false));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Role[];
  },

  async create(data: CreateRoleData): Promise<string> {
    const rolesRef = collection(db, ROLES_COLLECTION);
    const now = Timestamp.now();
    const docRef = await addDoc(rolesRef, {
      ...data,
      isSystem: data.isSystem ?? false,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async update(id: string, data: UpdateRoleData): Promise<void> {
    const docRef = doc(db, ROLES_COLLECTION, id);
    const role = await this.getById(id);

    // Prevent updating system roles' critical fields
    if (role?.isSystem) {
      delete data.name;
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(id: string): Promise<void> {
    const role = await this.getById(id);

    // Prevent deleting system roles
    if (role?.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    const docRef = doc(db, ROLES_COLLECTION, id);
    await deleteDoc(docRef);
  },

  async updatePermissions(id: string, permissions: RolePermissions): Promise<void> {
    const docRef = doc(db, ROLES_COLLECTION, id);
    await updateDoc(docRef, {
      permissions,
      updatedAt: Timestamp.now(),
    });
  },

  async updateDataAccess(id: string, dataAccess: DataAccess): Promise<void> {
    const docRef = doc(db, ROLES_COLLECTION, id);
    await updateDoc(docRef, {
      dataAccess,
      updatedAt: Timestamp.now(),
    });
  },
};
