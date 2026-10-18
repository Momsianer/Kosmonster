<script lang="ts">
  import type { SphereType } from '../data/spheres';
  import { t } from '../i18n';
  import type { CatchChanceRow, SphereView } from './view';

  let {
    spheres,
    total,
    catchTable,
    locked,
    onlyNew,
    onbuy,
    ononlynew,
  }: {
    spheres: SphereView[];
    total: number;
    catchTable: CatchChanceRow[];
    locked: boolean;
    onlyNew: boolean;
    onbuy: (amount: number, type: SphereType) => void;
    ononlynew: (value: boolean) => void;
  } = $props();
</script>

<section class="panel">
  <h2>{t('shop.title')}</h2>
  <p>{t('shop.total', { count: total })}</p>
  <p class="muted">{t('shop.pricing')}</p>
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
  {#if locked}
    <p class="muted">{t('shop.locked')}</p>
  {/if}
  <h3>{t('shop.chanceTitle')}</h3>
  <table>
    <thead>
      <tr>
        <th>{t('shop.rarity')}</th>
        {#each spheres as sphere (sphere.type)}
          <th>{sphere.name}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each catchTable as row (row.rarity)}
        <tr>
          <td style:color={row.color}>{row.rarity}</td>
          {#each row.chances as chance, i (i)}
            <td class="num">{chance}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
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
  h3 {
    margin: 0.3rem 0 0;
    font-size: 0.95rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
  }
  th,
  td {
    padding: 0.2rem 0.3rem;
    text-align: left;
  }
  th {
    font-weight: 600;
    color: #9aa3c7;
  }
  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
</style>
