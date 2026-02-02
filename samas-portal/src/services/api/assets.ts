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
  or,
} from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import {
  Asset,
  AssetType,
  AssetStatus,
  AssetCondition,
  MaintenanceRecord,
} from '@/types/asset';

const COLLECTION_NAME = 'assets';

export interface CreateAssetData {
  name: string;
  description?: string;
  type: AssetType;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  purchaseDate?: Timestamp | null;
  purchasePrice?: number | null;
  currency?: string;
  warrantyExpiration?: Timestamp | null;
  status?: AssetStatus;
  condition?: AssetCondition;
  location?: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
  projectId?: string | null;
  isGlobal?: boolean;
  tags?: string[];
}

export interface UpdateAssetData {
  name?: string;
  description?: string;
  type?: AssetType;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  purchaseDate?: Timestamp | null;
  purchasePrice?: number | null;
  currency?: string;
  warrantyExpiration?: Timestamp | null;
  status?: AssetStatus;
  condition?: AssetCondition;
  location?: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
  assignedAt?: Timestamp | null;
  projectId?: string | null;
  isGlobal?: boolean;
  tags?: string[];
}

export interface AssetFilters {
  projectId?: string;
  status?: AssetStatus;
  type?: AssetType;
  assignedTo?: string;
  isGlobal?: boolean;
  condition?: AssetCondition;
}

export interface CreateMaintenanceData {
  type: 'repair' | 'upgrade' | 'inspection' | 'cleaning';
  description: string;
  performedBy: string;
  performedByName: string;
  cost?: number | null;
  notes?: string;
}

export const assetsApi = {
  /**
   * Get all assets with optional filters
   */
  async getAll(filters?: AssetFilters, pageLimit = 50): Promise<Asset[]> {
    const ref = collection(db, COLLECTION_NAME);
    let q = query(ref, orderBy('createdAt', 'desc'));

    if (filters?.projectId) {
      q = query(q, where('projectId', '==', filters.projectId));
    }
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters?.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters?.assignedTo) {
      q = query(q, where('assignedTo', '==', filters.assignedTo));
    }
    if (filters?.isGlobal !== undefined) {
      q = query(q, where('isGlobal', '==', filters.isGlobal));
    }
    if (filters?.condition) {
      q = query(q, where('condition', '==', filters.condition));
    }

    q = query(q, limit(pageLimit));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Asset[];
  },

  /**
   * Get assets for a specific project, optionally including global assets
   */
  async getByProject(
    projectId: string,
    includeGlobal = false,
    pageLimit = 100
  ): Promise<Asset[]> {
    const ref = collection(db, COLLECTION_NAME);

    if (includeGlobal) {
      // Get both project-specific and global assets
      const q = query(
        ref,
        or(
          where('projectId', '==', projectId),
          where('isGlobal', '==', true)
        ),
        orderBy('createdAt', 'desc'),
        limit(pageLimit)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Asset[];
    } else {
      // Get only project-specific assets
      const q = query(
        ref,
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc'),
        limit(pageLimit)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Asset[];
    }
  },

  /**
   * Get assets assigned to a specific user
   */
  async getByAssignee(userId: string, pageLimit = 50): Promise<Asset[]> {
    const ref = collection(db, COLLECTION_NAME);
    const q = query(
      ref,
      where('assignedTo', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(pageLimit)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Asset[];
  },

  /**
   * Get global assets (not tied to a specific project)
   */
  async getGlobal(pageLimit = 50): Promise<Asset[]> {
    const ref = collection(db, COLLECTION_NAME);
    const q = query(
      ref,
      where('isGlobal', '==', true),
      orderBy('createdAt', 'desc'),
      limit(pageLimit)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Asset[];
  },

  /**
   * Get a single asset by ID
   */
  async getById(id: string): Promise<Asset | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Asset;
  },

  /**
   * Create a new asset
   */
  async create(data: CreateAssetData): Promise<string> {
    const now = Timestamp.now();
    const ref = collection(db, COLLECTION_NAME);

    // Validate serial number uniqueness if provided
    if (data.serialNumber) {
      const existing = await this.findBySerialNumber(data.serialNumber);
      if (existing) {
        throw new Error('An asset with this serial number already exists');
      }
    }

    const docRef = await addDoc(ref, {
      name: data.name,
      description: data.description || '',
      type: data.type,
      serialNumber: data.serialNumber || null,
      manufacturer: data.manufacturer || null,
      model: data.model || null,
      purchaseDate: data.purchaseDate || null,
      purchasePrice: data.purchasePrice || null,
      currency: data.currency || 'USD',
      warrantyExpiration: data.warrantyExpiration || null,
      status: data.status || 'available',
      condition: data.condition || 'good',
      location: data.location || '',
      assignedTo: data.assignedTo || null,
      assignedToName: data.assignedToName || null,
      assignedAt: data.assignedTo ? now : null,
      projectId: data.projectId || null,
      isGlobal: data.isGlobal ?? false,
      maintenanceHistory: [],
      documents: [],
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  },

  /**
   * Update an existing asset
   */
  async update(id: string, data: UpdateAssetData): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const now = Timestamp.now();

    // Validate serial number uniqueness if changed
    if (data.serialNumber !== undefined) {
      const existing = await this.getById(id);
      if (existing && data.serialNumber && data.serialNumber !== existing.serialNumber) {
        const duplicate = await this.findBySerialNumber(data.serialNumber);
        if (duplicate && duplicate.id !== id) {
          throw new Error('An asset with this serial number already exists');
        }
      }
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: now,
    });
  },

  /**
   * Delete an asset
   */
  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (existing?.assignedTo) {
      throw new Error('Cannot delete an asset that is currently assigned. Unassign it first.');
    }
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  /**
   * Assign an asset to a user
   */
  async assign(
    id: string,
    userId: string,
    userName: string,
    force = false
  ): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Asset not found');

    if (existing.assignedTo && existing.assignedTo !== userId && !force) {
      throw new Error(
        `Asset is already assigned to ${existing.assignedToName}. Use force=true to reassign.`
      );
    }

    const now = Timestamp.now();
    const docRef = doc(db, COLLECTION_NAME, id);

    await updateDoc(docRef, {
      assignedTo: userId,
      assignedToName: userName,
      assignedAt: now,
      status: 'assigned',
      updatedAt: now,
    });
  },

  /**
   * Unassign an asset from a user
   */
  async unassign(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const now = Timestamp.now();

    await updateDoc(docRef, {
      assignedTo: null,
      assignedToName: null,
      assignedAt: null,
      status: 'available',
      updatedAt: now,
    });
  },

  /**
   * Update asset status
   */
  async updateStatus(id: string, status: AssetStatus): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const now = Timestamp.now();

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: now,
    };

    // Clear assignment if retiring or marking as lost
    if (status === 'retired' || status === 'lost' || status === 'disposed') {
      updateData.assignedTo = null;
      updateData.assignedToName = null;
      updateData.assignedAt = null;
    }

    await updateDoc(docRef, updateData);
  },

  /**
   * Add a maintenance record
   */
  async addMaintenance(id: string, data: CreateMaintenanceData): Promise<string> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Asset not found');

    const now = Timestamp.now();
    const recordId = `maint_${Date.now()}`;

    const record: MaintenanceRecord = {
      id: recordId,
      type: data.type,
      description: data.description,
      performedBy: data.performedBy,
      performedByName: data.performedByName,
      cost: data.cost || null,
      date: now,
      notes: data.notes || '',
    };

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      maintenanceHistory: [...existing.maintenanceHistory, record],
      updatedAt: now,
    });

    return recordId;
  },

  /**
   * Find an asset by serial number
   */
  async findBySerialNumber(serialNumber: string): Promise<Asset | null> {
    const ref = collection(db, COLLECTION_NAME);
    const q = query(ref, where('serialNumber', '==', serialNumber), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Asset;
  },

  /**
   * Search assets by name, serial number, or model
   */
  async search(searchTerm: string, projectId?: string): Promise<Asset[]> {
    const ref = collection(db, COLLECTION_NAME);
    let baseQuery = query(ref, orderBy('name'));

    if (projectId) {
      baseQuery = query(baseQuery, where('projectId', '==', projectId));
    }

    const snapshot = await getDocs(baseQuery);
    const term = searchTerm.toLowerCase();

    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Asset)
      .filter(
        (a) =>
          a.name.toLowerCase().includes(term) ||
          (a.serialNumber && a.serialNumber.toLowerCase().includes(term)) ||
          (a.model && a.model.toLowerCase().includes(term)) ||
          (a.manufacturer && a.manufacturer.toLowerCase().includes(term))
      );
  },

  /**
   * Get asset statistics for a project or globally
   */
  async getStats(projectId?: string): Promise<{
    total: number;
    byStatus: Record<AssetStatus, number>;
    byType: Record<AssetType, number>;
    totalValue: number;
  }> {
    const ref = collection(db, COLLECTION_NAME);
    let q = query(ref);

    if (projectId) {
      q = query(q, where('projectId', '==', projectId));
    }

    const snapshot = await getDocs(q);
    const assets = snapshot.docs.map((doc) => doc.data() as Omit<Asset, 'id'>);

    const byStatus: Record<AssetStatus, number> = {
      available: 0,
      assigned: 0,
      maintenance: 0,
      retired: 0,
      lost: 0,
      disposed: 0,
    };

    const byType: Record<AssetType, number> = {
      laptop: 0,
      desktop: 0,
      monitor: 0,
      keyboard: 0,
      mouse: 0,
      phone: 0,
      tablet: 0,
      printer: 0,
      server: 0,
      network: 0,
      software_license: 0,
      furniture: 0,
      vehicle: 0,
      other: 0,
    };

    let totalValue = 0;

    assets.forEach((a) => {
      byStatus[a.status]++;
      byType[a.type]++;
      if (a.purchasePrice) {
        totalValue += a.purchasePrice;
      }
    });

    return {
      total: assets.length,
      byStatus,
      byType,
      totalValue,
    };
  },
};
