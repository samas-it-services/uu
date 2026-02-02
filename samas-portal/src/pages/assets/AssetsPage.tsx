import { FC, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Package,
  Filter,
  X,
  List,
  Grid,
  Globe,
  Folder,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { AssetCard } from '@/components/assets/AssetCard';
import { AssetModal } from '@/components/assets/AssetModal';
import {
  useProjectAssets,
  useDeleteAsset,
  useAssignAsset,
  useUnassignAsset,
} from '@/hooks/useAssets';
import { useAllProjects } from '@/hooks/useProjects';
import { usePermissions } from '@/hooks/usePermissions';
import { Asset, AssetType, AssetStatus } from '@/types/asset';
import { useActiveUsers } from '@/hooks/useUsers';

const typeOptions: { value: AssetType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'keyboard', label: 'Keyboard' },
  { value: 'mouse', label: 'Mouse' },
  { value: 'phone', label: 'Phone' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'printer', label: 'Printer' },
  { value: 'server', label: 'Server' },
  { value: 'network', label: 'Network' },
  { value: 'software_license', label: 'License' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'other', label: 'Other' },
];

const statusOptions: { value: AssetStatus | ''; label: string }[] = [
  { value: '', label: 'All Status' },
  { value: 'available', label: 'Available' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' },
  { value: 'lost', label: 'Lost' },
  { value: 'disposed', label: 'Disposed' },
];

export const AssetsPage: FC = () => {
  const { isSuperAdmin, isProjectManager, canAccessProject } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningAsset, setAssigningAsset] = useState<Asset | null>(null);
  const [showUnassignConfirm, setShowUnassignConfirm] = useState(false);
  const [unassigningAsset, setUnassigningAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [includeGlobal, setIncludeGlobal] = useState(true);

  // Filters from URL params
  const typeFilter = (searchParams.get('type') || '') as AssetType | '';
  const statusFilter = (searchParams.get('status') || '') as AssetStatus | '';
  const projectIdParam = searchParams.get('project') || '';

  // Fetch projects
  const { data: projects, isLoading: projectsLoading } = useAllProjects();
  const { data: users } = useActiveUsers();

  // Determine selected project
  const selectedProjectId = useMemo(() => {
    if (projectIdParam && projects?.some((p) => p.id === projectIdParam)) {
      return projectIdParam;
    }
    // Default to first project user has access to
    if (projects && projects.length > 0) {
      const accessibleProject = projects.find((p) => isSuperAdmin || canAccessProject(p.id));
      return accessibleProject?.id || '';
    }
    return '';
  }, [projectIdParam, projects, isSuperAdmin, canAccessProject]);

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  // Update URL when project changes
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== projectIdParam) {
      searchParams.set('project', selectedProjectId);
      setSearchParams(searchParams);
    }
  }, [selectedProjectId, projectIdParam, searchParams, setSearchParams]);

  // Fetch assets for selected project
  const { data: assets, isLoading: assetsLoading } = useProjectAssets(
    selectedProjectId,
    includeGlobal
  );
  const deleteAsset = useDeleteAsset();
  const assignAsset = useAssignAsset();
  const unassignAsset = useUnassignAsset();

  // Permissions
  const canCreate = isSuperAdmin || (isProjectManager && canAccessProject(selectedProjectId));
  const canEdit = (asset: Asset) => {
    if (isSuperAdmin) return true;
    if (isProjectManager && asset.projectId && canAccessProject(asset.projectId)) return true;
    return false;
  };
  const canDelete = () => isSuperAdmin;
  const canAssign = () => isSuperAdmin || isProjectManager;

  // Filter assets
  const filteredAssets = useMemo(() => {
    let result = assets || [];

    // Filter by type
    if (typeFilter) {
      result = result.filter((a) => a.type === typeFilter);
    }

    // Filter by status
    if (statusFilter) {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          (a.serialNumber && a.serialNumber.toLowerCase().includes(query)) ||
          (a.model && a.model.toLowerCase().includes(query)) ||
          (a.manufacturer && a.manufacturer.toLowerCase().includes(query))
      );
    }

    return result;
  }, [assets, typeFilter, statusFilter, searchQuery]);

  // Handlers
  const handleFilterChange = (key: string, value: string) => {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    setSearchParams(searchParams);
  };

  const handleProjectChange = (projectId: string) => {
    searchParams.set('project', projectId);
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    const newParams = new URLSearchParams();
    if (selectedProjectId) {
      newParams.set('project', selectedProjectId);
    }
    setSearchParams(newParams);
    setSearchQuery('');
  };

  const handleCreate = () => {
    setEditingAsset(null);
    setShowModal(true);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setShowModal(true);
  };

  const handleDelete = (asset: Asset) => {
    if (asset.assignedTo) {
      // Show error - can't delete assigned asset
      return;
    }
    setDeletingAsset(asset);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingAsset) return;
    try {
      await deleteAsset.mutateAsync(deletingAsset.id);
      setShowDeleteConfirm(false);
      setDeletingAsset(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleAssign = (asset: Asset) => {
    setAssigningAsset(asset);
    setShowAssignModal(true);
  };

  const handleUnassign = (asset: Asset) => {
    setUnassigningAsset(asset);
    setShowUnassignConfirm(true);
  };

  const confirmAssign = async (userId: string, userName: string) => {
    if (!assigningAsset) return;
    try {
      await assignAsset.mutateAsync({
        assetId: assigningAsset.id,
        userId,
        userName,
      });
      setShowAssignModal(false);
      setAssigningAsset(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const confirmUnassign = async () => {
    if (!unassigningAsset) return;
    try {
      await unassignAsset.mutateAsync(unassigningAsset.id);
      setShowUnassignConfirm(false);
      setUnassigningAsset(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const hasActiveFilters = typeFilter || statusFilter || searchQuery;
  const isLoading = projectsLoading || assetsLoading;

  // Get accessible projects for switcher
  const accessibleProjects = useMemo(() => {
    if (!projects) return [];
    if (isSuperAdmin) return projects;
    return projects.filter((p) => canAccessProject(p.id));
  }, [projects, isSuperAdmin, canAccessProject]);

  return (
    <div className="p-6 space-y-6" data-testid="assets-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Assets
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage company assets and equipment
          </p>
        </div>

        {/* Project Switcher and Actions */}
        <div className="flex items-center gap-4">
          {/* Project Switcher */}
          <div data-testid="project-switcher" className="flex items-center gap-2">
            <Select value={selectedProjectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-[200px]">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" data-testid="project-icon" />
                  <span data-testid="project-name" className="truncate">
                    {selectedProject?.name || 'Select Project'}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {accessibleProjects.map((project) => (
                  <SelectItem
                    key={project.id}
                    value={project.id}
                    data-testid="project-option"
                  >
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Show Global Toggle */}
          <label
            data-testid="show-global-toggle"
            className="flex items-center gap-2 cursor-pointer text-sm"
          >
            <Checkbox
              checked={includeGlobal}
              onCheckedChange={(checked) => setIncludeGlobal(checked === true)}
            />
            <Globe className="h-4 w-4" />
            <span>Show Global</span>
          </label>

          {/* Create Button */}
          {canCreate && (
            <Button data-testid="create-asset" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            data-testid="search-input"
            placeholder="Search by name, serial, model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Type filter */}
        <Select
          value={typeFilter}
          onValueChange={(value) => handleFilterChange('type', value)}
        >
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((t) => (
              <SelectItem key={t.value || 'all'} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger data-testid="filter-status" className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((s) => (
              <SelectItem key={s.value || 'all'} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex border rounded-md">
          <Button
            data-testid="list-view-toggle"
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            data-testid="grid-view-toggle"
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Content */}
      {!selectedProjectId ? (
        <Card className="p-12 text-center">
          <Folder className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Select a project to view assets
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Choose a project from the dropdown above
          </p>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {hasActiveFilters
              ? 'No assets match your filters'
              : 'No assets in this project'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {hasActiveFilters
              ? 'Try adjusting your search or filters'
              : 'Add assets to get started'}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : (
            canCreate && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            )
          )}
        </Card>
      ) : (
        <div
          data-testid={viewMode === 'list' ? 'list-view' : 'grid-view'}
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
              : 'space-y-3'
          }
        >
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              view={viewMode}
              onEdit={canEdit(asset) ? () => handleEdit(asset) : undefined}
              onDelete={
                canDelete() && !asset.assignedTo
                  ? () => handleDelete(asset)
                  : undefined
              }
              onAssign={
                canAssign() && !asset.assignedTo
                  ? () => handleAssign(asset)
                  : undefined
              }
              onUnassign={
                canAssign() && asset.assignedTo
                  ? () => handleUnassign(asset)
                  : undefined
              }
              showActions={canEdit(asset) || canAssign()}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AssetModal
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) setEditingAsset(null);
        }}
        asset={editingAsset}
        projectId={selectedProjectId}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingAsset?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingAsset(null);
              }}
            >
              Cancel
            </Button>
            <Button
              data-testid="confirm-delete"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteAsset.isPending}
            >
              {deleteAsset.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Asset</DialogTitle>
            <DialogDescription>
              Select a user to assign "{assigningAsset?.name}" to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
              {users?.map((u) => (
                <button
                  key={u.id}
                  data-testid="user-option"
                  className="w-full flex items-center gap-3 p-2 rounded hover:bg-accent text-left"
                  onClick={() => confirmAssign(u.id, u.displayName)}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {u.displayName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-medium">{u.displayName}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                </button>
              ))}
              {(!users || users.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users available
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningAsset(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unassign Confirmation Dialog */}
      <Dialog open={showUnassignConfirm} onOpenChange={setShowUnassignConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unassign Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to unassign "{unassigningAsset?.name}" from{' '}
              {unassigningAsset?.assignedToName}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowUnassignConfirm(false);
                setUnassigningAsset(null);
              }}
            >
              Cancel
            </Button>
            <Button
              data-testid="confirm-unassign"
              onClick={confirmUnassign}
              disabled={unassignAsset.isPending}
            >
              {unassignAsset.isPending ? 'Unassigning...' : 'Unassign'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
