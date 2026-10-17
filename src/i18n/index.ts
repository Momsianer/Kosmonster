import { de } from './de';

type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : { readonly [K in keyof T]: Widen<T[K]> };

/** Struktur, die jede Sprachdatei erfüllen muss */
export type Translations = Widen<typeof de>;

/** Alle Schlüssel, die auf einen Text zeigen, z. B. 'combat.zone' */
type LeafKeys<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : T[K] extends readonly unknown[]
      ? never
      : LeafKeys<T[K], `${P}${K}.`>;
}[keyof T & string];

export type TranslationKey = LeafKeys<typeof de>;

let current: Translations = de;

export function setLanguage(translations: Translations): void {
  current = translations;
}

export function getTranslations(): Translations {
  return current;
}

/** Locale für Intl Formatierung, z. B. 'de-DE' */
export function getLocale(): string {
  return current.meta.locale;
}

/**
 * Liefert den Text zu einem Schlüssel. Platzhalter in geschweiften Klammern
 * werden durch params ersetzt: t('combat.zone', { zone: 3 }) → "Zone 3".
 * Unbekannte Schlüssel werden unverändert zurückgegeben.
 */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let node: unknown = current;
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return key;
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node !== 'string') return key;
  if (!params) return node;
  return node.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
