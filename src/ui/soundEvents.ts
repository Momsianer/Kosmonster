import { isBossZone } from '../core/formulas';
import type { GameState } from '../core/state';
import { MYTHIC_IDS } from '../data/monsters';
import { activeHint } from '../systems/unlocks';
import type { SoundId } from './sound';

/** Was die Oberfläche zwischen zwei Aktualisierungen vergleicht, um Soundeffekte auszulösen */
export interface SoundSnapshot {
  catchTime: number | null;
  catchShiny: boolean;
  zone: number;
  highestZone: number;
  farming: boolean;
  bossTimeLeft: number;
  prestiges: number;
  theoremDefeated: boolean;
  endgameRecords: number;
  hint: string | null;
  mythics: number;
}

export function soundSnapshot(state: GameState): SoundSnapshot {
  return {
    catchTime: state.lastCatch?.time ?? null,
    catchShiny: state.lastCatch?.shiny ?? false,
    zone: state.zone,
    highestZone: state.highestZone,
    farming: state.farming,
    bossTimeLeft: state.bossTimeLeft,
    prestiges: state.supernovas + state.blackHoles + state.bigBangs,
    theoremDefeated: state.theoremDefeated,
    endgameRecords: Object.values(state.endgame.records).reduce((a, b) => a + b, 0),
    hint: activeHint(state),
    mythics: MYTHIC_IDS.filter((id) => state.collection[id]).length,
  };
}

/**
 * Leitet aus zwei Ständen die Soundeffekte ab, wichtigste zuerst.
 * Höchstens ein Effekt je Aktualisierung, damit es nicht durcheinander klingt.
 */
export function detectSound(prev: SoundSnapshot, next: SoundSnapshot): SoundId | null {
  if (next.theoremDefeated && !prev.theoremDefeated) return 'prestige';
  if (next.prestiges > prev.prestiges) return 'prestige';
  if (next.mythics > prev.mythics) return 'shiny';
  if (next.catchTime !== null && next.catchTime !== prev.catchTime) return next.catchShiny ? 'shiny' : 'catch';
  if (isBossZone(prev.zone) && next.highestZone > prev.highestZone) return 'bossWin';
  if (isBossZone(prev.zone) && next.farming && !prev.farming && prev.bossTimeLeft <= 1) return 'bossFail';
  if (next.hint !== null && next.hint !== prev.hint) return 'unlock';
  if (next.endgameRecords > prev.endgameRecords) return 'stage';
  // Besiegte Gegner klingen nur beim eigenen Klick, sonst wäre es mit starkem Team Dauerton
  return null;
}
