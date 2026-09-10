import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '../../lib/auth';

export default async function BuyerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'BUYER') redirect('/403');
  return <div className="min-h-screen bg-slate-100"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5"><Link className="font-bold text-slate-900" href="/buyer">My orders</Link><span className="text-sm text-slate-500">{session.user.email}</span></div></header><main className="mx-auto max-w-5xl px-6 py-8">{children}</main></div>;
}