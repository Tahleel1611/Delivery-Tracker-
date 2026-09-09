import { TrackingTimeline } from '../../../components/tracking-timeline';

type DeliveryStatus = 'READY_FOR_DISPATCH' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
type TrackingData = {
  orderRef: string;
  currentStatus: DeliveryStatus;
  deliveryAddressSnippet: string;
  assignedDriverFirstName?: string;
  statusLogs: { status: DeliveryStatus; timestamp: string }[];
};

const apiBaseUrl = process.env.TRACKING_API_BASE_URL ?? 'http://localhost:3000';

async function fetchTracking(token: string): Promise<TrackingData | null> {
  const response = await fetch(`${apiBaseUrl}/api/v1/tracking/t/${encodeURIComponent(token)}`, { cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Tracking service is temporarily unavailable.');
  const body = await response.json() as { data: TrackingData };
  return body.data;
}

const statusLabel = (status: DeliveryStatus) => status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let tracking: TrackingData | null = null;
  let serviceError = false;
  try { tracking = await fetchTracking(token); } catch { serviceError = true; }

  if (serviceError || !tracking) {
    return <main className="mx-auto grid min-h-screen max-w-lg place-items-center p-6"><section className="w-full rounded-2xl bg-white p-6 text-center shadow-sm"><h1 className="text-xl font-bold">{serviceError ? 'Tracking is temporarily unavailable' : 'Delivery not found'}</h1><p className="mt-2 text-sm text-slate-600">{serviceError ? 'Please try again shortly.' : 'Check your tracking link or contact the seller for help.'}</p></section></main>;
  }

  const latestUpdate = tracking.statusLogs.at(-1);
  const isException = tracking.currentStatus === 'FAILED' || tracking.currentStatus === 'CANCELLED';
  return (
    <main className="mx-auto min-h-screen max-w-lg p-4 sm:p-8">
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <header className="bg-slate-900 px-6 py-7 text-white"><p className="text-sm text-slate-300">Tracking order</p><h1 className="mt-1 break-all text-2xl font-bold">{tracking.orderRef}</h1></header>
        <div className="p-6">
          <div className={`mb-7 rounded-xl p-4 ${isException ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'}`}><p className="text-sm font-medium">Current status</p><p className="mt-1 text-xl font-bold">{statusLabel(tracking.currentStatus)}</p>{latestUpdate && <p className="mt-1 text-sm">Updated {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(latestUpdate.timestamp))}</p>}</div>
          <TrackingTimeline status={tracking.currentStatus} />
          <div className="mt-8 border-t border-slate-100 pt-5 text-sm text-slate-600"><p><span className="font-semibold text-slate-800">Delivery area: </span>{tracking.deliveryAddressSnippet}</p>{tracking.assignedDriverFirstName && <p className="mt-2"><span className="font-semibold text-slate-800">Driver: </span>{tracking.assignedDriverFirstName}</p>}</div>
        </div>
      </section>
    </main>
  );
}
