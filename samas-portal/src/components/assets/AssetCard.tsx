import { FC } from 'react';
import { format } from 'date-fns';
import {
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
  Printer,
  Server,
  Network,
  Key,
  Armchair,
  Car,
  Package,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Keyboard,
  Mouse,
  Globe,
} from 'lucide-react';
import { Asset, AssetType, AssetStatus } from '@/types/asset';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface AssetCardProps {
  asset: Asset;
  view?: 'list' | 'grid';
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
  onUnassign?: () => void;
  showActions?: boolean;
}

const typeConfig: Record<AssetType, { icon: typeof Laptop; label: string; color: string }> = {
  laptop: { icon: Laptop, label: 'Laptop', color: 'text-blue-600' },
  desktop: { icon: Monitor, label: 'Desktop', color: 'text-purple-600' },
  monitor: { icon: Monitor, label: 'Monitor', color: 'text-indigo-600' },
  keyboard: { icon: Keyboard, label: 'Keyboard', color: 'text-gray-600' },
  mouse: { icon: Mouse, label: 'Mouse', color: 'text-gray-500' },
  phone: { icon: Smartphone, label: 'Phone', color: 'text-green-600' },
  tablet: { icon: Tablet, label: 'Tablet', color: 'text-teal-600' },
  printer: { icon: Printer, label: 'Printer', color: 'text-orange-600' },
  server: { icon: Server, label: 'Server', color: 'text-red-600' },
  network: { icon: Network, label: 'Network', color: 'text-cyan-600' },
  software_license: { icon: Key, label: 'License', color: 'text-amber-600' },
  furniture: { icon: Armchair, label: 'Furniture', color: 'text-yellow-600' },
  vehicle: { icon: Car, label: 'Vehicle', color: 'text-slate-600' },
  other: { icon: Package, label: 'Other', color: 'text-gray-500' },
};

const statusConfig: Record<
  AssetStatus,
  { variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; label: string }
> = {
  available: { variant: 'success', label: 'Available' },
  assigned: { variant: 'default', label: 'Assigned' },
  maintenance: { variant: 'warning', label: 'Maintenance' },
  retired: { variant: 'secondary', label: 'Retired' },
  lost: { variant: 'destructive', label: 'Lost' },
  disposed: { variant: 'secondary', label: 'Disposed' },
};

export const AssetCard: FC<AssetCardProps> = ({
  asset,
  view = 'list',
  onClick,
  onEdit,
  onDelete,
  onAssign,
  onUnassign,
  showActions = true,
}) => {
  const config = typeConfig[asset.type];
  const status = statusConfig[asset.status];
  const Icon = config.icon;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (view === 'grid') {
    return (
      <Card
        data-testid="asset-card"
        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className={cn(
              'h-16 w-16 rounded-lg flex items-center justify-center mb-3',
              'bg-gray-100 dark:bg-gray-800'
            )}
          >
            <Icon className={cn('h-8 w-8', config.color)} />
          </div>

          {/* Name */}
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate w-full mb-1">
            {asset.name}
          </h3>

          {/* Serial */}
          {asset.serialNumber && (
            <p
              data-testid="asset-serial"
              className="text-xs text-gray-500 dark:text-gray-400 truncate w-full"
            >
              {asset.serialNumber}
            </p>
          )}

          {/* Status and badges */}
          <div className="flex items-center gap-1 mt-2 flex-wrap justify-center">
            <Badge data-testid="status-badge" variant={status.variant} className="text-xs">
              {status.label}
            </Badge>
            {asset.isGlobal && (
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Global
              </Badge>
            )}
          </div>

          {/* Assignee */}
          {asset.assignedToName && (
            <div
              data-testid="assignee-name"
              className="flex items-center gap-1 mt-2 text-xs text-gray-500"
            >
              <Avatar
                size="sm"
                alt={asset.assignedToName}
                fallback={asset.assignedToName}
                className="h-5 w-5"
              />
              <span className="truncate">{asset.assignedToName}</span>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // List view
  return (
    <Card
      data-testid="asset-card"
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className={cn(
            'h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0',
            'bg-gray-100 dark:bg-gray-800'
          )}
        >
          <Icon className={cn('h-6 w-6', config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {asset.name}
            </h3>
            <Badge data-testid="status-badge" variant={status.variant} className="text-xs">
              {status.label}
            </Badge>
            {asset.isGlobal && (
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Global
              </Badge>
            )}
          </div>

          {/* Details row */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-1">
            {asset.serialNumber && (
              <span data-testid="asset-serial" className="font-mono">
                {asset.serialNumber}
              </span>
            )}
            {asset.manufacturer && <span>{asset.manufacturer}</span>}
            {asset.model && <span>{asset.model}</span>}
          </div>

          {/* Info row */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>{config.label}</span>
            {asset.location && <span>{asset.location}</span>}
            {asset.purchasePrice !== null && (
              <span>{formatCurrency(asset.purchasePrice, asset.currency)}</span>
            )}
            {asset.warrantyExpiration && (
              <span
                className={cn(
                  asset.warrantyExpiration.toDate() < new Date() && 'text-red-500'
                )}
              >
                Warranty:{' '}
                {format(asset.warrantyExpiration.toDate(), 'MMM d, yyyy')}
              </span>
            )}
          </div>

          {/* Assignee */}
          {asset.assignedToName && (
            <div
              data-testid="assignee-name"
              className="flex items-center gap-2 mt-2 text-sm"
            >
              <Avatar
                size="sm"
                alt={asset.assignedToName}
                fallback={asset.assignedToName}
                className="h-6 w-6"
              />
              <span className="text-gray-700 dark:text-gray-300">
                {asset.assignedToName}
              </span>
              {asset.assignedAt && (
                <span className="text-xs text-gray-400">
                  since {format(asset.assignedAt.toDate(), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Assign/Unassign */}
            {asset.assignedTo ? (
              onUnassign && (
                <Button
                  data-testid="unassign-asset"
                  variant="ghost"
                  size="sm"
                  onClick={onUnassign}
                  title="Unassign"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              )
            ) : (
              onAssign && (
                <Button
                  data-testid="assign-asset"
                  variant="ghost"
                  size="sm"
                  onClick={onAssign}
                  title="Assign"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              )
            )}
            {onEdit && (
              <Button
                data-testid="edit-asset"
                variant="ghost"
                size="sm"
                onClick={onEdit}
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                data-testid="delete-asset"
                variant="ghost"
                size="sm"
                onClick={onDelete}
                title="Delete"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
