/** Deutsche Texte. Englisch folgt später als en.ts mit derselben Struktur. */
export const de = {
  meta: {
    locale: 'de-DE',
  },
  game: {
    title: 'Kosmonster',
  },
  currency: {
    energy: 'Energie',
  },
  combat: {
    zone: 'Zone {zone}',
    enemy: 'Gegner',
    hp: '{hp} / {maxHp} Leben',
    clickHint: 'Klicke auf den Gegner, um ihn anzugreifen.',
    defeated: 'Besiegte Gegner: {count}',
  },
  number: {
    /** Suffixe ab 1e6 in Dreierschritten: Index 0 = 1e6, Index 1 = 1e9, ... */
    suffixes: [
      'Mio.',
      'Mrd.',
      'Bio.',
      'Brd.',
      'Trio.',
      'Trd.',
      'Quadr.',
      'Quadrd.',
      'Quint.',
      'Quintd.',
      'Sext.',
      'Sextd.',
      'Sept.',
      'Septd.',
      'Okt.',
      'Oktd.',
      'Non.',
      'Nond.',
      'Dez.',
      'Dezd.',
    ],
  },
} as const;
