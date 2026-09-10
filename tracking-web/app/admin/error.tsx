'use client';

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="rounded-2xl bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-bold text-slate-900">Dashboard unavailable</h1><p className="mt-2 text-slate-600">Please try again in a moment.</p><button aria-label="Retry dashboard" className="mt-5 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white" onClick={reset}>Retry</button></div>;
}