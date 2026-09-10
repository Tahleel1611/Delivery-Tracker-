'use client';

import { useState } from 'react';
import { DeliveryStatus } from '@prisma/client';
import { updateDeliveryStatusAction } from '../../../actions/driver-actions';
import { ActionMessage } from '../../../../components/action-message';

export function StatusButtons({ deliveryId, status }: { deliveryId: string; status: DeliveryStatus }) {
  const [message, setMessage] = useState<{ success: boolean; error?: string } | null>(null);
  const nextStatus = status === DeliveryStatus.READY_FOR_DISPATCH ? DeliveryStatus.OUT_FOR_DELIVERY : DeliveryStatus.DELIVERED;
  if (status === DeliveryStatus.DELIVERED || status === DeliveryStatus.CANCELLED) return null;
  return <div><button className="w-full rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800" onClick={async () => setMessage(await updateDeliveryStatusAction(deliveryId, nextStatus))}>{nextStatus === DeliveryStatus.OUT_FOR_DELIVERY ? 'Start Route (Out for Delivery)' : 'Mark Delivered'}</button><ActionMessage message={message} /></div>;
}