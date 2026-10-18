<script lang="ts">
  import type { SpeciesId } from '../data/monsters';
  import { t } from '../i18n';
  import MonsterSprite from './MonsterSprite.svelte';
  import type { BreedingCandidateView, BreedingSlotView } from './view';

  let {
    slots,
    candidates,
    onbreed,
  }: { slots: BreedingSlotView[]; candidates: BreedingCandidateView[]; onbreed: (id: SpeciesId) => void } = $props();

  const freeSlot = $derived(slots.some((slot) => slot.speciesId === null));
</script>

<section class="panel">
  <h2>{t('breeding.title')}</h2>
  <p class="muted">{t('breeding.intro')}</p>
  <div class="slots">
    {#each slots as slot (slot.index)}
      <div class="slot">
        <div class="muted">{t('breeding.slot', { n: slot.index + 1 })}</div>
        {#if slot.speciesId}
          <MonsterSprite speciesId={slot.speciesId} scale={2} />
          <div class="name">{slot.name}</div>
          <div class="bar"><div class="fill" style:width="{slot.progress * 100}%"></div></div>
          <div class="muted">{t('breeding.remaining', { time: slot.remaining })}</div>
        {:else}
          <div class="egg muted">{t('breeding.empty')}</div>
        {/if}
      </div>
    {/each}
  </div>

  <h3>{t('breeding.candidates')}</h3>
  <div class="grid">
    {#each candidates as c (c.id)}
      <div class="candidate" class:dim={!c.enoughCaught}>
        <MonsterSprite speciesId={c.id} scale={2} stage={c.stage} />
        <div class="name">{c.name}</div>
        <div class="muted">{t('breeding.potential', { mult: c.potential, bred: c.bred })}</div>
        {#if c.busy}
          <div class="muted">{t('breeding.busy')}</div>
        {:else if !c.enoughCaught}
          <div class="muted">{t('breeding.needsTwo', { count: 2 })}</div>
        {:else if !freeSlot}
          <div class="muted">{t('breeding.noSlot')}</div>
        {:else}
          <button type="button" class="primary" disabled={!c.canBreed} onclick={() => onbreed(c.id)}>
            {t('breeding.breed', { time: c.time })}
          </button>
        {/if}
      </div>
    {/each}
  </div>
</section>

<style>
  h3 {
    margin: 0.5rem 0 0;
    font-size: 1rem;
  }
  .slots {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    min-width: 11rem;
    padding: 0.75rem;
    background: #10132a;
    border: 0.125rem dashed #2a2f4d;
  }
  .egg {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 5rem;
    border-radius: 50% 50% 45% 45%;
    border: 0.125rem dashed #2a2f4d;
  }
  .bar {
    width: 100%;
    height: 0.5rem;
    background: #1f2440;
    border: 0.125rem solid #000;
  }
  .fill {
    height: 100%;
    background: #5cc26b;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    gap: 0.5rem;
  }
  .candidate {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 0.5rem;
    background: #10132a;
    text-align: center;
  }
  .candidate.dim {
    opacity: 0.55;
  }
  .name {
    font-weight: 600;
    font-size: 0.9rem;
  }
</style>
