'use client';

import { useState } from 'react';
import { assignDriver } from '../../actions/order-actions';
import { ActionMessage } from '../../../components/action-message';

export function AssignDriverForm({ deliveryId, drivers, currentDriverId }: { deliveryId: string; drivers: { id: string; name: string | null }[]; currentDriverId: string | null }) {
  const [message, setMessage] = useState<{ success: boolean; error?: string } | null>(null);
  return <form className="flex items-center gap-2" onSubmit={async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const result = await assignDriver(deliveryId, String(data.get('driverId') || '') || null); setMessage(result); }}>
    <select className="max-w-44 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" defaultValue={currentDriverId ?? ''} name="driverId"><option value="">Unassigned</option>{drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name ?? driver.id.slice(0, 8)}</option>)}</select>
    <button className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-semibold hover:border-emerald-600" type="submit">Assign</button>
    <span className="sr-only"><ActionMessage message={message} /></span>
  </form>;
}