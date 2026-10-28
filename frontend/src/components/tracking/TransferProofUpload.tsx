'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, Paperclip, Upload } from 'lucide-react';
import { apiBase } from '@/lib/api';
import { getDictionary } from '@/i18n';
import { formatDate } from '@/lib/format';
import type { Locale } from '@/lib/routes';

/**
 * Dépôt du justificatif de virement, sous les coordonnées bancaires.
 *
 * C'est le seul signal que la boutique reçoit entre la validation de la
 * commande et l'apparition du virement sur le relevé : il déclenche l'avis à
 * la boutique et fait passer la commande en préparation.
 *
 * L'envoi passe par `fetch` et non par `apiFetch` : le corps est le fichier
 * lui-même, pas du JSON. Sérialiser une photo en base64 ferait grossir la
 * requête d'un tiers pour rien.
 */

const ACCEPTED = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

const MAX_BYTES = 10 * 1024 * 1024;

export interface ExistingProof {
  fileName: string;
  sizeBytes: number;
  createdAt: string;
}

export function TransferProofUpload({
  locale,
  orderNumber,
  email,
  proofs,
  onSubmitted,
}: {
  locale: Locale;
  orderNumber: string;
  email: string;
  proofs: ExistingProof[];
  /** Permet à la page de recharger la commande : l'étape vient de changer. */
  onSubmitted?: () => void;
}) {
  const t = getDictionary(locale);
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  function choose(selected: File | null) {
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    // Les deux contrôles sont refaits par le serveur : celui-ci n'est là que
    // pour éviter au client d'attendre dix mégaoctets avant d'être refusé.
    if (selected.size > MAX_BYTES) {
      setFile(null);
      setError(t.tracking.proof.tooLarge);
      return;
    }
    if (selected.type && !ACCEPTED.includes(selected.type)) {
      setFile(null);
      setError(t.tracking.proof.wrongType);
      return;
    }
    setFile(selected);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;

    setState('sending');
    setError(null);
    try {
      const params = new URLSearchParams({ email });
      const response = await fetch(
        `${apiBase()}/api/checkout/orders/${encodeURIComponent(orderNumber)}/proof?${params}`,
        {
          method: 'POST',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.message ?? t.tracking.proof.failed);
      }

      setState('sent');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      onSubmitted?.();
    } catch (err) {
      setState('idle');
      setError(err instanceof Error ? err.message : t.tracking.proof.failed);
    }
  }

  const latest = proofs[0];

  return (
    <div className="mt-6 border-t border-smoke-200 pt-6">
      <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
        <Paperclip className="h-4 w-4 text-signal" aria-hidden="true" />
        {t.tracking.proof.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-smoke-600">{t.tracking.proof.intro}</p>

      {latest && (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t.tracking.proof.alreadySent.replace('{date}', formatDate(latest.createdAt, locale))}
        </p>
      )}

      {state === 'sent' ? (
        <p
          role="status"
          className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {t.tracking.proof.sent}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block">
            <span className="sr-only">{t.tracking.proof.choose}</span>
            <input
              ref={inputRef}
              type="file"
              accept={`${ACCEPTED.join(',')},.pdf,.jpg,.jpeg,.png,.webp,.heic`}
              onChange={(e) => choose(e.target.files?.[0] ?? null)}
              className="block w-full cursor-pointer rounded-lg border border-smoke-200 bg-canvas-raised text-sm text-smoke-600 file:mr-4 file:cursor-pointer file:rounded-l-lg file:border-0 file:bg-ink file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-ink/90"
            />
            <span className="field-hint">{t.tracking.proof.formats}</span>
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-signal-soft px-4 py-3 text-sm font-medium text-signal-text">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!file || state === 'sending'}
            className="btn btn-primary btn-md w-full sm:w-auto"
          >
            <Upload className="h-4 w-4" />
            {state === 'sending' ? t.tracking.proof.sending : t.tracking.proof.submit}
          </button>
        </form>
      )}

      <p className="mt-4 text-xs leading-relaxed text-smoke-400">{t.tracking.proof.notice}</p>
    </div>
  );
}
