import { redirect } from 'next/navigation';
import { BuyerForm } from './buyer-form';
import { auth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { tenantIdFor } from '../../../lib/authorization';

export default async function BuyersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/403');
  const buyers = await prisma.user.findMany({ where: { sellerId: tenantIdFor(session.user), role: 'BUYER' }, orderBy: { createdAt: 'desc' } });
  return (
    <div className="space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Customers</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Buyers</h1></div>
      <BuyerForm />
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4"><h2 className="font-bold text-slate-900">Registered buyers</h2></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Email</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Added</th></tr></thead><tbody className="divide-y divide-slate-100">{buyers.map((buyer) => <tr key={buyer.id}><td className="px-6 py-4 font-semibold">{buyer.name ?? 'Unnamed buyer'}</td><td className="px-6 py-4">{buyer.email}</td><td className="px-6 py-4">{buyer.status}</td><td className="px-6 py-4 text-slate-500">{buyer.createdAt.toLocaleDateString()}</td></tr>)}</tbody></table></div>
      </section>
    </div>
  );
}