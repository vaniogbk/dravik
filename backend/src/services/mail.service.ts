import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

/**
 * Envoi d'e-mails par SMTP.
 *
 * Canal unique de la boutique : formulaire de contact, justificatif de
 * virement reçu avec sa pièce jointe, et messages de suivi envoyés au
 * client à chaque étape.
 *
 * Sans configuration SMTP, `enabled` vaut false et rien n'est envoyé.
 * L'appelant est tenu d'en faire état plutôt que de laisser croire à un
 * envoi réussi : voir OrderNotification, qui garde la trace de l'échec.
 */

let transport: Transporter | null = null;

function getTransport(): Transporter {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_SECURE,
      auth: { user: env.MAIL_USER!, pass: env.MAIL_PASSWORD! },
      // Un SMTP lent ne doit pas tenir une requête HTTP ouverte indéfiniment.
      connectionTimeout: 15_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return transport;
}

export const enabled = () => env.mailEnabled;

export interface Attachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  attachments?: Attachment[];
}

export class MailDisabledError extends Error {
  constructor() {
    super(
      "L'envoi d'e-mails n'est pas configuré (MAIL_HOST, MAIL_USER, MAIL_PASSWORD, MAIL_FROM).",
    );
    this.name = 'MailDisabledError';
  }
}

/**
 * Envoie un message. Lève si le SMTP n'est pas configuré ou refuse :
 * c'est à l'appelant de décider quoi faire d'un échec, pas à cette couche
 * de l'avaler en silence.
 */
export async function send(mail: Mail): Promise<void> {
  if (!env.mailEnabled) throw new MailDisabledError();

  await getTransport().sendMail({
    from: env.MAIL_FROM,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    replyTo: mail.replyTo,
    attachments: mail.attachments,
  });

  // L'objet suffit à retrouver l'envoi ; le corps peut contenir l'adresse et
  // le détail de la commande, qui n'ont rien à faire dans les journaux.
  logger.info({ to: mail.to, subject: mail.subject }, 'E-mail envoyé');
}

/** Échappement minimal pour composer un corps HTML sans moteur de gabarit. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
