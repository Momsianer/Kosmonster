<script lang="ts">
  import { t } from '../i18n';

  let {
    value,
    perSecond = '',
    stardust = '',
    bonus = '',
    darkMatter = '',
    origin = '',
    infinity = false,
  }: {
    value: string;
    perSecond?: string;
    stardust?: string;
    bonus?: string;
    darkMatter?: string;
    origin?: string;
    infinity?: boolean;
  } = $props();
</script>

<div class="energy">
  <span class="label">{t('currency.energy')}</span>
  <span class="value">{infinity ? '∞' : value}</span>
  {#if infinity}<span class="rate">{t('bigBang.infinity')}</span>{/if}
  {#if perSecond}
    <span class="rate">{t('station.perSecond', { amount: perSecond })}</span>
  {/if}
  {#if stardust}
    <span class="stardust">{t('prestige.stardustAmount', { amount: stardust })} · {t('prestige.bonus', { bonus })}</span>
  {/if}
  {#if darkMatter}
    <span class="darkmatter">{t('darkMatter.amount', { amount: darkMatter })}</span>
  {/if}
  {#if origin}
    <span class="origin">{t('bigBang.points', { amount: origin })}</span>
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
  .origin {
    color: #ff9f80;
    font-variant-numeric: tabular-nums;
  }
  .darkmatter {
    color: #8f7bff;
    font-variant-numeric: tabular-nums;
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
