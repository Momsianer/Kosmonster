<script lang="ts">
  import { t } from '../i18n';

  let {
    gain,
    available,
    zone,
    count,
    onsupernova,
  }: { gain: string; available: boolean; zone: number; count: number; onsupernova: () => void } = $props();

  let confirming = $state(false);

  function trigger() {
    confirming = false;
    onsupernova();
  }
</script>

<section class="panel supernova">
  <h2>{t('prestige.title')}</h2>
  {#if available}
    <p>{t('prestige.gain', { amount: gain })}</p>
  {:else}
    <p class="muted">{t('prestige.locked', { zone })}</p>
  {/if}
  <p class="muted">{t('prestige.explain')}</p>
  {#if count > 0}<p class="muted">{t('prestige.count', { count })}</p>{/if}
  {#if !confirming}
    <div><button type="button" class="primary" disabled={!available} onclick={() => (confirming = true)}>{t('prestige.button')}</button></div>
  {:else}
    <p>{t('prestige.confirm')}</p>
    <div class="actions">
      <button type="button" class="primary" onclick={trigger}>{t('prestige.confirmButton')}</button>
      <button type="button" onclick={() => (confirming = false)}>{t('prestige.cancel')}</button>
    </div>
  {/if}
</section>

<style>
  p {
    margin: 0;
  }
  .supernova {
    border-left: 0.25rem solid #b48cff;
  }
  .actions {
    display: flex;
    gap: 0.4rem;
  }
</style>
