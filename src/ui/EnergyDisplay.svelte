<script lang="ts">
  import { t } from '../i18n';

  let { value }: { value: string } = $props();
</script>

<div class="energy">
  <span class="label">{t('currency.energy')}</span>
  <span class="value">{value}</span>
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
  .value {
    color: var(--accent);
    font-size: 2rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
</style>
