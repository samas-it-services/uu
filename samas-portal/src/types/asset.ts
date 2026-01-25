import { Timestamp } from 'firebase/firestore';

export interface Asset {
  id: string;
  name: string;
  description: string;
  type: AssetType;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  purchaseDate: Timestamp | null;
  purchasePrice: number | null;
  currency: string;
  warrantyExpiration: Timestamp | null;
  status: AssetStatus;
  condition: AssetCondition;
  location: string;
  assignedTo: string | null;
  assignedToName: string | null;
  assignedAt: Timestamp | null;
  projectId: string | null;
  isGlobal: boolean;
  maintenanceHistory: MaintenanceRecord[];
  documents: string[];
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type AssetType =
  | 'laptop'
  | 'desktop'
  | 'monitor'
  | 'keyboard'
  | 'mouse'
  | 'phone'
  | 'tablet'
  | 'printer'
  | 'server'
  | 'network'
  | 'software_license'
  | 'furniture'
  | 'vehicle'
  | 'other';

export type AssetStatus =
  | 'available'
  | 'assigned'
  | 'maintenance'
  | 'retired'
  | 'lost'
  | 'disposed';

export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'broken';

export interface MaintenanceRecord {
  id: string;
  type: 'repair' | 'upgrade' | 'inspection' | 'cleaning';
  description: string;
  performedBy: string;
  performedByName: string;
  cost: number | null;
  date: Timestamp;
  notes: string;
}
