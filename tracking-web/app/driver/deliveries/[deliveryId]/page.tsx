import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { StatusBadge } from '../../../../components/status-badge';
import { StatusButtons } from './status-buttons';
import { PodUpload } from './pod-upload';

export default async function DriverDeliveryPage({ params }: { params: Promise<{ deliveryId: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'DRIVER') redirect('/403');
  const { deliveryId } = await params;
  const delivery = await prisma.delivery.findFirst({ where: { id: deliveryId, assignedUserId: session.user.id }, include: { userStatusLogs: { orderBy: { createdAt: 'desc' } } } });
  if (!delivery) notFound();
  const order = delivery.orderId ? await prisma.order.findUnique({ where: { id: delivery.orderId }, include: { items: true, buyer: { select: { name: true, phone: true } } } }) : null;
  return <div className="space-y-6"><Link className="text-sm font-semibold text-emerald-700" href="/driver">← Today&apos;s route</Link><section className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex justify-between gap-4"><div><p className="text-sm text-slate-500">Delivery</p><h1 className="mt-1 text-3xl font-bold text-slate-900">{order?.orderRef ?? delivery.orderRef}</h1></div><StatusBadge status={delivery.status} /></div><div className="mt-6 space-y-4 border-t border-slate-100 pt-5 text-sm"><p><strong className="text-slate-900">Deliver to:</strong> {order?.buyer.name ?? 'Buyer'}</p><p><strong className="text-slate-900">Phone:</strong> {(order?.buyer.phone ?? delivery.customerPhone) || 'Not provided'}</p><p><strong className="text-slate-900">Address:</strong> {delivery.deliveryAddress}</p></div><div className="mt-7"><StatusButtons deliveryId={delivery.id} status={delivery.status} /></div></section>{order && <section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="font-bold text-slate-900">Order items</h2><div className="mt-3 divide-y divide-slate-100">{order.items.map((item) => <div className="flex justify-between py-3 text-sm" key={item.id}><span>{item.description}</span><span className="font-semibold">× {item.quantity}</span></div>)}</div></section>}{delivery.status === 'DELIVERED' && <PodUpload deliveryId={delivery.id} hasPod={Boolean(delivery.podObjectKey)} />}</div>;
}