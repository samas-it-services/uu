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
  serverTimestamp,
  writeBatch,
  or,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  CustomFieldDefinition,
  CreateCustomFieldInput,
  UpdateCustomFieldInput,
} from '@/types/customField';

const COLLECTION_NAME = 'customFieldDefinitions';

/**
 * Custom Fields API Service
 *
 * Manages custom field definitions in Firestore.
 */
export const customFieldsApi = {
  /**
   * Get all custom field definitions
   */
  async getAll(): Promise<CustomFieldDefinition[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CustomFieldDefinition[];
  },

  /**
   * Get a single custom field definition by ID
   */
  async getById(id: string): Promise<CustomFieldDefinition | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as CustomFieldDefinition;
  },

  /**
   * Get custom fields for a specific project (includes global fields)
   */
  async getByProject(projectId: string): Promise<CustomFieldDefinition[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      or(
        where('projectId', '==', null),
        where('projectId', '==', projectId)
      ),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CustomFieldDefinition[];
  },

  /**
   * Get only global custom fields (projectId is null)
   */
  async getGlobal(): Promise<CustomFieldDefinition[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('projectId', '==', null),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CustomFieldDefinition[];
  },

  /**
   * Get enabled custom fields for a project (for form rendering)
   */
  async getEnabledByProject(projectId: string): Promise<CustomFieldDefinition[]> {
    const fields = await this.getByProject(projectId);
    return fields.filter((field) => field.enabled);
  },

  /**
   * Check if a key is unique within scope
   */
  async isKeyUnique(key: string, projectId: string | null, excludeId?: string): Promise<boolean> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('key', '==', key),
      where('projectId', '==', projectId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return true;
    if (excludeId && snapshot.docs.length === 1 && snapshot.docs[0].id === excludeId) {
      return true;
    }
    return false;
  },

  /**
   * Get the next order value for a given scope
   */
  async getNextOrder(projectId: string | null): Promise<number> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('projectId', '==', projectId),
      orderBy('order', 'desc')
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;
    const maxOrder = snapshot.docs[0].data().order || 0;
    return maxOrder + 1;
  },

  /**
   * Create a new custom field definition
   */
  async create(
    input: CreateCustomFieldInput,
    userId: string
  ): Promise<string> {
    // Validate unique key
    const isUnique = await this.isKeyUnique(input.key, input.projectId ?? null);
    if (!isUnique) {
      throw new Error(`Field key "${input.key}" already exists in this scope`);
    }

    // Get next order
    const order = await this.getNextOrder(input.projectId ?? null);

    // Process options if provided
    const options = input.options?.map((opt, index) => ({
      ...opt,
      order: index,
    }));

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      name: input.name,
      key: input.key,
      description: input.description || null,
      type: input.type,
      options: options || null,
      required: input.required ?? false,
      defaultValue: input.defaultValue ?? null,
      projectId: input.projectId ?? null,
      section: input.section || null,
      placeholder: input.placeholder || null,
      min: input.min ?? null,
      max: input.max ?? null,
      precision: input.precision ?? null,
      maxLength: input.maxLength ?? null,
      multiline: input.multiline ?? false,
      order,
      enabled: true,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  /**
   * Update a custom field definition
   */
  async update(
    id: string,
    input: UpdateCustomFieldInput,
    userId: string
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);

    // Build update object, only including defined fields
    const updateData: Record<string, unknown> = {
      updatedBy: userId,
      updatedAt: serverTimestamp(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.options !== undefined) updateData.options = input.options;
    if (input.required !== undefined) updateData.required = input.required;
    if (input.defaultValue !== undefined) updateData.defaultValue = input.defaultValue;
    if (input.section !== undefined) updateData.section = input.section;
    if (input.placeholder !== undefined) updateData.placeholder = input.placeholder;
    if (input.order !== undefined) updateData.order = input.order;
    if (input.enabled !== undefined) updateData.enabled = input.enabled;
    if (input.min !== undefined) updateData.min = input.min;
    if (input.max !== undefined) updateData.max = input.max;
    if (input.precision !== undefined) updateData.precision = input.precision;
    if (input.maxLength !== undefined) updateData.maxLength = input.maxLength;
    if (input.multiline !== undefined) updateData.multiline = input.multiline;

    await updateDoc(docRef, updateData);
  },

  /**
   * Delete a custom field definition
   */
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  /**
   * Reorder custom fields within a scope
   */
  async reorder(
    fieldIds: string[],
    userId: string
  ): Promise<void> {
    const batch = writeBatch(db);

    fieldIds.forEach((id, index) => {
      const docRef = doc(db, COLLECTION_NAME, id);
      batch.update(docRef, {
        order: index,
        updatedBy: userId,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  },

  /**
   * Toggle field enabled status
   */
  async toggleEnabled(id: string, userId: string): Promise<void> {
    const field = await this.getById(id);
    if (!field) throw new Error('Field not found');

    await this.update(id, { enabled: !field.enabled }, userId);
  },

  /**
   * Duplicate a field definition (for creating similar fields)
   */
  async duplicate(
    id: string,
    newKey: string,
    userId: string
  ): Promise<string> {
    const original = await this.getById(id);
    if (!original) throw new Error('Field not found');

    return this.create(
      {
        name: `${original.name} (Copy)`,
        key: newKey,
        description: original.description,
        type: original.type,
        options: original.options?.map(({ value, label, color, description }) => ({
          value,
          label,
          color,
          description,
        })),
        required: original.required,
        defaultValue: original.defaultValue,
        projectId: original.projectId,
        section: original.section,
        placeholder: original.placeholder,
        min: original.min ?? undefined,
        max: original.max ?? undefined,
        precision: original.precision ?? undefined,
        maxLength: original.maxLength ?? undefined,
        multiline: original.multiline ?? undefined,
      },
      userId
    );
  },
};
