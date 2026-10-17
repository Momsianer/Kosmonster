<script lang="ts">
  import { t } from '../i18n';

  let {
    duration,
    energy,
    hasEnergy,
    onclose,
  }: { duration: string; energy: string; hasEnergy: boolean; onclose: () => void } = $props();
</script>

<div class="report" role="status">
  <strong>{t('offline.title')}</strong>
  <p>{t('offline.away', { duration })}</p>
  {#if hasEnergy}
    <p>{t('offline.energy', { energy })}</p>
  {/if}
  <button type="button" onclick={onclose}>{t('offline.close')}</button>
</div>

<style>
  .report {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 1rem;
    background: var(--panel);
    border: 0.125rem solid var(--accent);
    text-align: center;
  }
  p {
    margin: 0;
    color: var(--muted);
  }
  button {
    padding: 0.4rem 1rem;
    border: 0.125rem solid #000;
    background: var(--accent);
    color: #000;
    font-weight: 700;
    cursor: pointer;
  }
</style>
