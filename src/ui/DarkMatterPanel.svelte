<script lang="ts">
  import type { AutomationId, DmUpgradeId } from '../data/darkmatter';
  import { t } from '../i18n';
  import type { AutomationView, DmUpgradeView } from './view';

  let {
    darkMatter,
    gravity,
    gain,
    available,
    minStardust,
    stardustCycle,
    count,
    upgrades,
    automations,
    autoclickRate,
    ownsAutospheres,
    ownsAutosupernova,
    ownsAutoBlackHole = false,
    sphereTarget,
    supernovaTarget,
    blackHoleTarget = 1,
    onblackhole,
    onbuy,
    ontoggle,
    onspheretarget,
    onsupernovatarget,
    onblackholetarget = () => {},
  }: {
    darkMatter: string;
    gravity: string;
    gain: string;
    available: boolean;
    minStardust: string;
    stardustCycle: string;
    count: number;
    upgrades: DmUpgradeView[];
    automations: AutomationView[];
    autoclickRate: string;
    ownsAutospheres: boolean;
    ownsAutosupernova: boolean;
    ownsAutoBlackHole?: boolean;
    sphereTarget: number;
    supernovaTarget: number;
    blackHoleTarget?: number;
    onblackhole: () => void;
    onbuy: (id: DmUpgradeId) => void;
    ontoggle: (id: AutomationId | 'autoschwarzloch', on: boolean) => void;
    onspheretarget: (value: number) => void;
    onsupernovatarget: (value: number) => void;
    onblackholetarget?: (value: number) => void;
  } = $props();

  let confirming = $state(false);

  function numberFrom(event: Event): number {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }
</script>

<div class="columns">
  <section class="panel blackhole">
    <h2>{t('darkMatter.blackHoleTitle')}</h2>
    <p>{t('darkMatter.amount', { amount: darkMatter })} · {t('darkMatter.gravity', { mult: gravity })}</p>
    {#if available}
      <p>{t('darkMatter.gain', { amount: gain })}</p>
    {:else}
      <p class="muted">{t('darkMatter.locked', { amount: minStardust, current: stardustCycle })}</p>
    {/if}
    <p class="muted">{t('darkMatter.explain')}</p>
    {#if count > 0}<p class="muted">{t('darkMatter.count', { count })}</p>{/if}
    {#if !confirming}
      <div><button type="button" class="primary" disabled={!available} onclick={() => (confirming = true)}>{t('darkMatter.button')}</button></div>
    {:else}
      <p>{t('darkMatter.confirm')}</p>
      <div class="row">
        <button type="button" class="primary" onclick={() => { confirming = false; onblackhole(); }}>{t('darkMatter.confirmButton')}</button>
        <button type="button" onclick={() => (confirming = false)}>{t('prestige.cancel')}</button>
      </div>
    {/if}
  </section>

  {#if automations.length > 0}
    <section class="panel">
      <h2>{t('automation.title')}</h2>
      {#each automations as auto (auto.id)}
        <label class="row toggle">
          <input type="checkbox" checked={auto.enabled} onchange={(e) => ontoggle(auto.id, e.currentTarget.checked)} />
          {auto.name}
          {#if auto.id === 'autoklicker'}<span class="muted">· {t('automation.clicksPerSecond', { rate: autoclickRate })}</span>{/if}
        </label>
      {/each}
      {#if ownsAutospheres}
        <label class="row">
          {t('automation.sphereTarget')}
          <input type="number" min="0" step="1" value={sphereTarget} onchange={(e) => onspheretarget(Math.floor(numberFrom(e)))} />
        </label>
      {/if}
      {#if ownsAutosupernova}
        <label class="row">
          {t('automation.supernovaTarget')}
          <input type="number" min="1" step="1" value={supernovaTarget} onchange={(e) => onsupernovatarget(numberFrom(e))} />
        </label>
      {/if}
      {#if ownsAutoBlackHole}
        <label class="row">
          {t('automation.blackHoleTarget')}
          <input type="number" min="1" step="1" value={blackHoleTarget} onchange={(e) => onblackholetarget(numberFrom(e))} />
        </label>
      {/if}
    </section>
  {/if}
</div>

<section class="panel">
  <h2>{t('darkMatter.upgradesTitle')}</h2>
  <div class="grid">
    {#each upgrades as upgrade (upgrade.id)}
      <div class="node" class:locked={!upgrade.available} class:maxed={upgrade.maxed}>
        <div class="name">{upgrade.name}</div>
        <div class="muted">{upgrade.description}</div>
        <div class="muted">{t('darkMatter.level', { level: upgrade.level, max: upgrade.maxLevel })}</div>
        {#if upgrade.maxed}
          <div class="done">{t('darkMatter.maxed')}</div>
        {:else if !upgrade.available}
          <div class="muted">{upgrade.requires}</div>
        {:else}
          <button type="button" class="primary" disabled={!upgrade.affordable} onclick={() => onbuy(upgrade.id)}>
            {t('darkMatter.buy', { cost: upgrade.cost })}
          </button>
        {/if}
      </div>
    {/each}
  </div>
</section>

<style>
  p {
    margin: 0;
  }
  .columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    gap: 1.25rem;
    width: 100%;
  }
  .blackhole {
    border-left: 0.25rem solid #6b4cc2;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
  .toggle {
    cursor: pointer;
  }
  input[type='number'] {
    width: 8rem;
    padding: 0.3rem;
    font: inherit;
    background: #0b0d1a;
    color: var(--text);
    border: 0.125rem solid #2a2f4d;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 0.75rem;
  }
  .node {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    padding: 0.6rem;
    background: #10132a;
    border-left: 0.2rem solid #2a2f4d;
  }
  .node.locked {
    opacity: 0.5;
  }
  .node.maxed {
    border-left-color: #6b4cc2;
  }
  .name {
    font-weight: 600;
  }
  .done {
    color: #b48cff;
    font-size: 0.85rem;
  }
</style>
