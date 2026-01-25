import { FC } from 'react';
import { RolePermissions, DataAccess, Module, Action } from '@/types/role';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';

interface PermissionMatrixProps {
  permissions: RolePermissions;
  dataAccess: DataAccess;
  onPermissionsChange: (permissions: RolePermissions) => void;
  onDataAccessChange: (dataAccess: DataAccess) => void;
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

const ACTIONS: { key: Action; label: string }[] = [
  { key: 'create', label: 'Create' },
  { key: 'read', label: 'Read' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
];

const DATA_ACCESS_OPTIONS: { key: keyof DataAccess; label: string; description: string }[] = [
  {
    key: 'allProjects',
    label: 'All Projects',
    description: 'Access to view all projects regardless of membership',
  },
  {
    key: 'sensitiveFinancials',
    label: 'Sensitive Financials',
    description: 'Access to sensitive financial data and reports',
  },
  {
    key: 'globalAssets',
    label: 'Global Assets',
    description: 'Access to company-wide assets',
  },
];

export const PermissionMatrix: FC<PermissionMatrixProps> = ({
  permissions,
  dataAccess,
  onPermissionsChange,
  onDataAccessChange,
  disabled = false,
}) => {
  const handlePermissionToggle = (module: Module, action: Action) => {
    if (disabled) return;
    const newPermissions = {
      ...permissions,
      [module]: {
        ...permissions[module],
        [action]: !permissions[module][action],
      },
    };
    onPermissionsChange(newPermissions);
  };

  const handleDataAccessToggle = (key: keyof DataAccess) => {
    if (disabled) return;
    const newDataAccess = {
      ...dataAccess,
      [key]: !dataAccess[key],
    };
    onDataAccessChange(newDataAccess);
  };

  const handleModuleSelectAll = (module: Module) => {
    if (disabled) return;
    const allEnabled = ACTIONS.every((action) => permissions[module][action.key]);
    const newPermissions = {
      ...permissions,
      [module]: ACTIONS.reduce(
        (acc, action) => ({
          ...acc,
          [action.key]: !allEnabled,
        }),
        {} as RolePermissions[Module]
      ),
    };
    onPermissionsChange(newPermissions);
  };

  const handleActionSelectAll = (action: Action) => {
    if (disabled) return;
    const allEnabled = MODULES.every((module) => permissions[module.key][action]);
    const newPermissions = { ...permissions };
    MODULES.forEach((module) => {
      newPermissions[module.key] = {
        ...newPermissions[module.key],
        [action]: !allEnabled,
      };
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
                        checked={permissions[module.key][action.key]}
                        onCheckedChange={() => handlePermissionToggle(module.key, action.key)}
                        disabled={disabled}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Data Access</h3>
        <div className="space-y-3">
          {DATA_ACCESS_OPTIONS.map((option) => (
            <div
              key={option.key}
              className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
              onClick={() => handleDataAccessToggle(option.key)}
            >
              <Checkbox
                checked={dataAccess[option.key]}
                onCheckedChange={() => handleDataAccessToggle(option.key)}
                disabled={disabled}
              />
              <div>
                <span className="font-medium text-sm">{option.label}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
