import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL est requis'),

  // Auth
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET doit faire au moins 32 caractères'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET doit faire au moins 32 caractères'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),

  // CORS : liste d'origines séparées par des virgules
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Stripe — optionnel en dev : le paiement carte est désactivé si absent
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Virement SEPA — aucune valeur par défaut.
  //
  // Ces champs portaient un IBAN de démonstration (le FR76 3000 1007 94… de
  // la Banque de France). Un défaut est commode en local, mais en production
  // il affiche de vraies coordonnées fausses à de vrais clients : l'argent
  // part vers un compte de test et personne ne s'en aperçoit avant la
  // réclamation. Vides, le virement est simplement annoncé indisponible
  // jusqu'à ce que les comptes soient saisis depuis le back-office.
  BANK_ACCOUNT_HOLDER: z.string().default(''),
  BANK_IBAN: z.string().default(''),
  BANK_BIC: z.string().default(''),
  BANK_NAME: z.string().default(''),
  BANK_TRANSFER_DUE_DAYS: z.coerce.number().default(7),

  // Compte administrateur créé par le seed
  ADMIN_EMAIL: z.string().email().default('admin@dravik.eu'),
  ADMIN_PASSWORD: z.string().min(8).default('ChangeMoi!2026'),

  // Formulaire de contact → Telegram (optionnel).
  // Sans ces deux valeurs, le formulaire est masqué et l'adresse e-mail
  // affichée à la place : le visiteur a toujours un moyen de vous joindre.
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),

  // Envoi d'e-mails (optionnel) : justificatifs de virement reçus et
  // messages de suivi envoyés au client à chaque étape.
  //
  // N'importe quel SMTP convient. Sans ces valeurs, rien n'est envoyé : les
  // messages sont journalisés en base avec leur motif d'échec, et le
  // back-office le signale. Mieux vaut un envoi qui manque et qui se voit
  // qu'un envoi qu'on croit parti.
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().default(587),
  /** true pour le port 465 (TLS implicite), false pour 587 (STARTTLS). */
  MAIL_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  MAIL_USER: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  /** Expéditeur affiché, ex. « Dravik <contact@exemple.fr> ». */
  MAIL_FROM: z.string().optional(),
  /** Boîte qui reçoit les justificatifs de virement. */
  MAIL_TO_SHOP: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n');
  // eslint-disable-next-line no-console
  console.error(`\nConfiguration invalide (.env) :\n${details}\n`);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isDev: raw.NODE_ENV === 'development',
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  stripeEnabled: Boolean(raw.STRIPE_SECRET_KEY),
  telegramEnabled: Boolean(raw.TELEGRAM_BOT_TOKEN && raw.TELEGRAM_CHAT_ID),
  mailEnabled: Boolean(raw.MAIL_HOST && raw.MAIL_USER && raw.MAIL_PASSWORD && raw.MAIL_FROM),
  /** Boîte de la boutique : MAIL_TO_SHOP, à défaut l'expéditeur. */
  shopMailbox: raw.MAIL_TO_SHOP || raw.MAIL_USER || '',
};

export type Env = typeof env;
