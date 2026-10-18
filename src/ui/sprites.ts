import type { SpeciesData } from '../data/monsters';
import { normalizeSpriteName } from '../util/spritename';

/**
 * Alle vorhandenen Monstersprites unter assets/monster/.
 * Neue Grafiken einfach in den Ordner legen, sie werden beim nächsten Build gefunden.
 * Erkannt werden art_001.png, art-001.png und art-0001.png, Evolutionen mit _e1 bzw. _e2.
 */
const files = import.meta.glob<string>('/assets/monster/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

const byName = new Map<string, string>();
for (const [path, url] of Object.entries(files)) {
  const name = normalizeSpriteName(path);
  if (name && !byName.has(name)) byName.set(name, url);
}

/** URL des Sprites oder null, solange die Grafik fehlt */
export function spriteUrl(species: SpeciesData, stage = 0): string | null {
  return byName.get(stage > 0 ? `${species.id}_e${stage}` : species.id) ?? null;
}
