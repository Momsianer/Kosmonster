import { describe, expect, it } from 'vitest';
import { getLocale, t } from '../src/i18n';

describe('Übersetzung', () => {
  it('liefert Texte zu Schlüsseln', () => {
    expect(t('currency.energy')).toBe('Energie');
    expect(getLocale()).toBe('de-DE');
  });

  it('ersetzt Platzhalter', () => {
    expect(t('combat.zone', { zone: 3 })).toBe('Zone 3');
    expect(t('combat.hp', { hp: '5', maxHp: '10' })).toBe('5 / 10 Leben');
  });

  it('lässt fehlende Platzhalter stehen', () => {
    expect(t('combat.zone')).toBe('Zone {zone}');
  });

  it('gibt unbekannte Schlüssel unverändert zurück', () => {
    // @ts-expect-error absichtlich unbekannter Schlüssel
    expect(t('gibt.es.nicht')).toBe('gibt.es.nicht');
  });
});
