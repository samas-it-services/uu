import { FC } from 'react';
import { RolePermissions, Module, PermissionAction, PermissionScope, Permission } from '@/types/role';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

interface PermissionMatrixProps {
  permissions: RolePermissions;
  onPermissionsChange: (permissions: RolePermissions) => void;
  disabled?: boolean;
}

const MODULES: { key: Module; label: string }[] = [
  { key: 'projects', label: 'Projects' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'documents', label: 'Documents' },
  { key: 'finance', label: 'Finance' },
  { key: 'assets', label: 'Assets' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'rbac', label: 'User Management' },
];

const ACTIONS: { key: PermissionAction; label: string }[] = [
  { key: 'create', label: 'Create' },
  { key: 'read', label: 'Read' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
];

const SCOPES: { key: PermissionScope; label: string }[] = [
  { key: 'global', label: 'Global' },
  { key: 'project', label: 'Project' },
  { key: 'own', label: 'Own' },
  { key: 'none', label: 'None' },
];

export const PermissionMatrix: FC<PermissionMatrixProps> = ({
  permissions,
  onPermissionsChange,
  disabled = false,
}) => {
  const hasAction = (module: Module, action: PermissionAction): boolean => {
    return permissions[module]?.actions?.includes(action) ?? false;
  };

  const handlePermissionToggle = (module: Module, action: PermissionAction) => {
    if (disabled) return;
    const currentActions = permissions[module]?.actions ?? [];
    const newActions = currentActions.includes(action)
      ? currentActions.filter((a) => a !== action)
      : [...currentActions, action];

    // If no actions left, set scope to 'none'
    const newScope = newActions.length === 0 ? 'none' : permissions[module]?.scope ?? 'project';

    const newPermissions: RolePermissions = {
      ...permissions,
      [module]: {
        actions: newActions,
        scope: newScope,
      },
    };
    onPermissionsChange(newPermissions);
  };

  const handleScopeChange = (module: Module, scope: PermissionScope) => {
    if (disabled) return;
    const newPermissions: RolePermissions = {
      ...permissions,
      [module]: {
        ...permissions[module],
        scope,
      },
    };
    onPermissionsChange(newPermissions);
  };

  const handleModuleSelectAll = (module: Module) => {
    if (disabled) return;
    const allEnabled = ACTIONS.every((action) => hasAction(module, action.key));
    const newActions: PermissionAction[] = allEnabled ? [] : ACTIONS.map((a) => a.key);
    const newScope = newActions.length === 0 ? 'none' : permissions[module]?.scope ?? 'project';

    const newPermissions: RolePermissions = {
      ...permissions,
      [module]: {
        actions: newActions,
        scope: newScope,
      },
    };
    onPermissionsChange(newPermissions);
  };

  const handleActionSelectAll = (action: PermissionAction) => {
    if (disabled) return;
    const allEnabled = MODULES.every((module) => hasAction(module.key, action));
    const newPermissions = { ...permissions };

    MODULES.forEach((module) => {
      const currentActions = newPermissions[module.key]?.actions ?? [];
      const newActions = allEnabled
        ? currentActions.filter((a) => a !== action)
        : currentActions.includes(action)
          ? currentActions
          : [...currentActions, action];
      const newScope = newActions.length === 0 ? 'none' : newPermissions[module.key]?.scope ?? 'project';

      newPermissions[module.key] = {
        actions: newActions,
        scope: newScope,
      } as Permission;
    });
    onPermissionsChange(newPermissions);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Module Permissions</h3>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 text-sm font-medium">Module</th>
                {ACTIONS.map((action) => (
                  <th key={action.key} className="text-center p-3 text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => handleActionSelectAll(action.key)}
                      className="hover:text-primary"
                      disabled={disabled}
                    >
                      {action.label}
                    </button>
                  </th>
                ))}
                <th className="text-center p-3 text-sm font-medium">Scope</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map((module, index) => (
                <tr
                  key={module.key}
                  className={cn(index % 2 === 0 ? 'bg-background' : 'bg-muted/30')}
                >
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => handleModuleSelectAll(module.key)}
                      className="text-sm font-medium hover:text-primary"
                      disabled={disabled}
                    >
                      {module.label}
                    </button>
                  </td>
                  {ACTIONS.map((action) => (
                    <td key={action.key} className="text-center p-3">
                      <Checkbox
                        checked={hasAction(module.key, action.key)}
                        onCheckedChange={() => handlePermissionToggle(module.key, action.key)}
                        disabled={disabled}
                      />
                    </td>
                  ))}
                  <td className="text-center p-3">
                    <Select
                      value={permissions[module.key]?.scope ?? 'none'}
                      onValueChange={(value) => handleScopeChange(module.key, value as PermissionScope)}
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCOPES.map((scope) => (
                          <SelectItem key={scope.key} value={scope.key}>
                            {scope.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
