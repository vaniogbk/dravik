export interface CategorySeed {
  slug: string;
  position: number;
  icon: string;
  fr: { name: string; slug: string; description: string; metaTitle: string; metaDescription: string };
  de: { name: string; slug: string; description: string; metaTitle: string; metaDescription: string };
}

/**
 * Quatre familles, alignées sur le catalogue Dravik.
 *
 * Les slugs techniques reprennent ceux du fichier d'identité
 * (DRAVIK/catalogue/products.json) pour que le rapprochement reste direct ;
 * les slugs d'URL sont localisés pour le référencement de chaque marché.
 */
export const CATEGORIES: CategorySeed[] = [
  {
    slug: 'outils-electroportatifs',
    position: 1,
    icon: 'power-tool',
    fr: {
      name: 'Outils électroportatifs',
      slug: 'outils-electroportatifs',
      description:
        'Perceuses, meuleuses, scies et perforateurs des grandes marques professionnelles. Machines nues ou complètes, toutes neuves et sous garantie constructeur.',
      metaTitle: 'Outils électroportatifs professionnels — Bosch, Makita, DeWalt, Metabo, Festool',
      metaDescription:
        'Perceuses-visseuses, meuleuses, scies circulaires et perforateurs neufs. Marques professionnelles, garantie constructeur, livraison France, Belgique, Allemagne et Autriche.',
    },
    de: {
      name: 'Elektrowerkzeuge',
      slug: 'elektrowerkzeuge',
      description:
        'Bohrschrauber, Winkelschleifer, Sägen und Bohrhämmer namhafter Profimarken. Als Solo-Gerät oder komplett, alle neu und mit Herstellergarantie.',
      metaTitle: 'Profi-Elektrowerkzeuge — Bosch, Makita, DeWalt, Metabo, Festool',
      metaDescription:
        'Akku-Bohrschrauber, Winkelschleifer, Handkreissägen und Bohrhämmer, neu. Profimarken, Herstellergarantie, Lieferung nach DE, AT, FR und BE.',
    },
  },
  {
    slug: 'outils-de-jardin',
    position: 2,
    icon: 'garden',
    fr: {
      name: 'Outils de jardin',
      slug: 'outils-de-jardin',
      description:
        'Tronçonneuses, débroussailleuses, taille-haies, souffleurs et tondeuses. Thermique pour la puissance continue, batterie pour le silence et le démarrage immédiat.',
      metaTitle: 'Outils de jardin thermiques et à batterie — STIHL, Husqvarna, Makita',
      metaDescription:
        'Tronçonneuses, débroussailleuses, taille-haies et tondeuses neufs. STIHL et Husqvarna, garantie constructeur, livraison en France, Belgique, Allemagne et Autriche.',
    },
    de: {
      name: 'Gartengeräte',
      slug: 'gartengeraete',
      description:
        'Kettensägen, Freischneider, Heckenscheren, Blasgeräte und Rasenmäher. Benzin für Dauerleistung, Akku für leises Arbeiten und sofortigen Start.',
      metaTitle: 'Gartengeräte mit Benzin- und Akkuantrieb — STIHL, Husqvarna, Makita',
      metaDescription:
        'Kettensägen, Freischneider, Heckenscheren und Rasenmäher, neu. STIHL und Husqvarna, Herstellergarantie, Lieferung nach DE, AT, FR und BE.',
    },
  },
  {
    slug: 'machines',
    position: 3,
    icon: 'machine',
    fr: {
      name: "Machines d'atelier",
      slug: 'machines-atelier',
      description:
        "Aspirateurs de chantier et systèmes d'affûtage. Les machines qui restent à l'atelier et servent à toutes les autres.",
      metaTitle: "Machines d'atelier — aspirateurs de chantier et affûtage",
      metaDescription:
        "Aspirateurs de chantier Festool, Bosch, DeWalt, Metabo et systèmes d'affûtage Tormek. Neufs, garantie constructeur, livraison en Europe de l'Ouest.",
    },
    de: {
      name: 'Werkstattmaschinen',
      slug: 'werkstattmaschinen',
      description:
        'Baustellensauger und Schleifsysteme. Die Maschinen, die in der Werkstatt bleiben und allen anderen dienen.',
      metaTitle: 'Werkstattmaschinen — Baustellensauger und Schleifsysteme',
      metaDescription:
        'Baustellensauger von Festool, Bosch, DeWalt und Metabo sowie Tormek-Schleifsysteme. Neu, Herstellergarantie, Lieferung in Westeuropa.',
    },
  },
  {
    slug: 'accessoires',
    position: 4,
    icon: 'accessories',
    fr: {
      name: 'Accessoires et batteries',
      slug: 'accessoires-batteries',
      description:
        "Batteries, chargeurs, rails de guidage, meules et gabarits d'affûtage. Les consommables et compléments qui font durer les machines.",
      metaTitle: 'Batteries, chargeurs et accessoires professionnels',
      metaDescription:
        "Batteries 18 V, chargeurs, rails de guidage Festool, meules et gabarits Tormek. Pièces d'origine, livraison en France, Belgique, Allemagne et Autriche.",
    },
    de: {
      name: 'Zubehör und Akkus',
      slug: 'zubehoer-akkus',
      description:
        'Akkus, Ladegeräte, Führungsschienen, Schleifsteine und Schärfvorrichtungen. Das Verbrauchsmaterial, das Maschinen am Leben hält.',
      metaTitle: 'Akkus, Ladegeräte und Profizubehör',
      metaDescription:
        '18-V-Akkus, Ladegeräte, Festool-Führungsschienen, Tormek-Steine und -Vorrichtungen. Originalteile, Lieferung nach DE, AT, FR und BE.',
    },
  },
];
