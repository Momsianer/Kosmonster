import { BALANCING } from '../data/balancing';
import { MODULES } from '../data/modules';
import { isBossZone } from '../core/formulas';
import type { GameState } from '../core/state';
import { affordableSpheres, buySpheres } from './catching';
import { challengeBoss, clickEnemy } from './combat';
import { autoclickRate, automationActive } from './darkmatter';
import { levelUp, levelUpCost } from './monsters';
import { canSupernova, stardustGain, supernova } from './prestige';
import { buyModule, moduleBuyCost } from './station';
import { blackHole, canBlackHole, darkMatterGain } from './blackhole';
import { originLevel } from './rules';

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
  const amount = Math.min(missing, affordableSpheres(state));
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

/** Autoschwarzloch (Ursprungsupgrade): öffnet ein Schwarzes Loch beim Zielwert */
function autoBlackHole(state: GameState): void {
  if (originLevel(state, 'autoschwarzloch') <= 0 || state.automation.enabled.autoschwarzloch === false) return;
  if (canBlackHole(state) && darkMatterGain(state).gte(state.automation.blackHoleTarget)) blackHole(state);
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
  // Ein Reset würde den laufenden Endgamekampf beenden, deshalb warten Supernova und Schwarzes Loch
  const fighting = state.endgame.run !== null;
  if (!fighting) autoBlackHole(state);
  if (automationActive(state, 'autoboss')) autoBoss(state, interval);
  if (!fighting && automationActive(state, 'autosupernova')) autoSupernova(state);
  if (automationActive(state, 'autosphaeren')) autoSpheres(state);
  if (automationActive(state, 'autolevel')) autoLevel(state);
  if (automationActive(state, 'automodul')) autoModule(state);
}
