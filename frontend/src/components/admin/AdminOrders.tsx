'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileCheck2, Landmark, Package, Search, Truck } from 'lucide-react';
import { apiBase, apiFetch, ApiError } from '@/lib/api';
import { getDictionary } from '@/i18n';
import { formatDateTime, formatPrice } from '@/lib/format';
import type { Locale } from '@/lib/routes';
import { cn } from '@/lib/cn';

const CARRIERS = ['DPD', 'DHL', 'Chronopost', 'GLS', 'Schenker'] as const;

/** Les trois etapes du suivi, dans l'ordre ou le client les voit. */
const STAGES = ['PREPARING', 'SHIPPED', 'DELIVERED'] as const;
type Stage = (typeof STAGES)[number];

interface BulkResult {
  updated: number;
  failed: number;
  emailsSent: number;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  email: string;
  country: string;
  status: string;
  paymentMethod: 'CARD' | 'BANK_TRANSFER';
  paymentStatus: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  bankTransferRef: string | null;
  items: Array<{ id: string; name: string; sku: string; quantity: number }>;
  shipments: Array<{ id: string; carrier: string; trackingNumber: string | null; status: string }>;
  transferProofs?: Array<{ id: string; fileName: string; contentType: string; createdAt: string }>;
  notifications?: Array<{ stage: Stage; sentAt: string | null; error: string | null }>;
}

export function AdminOrders({ locale, accessToken }: { locale: Locale; accessToken: string }) {
  const t = getDictionary(locale);

  const [items, setItems] = useState<AdminOrder[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [shipping, setShipping] = useState<{ orderId: string; carrier: string; tracking: string } | null>(
    null,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<BulkResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ perPage: '50' });
      if (query.trim()) params.set('q', query.trim());
      if (statusFilter) params.set('status', statusFilter);
      const data = await apiFetch<{ items: AdminOrder[] }>(
        `/api/admin/orders?${params.toString()}`,
        { accessToken },
      );
      setItems(data.items);
      // Une commande sortie du filtre ne doit pas rester selectionnee
      // invisiblement : l'action suivante la toucherait sans qu'on la voie.
      const visibles = new Set(data.items.map((o) => o.id));
      setSelected((s) => new Set([...s].filter((id) => visibles.has(id))));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, query, statusFilter, t.common.error]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  async function run(orderId: string, action: () => Promise<unknown>) {
    setBusy(orderId);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.common.error);
    } finally {
      setBusy(null);
    }
  }

  const confirmTransfer = (order: AdminOrder) =>
    run(order.id, () =>
      apiFetch(`/api/admin/orders/${order.id}/confirm-transfer`, {
        method: 'POST',
        accessToken,
        body: {},
      }),
    );

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setBulk(null);
  }

  /** Marque la selection a une etape et previent chaque client. */
  async function applyStage(stage: Stage) {
    setBusy('bulk');
    setError(null);
    setBulk(null);
    try {
      const result = await apiFetch<BulkResult>('/api/admin/orders/bulk-status', {
        method: 'POST',
        accessToken,
        body: { orderIds: [...selected], status: stage },
      });
      setBulk(result);
      setSelected(new Set());
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.common.error);
    } finally {
      setBusy(null);
    }
  }

  /**
   * Le justificatif est servi par une route authentifiee : un lien ordinaire
   * n'emporterait pas le jeton. On recupere donc le fichier, puis on le
   * remet au navigateur par un lien de telechargement.
   *
   * Pas de `window.open` : apres un `await`, le navigateur ne considere plus
   * l'appel comme declenche par le clic et bloque la fenetre sans rien dire.
   */
  async function downloadProof(order: AdminOrder) {
    const proof = order.transferProofs?.[0];
    if (!proof) return;

    setBusy(order.id);
    setError(null);
    try {
      const response = await fetch(
        `${apiBase()}/api/admin/orders/${order.id}/proofs/${proof.id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!response.ok) throw new ApiError(response.status, 'PROOF', t.common.error);

      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = proof.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.common.error);
    } finally {
      setBusy(null);
    }
  }

  const submitShipment = (event: React.FormEvent) => {
    event.preventDefault();
    if (!shipping) return;
    const payload = shipping;
    setShipping(null);
    void run(payload.orderId, () =>
      apiFetch(`/api/admin/orders/${payload.orderId}/ship`, {
        method: 'POST',
        accessToken,
        body: {
          carrier: payload.carrier,
          trackingNumber: payload.tracking.trim() || undefined,
        },
      }),
    );
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-3">
        <label className="relative min-w-[16rem] flex-1">
          <span className="sr-only">{t.nav.search}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-smoke-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SM-2026-… / e-mail / référence virement"
            className="field pl-9"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="field w-auto"
        >
          <option value="">—</option>
          {Object.keys(t.orderStatus).map((status) => (
            <option key={status} value={status}>
              {t.orderStatus[status as keyof typeof t.orderStatus]}
            </option>
          ))}
        </select>
      </div>

      {/* Barre d'action sur la selection : c'est le geste courant au retour
          du releve bancaire, une dizaine de commandes passees d'un coup. */}
      {items.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-smoke-200 bg-canvas-raised p-3">
          <label className="flex items-center gap-2 text-sm text-smoke-600">
            <input
              type="checkbox"
              checked={selected.size > 0 && selected.size === items.length}
              onChange={(e) =>
                setSelected(e.target.checked ? new Set(items.map((o) => o.id)) : new Set())
              }
              className="h-4 w-4 rounded border-smoke-300 text-signal focus:ring-signal"
            />
            {t.admin.stage.selectAll}
          </label>

          <span className="text-sm font-medium text-ink">
            {t.admin.stage.selected.replace('{count}', String(selected.size))}
          </span>

          <span className="ml-auto flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-smoke-400">
              {t.admin.stage.legend}
            </span>
            {STAGES.map((stage) => (
              <button
                key={stage}
                type="button"
                disabled={selected.size === 0 || busy === 'bulk'}
                onClick={() => void applyStage(stage)}
                className={cn('btn btn-sm', stage === 'DELIVERED' ? 'btn-dark' : 'btn-outline')}
              >
                {stage === 'PREPARING' && <Package className="h-3.5 w-3.5" />}
                {stage === 'SHIPPED' && <Truck className="h-3.5 w-3.5" />}
                {stage === 'DELIVERED' && <FileCheck2 className="h-3.5 w-3.5" />}
                {t.admin.stage[stage]}
              </button>
            ))}
          </span>
        </div>
      )}

      {bulk && (
        <p
          role="status"
          className={cn(
            'mb-4 rounded-lg px-4 py-3 text-sm',
            bulk.emailsSent === 0 && bulk.updated > 0
              ? 'bg-signal-soft font-medium text-signal-text'
              : 'bg-emerald-50 font-medium text-emerald-800',
          )}
        >
          {t.admin.stage.done
            .replace('{updated}', String(bulk.updated))
            .replace('{emails}', String(bulk.emailsSent))}
          {bulk.emailsSent === 0 && bulk.updated > 0 && ` ${t.admin.stage.mailOff}`}
        </p>
      )}

      {error && <p className="mb-4 text-sm text-signal">{error}</p>}

      {loading && items.length === 0 && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-24 rounded-card" />
          ))}
        </div>
      )}

      <ul className="space-y-4">
        {items.map((order) => {
          const awaitingTransfer =
            order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus === 'AWAITING_TRANSFER';
          const shippable =
            order.paymentStatus === 'SUCCEEDED' &&
            order.status !== 'SHIPPED' &&
            order.status !== 'DELIVERED' &&
            order.status !== 'CANCELLED';

          return (
            <li
              key={order.id}
              className={cn('card p-5', selected.has(order.id) && 'ring-2 ring-signal')}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(order.id)}
                    onChange={() => toggle(order.id)}
                    aria-label={order.orderNumber}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-smoke-300 text-signal focus:ring-signal"
                  />
                  <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold tabular text-ink">{order.orderNumber}</span>
                    <span
                      className={cn(
                        'badge',
                        order.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : order.status === 'CANCELLED'
                            ? 'bg-smoke-100 text-smoke-500'
                            : order.status === 'PENDING_PAYMENT'
                              ? 'bg-signal-soft text-signal'
                              : 'bg-ink text-white',
                      )}
                    >
                      {t.orderStatus[order.status as keyof typeof t.orderStatus] ?? order.status}
                    </span>
                    <span className="badge-outline">{t.paymentMethod[order.paymentMethod]}</span>
                    <span className="badge-soft">{order.country}</span>
                  </div>

                  <p className="mt-1.5 text-sm text-smoke-500">
                    {order.email} · {formatDateTime(order.createdAt, locale)}
                  </p>
                  <p className="mt-1 text-sm text-smoke-600">
                    {order.items.map((item) => `${item.sku} × ${item.quantity}`).join(', ')}
                  </p>
                  {order.bankTransferRef && (
                    <p className="mt-1 text-xs text-smoke-400">
                      {t.confirmation.reference}{' '}
                      <span className="font-mono text-ink">{order.bankTransferRef}</span>
                    </p>
                  )}
                  {order.shipments[0] && (
                    <p className="mt-1 text-xs text-smoke-500">
                      {order.shipments[0].carrier}
                      {order.shipments[0].trackingNumber
                        ? ` · ${order.shipments[0].trackingNumber}`
                        : ''}
                    </p>
                  )}

                  {/* Le justificatif est le signal qui declenche la
                      verification du releve : il doit se voir dans la liste. */}
                  {(order.transferProofs?.length ?? 0) > 0 && (
                    <button
                      type="button"
                      disabled={busy === order.id}
                      onClick={() => void downloadProof(order)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-signal-text hover:underline"
                    >
                      <FileCheck2 className="h-3.5 w-3.5" />
                      {t.admin.stage.proofCount.replace(
                        '{count}',
                        String(order.transferProofs?.length ?? 0),
                      )}
                      {' · '}
                      {t.admin.stage.openProof}
                    </button>
                  )}

                  {order.notifications?.some((n) => !n.sentAt) && (
                    <p className="mt-1.5 text-xs font-medium text-signal-text">
                      {t.admin.stage.mailOff}
                    </p>
                  )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-3">
                  <span className="text-xl font-bold tabular text-ink">
                    {formatPrice(order.totalCents, locale, order.currency)}
                  </span>

                  <div className="flex flex-wrap justify-end gap-2">
                    {awaitingTransfer && (
                      <button
                        type="button"
                        disabled={busy === order.id}
                        onClick={() => void confirmTransfer(order)}
                        className="btn btn-primary btn-sm"
                      >
                        <Landmark className="h-3.5 w-3.5" />
                        {t.admin.confirmTransfer}
                      </button>
                    )}
                    {shippable && (
                      <button
                        type="button"
                        disabled={busy === order.id}
                        onClick={() =>
                          setShipping({
                            orderId: order.id,
                            carrier: order.country === 'DE' ? 'DHL' : 'DPD',
                            tracking: '',
                          })
                        }
                        className="btn btn-dark btn-sm"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        {t.admin.ship}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {shipping?.orderId === order.id && (
                <form
                  onSubmit={submitShipment}
                  className="mt-4 flex flex-wrap items-end gap-3 border-t border-smoke-200 pt-4"
                >
                  <label className="min-w-[10rem]">
                    <span className="field-label">{t.admin.carrier}</span>
                    <select
                      value={shipping.carrier}
                      onChange={(e) =>
                        setShipping((s) => (s ? { ...s, carrier: e.target.value } : s))
                      }
                      className="field h-10"
                    >
                      {CARRIERS.map((carrier) => (
                        <option key={carrier} value={carrier}>
                          {carrier}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="min-w-[14rem] flex-1">
                    <span className="field-label">{t.admin.trackingNumber}</span>
                    <input
                      value={shipping.tracking}
                      onChange={(e) =>
                        setShipping((s) => (s ? { ...s, tracking: e.target.value } : s))
                      }
                      className="field h-10"
                    />
                  </label>

                  <button type="submit" className="btn btn-primary btn-md">
                    {t.admin.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShipping(null)}
                    className="btn btn-ghost btn-md"
                  >
                    {t.admin.cancel}
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>

      {!loading && items.length === 0 && (
        <p className="py-12 text-center text-sm text-smoke-400">{t.catalog.empty}</p>
      )}
    </div>
  );
}
