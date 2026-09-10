'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    await signIn('email', {
      email,
      callbackUrl: '/'
    });

    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">OMS</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Sign in</h1>
        <p className="mt-2 text-slate-600">Use your email to receive a secure sign-in link.</p>

        {sent ? (
          <p className="mt-8 rounded-lg bg-emerald-50 p-4 text-emerald-800">Check your email for the sign-in link.</p>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700" htmlFor="email">Email address</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
            <button className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800" type="submit">
              Send sign-in link
            </button>
            {error && <p className="text-sm text-red-700">{error}</p>}
          </form>
        )}
      </section>
    </main>
  );
}