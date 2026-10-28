'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Landmark, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { formatDateTime, formatIban } from '@/lib/format';
import type { Locale } from '@/lib/routes';

const COUNTRIES = [
  { code: 'FR', label: 'France' },
  { code: 'BE', label: 'Belgique' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'AT', label: 'Autriche' },
] as const;

type CountryCode = (typeof COUNTRIES)[number]['code'];

interface BankAccount {
  id: string;
  label: string;
  holder: string;
  iban: string;
  bic: string;
  bankName: string;
  countries: CountryCode[];
  active: boolean;
}

interface BankSettings {
  accounts: BankAccount[];
  dueDays: number;
  source: 'database' | 'env';
  updatedAt: string | null;
}

const EMPTY: BankAccount = {
  id: '',
  label: '',
  holder: '',
  iban: '',
  bic: '',
  bankName: '',
  countries: [],
  active: true,
};

/**
 * Comptes destinataires des virements clients.
 *
 * Dravik encaisse sur plusieurs comptes : l'IBAN français sert la France et la
 * Belgique, l'IBAN allemand sert l'Allemagne et l'Autriche. Le compte présenté
 * au client suit son pays de livraison, ce qui lui évite des frais et un délai
 * de virement transfrontalier.
 *
 * Ces coordonnées sont celles affichées sur la page de confirmation et
 * encodées dans le code QR. Une modification prend effet immédiatement, y
 * compris sur les commandes déjà passées mais non encore réglées.
 */
export function AdminBankAccount({
  locale,
  accessToken,
  canEdit,
}: {
  locale: Locale;
  accessToken: string;
  canEdit: boolean;
}) {
  const [settings, setSettings] = useState<BankSettings | null>(null);
  const [form, setForm] = useState<BankAccount | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<BankSettings>('/api/admin/settings/bank', { accessToken });
      setSettings(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chargement impossible.');
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;

    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<BankSettings>('/api/admin/settings/bank', {
        method: 'PUT',
        accessToken,
        body: form,
      });
      setSettings(data);
      setForm(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<BankSettings>(
        `/api/admin/settings/bank/${encodeURIComponent(id)}`,
        { method: 'DELETE', accessToken },
      );
      setSettings(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression impossible.');
    } finally {
      setBusy(false);
    }
  }

  function toggleCountry(code: CountryCode) {
    setForm((f) =>
      f
        ? {
            ...f,
            countries: f.countries.includes(code)
              ? f.countries.filter((c) => c !== code)
              : [...f.countries, code],
          }
        : f,
    );
  }

  if (!settings) {
    return <p className="text-sm text-smoke-500">Chargement…</p>;
  }

  /** Un pays sans compte ne peut pas être réglé par virement. */
  const covered = new Set(settings.accounts.filter((a) => a.active).flatMap((a) => a.countries));
  const uncovered = COUNTRIES.filter((c) => !covered.has(c.code));

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-ink">
          <Landmark className="h-5 w-5 text-signal" aria-hidden="true" />
          Comptes destinataires
        </h2>
        {canEdit && !form && (
          <button
            type="button"
            onClick={() => setForm({ ...EMPTY })}
            className="btn btn-outline inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter un compte
          </button>
        )}
      </header>

      {settings.source === 'env' && (
        <p className="flex gap-2.5 rounded-lg border border-signal/25 bg-signal-soft p-4 text-sm leading-relaxed text-ink">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-signal" aria-hidden="true" />
          Aucun compte n’a encore été saisi ici : la boutique utilise les valeurs du fichier
          d’environnement. Ajoutez vos IBAN pour qu’ils prennent effet.
        </p>
      )}

      {uncovered.length > 0 && (
        <p className="flex gap-2.5 rounded-lg border border-smoke-300 bg-canvas-raised p-4 text-sm leading-relaxed text-smoke-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-smoke-500" aria-hidden="true" />
          Pays sans compte dédié : <strong>{uncovered.map((c) => c.label).join(', ')}</strong>. Les
          commandes vers ces pays recevront le premier compte actif.
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-signal-soft px-4 py-3 text-sm font-medium text-signal">
          {error}
        </p>
      )}

      {saved && (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" aria-hidden="true" />
          Compte enregistré. Il s’applique dès maintenant.
        </p>
      )}

      {/* ------------------------------------------------- liste des comptes */}
      <ul className="space-y-3">
        {settings.accounts.map((account) => (
          <li key={account.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-ink">
                  {account.label}
                  {!account.active && (
                    <span className="ml-2 text-xs font-semibold uppercase text-smoke-400">
                      inactif
                    </span>
                  )}
                </p>
                <p className="mt-1 font-mono text-sm text-smoke-600">{formatIban(account.iban)}</p>
                <p className="mt-1 text-sm text-smoke-500">
                  {account.holder} · {account.bankName} · {account.bic}
                </p>
                <p className="mt-2 flex flex-wrap gap-1.5">
                  {account.countries.length === 0 ? (
                    <span className="text-xs text-smoke-400">aucun pays</span>
                  ) : (
                    account.countries.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-signal-soft px-2 py-0.5 text-xs font-semibold text-signal-text"
                      >
                        {COUNTRIES.find((x) => x.code === c)?.label ?? c}
                      </span>
                    ))
                  )}
                </p>
              </div>

              {canEdit && account.id !== 'env' && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...account })}
                    className="btn btn-outline"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(account.id)}
                    disabled={busy}
                    className="btn btn-ghost h-10 w-10 p-0 text-smoke-400 hover:text-signal"
                    aria-label={`Supprimer ${account.label}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* --------------------------------------------------------- formulaire */}
      {canEdit && form && (
        <form onSubmit={submit} className="card space-y-4 p-5">
          <h3 className="font-bold text-ink">
            {form.id ? 'Modifier le compte' : 'Nouveau compte destinataire'}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Intitulé (usage interne)</span>
              <input
                required
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Compte France"
                className="field"
              />
            </label>
            <label className="block">
              <span className="field-label">Titulaire</span>
              <input
                required
                value={form.holder}
                onChange={(e) => setForm({ ...form, holder: e.target.value })}
                className="field"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="field-label">IBAN</span>
              <input
                required
                value={form.iban}
                onChange={(e) => setForm({ ...form, iban: e.target.value })}
                placeholder="FR76 …"
                className="field font-mono"
              />
            </label>
            <label className="block">
              <span className="field-label">BIC</span>
              <input
                required
                value={form.bic}
                onChange={(e) => setForm({ ...form, bic: e.target.value.toUpperCase() })}
                className="field font-mono"
              />
            </label>
            <label className="block">
              <span className="field-label">Banque</span>
              <input
                required
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="field"
              />
            </label>
          </div>

          <fieldset>
            <legend className="field-label">Pays servis par ce compte</legend>
            <div className="mt-1 flex flex-wrap gap-4">
              {COUNTRIES.map((c) => (
                <label key={c.code} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.countries.includes(c.code)}
                    onChange={() => toggleCountry(c.code)}
                    className="h-4 w-4 rounded accent-signal"
                  />
                  <span className="text-smoke-600">{c.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-smoke-500">
              Un pays attribué ici est retiré des autres comptes : sans cela, le compte servi
              dépendrait de l’ordre de la liste.
            </p>
          </fieldset>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded accent-signal"
            />
            <span className="text-smoke-600">Compte actif</span>
          </label>

          <div className="flex gap-3">
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => setForm(null)} className="btn btn-outline">
              Annuler
            </button>
          </div>
        </form>
      )}

      <p className="flex items-center gap-2 text-xs text-smoke-400">
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Délai de règlement : {settings.dueDays} jours.
        {settings.updatedAt && ` Dernière modification le ${formatDateTime(settings.updatedAt, locale)}.`}
      </p>
    </section>
  );
}
