'use client';

import { useState } from 'react';
import { createBuyer } from '../../actions/buyer-actions';
import { ActionMessage } from '../../../components/action-message';

export function BuyerForm() {
  const [message, setMessage] = useState<{ success: boolean; error?: string } | null>(null);
  return (
    <form className="rounded-2xl bg-white p-6 shadow-sm" onSubmit={async (event) => {
      event.preventDefault();
      const result = await createBuyer(new FormData(event.currentTarget));
      setMessage(result);
      if (result.success) event.currentTarget.reset();
    }}>
      <h2 className="text-lg font-bold text-slate-900">Add buyer</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <input className="rounded-lg border border-slate-300 px-3 py-2" name="name" placeholder="Shop name" required />
        <input className="rounded-lg border border-slate-300 px-3 py-2" name="email" placeholder="Email address" required type="email" />
        <input className="rounded-lg border border-slate-300 px-3 py-2" name="phone" placeholder="Phone (optional)" />
      </div>
      <button className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800" type="submit">Create buyer</button>
      <ActionMessage message={message} />
    </form>
  );
}