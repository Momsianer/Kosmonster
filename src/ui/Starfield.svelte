<script lang="ts">
  /**
   * Pixelsternenhimmel im Hintergrund. Positionen in Prozent, damit das Layout
   * keine festen Breiten braucht. Feste Zufallsfolge, damit der Himmel stabil bleibt.
   */
  const COUNT = 90;
  const COLORS = ['#ffffff', '#c9d4ff', '#fff3c4', '#b48cff'];

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
    delay: random() * 6,
    duration: 3 + random() * 5,
  }));
</script>

<div class="sky" aria-hidden="true">
  {#each stars as s, i (i)}
    <span
      class="star"
      style:left="{s.x}%"
      style:top="{s.y}%"
      style:width="{s.size * 0.125}rem"
      style:height="{s.size * 0.125}rem"
      style:background={s.color}
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
    background: radial-gradient(ellipse at 70% 10%, #1a1640 0%, transparent 55%),
      radial-gradient(ellipse at 10% 90%, #10233a 0%, transparent 50%), var(--bg);
  }
  .star {
    position: absolute;
    opacity: 0.7;
    animation-name: twinkle;
    animation-iteration-count: infinite;
    animation-timing-function: steps(3);
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
  @media (prefers-reduced-motion: reduce) {
    .star {
      animation: none;
    }
  }
</style>
