'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-slate-100 p-6"><section className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1><p className="mt-2 text-slate-600">We could not load this page. Please try again.</p><button aria-label="Try loading the page again" className="mt-6 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white" onClick={reset}>Try again</button></section></main>;
}