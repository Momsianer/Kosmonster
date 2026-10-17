<script lang="ts">
  import { t } from '../i18n';

  let {
    value,
    perSecond = '',
    stardust = '',
    bonus = '',
  }: { value: string; perSecond?: string; stardust?: string; bonus?: string } = $props();
</script>

<div class="energy">
  <span class="label">{t('currency.energy')}</span>
  <span class="value">{value}</span>
  {#if perSecond}
    <span class="rate">{t('station.perSecond', { amount: perSecond })}</span>
  {/if}
  {#if stardust}
    <span class="stardust">{t('prestige.stardustAmount', { amount: stardust })} · {t('prestige.bonus', { bonus })}</span>
  {/if}
</div>

<style>
  .energy {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
  .label {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .stardust {
    color: #b48cff;
    font-variant-numeric: tabular-nums;
  }
  .rate {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .value {
    color: var(--accent);
    font-size: 2rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
</style>
