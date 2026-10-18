<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { MonsterType } from '../data/types';
  import PixelIcon from './PixelIcon.svelte';

  /**
   * Pixelsternenhimmel im Hintergrund, getönt in der Farbe der aktuellen Welt.
   * Ein Teil der Sterne hat die Form des Typsymbols, das der Planet stärkt.
   * Positionen in Prozent, damit das Layout keine festen Breiten braucht.
   * Feste Zufallsfolge, damit der Himmel stabil bleibt.
   */
  let { type, color }: { type: MonsterType; color: string } = $props();

  const COUNT = 90;
  const SYMBOLS = 16;
  const COLORS = ['#ffffff', '#c9d4ff', '#fff3c4'];

  let seed = 7;
  function random(): number {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  }

  const stars = Array.from({ length: COUNT }, () => ({
    x: random() * 100,
    y: random() * 100,
    size: random() < 0.15 ? 3 : random() < 0.5 ? 2 : 1,
    color: COLORS[Math.floor(random() * COLORS.length)],
    tinted: random() < 0.3,
    delay: random() * 6,
    duration: 3 + random() * 5,
  }));

  const symbols = Array.from({ length: SYMBOLS }, () => ({
    x: 2 + random() * 94,
    y: 2 + random() * 94,
    scale: random() < 0.3 ? 2 : 1,
    delay: random() * 8,
    duration: 5 + random() * 6,
  }));
</script>

<div class="sky" aria-hidden="true" style:--world={color}>
  {#key type}
    <div class="tint" transition:fade={{ duration: 800 }}></div>
    <div class="symbols" transition:fade={{ duration: 800 }}>
        {#each symbols as s, i (i)}
          <span class="symbol" style:left="{s.x}%" style:top="{s.y}%" style:animation-delay="{s.delay}s"
            style:animation-duration="{s.duration}s">
            <PixelIcon id={type} scale={s.scale} />
          </span>
        {/each}
    </div>
  {/key}
  {#each stars as s, i (i)}
    <span
      class="star"
      style:left="{s.x}%"
      style:top="{s.y}%"
      style:width="{s.size * 0.125}rem"
      style:height="{s.size * 0.125}rem"
      style:background={s.tinted ? 'var(--world)' : s.color}
      style:animation-delay="{s.delay}s"
      style:animation-duration="{s.duration}s"
    ></span>
  {/each}
</div>

<style>
  .sky {
    position: fixed;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    pointer-events: none;
    background: var(--bg);
  }
  .tint,
  .symbols {
    position: absolute;
    inset: 0;
  }
  .tint {
    background:
      radial-gradient(ellipse at 70% 10%, color-mix(in srgb, var(--world) 22%, transparent) 0%, transparent 55%),
      radial-gradient(ellipse at 10% 90%, color-mix(in srgb, var(--world) 14%, transparent) 0%, transparent 50%);
  }
  .star,
  .symbol {
    position: absolute;
    animation-name: twinkle;
    animation-iteration-count: infinite;
    animation-timing-function: steps(3);
  }
  .symbol {
    animation-name: glimmer;
    /* Heller Rand, damit auch dunkle Symbole (Null) sichtbar bleiben */
    filter: drop-shadow(0 0 0.0625rem rgb(255 255 255 / 0.6));
  }
  @keyframes twinkle {
    0%,
    100% {
      opacity: 0.25;
    }
    50% {
      opacity: 0.9;
    }
  }
  @keyframes glimmer {
    0%,
    100% {
      opacity: 0.12;
    }
    50% {
      opacity: 0.45;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .star,
    .symbol {
      animation: none;
      opacity: 0.4;
    }
  }
</style>
