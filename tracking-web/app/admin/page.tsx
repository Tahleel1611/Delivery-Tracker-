import { redirect } from 'next/navigation';
import { auth } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { tenantIdFor } from '../../lib/authorization';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/403');
  const sellerId = tenantIdFor(session.user);
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const [activeOrders, completedToday, pendingAssignments] = await Promise.all([
    prisma.order.count({ where: { sellerId, status: { notIn: ['DELIVERED', 'CANCELLED'] } } }),
    prisma.delivery.count({ where: { order: { sellerId }, status: 'DELIVERED', updatedAt: { gte: startOfDay } } }),
    prisma.delivery.count({ where: { order: { sellerId }, assignedUserId: null, status: { notIn: ['DELIVERED', 'CANCELLED'] } } })
  ]);
  return <div className="space-y-8"><div><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Operations overview</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Today at a glance</h1></div><div className="grid gap-4 sm:grid-cols-3">{[['Active orders', activeOrders, 'All open order workflows'], ['Completed today', completedToday, 'Deliveries marked complete'], ['Pending assignment', pendingAssignments, 'Need a delivery partner']].map(([label, value, detail]) => <section className="rounded-2xl bg-white p-6 shadow-sm" key={String(label)}><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-3 text-4xl font-bold text-slate-900">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></section>)}</div></div>;
}