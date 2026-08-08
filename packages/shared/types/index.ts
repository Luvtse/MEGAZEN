export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  type: 'importer' | 'exporter' | 'forwarder' | 'broker';
  email?: string;
  phone?: string;
  creditLimit: number;
  creditUsed: number;
  status: 'active' | 'suspended' | 'inactive';
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  origin: string;
  destination: string;
  cargoDescription: string;
  cargoType: string;
  status: 'pending' | 'confirmed' | 'approved' | 'cancelled';
  approvalStatus: 'pending' | 'auto-approved' | 'manual-approved' | 'rejected';
  createdAt: Date;
}

export interface Container {
  id: string;
  containerNumber: string;
  type: string;
  status: 'available' | 'assigned' | 'in-transit' | 'delivered' | 'maintenance';
  location?: string;
}

export interface BillOfLading {
  id: string;
  bolNumber: string;
  shipper: string;
  consignee: string;
  status: 'draft' | 'submitted' | 'issued' | 'amended' | 'voided';
  amendmentCount: number;
  version: number;
  createdAt: Date;
}
