import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '../../lib/auth';

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/403');

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link className="text-lg font-bold text-slate-900" href="/admin/orders">OMS Operations</Link>
          <nav className="flex gap-4 text-sm font-semibold text-slate-600">
            <Link className="hover:text-emerald-700" href="/admin/orders">Orders</Link>
            <Link className="hover:text-emerald-700" href="/admin/buyers">Buyers</Link>
            <Link className="hover:text-emerald-700" href="/admin/deliveries">Deliveries</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}