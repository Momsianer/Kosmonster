<script lang="ts">
  import { onDestroy } from 'svelte';
  import { BALANCING } from '../data/balancing';
  import type { SpeciesId } from '../data/monsters';
  import { actions, game } from '../core/game';
  import { t } from '../i18n';
  import BossTimer from './BossTimer.svelte';
  import CollectionPanel from './CollectionPanel.svelte';
  import Enemy from './Enemy.svelte';
  import EnergyDisplay from './EnergyDisplay.svelte';
  import HintBanner from './HintBanner.svelte';
  import OfflineReport from './OfflineReport.svelte';
  import Settings from './Settings.svelte';
  import ShopPanel from './ShopPanel.svelte';
  import TeamPanel from './TeamPanel.svelte';
  import { createView, type BuyAmount } from './view';

  let buyAmount = $state<BuyAmount>(1);
  let view = $state(createView(game.state, game.offlineReport));
  let showSettings = $state(false);

  function refresh() {
    view = createView(game.state, game.offlineReport, buyAmount);
  }

  const timer = setInterval(refresh, 1000 / BALANCING.loop.uiUpdatesPerSecond);
  onDestroy(() => clearInterval(timer));

  /** Führt eine Aktion aus und aktualisiert sofort die Anzeige */
  function act<A extends unknown[]>(fn: (...args: A) => unknown) {
    return (...args: A) => {
      fn(...args);
      refresh();
    };
  }

  const attack = act(actions.clickEnemy);
  const challengeBoss = act(actions.challengeBoss);
  const dismissOffline = act(actions.dismissOfflineReport);
  const levelUp = act((id: SpeciesId) => actions.levelUp(id, buyAmount));
  const addToTeam = act(actions.addToTeam);
  const removeFromTeam = act(actions.removeFromTeam);
  const buySpheres = act(actions.buySpheres);
  const setCatchOnlyNew = act(actions.setCatchOnlyNew);
  const setBuyAmount = act((amount: BuyAmount) => (buyAmount = amount));
  const dismissHint = act(() => view.hint && actions.dismissHint(view.hint));
</script>

<main class:wide={view.teamUnlocked}>
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

  {#if view.hint}
    <HintBanner hint={view.hint} onclose={dismissHint} />
  {/if}

  {#if showSettings}
    <Settings onchange={refresh} />
  {/if}

  <EnergyDisplay value={view.energy} />

  <div class="layout">
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
        speciesId={view.enemySpecies}
        name={view.enemyName}
        hp={view.enemyHp}
        maxHp={view.enemyMaxHp}
        fraction={view.enemyHpFraction}
        onattack={attack}
      />

      <div class="notice" aria-live="polite">{view.catchNotice}</div>

      {#if view.farming}
        <div class="farming">
          <p>{t('combat.farming')}</p>
          <button type="button" onclick={challengeBoss}>{t('combat.challengeBoss')}</button>
        </div>
      {/if}

      {#if view.shopUnlocked && view.spheres === 0}
        <p class="hint">{t('catching.noSpheres')}</p>
      {/if}

      <p class="hint">{t('combat.clickHint')}</p>
      <p class="hint">{t('combat.defeated', { count: view.enemiesDefeated })}</p>
    </section>

    {#if view.teamUnlocked || view.shopUnlocked}
      <aside class="side">
        {#if view.teamUnlocked}
          <TeamPanel
            team={view.team}
            slots={view.teamSlots}
            dps={view.teamDps}
            clickDamage={view.clickDamage}
            {buyAmount}
            onbuyamount={setBuyAmount}
            onlevelup={levelUp}
            onremove={removeFromTeam}
          />
        {/if}
        {#if view.shopUnlocked}
          <ShopPanel
            spheres={view.spheres}
            cost1={view.sphereCost1}
            cost10={view.sphereCost10}
            canBuy1={view.canBuy1}
            canBuy10={view.canBuy10}
            chanceCommon={view.catchChanceCommon}
            chanceUncommon={view.catchChanceUncommon}
            onlyNew={view.catchOnlyNew}
            onbuy={buySpheres}
            ononlynew={setCatchOnlyNew}
          />
        {/if}
      </aside>
    {/if}
  </div>

  {#if view.teamUnlocked}
    <CollectionPanel
      entries={view.collection}
      count={view.collectionCount}
      teamFull={view.teamFull}
      onadd={addToTeam}
      onremove={removeFromTeam}
    />
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    width: 100%;
    max-width: 60rem;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  main.wide {
    max-width: 80rem;
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
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
    width: 100%;
  }
  main.wide .layout {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .battle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
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
  .notice {
    min-height: 1.5rem;
    color: var(--accent);
    font-weight: 700;
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
    text-align: center;
  }
</style>
