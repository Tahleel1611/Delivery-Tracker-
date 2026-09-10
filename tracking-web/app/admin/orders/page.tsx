import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { tenantIdFor } from '../../../lib/authorization';
import { StatusBadge } from '../../../components/status-badge';
import { AssignDriverForm } from './order-actions';

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/403');
  const sellerId = tenantIdFor(session.user);
  const [orders, drivers] = await Promise.all([
    prisma.order.findMany({ where: { sellerId }, include: { buyer: { select: { name: true, email: true } }, delivery: { include: { assignedUser: { select: { id: true, name: true } } } } }, orderBy: { createdAt: 'desc' } }),
    prisma.user.findMany({ where: { sellerId, role: 'DRIVER', status: { not: 'DISABLED' } }, select: { id: true, name: true }, orderBy: { name: 'asc' } })
  ]);
  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Operations</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Orders</h1></div><Link className="rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800" href="/admin/orders/new">Create order</Link></div>
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-6 py-3">Order</th><th className="px-6 py-3">Buyer</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Driver</th><th className="px-6 py-3">Created</th><th className="px-6 py-3">Assignment</th></tr></thead><tbody className="divide-y divide-slate-100">{orders.map((order) => <tr key={order.id}><td className="px-6 py-4 font-bold">{order.orderRef}</td><td className="px-6 py-4">{order.buyer.name ?? order.buyer.email}</td><td className="px-6 py-4"><StatusBadge status={order.status} /></td><td className="px-6 py-4">{order.delivery?.assignedUser?.name ?? 'Unassigned'}</td><td className="px-6 py-4 text-slate-500">{order.createdAt.toLocaleDateString()}</td><td className="px-6 py-4">{order.delivery && <AssignDriverForm deliveryId={order.delivery.id} drivers={drivers} currentDriverId={order.delivery.assignedUser?.id ?? null} />}</td></tr>)}</tbody></table></div></section>
  </div>;
}