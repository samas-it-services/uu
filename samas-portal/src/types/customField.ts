import { Timestamp } from 'firebase/firestore';

/**
 * Custom Field Types
 *
 * Enterprise-grade custom fields system for tasks.
 * Inspired by Jira, Asana, and ServiceNow custom field systems.
 */

/**
 * Supported field types for custom fields
 */
export type CustomFieldType =
  | 'text' // Free text input
  | 'number' // Numeric values with precision
  | 'enum' // Single-select dropdown
  | 'multi_enum' // Multi-select tags
  | 'date' // Date/datetime picker
  | 'person' // User reference (picker)
  | 'checkbox' // Boolean toggle
  | 'url'; // URL with validation

/**
 * Custom field value types based on field definition
 */
export type CustomFieldValue =
  | string // text, enum, url
  | number // number
  | boolean // checkbox
  | string[] // multi_enum
  | CustomFieldDateValue // date/datetime
  | CustomFieldPersonValue; // person reference

/**
 * Date value structure for date fields
 */
export interface CustomFieldDateValue {
  date: string; // ISO date string (YYYY-MM-DD)
  time?: string; // Optional time (HH:mm)
}

/**
 * Person reference value for person fields
 */
export interface CustomFieldPersonValue {
  userId: string;
  displayName: string;
  email?: string;
  photoURL?: string;
}

/**
 * Option for enum/multi_enum fields
 */
export interface CustomFieldOption {
  value: string; // Machine value
  label: string; // Display label
  color?: string; // Optional color for visual indicator
  description?: string; // Optional description/help text
  order: number; // Sort order
}

/**
 * Custom field definition stored in Firestore
 */
export interface CustomFieldDefinition {
  id: string;
  name: string; // Display name (e.g., "Task Type")
  key: string; // Machine key (e.g., "taskType") - must be unique per scope
  description?: string; // Help text for users
  type: CustomFieldType;

  // For enum/multi_enum types
  options?: CustomFieldOption[];

  // Validation
  required: boolean;
  defaultValue?: CustomFieldValue;

  // Scope
  projectId?: string | null; // null = global, string = project-scoped

  // Display
  order: number; // Sort order in forms
  section?: string; // Group fields into sections (e.g., "Goals", "Categorization")
  placeholder?: string; // Placeholder text for input

  // For number type
  min?: number;
  max?: number;
  precision?: number; // Decimal places

  // For text type
  maxLength?: number;
  multiline?: boolean; // Textarea vs input

  // State
  enabled: boolean;

  // Audit
  createdBy: string;
  createdAt: Timestamp;
  updatedBy?: string;
  updatedAt: Timestamp;
}

/**
 * Input for creating a new custom field definition
 */
export interface CreateCustomFieldInput {
  name: string;
  key: string;
  description?: string;
  type: CustomFieldType;
  options?: Omit<CustomFieldOption, 'order'>[];
  required?: boolean;
  defaultValue?: CustomFieldValue;
  projectId?: string | null;
  section?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  precision?: number;
  maxLength?: number;
  multiline?: boolean;
}

/**
 * Input for updating a custom field definition
 */
export interface UpdateCustomFieldInput {
  name?: string;
  description?: string;
  options?: CustomFieldOption[];
  required?: boolean;
  defaultValue?: CustomFieldValue;
  section?: string;
  placeholder?: string;
  order?: number;
  enabled?: boolean;
  min?: number;
  max?: number;
  precision?: number;
  maxLength?: number;
  multiline?: boolean;
}

/**
 * Type guard to check if a value is a date field value
 */
export function isCustomFieldDateValue(
  value: CustomFieldValue
): value is CustomFieldDateValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'date' in value &&
    typeof (value as CustomFieldDateValue).date === 'string'
  );
}

/**
 * Type guard to check if a value is a person field value
 */
export function isCustomFieldPersonValue(
  value: CustomFieldValue
): value is CustomFieldPersonValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'userId' in value &&
    'displayName' in value
  );
}

/**
 * Validate a custom field value against its definition
 */
export function validateCustomFieldValue(
  value: CustomFieldValue | undefined,
  definition: CustomFieldDefinition
): { valid: boolean; error?: string } {
  // Check required
  if (definition.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: `${definition.name} is required` };
  }

  // If no value and not required, it's valid
  if (value === undefined || value === null) {
    return { valid: true };
  }

  switch (definition.type) {
    case 'text':
      if (typeof value !== 'string') {
        return { valid: false, error: `${definition.name} must be text` };
      }
      if (definition.maxLength && value.length > definition.maxLength) {
        return {
          valid: false,
          error: `${definition.name} must be at most ${definition.maxLength} characters`,
        };
      }
      break;

    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return { valid: false, error: `${definition.name} must be a number` };
      }
      if (definition.min !== undefined && value < definition.min) {
        return {
          valid: false,
          error: `${definition.name} must be at least ${definition.min}`,
        };
      }
      if (definition.max !== undefined && value > definition.max) {
        return {
          valid: false,
          error: `${definition.name} must be at most ${definition.max}`,
        };
      }
      break;

    case 'enum':
      if (typeof value !== 'string') {
        return { valid: false, error: `${definition.name} must be a single value` };
      }
      if (definition.options && !definition.options.some((opt) => opt.value === value)) {
        return { valid: false, error: `Invalid value for ${definition.name}` };
      }
      break;

    case 'multi_enum':
      if (!Array.isArray(value)) {
        return { valid: false, error: `${definition.name} must be an array` };
      }
      if (definition.options) {
        const validValues = definition.options.map((opt) => opt.value);
        for (const v of value) {
          if (!validValues.includes(v)) {
            return { valid: false, error: `Invalid value "${v}" for ${definition.name}` };
          }
        }
      }
      break;

    case 'date':
      if (!isCustomFieldDateValue(value)) {
        return { valid: false, error: `${definition.name} must be a date` };
      }
      break;

    case 'person':
      if (!isCustomFieldPersonValue(value)) {
        return { valid: false, error: `${definition.name} must be a person reference` };
      }
      break;

    case 'checkbox':
      if (typeof value !== 'boolean') {
        return { valid: false, error: `${definition.name} must be true or false` };
      }
      break;

    case 'url':
      if (typeof value !== 'string') {
        return { valid: false, error: `${definition.name} must be a URL` };
      }
      try {
        new URL(value);
      } catch {
        return { valid: false, error: `${definition.name} must be a valid URL` };
      }
      break;
  }

  return { valid: true };
}
