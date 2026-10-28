import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../../middleware/validate.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../lib/errors.js';
import * as orderService from '../../services/order.service.js';
import * as paymentService from '../../services/payment.service.js';
import * as proofService from '../../services/proof.service.js';
import * as notifyService from '../../services/order-notify.service.js';
import { buildTrackingUrl } from '../../services/shipping.service.js';

export const adminOrdersRouter = Router();

adminOrdersRouter.get(
  '/',
  validate(
    z.object({
      q: z.string().max(120).optional(),
      status: z
        .enum(['PENDING_PAYMENT', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
        .optional(),
      paymentMethod: z.enum(['CARD', 'BANK_TRANSFER']).optional(),
      paymentStatus: z
        .enum(['PENDING', 'AWAITING_TRANSFER', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELLED'])
        .optional(),
      page: z.coerce.number().int().min(1).default(1),
      perPage: z.coerce.number().int().min(1).max(100).default(25),
    }),
    'query',
  ),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as Record<string, string | number | undefined>;

    const where = {
      ...(q.status ? { status: q.status as never } : {}),
      ...(q.paymentMethod ? { paymentMethod: q.paymentMethod as never } : {}),
      ...(q.paymentStatus ? { paymentStatus: q.paymentStatus as never } : {}),
      ...(q.q
        ? {
            OR: [
              { orderNumber: { contains: String(q.q), mode: 'insensitive' as const } },
              { email: { contains: String(q.q), mode: 'insensitive' as const } },
              { bankTransferRef: { contains: String(q.q), mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const page = Number(q.page ?? 1);
    const perPage = Number(q.perPage ?? 25);

    const [total, items] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          items: true,
          shipments: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          // La liste doit montrer d'un coup d'œil qui a déposé son
          // justificatif : c'est le signal qui déclenche la vérification.
          // Les identifiants viennent avec, pour que l'ouverture du fichier
          // ne demande pas un second aller-retour.
          transferProofs: {
            orderBy: { createdAt: 'desc' as const },
            select: { id: true, fileName: true, contentType: true, createdAt: true },
          },
          notifications: { select: { stage: true, sentAt: true, error: true } },
        },
      }),
    ]);

    res.json({
      items,
      pagination: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
    });
  }),
);

adminOrdersRouter.get(
  '/:orderNumber',
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: {
        items: { include: { product: { select: { id: true, slug: true, sku: true } } } },
        shipments: { orderBy: { createdAt: 'desc' } },
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        stockMovements: true,
      },
    });
    if (!order) throw ApiError.notFound('Commande introuvable');

    res.json({
      order,
      proofs: await proofService.listProofs(order.id),
      payment:
        order.paymentMethod === 'BANK_TRANSFER'
          ? await paymentService.bankTransferInstructions(order)
          : null,
    });
  }),
);

/** Encaissement manuel d'un virement SEPA constaté sur le relevé bancaire. */
adminOrdersRouter.post(
  '/:id/confirm-transfer',
  validate(z.object({ note: z.string().max(300).optional() })),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw ApiError.notFound('Commande introuvable');
    if (order.paymentMethod !== 'BANK_TRANSFER') {
      throw ApiError.badRequest("Cette commande n'est pas réglée par virement.", 'NOT_A_TRANSFER');
    }

    const updated = await orderService.markPaid(order.id, { userId: req.auth!.sub });
    if (req.body.note) {
      await prisma.order.update({
        where: { id: order.id },
        data: { internalNote: [order.internalNote, req.body.note].filter(Boolean).join('\n') },
      });
    }
    res.json({ order: updated });
  }),
);

/**
 * Les trois étapes montrées au client : en préparation, en route, livrée.
 *
 * Le changement d'étape déclenche l'avis au client. Un avis qui n'est pas
 * parti ne bloque pas l'étape : la commande avance, et `notified` dit ce
 * qu'il en est, commande par commande.
 */
const stageSchema = z.enum(['PREPARING', 'SHIPPED', 'DELIVERED']);

async function applyStage(orderId: string, stage: z.infer<typeof stageSchema>) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: stage,
      ...(stage === 'DELIVERED'
        ? {
            shipments: {
              updateMany: { where: {}, data: { status: 'DELIVERED', deliveredAt: new Date() } },
            },
          }
        : {}),
      ...(stage === 'SHIPPED'
        ? {
            shipments: {
              updateMany: {
                where: { shippedAt: null },
                data: { status: 'IN_TRANSIT', shippedAt: new Date() },
              },
            },
          }
        : {}),
    },
    include: { shipments: true },
  });

  const notified = await notifyService.notifyStage(order, stage);
  return { order, notified };
}

adminOrdersRouter.post(
  '/:id/status',
  validate(z.object({ status: stageSchema })),
  asyncHandler(async (req, res) => {
    res.json(await applyStage(req.params.id, req.body.status));
  }),
);

/** Même chose sur une sélection : le cas courant au retour du relevé bancaire. */
adminOrdersRouter.post(
  '/bulk-status',
  validate(
    z.object({
      orderIds: z.array(z.string().min(1)).min(1).max(100),
      status: stageSchema,
    }),
  ),
  asyncHandler(async (req, res) => {
    const { orderIds, status } = req.body as {
      orderIds: string[];
      status: z.infer<typeof stageSchema>;
    };

    // Séquentiel et non en parallèle : cent envois SMTP simultanés feraient
    // tomber la connexion, et l'ordre du journal resterait illisible.
    const results = [];
    for (const id of orderIds) {
      try {
        const { order, notified } = await applyStage(id, status);
        results.push({
          id,
          orderNumber: order.orderNumber,
          ok: true,
          emailSent: notified.sent,
          emailSkipped: notified.skipped,
          emailError: notified.error ?? null,
        });
      } catch (err) {
        results.push({
          id,
          ok: false,
          error: err instanceof Error ? err.message : 'Échec',
        });
      }
    }

    res.json({
      status,
      updated: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      emailsSent: results.filter((r) => r.ok && r.emailSent).length,
      results,
    });
  }),
);

/** Justificatif de virement, servi tel qu'il a été déposé. */
adminOrdersRouter.get(
  '/:id/proofs/:proofId',
  asyncHandler(async (req, res) => {
    const proof = await proofService.getProofFile(req.params.proofId);
    if (proof.orderId !== req.params.id) throw ApiError.notFound('Justificatif introuvable');

    res.setHeader('Content-Type', proof.contentType);
    // `inline` : un PDF ou une photo s'ouvre dans l'onglet, sans téléchargement.
    res.setHeader('Content-Disposition', `inline; filename="${proof.fileName}"`);
    res.setHeader('Content-Length', String(proof.sizeBytes));
    res.send(Buffer.from(proof.data));
  }),
);

/** Avis de suivi restés en souffrance, pour que l'échec ne passe pas inaperçu. */
adminOrdersRouter.get(
  '/notifications/pending',
  asyncHandler(async (_req, res) => {
    res.json({ items: await notifyService.pendingNotifications() });
  }),
);

adminOrdersRouter.post(
  '/:id/ship',
  validate(
    z.object({
      carrier: z.enum(['DPD', 'DHL', 'Chronopost', 'GLS', 'Schenker']),
      trackingNumber: z.string().max(80).optional(),
      weightGrams: z.number().int().min(0).optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const order = await orderService.shipOrder({
      orderId: req.params.id,
      carrier: req.body.carrier,
      trackingNumber: req.body.trackingNumber,
      weightGrams: req.body.weightGrams,
      userId: req.auth!.sub,
    });
    res.json({ order });
  }),
);

adminOrdersRouter.patch(
  '/:id/shipments/:shipmentId',
  validate(
    z.object({
      status: z
        .enum(['PREPARING', 'HANDED_OVER', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'LOST'])
        .optional(),
      trackingNumber: z.string().max(80).optional(),
      carrier: z.enum(['DPD', 'DHL', 'Chronopost', 'GLS', 'Schenker']).optional(),
      estimatedAt: z.coerce.date().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const existing = await prisma.shipment.findUnique({ where: { id: req.params.shipmentId } });
    if (!existing || existing.orderId !== req.params.id) {
      throw ApiError.notFound('Expédition introuvable');
    }

    const carrier = req.body.carrier ?? existing.carrier;
    const trackingNumber = req.body.trackingNumber ?? existing.trackingNumber;

    const shipment = await prisma.shipment.update({
      where: { id: req.params.shipmentId },
      data: {
        ...req.body,
        trackingUrl: trackingNumber ? buildTrackingUrl(carrier, trackingNumber) : null,
        ...(req.body.status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
      },
    });

    if (req.body.status === 'DELIVERED') {
      await prisma.order.update({ where: { id: req.params.id }, data: { status: 'DELIVERED' } });
    }

    res.json({ shipment });
  }),
);

adminOrdersRouter.post(
  '/:id/cancel',
  validate(z.object({ reason: z.string().min(1).max(300) })),
  asyncHandler(async (req, res) => {
    const order = await orderService.cancelOrder(req.params.id, req.body.reason, req.auth!.sub);
    res.json({ order });
  }),
);

adminOrdersRouter.post(
  '/:id/refund',
  validate(z.object({ amountCents: z.number().int().min(1).optional() })),
  asyncHandler(async (req, res) => {
    res.json(await paymentService.refundOrder(req.params.id, req.body.amountCents));
  }),
);

adminOrdersRouter.patch(
  '/:id/note',
  validate(z.object({ internalNote: z.string().max(5000) })),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { internalNote: req.body.internalNote },
    });
    res.json({ order });
  }),
);
