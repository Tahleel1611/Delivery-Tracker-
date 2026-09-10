'use client';

import { useState } from 'react';
import { confirmPodUploadAction, getPodUploadUrlAction } from '../../../actions/pod-actions';
import { ActionMessage } from '../../../../components/action-message';

export function PodUpload({ deliveryId, hasPod }: { deliveryId: string; hasPod: boolean }) {
  const [message, setMessage] = useState<{ success: boolean; error?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (hasPod) return <div className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Proof of delivery uploaded.</div>;

  async function upload(file: File) {
    setBusy(true);
    setMessage(null);
    try {
      const signed = await getPodUploadUrlAction(deliveryId, { contentType: file.type, size: file.size });
      if (!signed.success) { setMessage(signed); return; }
      const response = await fetch(signed.data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!response.ok) { setMessage({ success: false, error: 'The file could not be uploaded.' }); return; }
      const confirmed = await confirmPodUploadAction(deliveryId, signed.data.objectKey);
      setMessage(confirmed);
    } catch {
      setMessage({ success: false, error: 'The upload could not be completed.' });
    } finally {
      setBusy(false);
    }
  }

  return <div className="rounded-xl border border-slate-200 p-4"><label className="block text-sm font-semibold text-slate-800" htmlFor="pod-file">Proof of delivery</label><p className="mt-1 text-xs text-slate-500">Upload a JPG, PNG, or PDF up to 10 MB.</p><input className="mt-3 block w-full text-sm" disabled={busy} id="pod-file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} type="file" accept="image/jpeg,image/png,application/pdf" />{busy && <p className="mt-2 text-sm text-slate-500">Uploading securely...</p>}<ActionMessage message={message} /></div>;
}