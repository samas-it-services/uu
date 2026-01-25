# Agent 13: Custom Fields Agent Checklist
## Flexible Metadata System Specialist

---

## Role Overview

**Responsibilities**: Custom field definitions, dynamic form rendering, field validation, admin UI for field management. Enables enterprise-grade task metadata without code changes.

**Design Inspiration**: Jira custom fields, Asana custom fields API, ServiceNow task tables, Workday project metadata.

**Files Owned**:
- `src/types/customField.ts`
- `src/services/api/customFields.ts`
- `src/hooks/useCustomFields.ts`
- `src/pages/admin/CustomFieldsPage.tsx`
- `src/components/admin/CustomFieldEditor.tsx`
- `src/components/forms/DynamicFieldRenderer.tsx`

---

## Phase 7 Tasks

### Custom Field Type Definitions
- [ ] Create `src/types/customField.ts`:
  ```typescript
  type CustomFieldType =
    | 'text'        // Free text input
    | 'number'      // Numeric values
    | 'enum'        // Single-select dropdown
    | 'multi_enum'  // Multi-select tags
    | 'date'        // Date picker
    | 'person'      // User reference
    | 'checkbox'    // Boolean toggle
    | 'url';        // URL with validation

  type CustomFieldValue =
    | string
    | number
    | boolean
    | string[]
    | { date: string; time?: string }
    | { userId: string; displayName: string };

  interface CustomFieldDefinition {
    id: string;
    name: string;
    key: string;
    description?: string;
    type: CustomFieldType;
    options?: CustomFieldOption[];
    required: boolean;
    defaultValue?: CustomFieldValue;
    projectId?: string | null;  // null = global
    order: number;
    section?: string;
    placeholder?: string;
    enabled: boolean;
    createdBy: string;
    createdAt: Timestamp;
    updatedBy?: string;
    updatedAt: Timestamp;
  }

  interface CustomFieldOption {
    value: string;
    label: string;
    color?: string;
    order: number;
  }
  ```

### Custom Fields API Service
- [ ] Create `src/services/api/customFields.ts`
- [ ] `getAll()` - get all field definitions
- [ ] `getById(id)` - get single field definition
- [ ] `getByProject(projectId)` - get global + project-scoped fields
- [ ] `create(data)` - create new field definition
- [ ] `update(id, data)` - update field definition
- [ ] `delete(id)` - delete field definition (with validation)
- [ ] `reorder(fieldIds)` - update field order
- [ ] Validate unique keys per scope

### Custom Fields Hook
- [ ] Create `src/hooks/useCustomFields.ts`
- [ ] `useCustomFields(projectId?)` - query fields for project
- [ ] `useCustomField(id)` - single field query
- [ ] `useCreateCustomField()` - mutation
- [ ] `useUpdateCustomField()` - mutation
- [ ] `useDeleteCustomField()` - mutation
- [ ] Cache invalidation on mutations

### Dynamic Field Renderer
- [ ] Create `src/components/forms/DynamicFieldRenderer.tsx`
- [ ] Render correct input based on field type:
  - [ ] `text` → TextInput
  - [ ] `number` → NumberInput with precision
  - [ ] `enum` → Select dropdown
  - [ ] `multi_enum` → Multi-select with tags
  - [ ] `date` → DatePicker
  - [ ] `person` → UserPicker (searchable)
  - [ ] `checkbox` → Checkbox
  - [ ] `url` → URLInput with validation
- [ ] Handle required field validation
- [ ] Apply default values
- [ ] Show placeholder text
- [ ] Group fields by section

### Task Modal Integration
- [ ] Update `src/components/modules/tasks/TaskModal.tsx`
- [ ] Add "Extended Details" section with:
  - [ ] Task Type dropdown
  - [ ] Category dropdown
  - [ ] Phase input
  - [ ] Sprint input
- [ ] Add "Goals & Criteria" section with:
  - [ ] Goal textarea
  - [ ] Acceptance Criteria textarea
  - [ ] Success Metrics textarea
- [ ] Add "Custom Fields" section:
  - [ ] Fetch fields for current project
  - [ ] Render with DynamicFieldRenderer
  - [ ] Save to task.customFields map
- [ ] Add "External Reference" section:
  - [ ] External ID input
  - [ ] External URL input

### Task Card Integration
- [ ] Update `src/components/modules/tasks/TaskCard.tsx`
- [ ] Show taskType badge (color-coded)
- [ ] Show category tag
- [ ] Show phase indicator (if set)
- [ ] Optionally show custom field values

### Custom Fields Admin Page
- [ ] Create `src/pages/admin/CustomFieldsPage.tsx`
- [ ] List all field definitions with:
  - [ ] Name, type, scope badge
  - [ ] Required indicator
  - [ ] Enabled toggle
  - [ ] Edit/Delete actions
- [ ] Drag-to-reorder support
- [ ] Filter by scope (global/project)
- [ ] Create new field button
- [ ] Bulk operations (optional)

### Custom Field Editor Modal
- [ ] Create `src/components/admin/CustomFieldEditor.tsx`
- [ ] Form fields:
  - [ ] Name (display name)
  - [ ] Key (machine key, auto-generated)
  - [ ] Description (help text)
  - [ ] Type selector
  - [ ] Required toggle
  - [ ] Default value input (type-specific)
  - [ ] Scope selector (global/project)
  - [ ] Section assignment
  - [ ] Placeholder text
- [ ] For enum/multi_enum:
  - [ ] Options editor (add/remove/reorder)
  - [ ] Option color picker
- [ ] Validation rules
- [ ] Preview of rendered field

### Data Migration
- [ ] Handle existing tasks without new fields
- [ ] Set default values on migration
- [ ] Validate data integrity

---

## Testing Requirements

- [ ] Test custom field CRUD operations
- [ ] Test field validation by type
- [ ] Test DynamicFieldRenderer for all types
- [ ] Test TaskModal with custom fields
- [ ] Test project-scoped vs global fields
- [ ] Test field reordering
- [ ] Test admin page functionality

---

## Acceptance Criteria

- [ ] Admins can create custom field definitions
- [ ] Fields can be scoped globally or per-project
- [ ] All 8 field types render correctly
- [ ] Task modal shows custom fields section
- [ ] Task cards display relevant field values
- [ ] Field values save correctly to Firestore
- [ ] Validation works for required fields
- [ ] Dropdown options are configurable
- [ ] Fields can be enabled/disabled
- [ ] Field order is customizable

---

## Integration Points

- **Projects & Tasks Agent (06)**: Extends task data model with customFields
- **RBAC Admin Agent (09)**: Admin-only access to field management
- **Testing Agent (10)**: Integration tests for custom fields

---

## Future Enhancements (Optional)

- [ ] Field dependencies (show field B only if field A has value X)
- [ ] Calculated fields (formulas)
- [ ] Field templates (copy field sets)
- [ ] Field history/audit trail
- [ ] Import/export field definitions
- [ ] API for external field creation
