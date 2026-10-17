<script lang="ts">
  import { onDestroy } from 'svelte';
  import { BALANCING } from '../data/balancing';
  import type { ModuleId } from '../data/modules';
  import type { SpeciesId } from '../data/monsters';
  import type { ResearchId } from '../data/research';
  import { actions, game } from '../core/game';
  import { t } from '../i18n';
  import BossTimer from './BossTimer.svelte';
  import CollectionPanel from './CollectionPanel.svelte';
  import Enemy from './Enemy.svelte';
  import EnergyDisplay from './EnergyDisplay.svelte';
  import HintBanner from './HintBanner.svelte';
  import OfflineReport from './OfflineReport.svelte';
  import Settings from './Settings.svelte';
  import ResearchPanel from './ResearchPanel.svelte';
  import ShopPanel from './ShopPanel.svelte';
  import SupernovaPanel from './SupernovaPanel.svelte';
  import StationPanel from './StationPanel.svelte';
  import TeamPanel from './TeamPanel.svelte';
  import { createView, type BuyAmount } from './view';

  let buyAmount = $state<BuyAmount>(1);
  let view = $state(createView(game.state, game.offlineReport));
  let showSettings = $state(false);
  let tab = $state<'game' | 'research' | 'collection'>('game');

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
  const zoneDown = act(() => actions.changeZone(view.zone - 1));
  const zoneUp = act(() => actions.changeZone(view.zone + 1));
  const setAutoProgress = act(actions.setAutoProgress);
  const dismissOffline = act(actions.dismissOfflineReport);
  const levelUp = act((id: SpeciesId) => actions.levelUp(id, buyAmount));
  const addToTeam = act(actions.addToTeam);
  const removeFromTeam = act(actions.removeFromTeam);
  const buySpheres = act(actions.buySpheres);
  const setCatchOnlyNew = act(actions.setCatchOnlyNew);
  const buyModule = act((id: ModuleId) => actions.buyModule(id, buyAmount));
  const triggerSupernova = act(actions.supernova);
  const buyResearch = act((id: ResearchId) => actions.buyResearch(id));
  const evolve = act((id: SpeciesId) => actions.evolve(id));
  const setBuyAmount = act((amount: BuyAmount) => (buyAmount = amount));
  const dismissHint = act(() => view.hint && actions.dismissHint(view.hint));
</script>

<main class:wide={view.teamUnlocked || view.stationUnlocked}>
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

  <EnergyDisplay
    value={view.energy}
    perSecond={view.stationUnlocked ? view.production : ''}
    stardust={view.showStardust ? view.stardust : ''}
    bonus={view.stardustBonus}
  />

  {#if view.teamUnlocked}
    <nav class="tabs">
      <button type="button" class:active={tab === 'game'} onclick={() => (tab = 'game')}>{t('tabs.game')}</button>
      {#if view.researchUnlocked}
        <button type="button" class:active={tab === 'research'} onclick={() => (tab = 'research')}>{t('tabs.research')}</button>
      {/if}
      <button type="button" class:active={tab === 'collection'} onclick={() => (tab = 'collection')}>{t('tabs.collection')}</button>
    </nav>
  {/if}

  {#if tab === 'research' && view.researchUnlocked}
    <ResearchPanel branches={view.research} stardust={view.stardust} bonus={view.stardustBonus} onbuy={buyResearch} />
  {:else if tab === 'collection' && view.teamUnlocked}
    <CollectionPanel
      entries={view.collection}
      count={view.collectionCount}
      teamFull={view.teamFull}
      onadd={addToTeam}
      onremove={removeFromTeam}
    />
  {:else}
  <div class="layout">
    <section class="battle">
      <header>
        <div class="zone-nav">
          <button type="button" class="nav" aria-label={t('combat.zoneDown')} title={t('combat.zoneDown')}
            disabled={!view.canZoneDown} onclick={zoneDown}>◀</button>
          <div class="zone">{t('combat.zone', { zone: view.zone })}</div>
          <button type="button" class="nav" aria-label={t('combat.zoneUp')} title={t('combat.zoneUp')}
            disabled={!view.canZoneUp} onclick={zoneUp}>▶</button>
        </div>
        <div class="sub">
          {t('combat.starSystem', { system: view.starSystem })} · {t('combat.highestZone', { zone: view.highestZone })}
        </div>
        <label class="auto">
          <input type="checkbox" checked={!view.farming} onchange={(e) => setAutoProgress(e.currentTarget.checked)} />
          {t('combat.autoProgress')}
        </label>
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

      {#if view.bossBlocked}
        <div class="farming">
          <p>{t('combat.bossFailed')}</p>
          <button type="button" onclick={challengeBoss}>{t('combat.challengeBoss')}</button>
        </div>
      {:else if view.farming}
        <p class="hint">{t('combat.farming')}</p>
      {/if}

      {#if view.shopUnlocked && view.spheres === 0}
        <p class="hint">{t('catching.noSpheres')}</p>
      {/if}

      <p class="hint">{t('combat.clickHint')}</p>
      <p class="hint">{t('combat.defeated', { count: view.enemiesDefeated })}</p>
    </section>

    {#if view.teamUnlocked || view.stationUnlocked || view.shopUnlocked || view.supernovaUnlocked}
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
            evolutionUnlocked={view.evolutionUnlocked}
            onevolve={evolve}
          />
        {/if}
        {#if view.supernovaUnlocked}
          <SupernovaPanel
            gain={view.stardustGain}
            available={view.canSupernova}
            zone={view.supernovaZone}
            count={view.supernovas}
            onsupernova={triggerSupernova}
          />
        {/if}
        {#if view.stationUnlocked}
          <StationPanel
            modules={view.modules}
            production={view.production}
            {buyAmount}
            onbuyamount={setBuyAmount}
            onbuy={buyModule}
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
  .tabs {
    display: flex;
    gap: 0.5rem;
    width: 100%;
    border-bottom: 0.125rem solid #2a2f4d;
  }
  .tabs button {
    padding: 0.5rem 1.25rem;
    font: inherit;
    background: none;
    color: var(--muted);
    border: none;
    border-bottom: 0.2rem solid transparent;
    cursor: pointer;
  }
  .tabs button.active {
    color: var(--text);
    border-bottom-color: var(--accent);
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
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    text-align: center;
  }
  .zone-nav {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .nav {
    padding: 0.2rem 0.6rem;
    font: inherit;
    background: #2a2f4d;
    color: var(--text);
    border: 0.125rem solid #000;
    cursor: pointer;
  }
  .nav:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .auto {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--muted);
    font-size: 0.85rem;
    cursor: pointer;
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
