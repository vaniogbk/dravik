import { cn } from '@/lib/cn';

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

/**
 * Marque Dravik, reprise de la charte : un chevron acier emboîté dans une
 * flèche orange. Le tracé vient de identite/logo/svg/dravik-embleme-couleur.svg,
 * posé ici en ligne plutôt qu'en fichier — un en-tête ne doit pas attendre une
 * requête réseau pour afficher son logo.
 */
export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        viewBox="-18 -18 128.16 136"
        className="h-9 w-9 shrink-0"
        aria-hidden="true"
        focusable="false"
      >
        <g transform="translate(-6.486 -5.135) scale(1.08108)">
          <path
            d="M55.19 20.75 L75.25 40.81 L75.25 59.19 L53.19 81.25 L30 81.25 L30 97.25 L59.81 97.25 L91.25 65.81 L91.25 34.19 L61.81 4.75 L6 4.75 L6 20.75Z"
            fill="#FF6A00"
          />
          <path d="M6 27 L30 27 L54 51 L30 75 L6 75 L30 51Z" fill="#8A8F98" />
        </g>
      </svg>

      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-[1.0625rem] font-extrabold tracking-[0.08em] text-ink">
            DRAVIK
          </span>
          <span className="mt-1 text-[0.5625rem] font-semibold uppercase tracking-[0.16em] text-smoke-500">
            Outils &amp; machines
          </span>
        </span>
      )}
    </span>
  );
}
