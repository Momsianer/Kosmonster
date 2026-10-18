/**
 * Normalisiert den Dateinamen eines Monstersprites auf das Schema art_001, art_001_e1 oder boss_001.
 * Erlaubt sind Unterstrich oder Bindestrich und beliebig viele führende Nullen,
 * also art_001.png, art-001.png, art-0001.png, art_1_e2.png oder boss-01.png. Sonst null.
 */
export function normalizeSpriteName(path: string): string | null {
  const file = path.split('/').pop() ?? '';
  const match = /^(art|boss)[_-]0*(\d+)(?:[_-]e(\d+))?\.png$/i.exec(file);
  if (!match) return null;
  const id = `${match[1]!.toLowerCase()}_${match[2]!.padStart(3, '0')}`;
  return match[3] ? `${id}_e${match[3]}` : id;
}
