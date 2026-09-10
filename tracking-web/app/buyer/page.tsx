import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { StatusBadge } from '../../components/status-badge';

export default async function BuyerOrdersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'BUYER') redirect('/403');
  const orders = await prisma.order.findMany({ where: { buyerId: session.user.id }, include: { delivery: true }, orderBy: { updatedAt: 'desc' } });
  return <div className="space-y-6"><div><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Customer portal</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Your orders</h1></div><div className="grid gap-4">{orders.map((order) => <Link className="rounded-2xl bg-white p-5 shadow-sm transition hover:ring-2 hover:ring-emerald-200" href={`/buyer/orders/${order.id}`} key={order.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{order.orderRef}</p><p className="mt-1 text-sm text-slate-500">{order.deliveryAddress}</p></div>{order.delivery && <StatusBadge status={order.delivery.status} />}</div><p className="mt-4 text-xs text-slate-500">Updated {order.updatedAt.toLocaleString()}</p></Link>)}{orders.length === 0 && <div className="rounded-2xl bg-white p-8 text-center text-slate-500">No orders yet.</div>}</div></div>;
}