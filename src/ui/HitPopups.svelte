<script lang="ts">
  /** Aufsteigende Schadenszahlen über dem Gegner */
  const LIFETIME_MS = 700;
  const MAX_POPUPS = 12;

  let popups = $state<{ id: number; text: string; x: number }[]>([]);
  let next = 0;

  export function add(text: string): void {
    const id = next++;
    popups = [...popups.slice(-(MAX_POPUPS - 1)), { id, text, x: 20 + Math.random() * 60 }];
    setTimeout(() => {
      popups = popups.filter((p) => p.id !== id);
    }, LIFETIME_MS);
  }
</script>

<div class="popups" aria-hidden="true">
  {#each popups as p (p.id)}
    <span class="popup" style:left="{p.x}%">{p.text}</span>
  {/each}
</div>

<style>
  .popups {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
  }
  .popup {
    position: absolute;
    top: 40%;
    transform: translateX(-50%);
    color: #fff3c4;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    text-shadow:
      0.125rem 0.125rem 0 #000,
      -0.0625rem -0.0625rem 0 #000;
    animation: rise 700ms steps(7) forwards;
    white-space: nowrap;
  }
  @keyframes rise {
    from {
      opacity: 1;
      margin-top: 0;
    }
    to {
      opacity: 0;
      margin-top: -3rem;
    }
  }
</style>
