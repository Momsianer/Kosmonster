import { describe, expect, it } from 'vitest';
import { normalizeSpriteName } from '../src/util/spritename';

describe('normalizeSpriteName', () => {
  it('erkennt das Schema und übliche Varianten', () => {
    expect(normalizeSpriteName('/assets/monster/art_001.png')).toBe('art_001');
    expect(normalizeSpriteName('/assets/monster/art-0001.png')).toBe('art_001');
    expect(normalizeSpriteName('art-1.png')).toBe('art_001');
    expect(normalizeSpriteName('art_120.PNG')).toBe('art_120');
  });

  it('erkennt Bossmonster', () => {
    expect(normalizeSpriteName('boss_001.png')).toBe('boss_001');
    expect(normalizeSpriteName('Boss-0012.png')).toBe('boss_012');
  });

  it('erkennt Evolutionen', () => {
    expect(normalizeSpriteName('art_003_e1.png')).toBe('art_003_e1');
    expect(normalizeSpriteName('art-0003-e2.png')).toBe('art_003_e2');
  });

  it('lehnt andere Dateien ab', () => {
    expect(normalizeSpriteName('hintergrund.png')).toBeNull();
    expect(normalizeSpriteName('art_001.gif')).toBeNull();
  });
});
