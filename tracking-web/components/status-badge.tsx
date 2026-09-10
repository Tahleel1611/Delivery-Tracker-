import type { DeliveryStatus } from '@prisma/client';

const styles: Record<DeliveryStatus, string> = {
  READY_FOR_DISPATCH: 'bg-slate-100 text-slate-700',
  OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-slate-200 text-slate-600'
};

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{status.replaceAll('_', ' ')}</span>;
}