import { FC, useEffect, useState } from 'react';
import { Loader2, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useCreateAsset, useUpdateAsset } from '@/hooks/useAssets';
import { Asset, AssetType, AssetStatus, AssetCondition } from '@/types/asset';
import { Timestamp } from 'firebase/firestore';

interface AssetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Asset | null;
  projectId: string;
  isGlobal?: boolean;
}

const assetTypes: { value: AssetType; label: string }[] = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'keyboard', label: 'Keyboard' },
  { value: 'mouse', label: 'Mouse' },
  { value: 'phone', label: 'Phone' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'printer', label: 'Printer' },
  { value: 'server', label: 'Server' },
  { value: 'network', label: 'Network Equipment' },
  { value: 'software_license', label: 'Software License' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'other', label: 'Other' },
];

const statusOptions: { value: AssetStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' },
  { value: 'lost', label: 'Lost' },
  { value: 'disposed', label: 'Disposed' },
];

const conditionOptions: { value: AssetCondition; label: string }[] = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'broken', label: 'Broken' },
];

export const AssetModal: FC<AssetModalProps> = ({
  open,
  onOpenChange,
  asset,
  projectId,
  isGlobal: defaultIsGlobal,
}) => {
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();

  const isEditing = !!asset;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AssetType>('laptop');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [warrantyExpiration, setWarrantyExpiration] = useState('');
  const [status, setStatus] = useState<AssetStatus>('available');
  const [condition, setCondition] = useState<AssetCondition>('good');
  const [location, setLocation] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [tags, setTags] = useState('');

  // Reset form when modal opens/closes or asset changes
  useEffect(() => {
    if (open) {
      if (asset) {
        setName(asset.name);
        setDescription(asset.description || '');
        setType(asset.type);
        setSerialNumber(asset.serialNumber || '');
        setManufacturer(asset.manufacturer || '');
        setModel(asset.model || '');
        setPurchaseDate(
          asset.purchaseDate
            ? asset.purchaseDate.toDate().toISOString().split('T')[0]
            : ''
        );
        setPurchasePrice(asset.purchasePrice?.toString() || '');
        setCurrency(asset.currency || 'USD');
        setWarrantyExpiration(
          asset.warrantyExpiration
            ? asset.warrantyExpiration.toDate().toISOString().split('T')[0]
            : ''
        );
        setStatus(asset.status);
        setCondition(asset.condition);
        setLocation(asset.location || '');
        setIsGlobal(asset.isGlobal);
        setTags(asset.tags?.join(', ') || '');
      } else {
        setName('');
        setDescription('');
        setType('laptop');
        setSerialNumber('');
        setManufacturer('');
        setModel('');
        setPurchaseDate('');
        setPurchasePrice('');
        setCurrency('USD');
        setWarrantyExpiration('');
        setStatus('available');
        setCondition('good');
        setLocation('');
        setIsGlobal(defaultIsGlobal || false);
        setTags('');
      }
    }
  }, [open, asset, defaultIsGlobal]);

  const handleSubmit = async () => {
    if (!name.trim() || !type) return;

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const data = {
      name: name.trim(),
      description: description.trim(),
      type,
      serialNumber: serialNumber.trim() || null,
      manufacturer: manufacturer.trim() || null,
      model: model.trim() || null,
      purchaseDate: purchaseDate
        ? Timestamp.fromDate(new Date(purchaseDate))
        : null,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
      currency,
      warrantyExpiration: warrantyExpiration
        ? Timestamp.fromDate(new Date(warrantyExpiration))
        : null,
      status,
      condition,
      location: location.trim(),
      isGlobal,
      projectId: isGlobal ? null : projectId,
      tags: tagList,
    };

    try {
      if (isEditing && asset) {
        await updateAsset.mutateAsync({ id: asset.id, data });
      } else {
        await createAsset.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const isPending = createAsset.isPending || updateAsset.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? 'Edit an existing asset' : 'Add a new asset to inventory'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="asset-name">Name *</Label>
              <Input
                id="asset-name"
                data-testid="asset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., MacBook Pro 16-inch"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Type *</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as AssetType)}
              >
                <SelectTrigger data-testid="asset-type" className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="asset-serial">Serial Number</Label>
              <Input
                id="asset-serial"
                data-testid="asset-serial"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g., ABC123XYZ"
                className="mt-1"
              />
            </div>
          </div>

          {/* Manufacturer and Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="asset-manufacturer">Manufacturer</Label>
              <Input
                id="asset-manufacturer"
                data-testid="asset-manufacturer"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g., Apple"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="asset-model">Model</Label>
              <Input
                id="asset-model"
                data-testid="asset-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g., MacBook Pro M3"
                className="mt-1"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="asset-description">Description</Label>
            <textarea
              id="asset-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details about the asset..."
              rows={3}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
            />
          </div>

          {/* Purchase Info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="purchase-date">Purchase Date</Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="purchase-date"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="purchase-price">Purchase Price</Label>
              <Input
                id="purchase-price"
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Warranty and Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="warranty">Warranty Expiration</Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="warranty"
                  type="date"
                  value={warrantyExpiration}
                  onChange={(e) => setWarrantyExpiration(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Office Building A, Floor 3"
                className="mt-1"
              />
            </div>
          </div>

          {/* Status and Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as AssetStatus)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Condition</Label>
              <Select
                value={condition}
                onValueChange={(value) => setCondition(value as AssetCondition)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conditionOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., engineering, remote"
              className="mt-1"
            />
          </div>

          {/* Global Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={isGlobal}
              onCheckedChange={(checked) => setIsGlobal(checked === true)}
            />
            <span className="text-sm">
              Global asset (not tied to a specific project)
            </span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              data-testid="submit-asset"
              onClick={handleSubmit}
              disabled={isPending || !name.trim() || !type}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : isEditing ? (
                'Update Asset'
              ) : (
                'Add Asset'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
