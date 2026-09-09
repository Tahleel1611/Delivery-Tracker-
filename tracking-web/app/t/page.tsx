'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TrackingLookupPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanToken = token.trim();

    if (!cleanToken) {
      setError('Enter a tracking token to continue.');
      return;
    }

    setError('');
    router.push(`/t/${encodeURIComponent(cleanToken)}`);
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-lg place-items-center p-6">
      <section className="w-full rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Delivery tracking</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Find your delivery</h1>
        <p className="mt-2 text-slate-600">Enter the tracking token from your delivery message.</p>
        <form className="mt-6" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-800" htmlFor="tracking-token">Tracking token</label>
          <input
            id="tracking-token"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            autoComplete="off"
            placeholder="Paste your token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
          <button className="mt-4 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-300" type="submit">
            Track Order
          </button>
        </form>
      </section>
    </main>
  );
}
