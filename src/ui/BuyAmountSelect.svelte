<script lang="ts">
  import { t } from '../i18n';
  import { BUY_AMOUNTS, type BuyAmount } from './view';

  let { value, onchange }: { value: BuyAmount; onchange: (amount: BuyAmount) => void } = $props();
</script>

<div class="amounts">
  <span class="muted">{t('team.buyAmount')}</span>
  {#each BUY_AMOUNTS as amount (amount)}
    <button type="button" class:active={value === amount} onclick={() => onchange(amount)}>
      {amount === 'max' ? t('team.max') : `×${amount}`}
    </button>
  {/each}
</div>

<style>
  .amounts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }
</style>
