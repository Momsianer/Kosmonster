import type { SpeciesData } from '../data/monsters';

/**
 * Alle vorhandenen Monstersprites unter assets/monster/.
 * Neue Grafiken einfach in den Ordner legen, sie werden beim nächsten Build gefunden.
 */
const files = import.meta.glob<string>('/assets/monster/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** URL des Sprites oder null, solange die Grafik fehlt */
export function spriteUrl(species: SpeciesData): string | null {
  return files[`/${species.sprite}`] ?? null;
}
