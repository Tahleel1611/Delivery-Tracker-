import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { StatusBadge } from '../../components/status-badge';

export default async function DriverManifestPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'DRIVER') redirect('/403');
  const deliveries = await prisma.delivery.findMany({ where: { assignedUserId: session.user.id, status: { notIn: ['DELIVERED', 'CANCELLED'] } }, include: { order: { select: { orderRef: true } } }, orderBy: { createdAt: 'asc' } });
  return <div className="space-y-6"><div><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Driver manifest</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Today&apos;s deliveries</h1></div><div className="space-y-3">{deliveries.map((delivery) => <Link className="block rounded-2xl bg-white p-5 shadow-sm transition hover:ring-2 hover:ring-emerald-200" href={`/driver/deliveries/${delivery.id}`} key={delivery.id}><div className="flex justify-between gap-3"><div><p className="font-bold text-slate-900">{delivery.order?.orderRef ?? delivery.orderRef}</p><p className="mt-1 text-sm text-slate-600">{delivery.deliveryAddress}</p></div><StatusBadge status={delivery.status} /></div></Link>)}{deliveries.length === 0 && <div className="rounded-2xl bg-white p-8 text-center text-slate-500">No active deliveries assigned.</div>}</div></div>;
}