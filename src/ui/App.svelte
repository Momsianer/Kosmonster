<script lang="ts">
  import { onDestroy } from 'svelte';
  import { BALANCING } from '../data/balancing';
  import { actions, game } from '../core/game';
  import { t } from '../i18n';
  import BossTimer from './BossTimer.svelte';
  import Enemy from './Enemy.svelte';
  import EnergyDisplay from './EnergyDisplay.svelte';
  import OfflineReport from './OfflineReport.svelte';
  import Settings from './Settings.svelte';
  import { createView } from './view';

  let view = $state(createView(game.state, game.offlineReport));
  let showSettings = $state(false);

  function refresh() {
    view = createView(game.state, game.offlineReport);
  }

  const timer = setInterval(refresh, 1000 / BALANCING.loop.uiUpdatesPerSecond);
  onDestroy(() => clearInterval(timer));

  function attack() {
    actions.clickEnemy();
    refresh();
  }

  function challengeBoss() {
    actions.challengeBoss();
    refresh();
  }

  function dismissOffline() {
    actions.dismissOfflineReport();
    refresh();
  }
</script>

<main>
  <div class="top">
    <h1>{t('game.title')}</h1>
    <button type="button" class="toggle" onclick={() => (showSettings = !showSettings)}>
      {showSettings ? t('settings.close') : t('settings.open')}
    </button>
  </div>

  {#if view.offline}
    <OfflineReport
      duration={view.offline.duration}
      energy={view.offline.energy}
      hasEnergy={view.offline.hasEnergy}
      onclose={dismissOffline}
    />
  {/if}

  {#if showSettings}
    <Settings onchange={refresh} />
  {/if}

  <EnergyDisplay value={view.energy} />
  <section class="battle">
    <header>
      <div class="zone">{t('combat.zone', { zone: view.zone })}</div>
      <div class="sub">
        {t('combat.starSystem', { system: view.starSystem })} · {t('combat.highestZone', { zone: view.highestZone })}
      </div>
    </header>

    {#if view.enemyKind === 'normal'}
      <div class="progress">{t('combat.progress', { kills: view.killsInZone, total: view.enemiesPerZone })}</div>
    {:else}
      <BossTimer time={view.bossTime} fraction={view.bossTimeFraction} />
      <p class="hint">{t('combat.bossHint', { seconds: view.bossTimeLimit })}</p>
    {/if}

    <Enemy
      kind={view.enemyKind}
      hp={view.enemyHp}
      maxHp={view.enemyMaxHp}
      fraction={view.enemyHpFraction}
      onattack={attack}
    />

    {#if view.farming}
      <div class="farming">
        <p>{t('combat.farming')}</p>
        <button type="button" onclick={challengeBoss}>{t('combat.challengeBoss')}</button>
      </div>
    {/if}

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
  .top {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }
  h1 {
    margin: 0;
    letter-spacing: 0.1em;
  }
  .toggle {
    position: absolute;
    right: 0;
    padding: 0.4rem 0.8rem;
    font: inherit;
    background: #2a2f4d;
    color: var(--text);
    border: 0.125rem solid #000;
    cursor: pointer;
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
  header {
    text-align: center;
  }
  .zone {
    font-size: 1.25rem;
    font-weight: 600;
  }
  .sub,
  .progress {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .farming {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: 0.125rem solid var(--accent);
    text-align: center;
  }
  .farming p {
    margin: 0;
  }
  .farming button {
    padding: 0.5rem 1rem;
    border: 0.125rem solid #000;
    background: var(--accent);
    color: #000;
    font-weight: 700;
    cursor: pointer;
  }
  .hint {
    margin: 0;
    color: var(--muted);
    font-size: 0.9rem;
  }
</style>
