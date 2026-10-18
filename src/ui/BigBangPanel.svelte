<script lang="ts">
  import type { ChallengeId } from '../data/challenges';
  import type { OriginId } from '../data/origin';
  import { t } from '../i18n';
  import type { ChallengeView, OriginUpgradeView } from './view';

  let {
    originPoints,
    gain,
    available,
    infinity,
    count,
    inChallenge,
    rules,
    tree,
    challenges,
    challengesUnlocked,
    endgameUnlocked,
    tierInfo,
    theoremAvailable,
    theoremDefeated,
    onbigbang,
    onbuy,
    onstart,
    onabandon,
    ontheorem,
  }: {
    originPoints: string;
    gain: string;
    available: boolean;
    infinity: string;
    count: number;
    inChallenge: boolean;
    rules: OriginUpgradeView[];
    tree: OriginUpgradeView[];
    challenges: ChallengeView[];
    challengesUnlocked: boolean;
    endgameUnlocked: boolean;
    tierInfo: string;
    theoremAvailable: boolean;
    theoremDefeated: boolean;
    onbigbang: () => void;
    onbuy: (id: OriginId) => void;
    onstart: (id: ChallengeId) => void;
    onabandon: () => void;
    ontheorem: () => void;
  } = $props();

  let confirmBigBang = $state(false);
  let confirmChallenge = $state<ChallengeId | null>(null);
</script>

<div class="columns">
  <section class="panel bigbang">
    <h2>{t('bigBang.title')}</h2>
    <p>{t('bigBang.points', { amount: originPoints })}</p>
    {#if inChallenge}
      <p class="muted">{t('bigBang.blockedByChallenge')}</p>
    {:else if available}
      <p>{t('bigBang.gain', { amount: gain })}</p>
    {:else}
      <p class="muted">{t('bigBang.locked', { amount: infinity })}</p>
    {/if}
    <p class="muted">{t('bigBang.explain')}</p>
    {#if count > 0}<p class="muted">{t('bigBang.count', { count })}</p>{/if}
    {#if !confirmBigBang}
      <div><button type="button" class="primary" disabled={!available} onclick={() => (confirmBigBang = true)}>{t('bigBang.button')}</button></div>
    {:else}
      <p>{t('bigBang.confirm')}</p>
      <div class="row">
        <button type="button" class="primary" onclick={() => { confirmBigBang = false; onbigbang(); }}>{t('bigBang.confirmButton')}</button>
        <button type="button" onclick={() => (confirmBigBang = false)}>{t('prestige.cancel')}</button>
      </div>
    {/if}
  </section>

  {#if theoremAvailable}
    <section class="panel theorem">
      <h2>{t('theorem.title')}</h2>
      {#if theoremDefeated}
        <p>{t('theorem.defeated')}</p>
      {:else}
        <p class="muted">{t('theorem.intro')}</p>
        <div><button type="button" class="primary" onclick={ontheorem}>{t('theorem.button')}</button></div>
      {/if}
    </section>
  {/if}
</div>

{#if count > 0}
  <section class="panel">
    <h2>{t('origin.rulesTitle')}</h2>
    <div class="grid">
      {#each [...rules] as u (u.id)}
        <div class="node" class:maxed={u.maxed}>
          <div class="name">{u.name}</div>
          <div class="muted">{u.description}</div>
          <div class="muted">{t('origin.level', { level: u.level, max: u.maxLevel })}</div>
          {#if u.maxed}
            <div class="done">{t('origin.maxed')}</div>
          {:else}
            <button type="button" class="primary" disabled={!u.affordable} onclick={() => onbuy(u.id)}>{t('origin.buy', { cost: u.cost })}</button>
          {/if}
        </div>
      {/each}
    </div>
    <h2>{t('origin.treeTitle')}</h2>
    <div class="grid">
      {#each [...tree] as u (u.id)}
        <div class="node" class:maxed={u.maxed}>
          <div class="name">{u.name}</div>
          <div class="muted">{u.description}</div>
          <div class="muted">{t('origin.level', { level: u.level, max: u.maxLevel })}</div>
          {#if u.maxed}
            <div class="done">{t('origin.maxed')}</div>
          {:else}
            <button type="button" class="primary" disabled={!u.affordable} onclick={() => onbuy(u.id)}>{t('origin.buy', { cost: u.cost })}</button>
          {/if}
        </div>
      {/each}
    </div>
  </section>
{/if}

{#if challengesUnlocked}
  <section class="panel">
    <h2>{t('challenge.title')}</h2>
    <p class="muted">{t('challenge.intro')}</p>
    {#if endgameUnlocked}<p class="muted">{tierInfo}</p>{/if}
    <div class="grid">
      {#each challenges as c (c.id)}
        <div class="node" class:maxed={c.completed} class:running={c.active}>
          <div class="name">
            {c.name}{#if c.tier > 1} <span class="done">· {t('challenge.tierDone', { tier: c.tier })}</span>{:else if c.completed} <span class="done">· {t('challenge.completed')}</span>{/if}
          </div>
          <div class="muted">{c.description}</div>
          <div class="muted">{t('challenge.goal', { zone: c.goal })} · {t('challenge.reward', { points: c.reward })}</div>
          <div class="muted">{c.bonus}</div>
          {#if c.active}
            <button type="button" onclick={onabandon}>{t('challenge.abandon')}</button>
          {:else if confirmChallenge === c.id}
            <p class="warn">{t('challenge.confirmStart')}</p>
            <div class="row">
              <button type="button" class="primary" onclick={() => { confirmChallenge = null; onstart(c.id); }}>{t('challenge.confirmButton')}</button>
              <button type="button" onclick={() => (confirmChallenge = null)}>{t('prestige.cancel')}</button>
            </div>
          {:else}
            <button type="button" class="primary" disabled={inChallenge} onclick={() => (confirmChallenge = c.id)}>
              {c.nextTier > 1 ? t('challenge.startTier', { tier: c.nextTier }) : t('challenge.start')}
            </button>
          {/if}
        </div>
      {/each}
    </div>
  </section>
{/if}

<style>
  p {
    margin: 0;
  }
  h2 + .grid {
    margin-bottom: 0.5rem;
  }
  .columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    gap: 1.25rem;
    width: 100%;
  }
  .bigbang {
    border-left: 0.25rem solid #ff7a59;
  }
  .theorem {
    border-left: 0.25rem solid #fff6b0;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
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
  .node.maxed {
    border-left-color: #ff7a59;
  }
  .node.running {
    border-left-color: var(--accent);
    outline: 0.125rem solid var(--accent);
  }
  .name {
    font-weight: 600;
  }
  .done {
    color: #ff9f80;
    font-size: 0.85rem;
  }
  .warn {
    color: var(--hp);
    font-size: 0.85rem;
  }
</style>
