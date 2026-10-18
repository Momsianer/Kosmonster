/**
 * Normalisiert den Dateinamen eines Monstersprites auf das Schema art_001 bzw. art_001_e1.
 * Erlaubt sind Unterstrich oder Bindestrich und beliebig viele führende Nullen,
 * also art_001.png, art-001.png, art-0001.png oder art_1_e2.png. Sonst null.
 */
export function normalizeSpriteName(path: string): string | null {
  const file = path.split('/').pop() ?? '';
  const match = /^art[_-]0*(\d+)(?:[_-]e(\d+))?\.png$/i.exec(file);
  if (!match) return null;
  const id = `art_${match[1]!.padStart(3, '0')}`;
  return match[2] ? `${id}_e${match[2]}` : id;
}
