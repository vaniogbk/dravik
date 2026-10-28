import type { Order } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import { ApiError } from '../lib/errors.js';
import * as mail from './mail.service.js';
import * as notify from './order-notify.service.js';

/**
 * Justificatif de virement déposé par le client.
 *
 * C'est le seul signal que la boutique reçoit entre le moment où le client
 * valide sa commande et celui où le virement apparaît sur le relevé : il
 * tient lieu de notification de paiement. D'où le dépôt du fichier, l'avis
 * immédiat à la boutique, et le passage de la commande en préparation.
 *
 * Attention à ce qu'il ne prouve pas : un ordre de virement n'est pas un
 * virement crédité. La commande passe « en préparation », pas « payée » —
 * l'encaissement reste constaté à la main sur le relevé bancaire.
 */

/** Types acceptés. Un justificatif est un PDF ou une photo, rien d'autre. */
export const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export const MAX_BYTES = 10 * 1024 * 1024;

/** Nombre de dépôts gardés par commande : un client peut se tromper de fichier. */
const MAX_PER_ORDER = 5;

const EXTENSION: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

/**
 * Un nom de fichier venu du navigateur ne doit jamais servir tel quel :
 * il peut porter un chemin, des caractères de contrôle, ou une extension
 * qui ment sur le contenu. On le reconstruit à partir de la commande.
 */
function safeFileName(order: Order, contentType: string, index: number): string {
  const ext = EXTENSION[contentType] ?? 'bin';
  const suffix = index > 1 ? `-${index}` : '';
  return `virement-${order.orderNumber}${suffix}.${ext}`;
}

export interface SubmitInput {
  order: Order;
  contentType: string;
  data: Buffer;
  submittedBy: string;
}

export interface SubmitResult {
  fileName: string;
  sizeBytes: number;
  /** La boutique a-t-elle été prévenue. */
  shopNotified: boolean;
  /** Étape de suivi atteinte, et avis au client. */
  stage: notify.NotifyResult | null;
}

export async function submitProof(input: SubmitInput): Promise<SubmitResult> {
  const { order, contentType, data, submittedBy } = input;

  if (!(ACCEPTED_TYPES as readonly string[]).includes(contentType)) {
    throw ApiError.badRequest(
      'Format non accepté. Déposez un PDF ou une photo (JPEG, PNG, WebP, HEIC).',
      'UNSUPPORTED_FILE_TYPE',
    );
  }
  if (data.length === 0) throw ApiError.badRequest('Fichier vide.', 'EMPTY_FILE');
  if (data.length > MAX_BYTES) {
    throw ApiError.badRequest('Fichier trop lourd : 10 Mo au maximum.', 'FILE_TOO_LARGE');
  }
  if (order.paymentMethod !== 'BANK_TRANSFER') {
    throw ApiError.badRequest(
      "Cette commande n'est pas réglée par virement.",
      'NOT_A_TRANSFER',
    );
  }

  const already = await prisma.transferProof.count({ where: { orderId: order.id } });
  if (already >= MAX_PER_ORDER) {
    throw ApiError.badRequest(
      'Vous avez déjà déposé plusieurs justificatifs pour cette commande. Écrivez-nous si celui-ci doit être corrigé.',
      'TOO_MANY_PROOFS',
    );
  }

  const fileName = safeFileName(order, contentType, already + 1);

  const proof = await prisma.transferProof.create({
    data: {
      orderId: order.id,
      fileName,
      contentType,
      sizeBytes: data.length,
      data,
      submittedBy,
    },
    select: { id: true },
  });

  const shopNotified = await notifyShop({ order, fileName, contentType, data, submittedBy });

  if (shopNotified) {
    await prisma.transferProof.update({
      where: { id: proof.id },
      data: { notified: true },
    });
  }

  // Étape 1 du suivi : la commande entre en préparation dès le dépôt.
  // Le statut de paiement, lui, ne bouge pas — rien n'est encore encaissé.
  const stage = await enterPreparation(order);

  logger.info(
    { orderNumber: order.orderNumber, sizeBytes: data.length, shopNotified },
    'Justificatif de virement reçu',
  );

  return { fileName, sizeBytes: data.length, shopNotified, stage };
}

/** Fait passer la commande en préparation et prévient le client, une seule fois. */
async function enterPreparation(order: Order): Promise<notify.NotifyResult | null> {
  // Une commande déjà en route ou livrée ne revient pas en arrière parce
  // qu'un second justificatif arrive.
  if (order.status === 'SHIPPED' || order.status === 'DELIVERED') return null;
  if (order.status === 'CANCELLED' || order.status === 'REFUNDED') return null;

  if (order.status !== 'PREPARING') {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'PREPARING' } });
  }
  return notify.notifyStage(order, 'PREPARING');
}

/**
 * Avis à la boutique, avec le justificatif en pièce jointe.
 *
 * Un échec ne fait pas échouer le dépôt : le fichier est déjà en base et
 * reste consultable depuis le back-office. `notified` dit ce qu'il en est.
 */
async function notifyShop(input: {
  order: Order;
  fileName: string;
  contentType: string;
  data: Buffer;
  submittedBy: string;
}): Promise<boolean> {
  const { order, fileName, contentType, data, submittedBy } = input;
  const amount = (order.totalCents / 100).toFixed(2).replace('.', ',');
  const url = notify.trackingUrl(order);

  if (!mail.enabled() || !env.shopMailbox) {
    logger.warn(
      { orderNumber: order.orderNumber },
      "Justificatif reçu mais aucun avis envoyé : l'envoi d'e-mails n'est pas configuré",
    );
    return false;
  }

  const lines = [
    `Commande : ${order.orderNumber}`,
    `Montant : ${amount} ${order.currency}`,
    `Référence du virement : ${order.bankTransferRef ?? '—'}`,
    `Client : ${order.email}`,
    `Déposé par : ${submittedBy}`,
    '',
    `Suivi : ${url}`,
    '',
    "Un ordre de virement n'est pas un virement crédité : confirmez l'encaissement",
    'depuis le relevé bancaire avant de marquer la commande « En route ».',
  ];

  try {
    await mail.send({
      to: env.shopMailbox,
      replyTo: order.email,
      subject: `Justificatif de virement — ${order.orderNumber} (${amount} ${order.currency})`,
      text: lines.join('\n'),
      html: `<pre style="font:14px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;">${mail.escapeHtml(
        lines.join('\n'),
      )}</pre>`,
      attachments: [{ filename: fileName, content: data, contentType }],
    });
    return true;
  } catch (err) {
    logger.error({ err, orderNumber: order.orderNumber }, "Avis de justificatif non envoyé");
    return false;
  }
}

/** Liste des justificatifs d'une commande, sans les octets. */
export function listProofs(orderId: string) {
  return prisma.transferProof.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      fileName: true,
      contentType: true,
      sizeBytes: true,
      submittedBy: true,
      notified: true,
      createdAt: true,
    },
  });
}

export async function getProofFile(proofId: string) {
  const proof = await prisma.transferProof.findUnique({ where: { id: proofId } });
  if (!proof) throw ApiError.notFound('Justificatif introuvable');
  return proof;
}
