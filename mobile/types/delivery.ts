export type DeliveryStatus =
  | 'READY_FOR_DISPATCH'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export interface Delivery {
  id: string;
  orderRef: string;
  customerPhone: string;
  deliveryAddress: string;
  status: DeliveryStatus;
  assignedDriverId: string | null;
  createdAt: string;
  updatedAt: string;
  podImageUrl?: string | null;
}

export interface DriverManifest {
  driver: {
    id: string;
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
  };
  deliveries: Delivery[];
}
