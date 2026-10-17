<script lang="ts">
  import { t } from '../i18n';

  let {
    spheres,
    cost1,
    cost10,
    canBuy1,
    canBuy10,
    chanceCommon,
    chanceUncommon,
    onlyNew,
    onbuy,
    ononlynew,
  }: {
    spheres: number;
    cost1: string;
    cost10: string;
    canBuy1: boolean;
    canBuy10: boolean;
    chanceCommon: string;
    chanceUncommon: string;
    onlyNew: boolean;
    onbuy: (amount: number) => void;
    ononlynew: (value: boolean) => void;
  } = $props();
</script>

<section class="panel">
  <h2>{t('shop.title')}</h2>
  <p>{t('shop.owned', { count: spheres })}</p>
  <p class="muted">{t('shop.chance', { common: chanceCommon, uncommon: chanceUncommon })}</p>
  <label class="toggle">
    <input type="checkbox" checked={onlyNew} onchange={(e) => ononlynew(e.currentTarget.checked)} />
    {t('shop.onlyNew')}
  </label>
  <div class="actions">
    <button type="button" class="primary" disabled={!canBuy1} onclick={() => onbuy(1)}>
      {t('shop.buy', { amount: 1 })} · {t('shop.cost', { cost: cost1 })}
    </button>
    <button type="button" class="primary" disabled={!canBuy10} onclick={() => onbuy(10)}>
      {t('shop.buy', { amount: 10 })} · {t('shop.cost', { cost: cost10 })}
    </button>
  </div>
</section>

<style>
  p {
    margin: 0;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    cursor: pointer;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
</style>
