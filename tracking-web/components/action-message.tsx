'use client';

export function ActionMessage({ message }: { message: { success: boolean; error?: string } | null }) {
  if (!message) return null;
  return <p className={`mt-3 text-sm ${message.success ? 'text-emerald-700' : 'text-red-700'}`} role="status">{message.success ? 'Saved successfully.' : message.error}</p>;
}