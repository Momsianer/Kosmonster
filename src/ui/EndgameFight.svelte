<script lang="ts">
  import { t } from '../i18n';
  import type { EndgameRunView } from './view';

  let { run, onattack, onretreat }: { run: EndgameRunView; onattack: () => void; onretreat: () => void } = $props();
</script>

<div class="fight" class:zero={run.zero}>
  <div class="title">{t(`endgame.${run.mode}.name`)}</div>
  <div class="stage">{run.title}</div>
  <div class="muted">{run.info}</div>
  <div class="timer">
    <div class="bar"><div class="fill time" style:width="{run.timeFraction * 100}%"></div></div>
    <span>{t('endgame.time', { seconds: run.time })}</span>
  </div>
  <button type="button" class="foe" aria-label={run.title} onclick={onattack}>∞</button>
  <div class="bar wide"><div class="fill" style:width="{run.fraction * 100}%"></div></div>
  <div class="hp">{t('endgame.hp', { hp: run.hp, maxHp: run.maxHp })}</div>
  <button type="button" class="retreat" onclick={onretreat}>{t('endgame.retreat')}</button>
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
    color: #c9a7ff;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
  .stage {
    font-size: 1.1rem;
    font-weight: 600;
  }
  .muted {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .zero .muted {
    color: #fff6b0;
    font-weight: 700;
  }
  .timer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: min(100%, 20rem);
  }
  .foe {
    width: 14rem;
    aspect-ratio: 1;
    border: 0.25rem solid #9b5de5;
    background: radial-gradient(circle, #2b1f50, #0b0d1a);
    color: #c9a7ff;
    font-size: 7rem;
    cursor: pointer;
  }
  .zero .foe {
    border-color: #fff6b0;
  }
  .foe:active {
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
    background: #c9a7ff;
  }
  .hp {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .retreat {
    padding: 0.4rem 1rem;
    font: inherit;
    background: #2a2f4d;
    color: var(--text);
    border: 0.125rem solid #000;
    cursor: pointer;
  }
</style>
