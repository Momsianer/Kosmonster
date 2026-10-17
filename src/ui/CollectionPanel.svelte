<script lang="ts">
  import type { SpeciesId } from '../data/monsters';
  import { t } from '../i18n';
  import MonsterSprite from './MonsterSprite.svelte';
  import type { CollectionEntryView } from './view';

  let {
    entries,
    count,
    shinyCount,
    teamFull,
    onadd,
    onremove,
  }: {
    entries: CollectionEntryView[];
    count: number;
    shinyCount: number;
    teamFull: boolean;
    onadd: (id: SpeciesId) => void;
    onremove: (id: SpeciesId) => void;
  } = $props();
</script>

<section class="panel">
  <h2>{t('collection.title')}</h2>
  <p class="muted">
    {t('collection.count', { caught: count, total: entries.length })} ·
    {t('collection.shinies', { caught: shinyCount, total: entries.length })}
  </p>
  <div class="grid">
    {#each entries as entry (entry.id)}
      <div class="entry" class:unknown={!entry.caught} style:border-color={entry.caught ? entry.rarityColor : undefined}>
        <MonsterSprite speciesId={entry.id} scale={entry.big ? 1 : 2} big={entry.big} unknown={!entry.caught} stage={entry.stage} shiny={entry.shiny} />
        {#if entry.caught}
          <div class="name">{entry.name}{#if entry.shiny} <span class="shinymark">✦</span>{/if}</div>
          <div class="muted">{entry.typeName} · <span style:color={entry.rarityColor}>{entry.rarityName}</span></div>
          <div class="stars">{'★'.repeat(entry.stars)}{'☆'.repeat(entry.maxStars - entry.stars)}</div>
          <div class="muted">{t('collection.caught', { count: entry.caughtCount })}</div>
          {#if entry.starProgress}<div class="muted small">{entry.starProgress}</div>{/if}
          {#if entry.inTeam}
            <button type="button" onclick={() => onremove(entry.id)}>{t('team.remove')}</button>
          {:else}
            <button type="button" disabled={teamFull} onclick={() => onadd(entry.id)}>
              {teamFull ? t('team.full') : t('team.add')}
            </button>
          {/if}
        {:else}
          <div class="name muted">#{String(entry.number).padStart(3, '0')} {t('collection.unknown')}</div>
        {/if}
      </div>
    {/each}
  </div>
</section>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
    gap: 0.5rem;
  }
  .entry {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    background: #10132a;
    text-align: center;
  }
  .entry {
    border-top: 0.2rem solid transparent;
  }
  .stars {
    color: var(--accent);
    font-size: 0.8rem;
    letter-spacing: 0.1em;
  }
  .shinymark {
    color: #fff6b0;
  }
  .small {
    font-size: 0.75rem;
  }
  .entry.unknown {
    opacity: 0.6;
  }
  .name {
    font-weight: 600;
    font-size: 0.9rem;
  }
</style>
