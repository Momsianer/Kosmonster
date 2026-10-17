<script lang="ts">
  import type { ResearchBranch, ResearchId } from '../data/research';
  import { t } from '../i18n';
  import type { ResearchNodeView } from './view';

  let {
    branches,
    stardust,
    bonus,
    onbuy,
  }: {
    branches: { branch: ResearchBranch; name: string; nodes: ResearchNodeView[] }[];
    stardust: string;
    bonus: string;
    onbuy: (id: ResearchId) => void;
  } = $props();
</script>

<section class="panel">
  <h2>{t('research.title')}</h2>
  <p>{t('prestige.stardustAmount', { amount: stardust })} · {t('prestige.bonus', { bonus })}</p>
  <p class="muted">{t('research.intro')}</p>
  <div class="tree">
    {#each branches as branch (branch.branch)}
      <div class="branch">
        <h3>{branch.name}</h3>
        {#each branch.nodes as node (node.id)}
          <div class="node" class:locked={!node.available} class:maxed={node.maxed}>
            <div class="name">{node.name}</div>
            <div class="muted">{node.description}</div>
            <div class="muted">{t('research.level', { level: node.level, max: node.maxLevel })}</div>
            {#if node.maxed}
              <div class="done">{t('research.maxed')}</div>
            {:else if !node.available}
              <div class="muted">{node.requires}</div>
            {:else}
              <button type="button" class="primary" disabled={!node.affordable} onclick={() => onbuy(node.id)}>
                {t('research.buy', { cost: node.cost })}
              </button>
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>
</section>

<style>
  p {
    margin: 0;
  }
  .tree {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: 1rem;
  }
  .branch {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  h3 {
    margin: 0;
    font-size: 1rem;
    color: var(--accent);
  }
  .node {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    padding: 0.6rem;
    background: #10132a;
    border-left: 0.2rem solid #2a2f4d;
  }
  .node.locked {
    opacity: 0.5;
  }
  .node.maxed {
    border-left-color: var(--accent);
  }
  .name {
    font-weight: 600;
  }
  .done {
    color: var(--accent);
    font-size: 0.85rem;
  }
</style>
