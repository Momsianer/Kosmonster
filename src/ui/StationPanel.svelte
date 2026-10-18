<script lang="ts">
  import type { ModuleId } from '../data/modules';
  import { t } from '../i18n';
  import BuyAmountSelect from './BuyAmountSelect.svelte';
  import type { BuyAmount, ModuleView } from './view';

  let {
    modules,
    production,
    buyAmount,
    onbuyamount,
    onbuy,
  }: {
    modules: ModuleView[];
    production: string;
    buyAmount: BuyAmount;
    onbuyamount: (amount: BuyAmount) => void;
    onbuy: (id: ModuleId) => void;
  } = $props();
</script>

<section class="panel">
  <h2>{t('station.title')}</h2>
  <p>{t('station.production', { amount: production })}</p>
  <BuyAmountSelect value={buyAmount} onchange={onbuyamount} />

  {#each modules as module (module.id)}
    <div class="module">
      <div class="info">
        <div class="name">{module.name}</div>
        {#if module.owned > 0}
          <div class="muted">
            {t('station.owned', { count: module.owned })} · {t('station.moduleProduction', { amount: module.production })} ·
            {t('station.multiplier', { mult: module.mult })}
          </div>
          <div class="muted">
            {module.nextUpgrade === null
              ? t('station.allUpgrades')
              : t('station.nextUpgrade', { count: module.nextUpgrade })}
          </div>
        {/if}
      </div>
      <button type="button" class="primary" disabled={!module.affordable} onclick={() => onbuy(module.id)}>
        {t('station.buy', { count: module.count, cost: module.cost })}
      </button>
    </div>
  {/each}
</section>

<style>
  p {
    margin: 0;
  }
  .module {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #10132a;
  }
  .info {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }
  /* Zeilen brechen nicht um, damit sich die Höhe beim Aktualisieren nicht ändert */
  .info > div {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  button {
    flex: none;
  }
  .name {
    font-weight: 600;
  }
</style>
