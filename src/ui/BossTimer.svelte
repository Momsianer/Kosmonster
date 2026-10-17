<script lang="ts">
  import { t } from '../i18n';

  let { time, fraction }: { time: string; fraction: number } = $props();
</script>

<div class="timer">
  <div class="bar">
    <div class="fill" class:low={fraction < 0.25} style:width="{fraction * 100}%"></div>
  </div>
  <span class="time">{t('combat.bossTime', { seconds: time })}</span>
</div>

<style>
  .timer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: min(100%, 20rem);
  }
  .bar {
    flex: 1;
    height: 0.5rem;
    background: #1f2440;
    border: 0.125rem solid #000;
  }
  .fill {
    height: 100%;
    background: var(--accent);
  }
  .fill.low {
    background: var(--hp);
  }
  .time {
    min-width: 3.5rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
</style>
