import { challengeBoss, clickEnemy } from '../systems/combat';
import { startLoop, type LoopHandle } from './loop';
import { createInitialState, type GameState } from './state';

/** Die eine laufende Spielinstanz. Die Oberfläche liest nur und ruft Aktionen auf. */
export const game: { state: GameState; loop: LoopHandle | null } = {
  state: createInitialState(),
  loop: null,
};

export function startGame(): void {
  if (game.loop) return;
  game.loop = startLoop(game.state);
}

export function stopGame(): void {
  game.loop?.stop();
  game.loop = null;
}

export const actions = {
  clickEnemy: () => clickEnemy(game.state),
  challengeBoss: () => challengeBoss(game.state),
};
