<script lang="ts">
  import { t } from '../i18n';
  import MonsterSprite from './MonsterSprite.svelte';
  import type { AreaEntryView, AreaView } from './view';

  /** Welche Arten und Bossmonster in diesem Gebiet vorkommen, nicht gefangene nur als Fragezeichen */
  let { area }: { area: AreaView } = $props();
</script>

{#snippet entry(e: AreaEntryView)}
  <div class="entry" class:current={e.current} title={e.caught ? e.name : t('area.unknownHint')}>
    <MonsterSprite speciesId={e.id} scale={1} big={e.big} unknown={!e.caught} shiny={e.shiny} />
    <div class="text">
      <div class="name">{e.name}</div>
      <div class="muted"><span style:color={e.rarityColor}>{e.rarityName}</span>{#if e.chance}&nbsp;· {e.chance}{/if}</div>
      {#if e.zone !== null}<div class="muted">{t('area.bossZone', { zone: e.zone })}</div>{/if}
    </div>
  </div>
{/snippet}

<section class="area">
  <h3>{t('area.title', { system: area.system, from: area.fromZone, to: area.toZone })}</h3>
  <div class="list">
    {#each area.species as e (e.id)}
      {@render entry(e)}
    {/each}
  </div>
  <div class="list">
    {#each area.bosses as e (e.id)}
      {@render entry(e)}
    {/each}
  </div>
  <p class="muted">{t('area.hint')}</p>
</section>

<style>
  .area {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    padding-top: 0.75rem;
    border-top: 0.125rem solid #2a2f4d;
  }
  h3 {
    margin: 0;
    font-size: 0.95rem;
    text-align: center;
  }
  .list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    gap: 0.4rem;
  }
  .entry {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.5rem;
    background: #10132a;
    min-width: 0;
  }
  .entry.current {
    outline: 0.125rem solid var(--accent);
  }
  .text {
    min-width: 0;
  }
  .name {
    font-weight: 600;
    font-size: 0.85rem;
  }
  .name,
  .muted {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .muted {
    margin: 0;
    color: var(--muted);
    font-size: 0.75rem;
  }
  p.muted {
    white-space: normal;
    text-align: center;
  }
</style>
