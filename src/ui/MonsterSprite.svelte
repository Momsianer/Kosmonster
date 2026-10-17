<script lang="ts">
  import { getSpecies, TYPE_COLORS, type SpeciesId } from '../data/monsters';
  import { spriteUrl } from './sprites';

  /** scale: ganzzahlige Vergrößerung der 32×32 Pixel (Bosse 64×64) */
  let {
    speciesId,
    scale = 2,
    big = false,
    unknown = false,
  }: { speciesId: SpeciesId; scale?: number; big?: boolean; unknown?: boolean } = $props();

  const species = $derived(getSpecies(speciesId));
  const url = $derived(species && !unknown ? spriteUrl(species) : null);
  const size = $derived((big ? 64 : 32) * scale);
  const color = $derived(species && !unknown ? TYPE_COLORS[species.type] : '#2a2f4d');
  const label = $derived(species ? String(species.number).padStart(3, '0') : '');
</script>

<div class="sprite" style:width="{size / 16}rem" style:height="{size / 16}rem">
  {#if url}
    <img src={url} alt="" width={size} height={size} />
  {:else}
    <div class="placeholder" style:background={color} style:font-size="{size / 64}rem">
      {unknown ? '?' : label}
    </div>
  {/if}
</div>

<style>
  .sprite {
    flex: none;
    image-rendering: pixelated;
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }
  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border: 0.125rem solid rgb(0 0 0 / 0.5);
    color: rgb(0 0 0 / 0.65);
    font-family: monospace;
    font-weight: 700;
  }
</style>
