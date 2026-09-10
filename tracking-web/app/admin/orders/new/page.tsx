import { redirect } from 'next/navigation';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { tenantIdFor } from '../../../../lib/authorization';
import { OrderForm } from './order-form';

export default async function NewOrderPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/403');
  const sellerId = tenantIdFor(session.user);
  const [buyers, drivers] = await Promise.all([
    prisma.user.findMany({ where: { sellerId, role: 'BUYER', status: { not: 'DISABLED' } }, select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { sellerId, role: 'DRIVER', status: { not: 'DISABLED' } }, select: { id: true, name: true }, orderBy: { name: 'asc' } })
  ]);
  return <div className="mx-auto max-w-4xl space-y-6"><div><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Operations</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Create order</h1></div><OrderForm buyers={buyers} drivers={drivers} /></div>;
}