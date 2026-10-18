<script lang="ts">
  import { getTranslations, t } from '../i18n';

  let { onclose }: { onclose: () => void } = $props();
  const lines = getTranslations().theorem.credits;
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label={t('theorem.creditsTitle')}>
  <div class="box">
    <h2>{t('theorem.creditsTitle')} ∎</h2>
    {#each lines as line, i (i)}
      <p>{line}</p>
    {/each}
    <button type="button" onclick={onclose}>{t('theorem.close')}</button>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgb(5 6 14 / 0.92);
    z-index: 10;
  }
  .box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    max-width: 36rem;
    text-align: center;
  }
  h2 {
    margin: 0;
    color: #fff6b0;
    letter-spacing: 0.2em;
  }
  p {
    margin: 0;
    line-height: 1.6;
  }
  button {
    padding: 0.5rem 1.5rem;
    font: inherit;
    font-weight: 700;
    border: 0.125rem solid #000;
    background: #fff6b0;
    color: #000;
    cursor: pointer;
  }
</style>
