<script lang="ts">
  import { t } from '../i18n';
  import type { UnlockId } from '../systems/unlocks';

  let { hint, onclose }: { hint: UnlockId; onclose: () => void } = $props();
</script>

<div class="hint" role="status">
  <p>{t(`hints.${hint}`)}</p>
  <button type="button" onclick={onclose}>{t('hints.close')}</button>
</div>

<style>
  .hint {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: #1d2240;
    border-left: 0.25rem solid var(--accent);
  }
  p {
    flex: 1 1 20rem;
    margin: 0;
  }
  button {
    padding: 0.4rem 1rem;
    border: 0.125rem solid #000;
    background: var(--accent);
    color: #000;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
</style>
