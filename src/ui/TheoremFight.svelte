<script lang="ts">
  import { t } from '../i18n';

  let {
    hp,
    maxHp,
    fraction,
    time,
    timeFraction,
    onattack,
  }: { hp: string; maxHp: string; fraction: number; time: string; timeFraction: number; onattack: () => void } =
    $props();
</script>

<div class="fight">
  <div class="title">{t('theorem.fight')}</div>
  <div class="timer">
    <div class="bar"><div class="fill time" style:width="{timeFraction * 100}%"></div></div>
    <span>{t('theorem.time', { seconds: time })}</span>
  </div>
  <button type="button" class="theorem" aria-label={t('theorem.title')} onclick={onattack}>∎</button>
  <div class="bar wide"><div class="fill" style:width="{fraction * 100}%"></div></div>
  <div class="hp">{t('theorem.hp', { hp, maxHp })}</div>
</div>

<style>
  .fight {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
  }
  .title {
    color: #fff6b0;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
  .timer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: min(100%, 20rem);
  }
  .theorem {
    width: 16rem;
    aspect-ratio: 1;
    border: 0.25rem solid #fff6b0;
    background: radial-gradient(circle, #2b2450, #0b0d1a);
    color: #fff6b0;
    font-size: 8rem;
    cursor: pointer;
  }
  .theorem:active {
    transform: scale(0.97);
  }
  .bar {
    flex: 1;
    height: 0.6rem;
    background: #1f2440;
    border: 0.125rem solid #000;
  }
  .bar.wide {
    flex: none;
    width: min(100%, 24rem);
    height: 1rem;
  }
  .fill {
    height: 100%;
    background: var(--hp);
  }
  .fill.time {
    background: #fff6b0;
  }
  .hp {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
</style>
