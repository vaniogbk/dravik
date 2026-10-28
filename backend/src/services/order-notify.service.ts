import type { DeliveryStage, Locale, Order } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import * as mail from './mail.service.js';

/**
 * Messages de suivi envoyés au client à chaque étape de la livraison.
 *
 * Trois étapes, trois messages, un par commande : la contrainte unique
 * (orderId, stage) de OrderNotification garantit qu'un client ne reçoit pas
 * deux fois le même avis, même si l'étape est repassée depuis le back-office.
 *
 * Un échec n'interrompt jamais le changement d'étape : la commande avance,
 * la ligne du journal porte le motif, et le back-office l'affiche. Une
 * commande bloquée parce que le SMTP est tombé serait pire que le message
 * manquant.
 */

/** Segment d'URL de la page de suivi, par langue. Miroir de `routes.ts`. */
const TRACKING_PATH: Record<Locale, string> = {
  fr: 'suivi-commande',
  de: 'sendungsverfolgung',
};

interface Copy {
  subject: string;
  message: string;
  cta: string;
  signature: string;
}

/**
 * Les trois messages sont ceux demandés, mot pour mot. Les réécrire ici
 * changerait ce que le client lit : ils ne sont pas à « améliorer ».
 */
const COPY: Record<Locale, Record<DeliveryStage, Copy>> = {
  fr: {
    PREPARING: {
      subject: 'Votre commande {order} est en préparation',
      message: 'Votre commande est en préparation auprès du fournisseur. Merci de patienter !',
      cta: 'Suivre ma commande',
      signature: 'Dravik — outils et machines',
    },
    SHIPPED: {
      subject: 'Votre commande {order} est en route',
      message: 'Votre commande est déjà en route vers votre adresse.',
      cta: 'Suivre ma commande',
      signature: 'Dravik — outils et machines',
    },
    DELIVERED: {
      subject: 'Votre commande {order} est arrivée',
      message: 'Votre commande est arrivée à votre adresse. Merci pour l’achat.',
      cta: 'Revoir ma commande',
      signature: 'Dravik — outils et machines',
    },
  },
  de: {
    PREPARING: {
      subject: 'Ihre Bestellung {order} wird vorbereitet',
      message: 'Ihre Bestellung wird beim Lieferanten vorbereitet. Bitte haben Sie etwas Geduld!',
      cta: 'Bestellung verfolgen',
      signature: 'Dravik — Werkzeuge und Maschinen',
    },
    SHIPPED: {
      subject: 'Ihre Bestellung {order} ist unterwegs',
      message: 'Ihre Bestellung ist bereits zu Ihrer Adresse unterwegs.',
      cta: 'Bestellung verfolgen',
      signature: 'Dravik — Werkzeuge und Maschinen',
    },
    DELIVERED: {
      subject: 'Ihre Bestellung {order} ist angekommen',
      message: 'Ihre Bestellung ist an Ihrer Adresse angekommen. Danke für Ihren Einkauf.',
      cta: 'Bestellung ansehen',
      signature: 'Dravik — Werkzeuge und Maschinen',
    },
  },
};

/**
 * Lien direct vers la page de suivi, numéro et e-mail déjà remplis : le
 * client n'a rien à ressaisir depuis son téléphone.
 */
export function trackingUrl(order: Pick<Order, 'orderNumber' | 'email' | 'locale'>): string {
  const base = env.FRONTEND_URL.replace(/\/$/, '');
  const params = new URLSearchParams({ order: order.orderNumber, email: order.email });
  return `${base}/${order.locale}/${TRACKING_PATH[order.locale]}?${params.toString()}`;
}

function body(copy: Copy, order: Pick<Order, 'orderNumber' | 'email' | 'locale'>) {
  const url = trackingUrl(order);
  const text = `${copy.message}\n\n${copy.cta} : ${url}\n\n${order.orderNumber}\n${copy.signature}`;

  const html = `<!doctype html>
<html lang="${order.locale}">
  <body style="margin:0;background:#f4f5f7;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr><td style="background:#0F1115;padding:20px 28px;">
        <span style="color:#FF6A00;font-weight:800;letter-spacing:.18em;font-size:15px;">DRAVIK</span>
      </td></tr>
      <tr><td style="padding:28px;">
        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#0F1115;">${mail.escapeHtml(copy.message)}</p>
        <p style="margin:0 0 24px;">
          <a href="${mail.escapeHtml(url)}" style="display:inline-block;background:#FF6A00;color:#0F1115;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:8px;">${mail.escapeHtml(copy.cta)}</a>
        </p>
        <p style="margin:0;font-size:13px;color:#8A8F98;">
          ${mail.escapeHtml(order.orderNumber)}<br />${mail.escapeHtml(copy.signature)}
        </p>
      </td></tr>
    </table>
  </body>
</html>`;

  return { text, html };
}

export interface NotifyResult {
  stage: DeliveryStage;
  sent: boolean;
  /** Vrai si l'avis était déjà parti : l'étape a été repassée. */
  skipped: boolean;
  error?: string;
}

/**
 * Prévient le client d'un passage d'étape. N'envoie qu'une fois par étape.
 * Ne lève jamais : le résultat dit ce qui s'est passé.
 */
export async function notifyStage(
  order: Pick<Order, 'id' | 'orderNumber' | 'email' | 'locale'>,
  stage: DeliveryStage,
): Promise<NotifyResult> {
  const existing = await prisma.orderNotification.findUnique({
    where: { orderId_stage: { orderId: order.id, stage } },
  });
  if (existing?.sentAt) return { stage, sent: false, skipped: true };

  const copy = COPY[order.locale][stage];
  const { text, html } = body(copy, order);

  let error: string | null = null;
  try {
    await mail.send({
      to: order.email,
      subject: copy.subject.replace('{order}', order.orderNumber),
      text,
      html,
    });
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    logger.warn({ orderNumber: order.orderNumber, stage, err }, 'Avis de suivi non envoyé');
  }

  const data = {
    email: order.email,
    sentAt: error ? null : new Date(),
    error,
    attempts: (existing?.attempts ?? 0) + 1,
  };

  await prisma.orderNotification.upsert({
    where: { orderId_stage: { orderId: order.id, stage } },
    update: data,
    create: { orderId: order.id, stage, ...data },
  });

  return { stage, sent: !error, skipped: false, ...(error ? { error } : {}) };
}

/** Avis en attente, pour que le back-office montre ce qui n'est pas parti. */
export async function pendingNotifications() {
  return prisma.orderNotification.findMany({
    where: { sentAt: null },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: { order: { select: { orderNumber: true } } },
  });
}
