import { BALANCING } from '../data/balancing';
import type { SpeciesId } from '../data/monsters';
import type { BreedingSlot, GameState } from '../core/state';
import { D, type Decimal } from '../util/decimal';
import { breedingSlotCount } from './darkmatter';

/** potenzialMult = 1 + perBreed * zuchten^flattening (abflachend) */
export function potentialMult(bred: number): Decimal {
  const { perBreed, flattening } = BALANCING.breeding;
  return D(1 + perBreed * Math.max(0, bred) ** flattening);
}

/** Brutzeit = baseSeconds * timeGrowth^bisherigeZuchten */
export function breedingSeconds(bred: number): number {
  const { baseSeconds, timeGrowth } = BALANCING.breeding;
  return baseSeconds * timeGrowth ** bred;
}

/** Brutplätze in passender Länge (gekaufte Plätze kommen frei dazu) */
export function breedingSlots(state: GameState): (BreedingSlot | null)[] {
  const count = breedingSlotCount(state);
  while (state.breeding.length < count) state.breeding.push(null);
  return state.breeding.slice(0, count);
}

export function isBreeding(state: GameState, id: SpeciesId): boolean {
  return state.breeding.some((slot) => slot?.speciesId === id);
}

/** Zwei Exemplare (Fänge) einer Art, freier Platz, Art nicht schon im Brutkasten */
export function canBreed(state: GameState, id: SpeciesId): boolean {
  const entry = state.collection[id];
  if (!entry || entry.caught < BALANCING.breeding.requiredCaught || isBreeding(state, id)) return false;
  return breedingSlots(state).some((slot) => slot === null);
}

export function startBreeding(state: GameState, id: SpeciesId): boolean {
  if (!canBreed(state, id)) return false;
  const slots = breedingSlots(state);
  const index = slots.findIndex((slot) => slot === null);
  const total = breedingSeconds(state.collection[id]!.bred);
  state.breeding[index] = { speciesId: id, remaining: total, total };
  return true;
}

/** Lässt die Eier reifen, auch offline. Geschlüpfte Eier erhöhen das Potenzial der Art. */
export function updateBreeding(state: GameState, dtSeconds: number): void {
  if (dtSeconds <= 0) return;
  state.breeding.forEach((slot, index) => {
    if (!slot) return;
    slot.remaining -= dtSeconds;
    if (slot.remaining > 0) return;
    const entry = state.collection[slot.speciesId];
    if (entry) entry.bred += 1;
    state.breeding[index] = null;
  });
}
