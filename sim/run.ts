/**
 * Startet den Simulator: npm run sim
 * Rechnet beide Profile und vergleicht mit der Pacingtabelle.
 */
import { formatTime, MILESTONES, PROFILES, simulate } from './simulate';

const MAX_SECONDS = 12 * 3600;
const SEEDS = [1, 2, 3];

function median(values: (number | null)[]): number | null {
  const reached = values.filter((v): v is number => v !== null).sort((a, b) => a - b);
  if (reached.length < Math.ceil(values.length / 2)) return null;
  return reached[Math.floor(reached.length / 2)] ?? null;
}

for (const profile of Object.values(PROFILES)) {
  const started = Date.now();
  const results = SEEDS.map((seed) => simulate(profile, MAX_SECONDS, seed));
  console.log(`\nProfil: ${profile.name} (Median aus ${SEEDS.length} Läufen, ${((Date.now() - started) / 1000).toFixed(1)} s Rechenzeit)`);
  console.log('Meilenstein'.padEnd(26) + 'Zeit'.padEnd(18) + 'Ziel');
  for (const m of MILESTONES) {
    const time = median(results.map((r) => r.times[m.id] ?? null));
    const target = m.target === null ? '' : formatTime(m.target);
    console.log(m.label.padEnd(26) + formatTime(time).padEnd(18) + target);
  }
  console.log(`Endzone: ${results.map((r) => r.finalZone).join(', ')}`);
}
