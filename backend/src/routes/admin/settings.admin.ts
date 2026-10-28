import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../../middleware/validate.js';
import { requireRole } from '../../middleware/auth.js';
import * as settings from '../../services/settings.service.js';

export const adminSettingsRouter = Router();

/** Les comptes destinataires sont visibles par le staff, modifiables par l'admin seul. */
adminSettingsRouter.get(
  '/bank',
  asyncHandler(async (_req, res) => {
    const stored = await settings.getBankSettings();
    res.json({ ...stored, servedCountries: settings.SERVED_COUNTRIES });
  }),
);

const accountSchema = z.object({
  id: z.string().trim().max(40).default(''),
  label: z.string().trim().min(2, 'Donnez un intitulé à ce compte').max(60),
  holder: z.string().trim().min(2, 'Indiquez le titulaire du compte').max(70),
  // La longueur et la clé de contrôle sont revalidées dans le service.
  iban: z.string().trim().min(15).max(42),
  bic: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'BIC invalide (8 ou 11 caractères)'),
  bankName: z.string().trim().min(2).max(120),
  countries: z
    .array(z.enum(settings.SERVED_COUNTRIES))
    .min(1, 'Choisissez au moins un pays servi par ce compte'),
  active: z.boolean().default(true),
});

/**
 * Changer un compte destinataire est l'opération la plus sensible du
 * back-office : elle est réservée aux administrateurs, jamais au staff.
 */
adminSettingsRouter.put(
  '/bank',
  requireRole('ADMIN'),
  validate(accountSchema),
  asyncHandler(async (req, res) => {
    const stored = await settings.saveBankAccount(
      req.body as z.infer<typeof accountSchema>,
      req.auth!.sub,
    );
    res.json({ ...stored, servedCountries: settings.SERVED_COUNTRIES });
  }),
);

adminSettingsRouter.delete(
  '/bank/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const stored = await settings.deleteBankAccount(req.params.id!, req.auth!.sub);
    res.json({ ...stored, servedCountries: settings.SERVED_COUNTRIES });
  }),
);

const dueDaysSchema = z.object({ dueDays: z.number().int().min(1).max(30) });

adminSettingsRouter.put(
  '/bank-due-days',
  requireRole('ADMIN'),
  validate(dueDaysSchema),
  asyncHandler(async (req, res) => {
    const stored = await settings.setDueDays((req.body as { dueDays: number }).dueDays, req.auth!.sub);
    res.json({ ...stored, servedCountries: settings.SERVED_COUNTRIES });
  }),
);

/** Revient aux valeurs du fichier d'environnement. */
adminSettingsRouter.delete(
  '/bank',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const stored = await settings.resetBankAccounts(req.auth!.sub);
    res.json({ ...stored, servedCountries: settings.SERVED_COUNTRIES });
  }),
);
