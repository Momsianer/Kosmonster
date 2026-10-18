<script lang="ts">
  import { t } from '../i18n';
  import type { StoryView } from './view';

  let { entries }: { entries: StoryView[] } = $props();
</script>

<section class="panel">
  <h2>{t('story.title')}</h2>
  <p class="muted">{t('story.intro')}</p>
  {#if entries.length === 0}
    <p class="muted">{t('story.empty')}</p>
  {/if}
  {#each entries as entry (entry.system)}
    <div class="entry">
      <div class="system">{t('story.entry', { system: entry.system })}</div>
      <p>{entry.text}</p>
    </div>
  {/each}
</section>

<style>
  .entry {
    padding: 0.5rem 0.75rem;
    background: #10132a;
    border-left: 0.2rem solid #9fd3ff;
  }
  .system {
    color: var(--muted);
    font-size: 0.8rem;
  }
  p {
    margin: 0.2rem 0 0;
    font-style: italic;
  }
</style>
