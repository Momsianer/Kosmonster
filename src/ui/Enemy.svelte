<script lang="ts">
  import type { EnemyKind } from '../core/formulas';
  import { t } from '../i18n';

  let {
    kind,
    hp,
    maxHp,
    fraction,
    onattack,
  }: { kind: EnemyKind; hp: string; maxHp: string; fraction: number; onattack: () => void } =
    $props();

  const label = $derived(
    kind === 'systemBoss' ? t('combat.systemBoss') : kind === 'boss' ? t('combat.boss') : t('combat.enemy'),
  );
</script>

<div class="enemy">
  {#if kind !== 'normal'}
    <div class="kind">{label}</div>
  {/if}
  <button class="sprite {kind}" type="button" aria-label={label} onclick={onattack}>
    <span>?</span>
  </button>
  <div class="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fraction * 100)}>
    <div class="fill" style:width="{fraction * 100}%"></div>
  </div>
  <div class="hp">{t('combat.hp', { hp, maxHp })}</div>
</div>

<style>
  .enemy {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }
  .sprite {
    width: 8rem;
    aspect-ratio: 1;
    border: 0.25rem solid #5a3f8c;
    background: #3b2a5e;
    color: var(--text);
    font-size: 3rem;
    font-weight: 700;
    cursor: pointer;
    image-rendering: pixelated;
    transition: transform 60ms;
  }
  /* Bosse sind doppelt so groß (64 statt 32 Pixel) */
  .sprite.boss,
  .sprite.systemBoss {
    width: 16rem;
    font-size: 6rem;
  }
  .sprite.boss {
    border-color: #8c3f3f;
    background: #5e2a2a;
  }
  .sprite.systemBoss {
    border-color: #8c7a3f;
    background: #5e4e2a;
  }
  .kind {
    color: var(--accent);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .sprite:active {
    transform: scale(0.94);
  }
  .bar {
    width: min(100%, 20rem);
    height: 1rem;
    background: var(--hp-bg);
    border: 0.125rem solid #000;
  }
  .fill {
    height: 100%;
    background: var(--hp);
    transition: width 80ms linear;
  }
  .hp {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
</style>
