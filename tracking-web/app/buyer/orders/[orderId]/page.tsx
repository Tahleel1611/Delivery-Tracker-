import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { StatusBadge } from '../../../../components/status-badge';
import { signedPodViewUrl } from '../../../../lib/storage';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return { title: `Order ${orderId} | OMS`, description: 'View delivery status and order history.' };
}

const timeline = ['READY_FOR_DISPATCH', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const;

export default async function BuyerOrderDetail({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'BUYER') redirect('/403');
  const { orderId } = await params;
  const order = await prisma.order.findFirst({ where: { id: orderId, buyerId: session.user.id }, include: { items: true, delivery: { include: { userStatusLogs: { orderBy: { createdAt: 'asc' } } } } } });
  if (!order) notFound();
  const current = order.delivery?.status ?? order.status;
  const currentIndex = timeline.indexOf(current as typeof timeline[number]);
  const podUrl = order.delivery?.status === 'DELIVERED' && order.delivery.podObjectKey ? await signedPodViewUrl(order.delivery.podObjectKey) : null;
  return <div className="mx-auto max-w-2xl space-y-6"><Link aria-label="Return to all orders" className="text-sm font-semibold text-emerald-700" href="/buyer">← All orders</Link><section className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-sm text-slate-500">Order reference</p><h1 className="mt-1 text-3xl font-bold text-slate-900">{order.orderRef}</h1></div><StatusBadge status={current} /></div><p className="mt-5 text-sm text-slate-600"><strong className="text-slate-900">Delivery address:</strong> {order.deliveryAddress}</p><div className="mt-7 border-t border-slate-100 pt-6"><h2 className="font-bold text-slate-900">Delivery timeline</h2><div className="mt-5 space-y-5">{timeline.map((status, index) => { const log = order.delivery?.userStatusLogs.find((entry) => entry.status === status); return <div className="flex gap-3" key={status}><div aria-hidden="true" className={`mt-1 h-3 w-3 shrink-0 rounded-full ${index <= currentIndex ? 'bg-emerald-600' : 'bg-slate-200'}`} /><div><p className={`font-semibold ${index <= currentIndex ? 'text-slate-900' : 'text-slate-400'}`}>{status.replaceAll('_', ' ')}</p>{log && <p className="text-xs text-slate-500">{log.createdAt.toLocaleString()}</p>}</div></div>; })}</div></div>{podUrl && <div className="mt-7 rounded-xl bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-700">Proof of delivery</p><img alt="Proof of delivery" className="mt-3 max-h-72 w-full rounded-lg object-contain" src={podUrl} /></div>}</section><section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="font-bold text-slate-900">Items</h2><div className="mt-3 divide-y divide-slate-100">{order.items.map((item) => <div className="flex justify-between py-3 text-sm" key={item.id}><span>{item.description} <span className="text-slate-500">({item.sku})</span></span><span className="font-semibold">× {item.quantity}</span></div>)}</div></section></div>;
}