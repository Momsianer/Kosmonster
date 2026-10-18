<script lang="ts">
  import type { EndgameMode } from '../data/endgame';
  import { t } from '../i18n';
  import MonsterSprite from './MonsterSprite.svelte';
  import type { EndgameModeView, MythicView, ShinySetView } from './view';

  let {
    modes,
    canStart,
    running,
    mythics,
    shinySets,
    shinySetMult,
    extraStars,
    onstart,
  }: {
    modes: EndgameModeView[];
    canStart: boolean;
    running: boolean;
    mythics: MythicView[];
    shinySets: ShinySetView[];
    shinySetMult: string;
    extraStars: string;
    onstart: (mode: EndgameMode) => void;
  } = $props();
</script>

<section class="panel">
  <h2>{t('endgame.title')}</h2>
  <p class="muted">{t('endgame.intro')}</p>
  <p class="muted">{extraStars}</p>
  {#if !canStart && !running}
    <p class="muted">{t('endgame.blocked')}</p>
  {/if}
  <div class="grid">
    {#each modes as m (m.mode)}
      <div class="node">
        <div class="name">{m.name}</div>
        <div class="muted">{m.description}</div>
        <div>{m.record}</div>
        <div class="reward">{m.reward}</div>
        <button type="button" class="primary" disabled={!canStart} onclick={() => onstart(m.mode)}>{t('endgame.start')}</button>
      </div>
    {/each}
  </div>
</section>

<section class="panel">
  <h2>{t('mythic.title')}</h2>
  <p class="muted">{t('mythic.intro')}</p>
  <div class="grid">
    {#each mythics as m (m.id)}
      <div class="node mythic" class:caught={m.caught}>
        <MonsterSprite speciesId={m.id} scale={1} big={true} unknown={!m.caught} />
        <div class="name">#{String(m.number).padStart(3, '0')} {m.name}</div>
        <div class="muted">{m.typeName}</div>
        <div class="muted">{m.condition}</div>
        {#if !m.caught}<div>{m.progress}</div>{/if}
      </div>
    {/each}
  </div>
</section>

<section class="panel">
  <h2>{t('polarstern.title')}</h2>
  <p class="muted">{t('polarstern.intro', { mult: shinySetMult })}</p>
  <div class="sets">
    {#each shinySets as set (set.type)}
      <div class="set" class:complete={set.complete}>
        <span style:color={set.color}>{set.name}</span>
        <span>{t('polarstern.progress', { have: set.have, total: set.total })}</span>
        {#if set.complete}<span class="done">✦ {t('polarstern.complete')}</span>{/if}
      </div>
    {/each}
  </div>
</section>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 0.75rem;
  }
  .node {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
    padding: 0.6rem;
    background: #10132a;
    border-left: 0.2rem solid #9b5de5;
  }
  .node.mythic {
    border-left-color: #2a2f4d;
  }
  .node.mythic.caught {
    border-left-color: #ff5c8a;
  }
  .name {
    font-weight: 600;
  }
  .reward {
    color: var(--accent);
    font-size: 0.9rem;
  }
  .sets {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
    gap: 0.5rem;
  }
  .set {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    background: #10132a;
    font-size: 0.9rem;
  }
  .set.complete {
    outline: 0.125rem solid #fff6b0;
  }
  .done {
    color: #fff6b0;
  }
</style>
