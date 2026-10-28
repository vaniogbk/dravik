import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { isValidIban, normalizeIban } from './sepa-qr.service.js';

/**
 * Réglages modifiables depuis le back-office, stockés en base.
 *
 * Dravik encaisse sur plusieurs comptes : un compte français pour la France et
 * la Belgique, un compte allemand pour l'Allemagne et l'Autriche. Un acheteur
 * autrichien qui vire sur un IBAN français paie des frais et attend plus
 * longtemps ; servir le bon compte selon le pays de livraison supprime les
 * deux.
 *
 * Le stockage passe par la table `Setting` plutôt que par une table dédiée :
 * la liste tient en quelques lignes, elle se modifie uniquement depuis
 * l'administration, et cela évite une migration pour une donnée de
 * configuration. Le `.env` ne sert plus que de valeur de départ.
 */

const BANK_ACCOUNTS_KEY = 'bank_accounts';

/** Marchés desservis. Un compte ne peut couvrir que ces pays. */
export const SERVED_COUNTRIES = ['FR', 'BE', 'DE', 'AT'] as const;
export type ServedCountry = (typeof SERVED_COUNTRIES)[number];

export interface BankAccount {
  id: string;
  /** Intitulé affiché dans l'administration, jamais au client. */
  label: string;
  holder: string;
  iban: string;
  bic: string;
  bankName: string;
  /** Pays de livraison servis par ce compte. */
  countries: ServedCountry[];
  active: boolean;
}

export interface BankSettings {
  accounts: BankAccount[];
  /** Délai laissé au client pour régler, en jours. */
  dueDays: number;
}

export interface StoredBankSettings extends BankSettings {
  /** D'où vient la valeur servie : le formulaire, ou le `.env` de départ. */
  source: 'database' | 'env';
  updatedAt: Date | null;
}

/**
 * Compte de secours issu du `.env`, utilisé tant que rien n'a été saisi dans
 * l'administration. Il ne porte aucun pays : il sert tous les marchés par
 * défaut, faute de mieux.
 */
function fromEnv(): BankSettings {
  const configured = Boolean(env.BANK_IBAN && env.BANK_ACCOUNT_HOLDER);
  return {
    accounts: configured
      ? [
          {
            id: 'env',
            label: 'Compte par défaut (.env)',
            holder: env.BANK_ACCOUNT_HOLDER,
            iban: env.BANK_IBAN,
            bic: env.BANK_BIC,
            bankName: env.BANK_NAME,
            countries: [...SERVED_COUNTRIES],
            active: true,
          },
        ]
      : [],
    dueDays: env.BANK_TRANSFER_DUE_DAYS,
  };
}

function sanitize(raw: unknown): BankAccount | null {
  const a = raw as Partial<BankAccount> | null;
  if (!a || typeof a.iban !== 'string' || !a.iban.trim()) return null;

  const countries = Array.isArray(a.countries)
    ? (a.countries.filter((c): c is ServedCountry =>
        (SERVED_COUNTRIES as readonly string[]).includes(c),
      ) as ServedCountry[])
    : [];

  return {
    id: String(a.id ?? '').trim() || normalizeIban(a.iban).slice(-6),
    label: String(a.label ?? '').trim() || 'Compte',
    holder: String(a.holder ?? '').trim(),
    iban: normalizeIban(a.iban),
    bic: String(a.bic ?? '').trim().toUpperCase(),
    bankName: String(a.bankName ?? '').trim(),
    countries,
    active: a.active !== false,
  };
}

/**
 * Réglages bancaires en vigueur.
 * Lu à chaque génération d'instructions de virement : une modification
 * s'applique sans redémarrage.
 */
export async function getBankSettings(): Promise<StoredBankSettings> {
  const setting = await prisma.setting.findUnique({ where: { key: BANK_ACCOUNTS_KEY } });
  if (!setting) return { ...fromEnv(), source: 'env', updatedAt: null };

  const stored = setting.value as unknown as Partial<BankSettings>;
  const accounts = Array.isArray(stored.accounts)
    ? stored.accounts.map(sanitize).filter((a): a is BankAccount => a !== null)
    : [];

  // Une liste vidée depuis l'administration retombe sur le `.env` plutôt que
  // de rendre le virement indisponible sans prévenir.
  if (accounts.length === 0) return { ...fromEnv(), source: 'env', updatedAt: setting.updatedAt };

  return {
    accounts,
    dueDays: stored.dueDays ?? env.BANK_TRANSFER_DUE_DAYS,
    source: 'database',
    updatedAt: setting.updatedAt,
  };
}

/**
 * Compte à présenter pour un pays de livraison donné.
 *
 * Priorité au compte qui déclare ce pays ; à défaut, le premier compte actif,
 * pour qu'une configuration incomplète n'empêche jamais une commande d'aboutir.
 */
export async function resolveReceivingAccount(country: string): Promise<BankAccount | null> {
  const { accounts } = await getBankSettings();
  const active = accounts.filter((a) => a.active);
  if (active.length === 0) return null;

  const code = country.trim().toUpperCase();
  return active.find((a) => a.countries.includes(code as ServedCountry)) ?? active[0] ?? null;
}

/** Le virement n'est proposé que si un compte peut effectivement recevoir. */
export async function bankTransferAvailable(): Promise<boolean> {
  const { accounts } = await getBankSettings();
  return accounts.some((a) => a.active && a.iban);
}

/**
 * Prisma type le champ `value` en JSON brut et refuse une interface nommée.
 * La conversion est isolée ici pour qu'elle ne se disperse pas dans le fichier.
 */
function asJson(value: BankSettings): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

function assertIban(iban: string): string {
  const normalized = normalizeIban(iban);
  // Un IBAN erroné enverrait l'argent des clients ailleurs, sans message
  // d'erreur pour eux : la clé de contrôle est vérifiée avant enregistrement.
  if (!isValidIban(normalized)) {
    throw ApiError.badRequest(
      'Cet IBAN est invalide : sa clé de contrôle ne correspond pas. Vérifiez la saisie.',
      'INVALID_IBAN',
    );
  }
  return normalized;
}

/** Ajoute ou remplace un compte, identifié par son `id`. */
export async function saveBankAccount(
  input: Omit<BankAccount, 'iban'> & { iban: string },
  userId: string,
): Promise<StoredBankSettings> {
  const iban = assertIban(input.iban);
  const current = await getBankSettings();

  const account: BankAccount = {
    id: input.id.trim() || iban.slice(-6),
    label: input.label.trim() || 'Compte',
    holder: input.holder.trim(),
    iban,
    bic: input.bic.trim().toUpperCase(),
    bankName: input.bankName.trim(),
    countries: input.countries.filter((c) =>
      (SERVED_COUNTRIES as readonly string[]).includes(c),
    ),
    active: input.active,
  };

  // Un pays ne peut être servi que par un compte : sinon le choix deviendrait
  // dépendant de l'ordre de la liste, donc imprévisible.
  const others = current.accounts
    .filter((a) => a.id !== account.id && a.id !== 'env')
    .map((a) =>
      account.active
        ? { ...a, countries: a.countries.filter((c) => !account.countries.includes(c)) }
        : a,
    );

  const accounts = [...others, account];
  const value = { accounts, dueDays: current.dueDays };

  const setting = await prisma.setting.upsert({
    where: { key: BANK_ACCOUNTS_KEY },
    update: { value: asJson(value) },
    create: { key: BANK_ACCOUNTS_KEY, value: asJson(value) },
  });

  // Trace explicite : un changement de compte destinataire est l'opération la
  // plus sensible du back-office. L'IBAN n'est jamais journalisé en entier.
  logger.warn(
    {
      userId,
      id: account.id,
      iban: `${iban.slice(0, 8)}…${iban.slice(-4)}`,
      holder: account.holder,
      countries: account.countries,
    },
    'Compte bancaire destinataire enregistré',
  );

  return { accounts, dueDays: current.dueDays, source: 'database', updatedAt: setting.updatedAt };
}

export async function deleteBankAccount(id: string, userId: string): Promise<StoredBankSettings> {
  const current = await getBankSettings();
  const accounts = current.accounts.filter((a) => a.id !== id);
  const value = { accounts, dueDays: current.dueDays };

  const setting = await prisma.setting.upsert({
    where: { key: BANK_ACCOUNTS_KEY },
    update: { value: asJson(value) },
    create: { key: BANK_ACCOUNTS_KEY, value: asJson(value) },
  });

  logger.warn({ userId, id }, 'Compte bancaire destinataire supprimé');
  return { ...(await getBankSettings()), updatedAt: setting.updatedAt };
}

/** Change le délai de règlement, sans toucher aux comptes. */
export async function setDueDays(dueDays: number, userId: string): Promise<StoredBankSettings> {
  const current = await getBankSettings();
  const value = { accounts: current.accounts, dueDays };

  await prisma.setting.upsert({
    where: { key: BANK_ACCOUNTS_KEY },
    update: { value: asJson(value) },
    create: { key: BANK_ACCOUNTS_KEY, value: asJson(value) },
  });

  logger.info({ userId, dueDays }, 'Délai de règlement modifié');
  return getBankSettings();
}

/** Repasse sur les valeurs du `.env`, en supprimant la surcharge en base. */
export async function resetBankAccounts(userId: string): Promise<StoredBankSettings> {
  await prisma.setting.deleteMany({ where: { key: BANK_ACCOUNTS_KEY } });
  logger.warn({ userId }, 'Comptes bancaires réinitialisés sur les variables d’environnement');
  return { ...fromEnv(), source: 'env', updatedAt: null };
}
