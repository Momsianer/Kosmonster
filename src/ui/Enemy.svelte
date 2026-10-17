<script lang="ts">
  import type { EnemyKind } from '../core/formulas';
  import type { SpeciesId } from '../data/monsters';
  import { t } from '../i18n';
  import MonsterSprite from './MonsterSprite.svelte';

  let {
    kind,
    speciesId,
    stage = 0,
    name,
    hp,
    maxHp,
    fraction,
    onattack,
  }: {
    kind: EnemyKind;
    speciesId: SpeciesId;
    stage?: number;
    name: string;
    hp: string;
    maxHp: string;
    fraction: number;
    onattack: () => void;
  } = $props();

  const label = $derived(
    kind === 'systemBoss' ? t('combat.systemBoss') : kind === 'boss' ? t('combat.boss') : t('combat.enemy'),
  );
</script>

<div class="enemy">
  {#if kind !== 'normal'}
    <div class="kind">{label}</div>
  {/if}
  <button class="target {kind}" type="button" aria-label="{label}: {name}" onclick={onattack}>
    <MonsterSprite {speciesId} {stage} scale={4} big={kind !== 'normal'} />
  </button>
  <div class="name">{name}</div>
  <div class="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fraction * 100)}>
    <div class="fill" style:width="{fraction * 100}%"></div>
  </div>
  <div class="hp">{t('combat.hp', { hp, maxHp })}</div>
</div>

<style>
  .enemy {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }
  .target {
    padding: 0;
    border: 0.25rem solid #000;
    background: none;
    cursor: pointer;
    transition: transform 60ms;
  }
  .target.boss {
    border-color: #8c3f3f;
  }
  .target.systemBoss {
    border-color: #c9a44a;
  }
  .target:active {
    transform: scale(0.95);
  }
  .kind {
    color: var(--accent);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .name {
    font-weight: 600;
  }
  .bar {
    width: min(100%, 20rem);
    height: 1rem;
    background: var(--hp-bg);
    border: 0.125rem solid #000;
  }
  .fill {
    height: 100%;
    background: var(--hp);
    transition: width 80ms linear;
  }
  .hp {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
</style>
