#!/usr/bin/env node
/**
 * Construit le catalogue Dravik à partir de trois sources séparées :
 *
 *   • DRAVIK/catalogue/products.json  — référence, marque, modèle, images
 *   • scripts/dravik-prix.csv         — prix, stock, poids, mise en avant
 *   • scripts/dravik-copy.mjs         — spécifications et accroches FR/DE
 *
 * Et produit backend/prisma/seed-data/products-dravik.ts, plus la copie des
 * visuels dans frontend/public/produits/dravik/.
 *
 * Les trois sources sont distinctes pour que les prix se corrigent sans
 * toucher à la rédaction, et la rédaction sans toucher aux prix.
 *
 * Usage : node scripts/build-dravik-catalogue.mjs [--identite <chemin>]
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COPY } from './dravik-copy.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const flag = args.indexOf('--identite');
const SOURCE = resolve(
  flag >= 0 && args[flag + 1]
    ? args[flag + 1]
    : 'C:/MySTARTUPS/DRAVIK-identite-et-catalogue/DRAVIK',
);

const OUT_TS = resolve(ROOT, 'backend/prisma/seed-data/products-dravik.ts');
const OUT_IMG = resolve(ROOT, 'frontend/public/produits/dravik');

// --------------------------------------------------------------- lecture

function readProducts() {
  return JSON.parse(readFileSync(resolve(SOURCE, 'catalogue/products.json'), 'utf8'));
}

/** Le CSV est séparé par des points-virgules et peut porter un BOM. */
function readPrices() {
  const text = readFileSync(resolve(ROOT, 'scripts/dravik-prix.csv'), 'utf8').replace(/^\uFEFF/, '');
  const [head, ...rows] = text.trim().split(/\r?\n/);
  const cols = head.split(';');
  const out = new Map();
  for (const row of rows) {
    const cells = row.split(';');
    const rec = Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
    out.set(rec.id, {
      priceCents: Math.round(Number(rec.prix_eur) * 100),
      stock: Number(rec.stock),
      weightGrams: Number(rec.poids_g),
      featured: rec.vedette === '1',
    });
  }
  return out;
}

// ------------------------------------------------------------- rédaction

const CATEGORY_LABEL_DE = {
  'outils-de-jardin': 'Gartengeräte',
  accessoires: 'Zubehör',
  'outils-electroportatifs': 'Elektrowerkzeuge',
  machines: 'Maschinen',
};

/** Traduction des familles d'outils, pour le nom allemand du produit. */
const TYPE_DE = {
  'Tronçonneuse thermique': 'Benzin-Kettensäge',
  'Débroussailleuse thermique': 'Benzin-Freischneider',
  'Taille-haie thermique': 'Benzin-Heckenschere',
  'Souffleur sur batterie': 'Akku-Blasgerät',
  'Tondeuse à gazon sur batterie': 'Akku-Rasenmäher',
  'Batterie + chargeur': 'Akku + Ladegerät',
  'Scie plongeante': 'Tauchsäge',
  'Perceuse-visseuse sans fil': 'Akku-Bohrschrauber',
  'Ponceuse excentrique': 'Exzenterschleifer',
  'Aspirateur de chantier': 'Baustellensauger',
  Défonceuse: 'Oberfräse',
  'Rail de guidage 1400 mm': 'Führungsschiene 1400 mm',
  "Système d'affûtage à eau": 'Nassschleifsystem',
  "Meule d'affûtage 250 mm": 'Schleifstein 250 mm',
  'Pâte à affiler': 'Honpaste',
  "AngleMaster (gabarit de mesure d'angle)": 'AngleMaster (Winkellehre)',
  'Gabarit pour couteaux larges': 'Vorrichtung für breite Messer',
  'Pierre de préparation de meule (Stone Grader)': 'Steinabrichter (Stone Grader)',
  'Perceuse-visseuse à percussion 18 V': 'Akku-Schlagbohrschrauber 18 V',
  "Meuleuse d'angle 125 mm": 'Winkelschleifer 125 mm',
  'Scie circulaire 18 V': 'Akku-Handkreissäge 18 V',
  'Scie sauteuse': 'Stichsäge',
  'Perforateur SDS-Plus': 'Bohrhammer SDS-Plus',
  'Souffleur 18 V': 'Akku-Blasgerät 18 V',
  'Perceuse-visseuse 18 V': 'Akku-Bohrschrauber 18 V',
  "Meuleuse d'angle 18 V": 'Akku-Winkelschleifer 18 V',
  'Scie circulaire': 'Handkreissäge',
  Batterie: 'Akku',
  'Scie sabre 18 V': 'Akku-Säbelsäge 18 V',
  'Batterie 18 V 5 Ah': 'Akku 18 V 5 Ah',
  'Débroussailleuse sur batterie': 'Akku-Freischneider',
  'Taille-haie sur batterie': 'Akku-Heckenschere',
  'Robot tondeuse': 'Mähroboter',
  'Tracteur tondeuse': 'Aufsitzmäher',
};

const GUARANTEE_FR =
  '\n\n---\n\nNeuf, sous garantie constructeur. Expédié depuis la France vers la France, la Belgique, l’Allemagne et l’Autriche.';
const GUARANTEE_DE =
  '\n\n---\n\nNeugerät mit Herstellergarantie. Versand aus Frankreich nach Frankreich, Belgien, Deutschland und Österreich.';

function slugify(input) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ßẞ]/g, 'ss')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function body(tagline, specs, guarantee) {
  const lines = specs.map(([k, v]) => `- **${k}** : ${v}`).join('\n');
  return `${tagline}\n\n${lines}${guarantee}`;
}

function bodyDe(tagline, specs) {
  const lines = specs.map(([k, v]) => `- **${k}**: ${v}`).join('\n');
  return `${tagline}\n\n${lines}${GUARANTEE_DE}`;
}

// ------------------------------------------------------------ génération

/**
 * Les descriptions contiennent des sauts de ligne : un littéral à guillemets
 * simples ne peut pas en porter, il faut les échapper.
 */
const q = (s) =>
  `'${String(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n')}'`;
const pairs = (arr) => `[${arr.map(([k, v]) => `[${q(k)}, ${q(v)}]`).join(', ')}]`;

function emit(product, price, copy) {
  const { id, brand, model, type, category, category_label: catFr, slug, images } = product;
  const typeDe = TYPE_DE[type] ?? type;
  const nameFr = `${brand} ${model} — ${type.toLowerCase()}`;
  const nameDe = `${brand} ${model} — ${typeDe}`;

  return `  {
    sku: ${q(id)},
    slug: ${q(slug)},
    categorySlug: ${q(category)},
    brand: ${q(brand)},
    model: ${q(model)},
    condition: 'NEW',
    priceCents: ${price.priceCents},
    vatMode: 'STANDARD',
    vatRateBps: 2000,
    stock: ${price.stock},
    lowStockAlert: 2,
    isUnique: false,
    isFeatured: ${price.featured},
    weightGrams: ${price.weightGrams},
    images: [
      {
        url: '/produits/dravik/${slug}.webp',
        altFr: ${q(`${brand} ${model} — ${type}`)},
        altDe: ${q(`${brand} ${model} — ${typeDe}`)},
      },
    ],
    fr: {
      name: ${q(nameFr)},
      slug: ${q(slug)},
      shortDescription: ${q(copy.fr)},
      description: ${q(body(copy.fr, copy.specs, GUARANTEE_FR))},
      metaTitle: ${q(`${brand} ${model} neuf — ${type} | Dravik`)},
      metaDescription: ${q(`${copy.fr} Neuf, garantie constructeur, livré en France, Belgique, Allemagne et Autriche.`.slice(0, 158))},
    },
    de: {
      name: ${q(nameDe)},
      slug: ${q(slugify(`${brand} ${model} ${typeDe}`))},
      shortDescription: ${q(copy.de)},
      description: ${q(bodyDe(copy.de, copy.specsDe))},
      metaTitle: ${q(`${brand} ${model} neu — ${typeDe} | Dravik`)},
      metaDescription: ${q(`${copy.de} Neugerät mit Herstellergarantie, Lieferung nach DE, AT, FR und BE.`.slice(0, 158))},
    },
    specs: {
      fr: ${pairs(copy.specs)},
      de: ${pairs(copy.specsDe)},
    },
  },`;
}

// ------------------------------------------------------------------ main

const products = readProducts();
const prices = readPrices();

const missing = products.filter((p) => !prices.has(p.id) || !COPY[p.id]);
if (missing.length) {
  console.error(`Données manquantes pour : ${missing.map((p) => p.id).join(', ')}`);
  process.exit(1);
}

mkdirSync(OUT_IMG, { recursive: true });
let copied = 0;
let absent = 0;
for (const p of products) {
  const from = resolve(SOURCE, 'catalogue', p.images.large);
  if (existsSync(from)) {
    copyFileSync(from, resolve(OUT_IMG, `${p.slug}.webp`));
    copied++;
  } else {
    absent++;
    console.warn(`  visuel absent : ${p.id} (${p.slug})`);
  }
}

const blocks = products.map((p) => emit(p, prices.get(p.id), COPY[p.id])).join('\n');

const file = `import type { ProductSeed } from './types.js';

/**
 * Catalogue Dravik : 48 références neuves, huit marques.
 *
 * Fichier GÉNÉRÉ par scripts/build-dravik-catalogue.mjs — ne pas modifier à la
 * main. Les prix se corrigent dans scripts/dravik-prix.csv, la rédaction dans
 * scripts/dravik-copy.mjs, puis on relance le script.
 *
 * ⚠️ Les prix sont des prix de référence relevés sur le marché européen. Ils
 * doivent être confrontés aux conditions d'achat réelles avant l'ouverture.
 */
export const DRAVIK_PRODUCTS: ProductSeed[] = [
${blocks}
];
`;

writeFileSync(OUT_TS, file, 'utf8');

console.log(`${products.length} références écrites dans backend/prisma/seed-data/products-dravik.ts`);
console.log(`${copied} visuels copiés dans frontend/public/produits/dravik/${absent ? ` (${absent} absents)` : ''}`);
const total = [...prices.values()].reduce((s, p) => s + p.priceCents * p.stock, 0);
console.log(`Valeur du stock : ${(total / 100).toLocaleString('fr-FR')} €`);
