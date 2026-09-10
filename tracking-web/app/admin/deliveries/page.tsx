import { redirect } from 'next/navigation';
import { auth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { tenantIdFor } from '../../../lib/authorization';
import { StatusBadge } from '../../../components/status-badge';

export const dynamic = 'force-dynamic';

export default async function DeliveriesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/403');
  const deliveries = await prisma.delivery.findMany({ where: { order: { sellerId: tenantIdFor(session.user) } }, include: { order: { select: { orderRef: true, buyer: { select: { name: true, email: true } } } }, assignedUser: { select: { name: true } } }, orderBy: { updatedAt: 'desc' } });
  return <div className="space-y-6"><div><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Live operations</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Deliveries</h1></div><section className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-6 py-3">Order</th><th className="px-6 py-3">Buyer</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Driver</th><th className="px-6 py-3">Updated</th></tr></thead><tbody className="divide-y divide-slate-100">{deliveries.map((delivery) => <tr key={delivery.id}><td className="px-6 py-4 font-semibold">{delivery.order?.orderRef ?? delivery.orderRef}</td><td className="px-6 py-4">{delivery.order?.buyer.name ?? delivery.order?.buyer.email ?? 'Legacy delivery'}</td><td className="px-6 py-4"><StatusBadge status={delivery.status} /></td><td className="px-6 py-4">{delivery.assignedUser?.name ?? 'Unassigned'}</td><td className="px-6 py-4 text-slate-500">{delivery.updatedAt.toLocaleString()}</td></tr>)}</tbody></table></div></section></div>;
}