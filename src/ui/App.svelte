<script lang="ts">
  import { onDestroy } from 'svelte';
  import { BALANCING } from '../data/balancing';
  import { actions, game } from '../core/game';
  import { t } from '../i18n';
  import Enemy from './Enemy.svelte';
  import EnergyDisplay from './EnergyDisplay.svelte';
  import { createView } from './view';

  let view = $state(createView(game.state));

  function refresh() {
    view = createView(game.state);
  }

  const timer = setInterval(refresh, 1000 / BALANCING.loop.uiUpdatesPerSecond);
  onDestroy(() => clearInterval(timer));

  function attack() {
    actions.clickEnemy();
    refresh();
  }
</script>

<main>
  <h1>{t('game.title')}</h1>
  <EnergyDisplay value={view.energy} />
  <section class="battle">
    <div class="zone">{t('combat.zone', { zone: view.zone })}</div>
    <Enemy hp={view.enemyHp} maxHp={view.enemyMaxHp} fraction={view.enemyHpFraction} onattack={attack} />
    <p class="hint">{t('combat.clickHint')}</p>
    <p class="hint">{t('combat.defeated', { count: view.enemiesDefeated })}</p>
  </section>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    width: 100%;
    max-width: 60rem;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  h1 {
    margin: 0;
    letter-spacing: 0.1em;
  }
  .battle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 1.5rem;
    background: var(--panel);
  }
  .zone {
    font-weight: 600;
  }
  .hint {
    margin: 0;
    color: var(--muted);
    font-size: 0.9rem;
  }
</style>
