/**
 * Publie une référence du catalogue généré via l'API d'administration.
 *
 * Le seed complet (`SEED_FORCE=1` + redéploiement) réapplique les prix et les
 * stocks des quarante-neuf références. Pour en ajouter une seule, c'est une
 * massue : il réécrirait aussi les stocks des autres, sans tenir compte des
 * commandes déjà passées. Ce script ne touche qu'une référence, par les
 * mêmes routes que le back-office.
 *
 * Usage :
 *   API_URL=https://… ADMIN_EMAIL=… ADMIN_PASSWORD=… \
 *     npx tsx prisma/publier-reference.ts DRV-049
 *
 * Idempotent : relancé, il met la référence à jour au lieu d'en créer une
 * seconde.
 */
import { DRAVIK_PRODUCTS } from './seed-data/products-dravik.js';

const sku = process.argv[2];
if (!sku) {
  console.error('Usage : npx tsx prisma/publier-reference.ts <SKU>');
  process.exit(1);
}

const API = (process.env.API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('ADMIN_EMAIL et ADMIN_PASSWORD sont requis.');
  process.exit(1);
}

const seed = DRAVIK_PRODUCTS.find((p) => p.sku === sku);
if (!seed) {
  console.error(`Référence ${sku} absente du catalogue généré.`);
  process.exit(1);
}

async function call<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...rest } = init;
  const response = await fetch(`${API}${path}`, {
    ...rest,
    headers: {
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(
      `${init.method ?? 'GET'} ${path} → ${response.status} ${JSON.stringify(payload)}`,
    );
  }
  return payload as T;
}

const { accessToken } = await call<{ accessToken: string }>('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
console.log(`  ✔ Connecté : ${EMAIL}`);

const { categories } = await call<{
  categories: Array<{ id: string; slug: string }>;
}>('/api/admin/categories', { token: accessToken });

const category = categories.find((c) => c.slug === seed.categorySlug);
if (!category) throw new Error(`Catégorie inconnue : ${seed.categorySlug}`);

const payload = {
  sku: seed.sku,
  slug: seed.slug,
  categoryId: category.id,
  brand: seed.brand,
  model: seed.model,
  condition: seed.condition,
  priceCents: seed.priceCents,
  vatMode: seed.vatMode ?? 'STANDARD',
  vatRateBps: seed.vatRateBps ?? 2000,
  stock: seed.stock,
  lowStockAlert: seed.lowStockAlert ?? 1,
  weightGrams: seed.weightGrams,
  status: 'PUBLISHED' as const,
  isFeatured: seed.isFeatured ?? false,
  isUnique: seed.isUnique ?? false,
  translations: (['fr', 'de'] as const).map((locale) => ({
    locale,
    name: seed[locale].name,
    slug: seed[locale].slug,
    shortDescription: seed[locale].shortDescription,
    description: seed[locale].description,
    metaTitle: seed[locale].metaTitle,
    metaDescription: seed[locale].metaDescription,
  })),
  images: seed.images.map((img, i) => ({
    url: img.url,
    altFr: img.altFr,
    altDe: img.altDe,
    position: i,
  })),
  specs: (['fr', 'de'] as const).flatMap((locale) =>
    seed.specs[locale].map(([label, value], i) => ({ locale, label, value, position: i })),
  ),
};

// Déjà présente ? On met à jour plutôt que de se heurter au SKU unique.
const { items } = await call<{ items: Array<{ id: string; sku: string }> }>(
  `/api/admin/products?q=${encodeURIComponent(sku)}&perPage=5`,
  { token: accessToken },
);
const existing = items.find((p) => p.sku === sku);

// La mise à jour ne porte pas le stock : l'inventaire se gère depuis le
// back-office, et l'écraser avec la valeur du dépôt effacerait les
// réservations des commandes déjà passées.
const { stock: _stock, ...patchPayload } = payload;

const result = existing
  ? await call<{ product: { id: string } }>(`/api/admin/products/${existing.id}`, {
      method: 'PATCH',
      token: accessToken,
      body: JSON.stringify(patchPayload),
    })
  : await call<{ product: { id: string } }>('/api/admin/products', {
      method: 'POST',
      token: accessToken,
      body: JSON.stringify(payload),
    });

console.log(
  `  ✔ ${existing ? 'Mise à jour' : 'Création'} : ${seed.sku} — ${seed.fr.name} ` +
    `(${(seed.priceCents / 100).toLocaleString('fr-FR')} €, stock ${seed.stock})`,
);
console.log(`    id ${result.product.id}`);
