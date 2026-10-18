<script lang="ts">
  import { DARK_TYPES, getSpecies, TYPE_COLORS, type SpeciesId } from '../data/monsters';
  import { spriteUrl } from './sprites';

  /** scale: ganzzahlige Vergrößerung der 32×32 Pixel (Bosse 64×64) */
  let {
    speciesId,
    scale = 2,
    big = false,
    unknown = false,
    stage = 0,
    shiny = false,
  }: {
    speciesId: SpeciesId;
    scale?: number;
    big?: boolean;
    unknown?: boolean;
    stage?: number;
    shiny?: boolean;
  } = $props();

  const species = $derived(getSpecies(speciesId));
  const url = $derived(species && !unknown ? spriteUrl(species, stage) : null);
  const size = $derived((big ? 64 : 32) * scale);
  const color = $derived(species && !unknown ? TYPE_COLORS[species.type] : '#2a2f4d');
  const lightText = $derived(!!species && !unknown && DARK_TYPES.includes(species.type));
  const label = $derived(
    species
      ? (species.boss ? 'B' : '') + String(species.number).padStart(3, '0') + (stage > 0 ? '+'.repeat(stage) : '')
      : '',
  );
</script>

<div class="sprite" class:shiny style:width="{size / 16}rem" style:height="{size / 16}rem">
  {#if url}
    <img src={url} alt="" width={size} height={size} />
  {:else}
    <div class="placeholder" class:light={lightText} style:background={color} style:font-size="{size / 64}rem">
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
  /* Polarstern: eigene Farbe und Leuchten */
  .shiny {
    filter: hue-rotate(160deg) saturate(1.4);
    box-shadow: 0 0 0.6rem #fff6b0;
  }
  .placeholder.light {
    color: rgb(255 255 255 / 0.8);
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
