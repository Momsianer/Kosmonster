<script lang="ts">
  import { t } from '../i18n';
  import type { ConstellationView } from './view';

  let {
    constellations,
    found,
    unlocked,
  }: { constellations: ConstellationView[]; found: number; unlocked: boolean } = $props();
</script>

<section class="panel">
  <h2>{t('constellation.title')}</h2>
  <p class="muted">{t('constellation.count', { found, total: constellations.length })}</p>
  {#if !unlocked}<p class="muted">{t('constellation.locked')}</p>{/if}
  <div class="grid">
    {#each constellations as c (c.id)}
      <div class="star" class:found={c.found} class:active={c.active}>
        <div class="name">{c.found ? '✦' : '✧'} {c.name}</div>
        <div class="muted">{c.hint}</div>
        {#if c.found}<div class="muted">{t('constellation.bonus', { mult: c.bonus })}</div>{/if}
        {#if c.active}<div class="on">{t('constellation.active')}</div>{/if}
      </div>
    {/each}
  </div>
</section>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
    gap: 0.5rem;
  }
  .star {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.5rem;
    background: #10132a;
    opacity: 0.5;
  }
  .star.found {
    opacity: 1;
  }
  .star.active {
    outline: 0.125rem solid #9fd3ff;
  }
  .name {
    font-weight: 600;
  }
  .on {
    color: #9fd3ff;
    font-size: 0.85rem;
  }
</style>
