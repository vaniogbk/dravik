import type { Config } from 'tailwindcss';

/**
 * Charte Dravik : noir / blanc / rouge.
 * Le rouge est réservé aux actions et aux informations commerciales fortes
 * (prix cassés, CTA, badges). Il ne sert jamais de couleur de fond de section :
 * son efficacité vient de sa rareté.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Graphite Dravik : le noir de la charte n'est pas un noir pur, il
        // tire légèrement vers le bleu, ce qui adoucit les aplats.
        ink: {
          DEFAULT: '#0F1115',
          soft: '#171A20',
          muted: '#22262E',
        },
        signal: {
          DEFAULT: '#FF6A00', // orange industriel Dravik
          hover: '#E05D00',
          // L'orange de marque ne passe pas le contraste AA en petit texte sur
          // fond clair. `text` est la variante assombrie prévue pour ça par la
          // charte : à utiliser dès qu'il s'agit de lire, pas de signaler.
          text: '#B84A00',
          bright: '#FF8A3D',
          soft: '#FFF4EB',
          ring: 'rgba(255, 106, 0, 0.28)',
        },
        /**
         * Fond général du site. Volontairement en retrait du blanc pur :
         * sur un écran lumineux, une page 100 % blanche fatigue la vue au
         * bout de quelques minutes. Les cartes restent blanches et se
         * détachent donc naturellement de ce fond.
         */
        canvas: {
          DEFAULT: '#EEF0F2',
          raised: '#F7F8F9',
        },
        // Échelle acier de la charte, rangée du plus clair au plus sombre.
        smoke: {
          50: '#FAFBFC',
          100: '#EEF0F2',
          200: '#DDE0E4',
          300: '#C4C8CE',
          400: '#8A8F98',
          500: '#5F6570',
          600: '#343A44',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
      },
      borderRadius: {
        card: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(11, 11, 12, 0.04), 0 8px 24px -12px rgba(11, 11, 12, 0.16)',
        'card-hover': '0 2px 4px rgba(11, 11, 12, 0.06), 0 16px 40px -16px rgba(11, 11, 12, 0.24)',
        focus: '0 0 0 3px rgba(225, 0, 15, 0.28)',
      },
      maxWidth: {
        content: '80rem',
        prose: '68ch',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        /**
         * Défilement en boucle. La piste contient deux copies identiques :
         * translater de la moitié exacte ramène au point de départ, donc la
         * répétition est invisible.
         */
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s infinite',
        marquee: 'marquee 32s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
