# Kosmonster

Designdokument und Projektanweisungen für Claude Code.
Ein Weltraum Idle/Clicker Spiel über das Sammeln mathematischer Sternmonster.

---

## 1. Vision

* **Einfacher Einstieg:** Am Anfang gibt es nur einen Button. Alles andere wird schrittweise freigeschaltet.
* **Tiefe für Veteranen:** Teamaufbau, Typensynergien, Forschungsentscheidungen, Challenges, optimale Resetzeitpunkte.
* **Hauptspiel:** ca. 100 bis 150 Stunden bis zum Abschluss der Story.
* **Endgame:** unendlich, mit Systemen, die später erweitert werden können.
* **Thema:** Monster fangen (Sammelmotivation wie PokeClicker), Kampf in Zonen (wie Clicker Heroes), passive Produktion (wie Cookie Clicker), alles verbunden durch Weltraum und Mathematik.

### Designsäulen
1. Jede neue Mechanik wird einzeln eingeführt, mit kurzem Hinweistext.
2. Jede Entscheidung soll spürbar sein (Zahlen sichtbar, Formeln optional einblendbar).
3. Sammeln ist nie verloren: gefangene Arten bleiben über alle Resets erhalten.
4. Automatisierung ist eine Belohnung, kein Startzustand.

---

## 2. Kernschleife

```
Gegner besiegen (Klick + Team) → Energie verdienen
Energie ausgeben → Monster leveln, Fangsphären kaufen, Stationsmodule bauen
Besiegte Gegner fangen → neue Arten → stärkeres Team
Fortschritt verlangsamt sich → Prestige (Reset) gegen dauerhafte Boni
```

---

## 3. Währungen

| Währung | Quelle | Verwendung | Reset bei |
|---|---|---|---|
| Energie | Gegner, Raumstation | Level, Module, Fangsphären | Supernova |
| Sternenstaub | Supernova | Forschungsbaum, passiver Bonus | Schwarzes Loch |
| Dunkle Materie | Schwarzes Loch | Automatisierung, Zucht, Gravitationsboni | Urknall |
| Ursprungspunkte | Urknall, Challenges | Universumsregeln, Konstellationsbaum | nie |
| Kometensplitter | seltene Drops, Errungenschaften | kosmetisch, Komfortfunktionen | nie |

---

## 4. Welt und Kampf

### Struktur
* Die Welt besteht aus **Zonen** (fortlaufend nummeriert, theoretisch unendlich).
* 10 Zonen bilden ein **Sternsystem** mit eigenem Namen, Planetentyp und Monsterpool.
* Pro Zone müssen **10 Gegner** besiegt werden.
* **Boss** jede 5. Zone, **Systemboss** jede 10. Zone, mit 30 Sekunden Zeitlimit.
* Scheitert man am Boss, bleibt man in der Zone davor (Farmmodus).

### Gegnerleben (Startwerte, per Simulator tunen)
```
hp(z) = 10 * 1,55^(z − 1)                  für z ≤ 140
hp(z) = hp(140) * 1,145^(z − 140)          für z > 140
Boss:       hp * 10
Systemboss: hp * 25
```

### Belohnung
```
energie(z) = hp(z) / 15
Boss:       energie * 3
```

### Schaden
```
klickschaden = 1 + 0,01 * teamDPS * klickbonus      (Klick wird später relativ zum Team)
teamDPS = Summe aller Monster im Team
monsterDPS = basisDPS * level * meilensteinMult * seltenheitMult * sterneMult * typMult * globalMult
```

### Planetentypen
Jedes Sternsystem hat einen Planetentyp, der einen Monstertyp stärkt (×2) und einen schwächt (×0,5).
Neue Spieler bekommen einen Hinweis „empfohlener Typ", Veteranen bauen gezielt um.

---

## 5. Monster

### Grundlagen
* **120 Arten** im Hauptspiel (8 Typen × 15 Arten), dazu **8 Mythische** im Endgame.
* Neue Arten erscheinen bis Zone 500, danach rotieren die Pools.
* Teamplätze: Start 3, erweiterbar auf 6 (Forschung) und 10 (Dunkle Materie).
* Alle Designs sind eigene Kreationen, keine Anlehnung an bestehende Marken.

### Seltenheit

| Seltenheit | Basisfangchance | DPS Mult | Vorkommen |
|---|---|---|---|
| Gewöhnlich | 25 % | ×1 | überall |
| Ungewöhnlich | 12 % | ×2 | überall |
| Selten | 5 % | ×5 | ab Zone 25 |
| Episch | 1,5 % | ×15 | ab Zone 100 |
| Legendär | 0,3 % | ×50 | nur Systembosse |
| Mythisch | Sonderbedingung | ×200 | Endgame |

### Fangen
* Besiegte Gegner können mit einer **Fangsphäre** gefangen werden (automatisch, wenn Sphären vorhanden).
```
fangchance = basisChance * sphärenMult * (1 + forschungsBonus)
```
* Sphärentypen: Standard (×1), Orbit (×1,5), Nebel (×2,5), Singularität (×5).

### Duplikate und Sterne
Jede weitere gefangene Kopie bringt Fortschritt zu **Sternen** (1 bis 5, im Endgame unendlich).
```
kopienFürStern(s) = 5 * 2^(s − 1)
sterneMult = 1,5^sterne
```

### Polarstern Variante (Shiny)
* Chance 1/8192 pro Begegnung.
* ×2 Bonus, eigene Farbe, zählt separat in der Sammlung.

### Level
```
levelKosten(l) = basisKosten * 1,07^l
meilensteinMult: ×2 bei Level 10, 25, 50, 100, danach alle 100 Level ×2, alle 1000 Level ×10
```

### Evolution
* Ab Level 100 möglich, kostet Sternenstaub.
* Evolution: basisDPS × 5, neues Aussehen, neuer Name.
* Zweite Evolution ab Level 500 (nur manche Arten).

### Die 8 mathematischen Typen

| Typ | Farbe | Fähigkeit |
|---|---|---|
| Prim | Rot | ×2 Schaden in Zonen mit Primzahlnummer |
| Fibonacci | Gold | Zusätzliche Meilensteine bei Fibonacci Leveln (1, 2, 3, 5, 8, 13, 21, ...), je ×1,5 |
| Pi | Blau | Erhöht Klickschaden um π % der Team DPS |
| Euler | Grün | Bonus wächst mit Zeit seit letztem Reset: ×(1 + ln(1 + t/60)) |
| Null | Schwarz | Verdoppelt Offlineertrag und Leerlaufbonus |
| Unendlich | Violett | +1 % pro gefangener Art in der Sammlung |
| Fraktal | Türkis | Bonus steigt mit Anzahl gleicher Typen im Team: ×1,25^(n − 1) |
| Vektor | Silber | ×3 Schaden gegen Bosse |

---

## 6. Raumstation (passive Produktion)

Freigeschaltet nach ca. 5 Minuten. Module produzieren Energie pro Sekunde, unabhängig vom Kampf.

```
modulKosten(i, n) = basis_i * 1,15^n
produktion_i     = prod_i * n * modulMult_i
```

| # | Modul | Basiskosten | Produktion/s |
|---|---|---|---|
| 1 | Solarpanel | 15 | 0,1 |
| 2 | Asteroidenbohrer | 100 | 1 |
| 3 | Fusionsreaktor | 1.100 | 8 |
| 4 | Dysonring | 12.000 | 47 |
| 5 | Pulsarsammler | 130.000 | 260 |
| 6 | Quasarspiegel | 1,4e6 | 1.400 |
| 7 | Wurmlochpumpe | 2e7 | 7.800 |
| 8 | Zeitkristall | 3,3e8 | 44.000 |

Modulupgrades: ×2 bei 25, 50, 100, 150, 200 Stück. Verbindung zum Kampf: Forschung kann einen Teil der Produktion in Team DPS umwandeln.

### Mehrfachkauf
```
kosten(n) = basis * r^k * (r^n − 1) / (r − 1)              k = bereits besessen
maxKaufbar = floor( log_r( geld * (r − 1) / (basis * r^k) + 1 ) )
```
Kaufoptionen: ×1, ×10, ×100, Max.

---

## 7. Prestigeebenen

### Ebene 1: Supernova (ab Zone 60, ca. 3 Stunden)
```
sternenstaub = floor( (gesamtEnergieDiesesZyklus / 1e9)^0,5 )
passiver Bonus: ×(1 + 0,02 * unausgegebenerSternenstaub)
```
* **Kernentscheidung:** Unausgegebener Sternenstaub gibt passiven Bonus, ausgegebener kauft Forschung. Veteranen optimieren die Aufteilung.
* Behalten: gefangene Arten, Sterne, Forschung, Errungenschaften.
* Zurückgesetzt: Energie, Zone, Monsterlevel, Module.
* Freischaltung: Forschungsbaum, Evolution.

### Ebene 2: Schwarzes Loch (ab 1e6 Sternenstaub in einem Zyklus, ca. 20 Stunden)
```
dunkleMaterie = floor( (sternenstaubDiesesZyklus / 1e6)^0,4 )
gravitationsMult auf Sternenstaubertrag = (1 + dunkleMaterie)^0,5
```
* Behalten: Sammlung, Sterne, Dunkle Materie Upgrades.
* Zurückgesetzt: Sternenstaub, Forschungsbaum (ein Teil kann per Upgrade erhalten bleiben).
* Freischaltung: Automatisierung, Brutstation (Zucht), weitere Teamplätze.

### Ebene 3: Urknall (bei 1e308 Energie, „Unendlichkeit", ca. 60 Stunden)
```
ursprungspunkte = 1 + challengeBonus
```
* Behalten: Sammlung, Errungenschaften, Ursprungsupgrades.
* Zurückgesetzt: fast alles andere.
* Freischaltung: Universumsregeln, Challenges, Konstellationsbaum.
* Ab dem ersten Urknall: Zahlen jenseits von 1e308 sind möglich.

---

## 8. Forschungsbaum (Sternenstaub)

Ca. 40 Knoten in 4 Ästen:

* **Kampf:** Klickschaden, Team DPS, kritische Treffer, Bosszeit
* **Sammeln:** Fangchance, Seltenheitsboni, Teamplätze, Shinychance
* **Station:** Modulproduktion, günstigere Module, Umwandlung in DPS
* **Zeit:** Offlineertrag, Offlinelimit, Startzone nach Supernova

Kosten pro Knoten wachsen mit `kosten = basis * 3^stufe`.

---

## 9. Automatisierung (Dunkle Materie)

Freischaltung in dieser Reihenfolge:
1. Autoklicker (10/s, ausbaubar)
2. Autolevel (levelt günstigstes Monster)
3. Autobau Module
4. Autosphären (kauft Fangsphären nach Regel)
5. Autoboss (wechselt bei Fehlschlag in Farmmodus)
6. Autosupernova (bei Zielwert, frei einstellbar)
7. Autoschwarzloch (später)

---

## 10. Brutstation (Zucht)

* Zwei Monster gleicher Art → Ei, schlüpft nach Zeit.
* Nachwuchs hat erhöhte **Potenzialwerte** (permanenter Mult für die Art: +5 % pro Zucht, abflachend).
* Gibt Idle Spielern ein Langzeitziel.

---

## 11. Konstellationen

* Bestimmte Kombinationen im Team ergeben Konstellationen mit Sonderboni.
* Einfache Regeln (für alle verständlich): 3 gleiche Typen im Team = kleiner Bonus.
* Versteckte Konstellationen (zum Entdecken): z. B. „Primzwillinge", „Goldener Schnitt" (Fibonacci + Euler), „Eulersche Identität" (Euler + Pi + Null + Unendlich).
* 24 Konstellationen im Hauptspiel, eine Sammlungsseite zeigt entdeckte und unentdeckte (als Silhouette).

---

## 12. Challenges (ab Urknall)

12 Challenges im Hauptspiel. Abschluss gibt Ursprungspunkte und permanente Boni.

Beispiele:
1. **Stille Hände:** Klicken deaktiviert
2. **Quadratisches Wachstum:** Kosten wachsen mit r^(n²) statt r^n
3. **Einzelgänger:** nur 1 Teamplatz
4. **Leeres Universum:** keine Raumstation
5. **Primzahlwelt:** Schaden nur in Primzahlzonen
6. **Gezeitensperre:** Produktion halbiert sich alle 60 Sekunden, Reset bei Bosssieg
7. **Monokultur:** nur ein Typ im Team erlaubt
8. **Teilbarkeit:** Gegnerleben × 1000, wenn Zone nicht durch 3 teilbar
9. **Entropie:** Monsterlevel sinken langsam
10. **Ohne Gedächtnis:** Forschungsbaum deaktiviert
11. **Lichtgeschwindigkeit:** Zeitlimit für ganze Zyklen
12. **Der Beweis:** alle Einschränkungen 1 bis 4 gleichzeitig

---

## 13. Story und Abschluss des Hauptspiels

* Kurze Texte bei jedem Systemboss (ein bis zwei Sätze), optional lesbar.
* Rahmenhandlung: Ein uraltes Theorem zerfällt, die Monster sind Bruchstücke davon.
* **Finale:** Nach allen 12 Challenges erscheint „Das Theorem" als Endboss.
* Sieg = Abspann, Errungenschaft, Freischaltung des Endgames.

---

## 14. Endgame (unendlich, erweiterbar)

* **Multiversum:** unendliche Zonen mit eigener Skalierung, Rekordanzeige „tiefste Zone".
* **Unbewiesene Vermutungen:** Spezialbosse mit Mathemechaniken
  * *Collatz Labyrinth:* Zonenfolge nach Collatz Regel, endlos tiefer
  * *Goldbach Arena:* Schaden nur als Summe zweier Primzahlen
  * *Riemann Spirale:* Bonus an „Nullstellen" (bestimmte Zonenintervalle)
* **Mythische Monster:** 8 Arten mit Sonderbedingungen.
* **Challengestufen:** jede Challenge unendlich steigerbar.
* **Sterne über 5:** unendliche Sternstufen mit abflachendem Bonus.
* **Polarstern Jagd:** Sammlung aller Shinies.
* Erweiterungspunkte: neue Vermutungen, neue Galaxien, neue Mythische.

---

## 15. Errungenschaften

* Ca. 150 im Hauptspiel.
* Jede gibt +1 % globalen Bonus (multiplikativ zusammengefasst als ×(1 + 0,01 * anzahl)).
* Kategorien: Zonen, Sammlung, Klicks, Prestige, Challenges, Geheim.

---

## 16. Pacing Ziele (Prüfung durch Simulator)

| Ziel | Zielzeit (aktiver Spieler) |
|---|---|
| Erstes Monster gefangen | 1 Minute |
| Raumstation frei | 5 Minuten |
| Erster Boss | 10 Minuten |
| Erste Supernova | 3 Stunden |
| 10 Supernovas | 12 Stunden |
| Erstes Schwarzes Loch | 20 Stunden |
| Erster Urknall | 60 Stunden |
| Alle 12 Challenges | 120 Stunden |
| Theorem besiegt | 100 bis 150 Stunden |

Annahme: aktiver Spieler ca. 30 % der Zeit online, Rest offline. Der Simulator rechnet beide Profile (aktiv und überwiegend idle).

---

## 17. Freischaltreihenfolge der Oberfläche

1. Nur Gegner + Klick
2. Erstes Monster → Team Ansicht
3. Raumstation
4. Fangsphärenladen
5. Bosse
6. Supernova Button (erst sichtbar, wenn sinnvoll)
7. Forschungsbaum
8. Evolution
9. Automatisierung, Brutstation
10. Urknall, Challenges, Konstellationen
11. Endgame

Jede Freischaltung zeigt einmalig einen kurzen Hinweis.

---

## 18. Technik

### Stack
* **TypeScript** + **Vite**
* **Svelte 5** für die Oberfläche
* **break_eternity.js** für alle Spielzahlen (Decimal)
* **lz-string** für komprimierte Speicherstände
* **Vitest** für Tests
* Später: **Tauri** für Desktop, Veröffentlichung auf itch.io

### Ordnerstruktur
```
src/
  core/        Spielzustand, Tickschleife, Formeln
  data/        Monster, Zonen, Module, Forschung, balancing.ts
  systems/     combat, catching, station, prestige, research, automation
  save/        Speichern, Laden, Migrationen
  ui/          Svelte Komponenten
  util/        Zahlenformatierung
sim/           Simulator für Balancing
tests/
```

### Regeln für die Architektur
* Ein zentraler Spielzustand, komplett serialisierbar.
* Spiellogik kennt keine Oberfläche. Die Oberfläche liest nur Zustand und ruft Aktionen auf.
* Tickschleife mit Zeitdifferenz (`Date.now()`), niemals Ticks zählen.
* Logik ca. 20 Ticks/s, Oberfläche ca. 10 Aktualisierungen/s.
* Offlinefortschritt beim Laden berechnen (mit Limit, Start 8 Stunden).

### Speichern
* Autosave alle 30 Sekunden und beim Schließen.
* Format: JSON → lz-string → Base64.
* Feld `version` in jedem Speicherstand, Migrationsliste für jede Strukturänderung.
* Export/Import als Textcode, Hardreset mit doppelter Bestätigung.

### Zahlenanzeige
Wählbar: deutsch (1,5 Mio., 2,3 Mrd.), wissenschaftlich (1,5e6), technisch (1,5e6 in 3er Schritten), Buchstaben (1,5aa).

---

## 19. Umsetzungsreihenfolge

| Status | Meilenstein | Inhalt |
|---|---|---|
| ✅ | M1 | Projektgerüst, Decimal, Tickschleife, Klick auf Gegner, Energie |
| ✅ | M2 | Zonen, Gegnerleben, Bosse mit Zeitlimit |
| ✅ | M3 | Speichern/Laden, Offlinefortschritt, Zahlenformatierung |
| ✅ | M4 | Monster, Fangen, Team, Level, Meilensteine (erst 2 Typen, 10 Arten) |
| ✅ | M5 | Raumstation mit Mehrfachkauf |
| ✅ | M6 | Simulator, erste Balancingrunde bis Zone 60 |
| ✅ | M7 | Supernova, Forschungsbaum, Evolution |
| ✅ | M8 | Alle 8 Typen, Planetentypen, Seltenheit, Sterne, Shinies |
| ✅ | M9 | Schwarzes Loch, Automatisierung, Brutstation |
| ⬜ | M10 | Urknall, Challenges, Konstellationen, Story, Theorem |
| ⬜ | M11 | Endgame Grundgerüst |
| ⬜ | M12 | Grafik, Sound, Feinschliff, Tauri Build |

Jeder Meilenstein muss spielbar sein, bevor der nächste beginnt.

---

## 20. Arbeitsregeln für Claude Code

* Alle Spielzahlen als Decimal (break_eternity.js), nie als normale Zahl.
* Alle Balancingwerte ausschließlich in `src/data/balancing.ts`, keine festen Zahlen in Systemen.
* Jede Formel bekommt einen Test.
* Nach Balancingänderungen den Simulator laufen lassen und Pacingtabelle prüfen.
* Kleine, abgeschlossene Schritte, nach jedem Schritt committen.
* Strukturänderungen am Spielzustand immer mit Speicherstandmigration.
* Texte im Spiel auf Deutsch, ohne Gendersprache.
* Vor größeren Änderungen kurz den Plan nennen.
* Nach jedem abgeschlossenen Meilenstein mit grünen Tests direkt in main pushen bzw. den Pull Request selbst in main mergen. Das hat Moritz ausdrücklich erlaubt.

---

## 21. Festgelegte Entscheidungen

### Name
Das Spiel heißt **Kosmonster**.

### Grafik
* Stil: **Pixelart**
* Monstersprites: 32×32 Pixel, in der Oberfläche ganzzahlig skaliert (×2, ×3, ×4)
* Kleine Symbole (Währungen, Typen): 16×16 Pixel
* Bosse und Legendäre: 64×64 Pixel
* Rendering mit `image-rendering: pixelated`, nie weichgezeichnet
* Solange Sprites fehlen: farbige Platzhalter nach Typfarbe mit Artnummer

### Monsterarten
* Namen und Designs erstellt Moritz selbst.
* Claude Code legt in `src/data/monsters.ts` nur Platzhalter an (z. B. `art_001`, Name „Art 001"), mit Typ, Seltenheit, Basiswerten und Zonenbereich.
* Spritepfad nach Schema `assets/monster/art_001.png`, damit fertige Grafiken nur in den Ordner gelegt werden müssen.

### Plattform
* Zuerst nur **Desktop Browser**.
* Mobile kommt später. Bis dahin keine Mobilanpassungen, aber auch keine festen Pixelbreiten für das Gesamtlayout, damit der Umbau später leicht fällt.

### Sprache
* Zuerst nur **Deutsch**, später **Englisch**.
* Trotzdem von Anfang an alle Texte über ein Übersetzungssystem: `src/i18n/de.ts` mit Schlüsseln (z. B. `t('station.solarpanel.name')`), keine Texte direkt in Komponenten.
* Zahlenformatierung abhängig von der Sprache (Dezimalkomma im Deutschen).
* Englisch wird später nur durch eine `en.ts` ergänzt.
