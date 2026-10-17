<script lang="ts">
  import type { SphereType } from '../data/spheres';
  import { t } from '../i18n';
  import type { SphereView } from './view';

  let {
    spheres,
    total,
    chanceCommon,
    chanceUncommon,
    onlyNew,
    onbuy,
    ononlynew,
  }: {
    spheres: SphereView[];
    total: number;
    chanceCommon: string;
    chanceUncommon: string;
    onlyNew: boolean;
    onbuy: (amount: number, type: SphereType) => void;
    ononlynew: (value: boolean) => void;
  } = $props();
</script>

<section class="panel">
  <h2>{t('shop.title')}</h2>
  <p>{t('shop.total', { count: total })}</p>
  <p class="muted">{t('shop.chance', { common: chanceCommon, uncommon: chanceUncommon })}</p>
  <p class="muted">{t('shop.rule')}</p>
  <label class="toggle">
    <input type="checkbox" checked={onlyNew} onchange={(e) => ononlynew(e.currentTarget.checked)} />
    {t('shop.onlyNew')}
  </label>
  {#each spheres as sphere (sphere.type)}
    <div class="sphere">
      <div class="info">
        <div class="name">{sphere.name}</div>
        <div class="muted">{t('shop.catchMult', { mult: sphere.catchMult })} · {t('shop.owned', { count: sphere.owned })}</div>
      </div>
      <div class="actions">
        <button type="button" class="primary" disabled={!sphere.canBuy1} onclick={() => onbuy(1, sphere.type)}>
          {t('shop.buy', { amount: 1 })} · {t('shop.cost', { cost: sphere.cost1 })}
        </button>
        <button type="button" class="primary" disabled={!sphere.canBuy10} onclick={() => onbuy(10, sphere.type)}>
          {t('shop.buy', { amount: 10 })} · {t('shop.cost', { cost: sphere.cost10 })}
        </button>
      </div>
    </div>
  {/each}
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
  .sphere {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.5rem;
    background: #10132a;
  }
  .name {
    font-weight: 600;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
</style>
