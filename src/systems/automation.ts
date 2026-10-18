import { BALANCING } from '../data/balancing';
import { MODULES } from '../data/modules';
import { isBossZone } from '../core/formulas';
import type { GameState } from '../core/state';
import { buySpheres, currentSphereCost } from './catching';
import { challengeBoss, clickEnemy } from './combat';
import { autoclickRate, automationActive } from './darkmatter';
import { levelUp, levelUpCost } from './monsters';
import { canSupernova, stardustGain, supernova } from './prestige';
import { buyModule, moduleBuyCost } from './station';

/** Höchstzahl an Käufen je Automatikrunde, damit eine Runde nie hängt */
const MAX_PURCHASES = 200;

/** Autolevel: kauft immer das günstigste Level im Team, solange bezahlbar */
function autoLevel(state: GameState): void {
  for (let i = 0; i < MAX_PURCHASES; i++) {
    const cheapest = state.team
      .map((id) => ({ id, cost: levelUpCost(state, id, 1).cost }))
      .sort((a, b) => a.cost.cmp(b.cost))[0];
    if (!cheapest || state.energy.lt(cheapest.cost) || levelUp(state, cheapest.id, 1) === 0) return;
  }
}

/** Autobau: kauft immer das günstigste Modul, solange bezahlbar */
function autoModule(state: GameState): void {
  for (let i = 0; i < MAX_PURCHASES; i++) {
    const cheapest = MODULES.map((m) => ({ id: m.id, cost: moduleBuyCost(state, m.id, 1).cost })).sort((a, b) =>
      a.cost.cmp(b.cost),
    )[0];
    if (!cheapest || state.energy.lt(cheapest.cost) || buyModule(state, cheapest.id, 1) === 0) return;
  }
}

/** Autosphären: füllt Standardsphären bis zum Zielwert auf, soweit bezahlbar */
function autoSpheres(state: GameState): void {
  const missing = state.automation.sphereTarget - state.spheres.standard;
  if (missing <= 0) return;
  const affordable = Math.floor(state.energy.div(currentSphereCost(state)).toNumber());
  const amount = Math.min(missing, affordable);
  if (amount > 0) buySpheres(state, amount);
}

/** Autoboss: fordert einen blockierenden Boss nach bossRetrySeconds erneut heraus */
function autoBoss(state: GameState, dtSeconds: number): void {
  const blocked = state.farming && isBossZone(state.zone + 1) && state.zone + 1 === state.highestZone;
  if (!blocked) {
    state.automation.bossWait = 0;
    return;
  }
  state.automation.bossWait += dtSeconds;
  if (state.automation.bossWait >= BALANCING.automation.bossRetrySeconds) {
    state.automation.bossWait = 0;
    challengeBoss(state);
  }
}

/** Autosupernova: löst aus, sobald der Gewinn den Zielwert erreicht */
function autoSupernova(state: GameState): void {
  if (canSupernova(state) && stardustGain(state).gte(state.automation.supernovaTarget)) supernova(state);
}

/** Läuft in jedem Tick: Autoklicker laufend, die übrigen Automatiken alle intervalSeconds */
export function runAutomation(state: GameState, dtSeconds: number): void {
  if (dtSeconds <= 0) return;
  const auto = state.automation;

  if (automationActive(state, 'autoklicker')) {
    auto.clickBudget += autoclickRate(state) * dtSeconds;
    while (auto.clickBudget >= 1) {
      clickEnemy(state, false);
      auto.clickBudget -= 1;
    }
  }

  auto.timer -= dtSeconds;
  if (auto.timer > 0) return;
  const interval = BALANCING.automation.intervalSeconds;
  auto.timer = interval;
  if (automationActive(state, 'autoboss')) autoBoss(state, interval);
  if (automationActive(state, 'autosupernova')) autoSupernova(state);
  if (automationActive(state, 'autosphaeren')) autoSpheres(state);
  if (automationActive(state, 'autolevel')) autoLevel(state);
  if (automationActive(state, 'automodul')) autoModule(state);
}
