import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { ApiError } from '../lib/errors.js';
import * as mail from './mail.service.js';

/**
 * Formulaire de contact → boîte de la boutique.
 *
 * Les demandes arrivent dans la boîte où on y répond, et répondre se fait
 * d'un clic grâce à `replyTo`.
 *
 * Sans configuration SMTP, le formulaire est masqué et l'adresse e-mail
 * affichée à la place : le visiteur a toujours un moyen de joindre la
 * boutique.
 */

export interface ContactMessage {
  name: string;
  email: string;
  orderNumber?: string;
  subject: string;
  message: string;
  locale: 'fr' | 'de';
}

/** Le formulaire ne s'affiche que si la boutique peut recevoir les messages. */
export const contactEnabled = () => mail.enabled() && Boolean(env.shopMailbox);

function body(input: ContactMessage): { text: string; html: string } {
  const lines = [
    `De : ${input.name} <${input.email}>`,
    `Langue : ${input.locale === 'de' ? 'allemand' : 'français'}`,
    ...(input.orderNumber ? [`Commande : ${input.orderNumber}`] : []),
    `Sujet : ${input.subject}`,
    '',
    input.message,
  ];

  const text = lines.join('\n');
  const html = `<pre style="font:14px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;">${mail.escapeHtml(
    text,
  )}</pre>`;

  return { text, html };
}

export async function sendContactMessage(input: ContactMessage): Promise<void> {
  if (!contactEnabled()) {
    throw new ApiError(
      503,
      'CONTACT_NOT_CONFIGURED',
      "Le formulaire n'est pas disponible pour le moment. Écrivez-nous par e-mail.",
    );
  }

  const { text, html } = body(input);

  try {
    await mail.send({
      to: env.shopMailbox,
      // Répondre au message répond au visiteur, pas à la boutique.
      replyTo: `${input.name} <${input.email}>`,
      subject: input.orderNumber
        ? `Contact — ${input.subject} (${input.orderNumber})`
        : `Contact — ${input.subject}`,
      text,
      html,
    });
  } catch (err) {
    // Le détail de l'échec SMTP (identifiants, quota, destinataire refusé)
    // est journalisé, jamais renvoyé au visiteur.
    logger.error({ err, from: input.email }, 'Message de contact non transmis');
    throw new ApiError(
      502,
      'CONTACT_DELIVERY_FAILED',
      "Votre message n'a pas pu être transmis. Réessayez, ou écrivez-nous par e-mail.",
    );
  }

  logger.info({ from: input.email }, 'Message de contact transmis');
}
