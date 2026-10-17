<script lang="ts">
  import type { SpeciesId } from '../data/monsters';
  import { t } from '../i18n';
  import BuyAmountSelect from './BuyAmountSelect.svelte';
  import MonsterSprite from './MonsterSprite.svelte';
  import type { BuyAmount, TeamMemberView } from './view';

  let {
    team,
    slots,
    dps,
    clickDamage,
    buyAmount,
    onbuyamount,
    onlevelup,
    onremove,
  }: {
    team: TeamMemberView[];
    slots: number;
    dps: string;
    clickDamage: string;
    buyAmount: BuyAmount;
    onbuyamount: (amount: BuyAmount) => void;
    onlevelup: (id: SpeciesId) => void;
    onremove: (id: SpeciesId) => void;
  } = $props();

  const emptySlots = $derived(Math.max(0, slots - team.length));
</script>

<section class="panel">
  <h2>{t('team.title')}</h2>
  <div class="stats">
    <span>{t('team.dps', { dps })}</span>
    <span>{t('team.clickDamage', { damage: clickDamage })}</span>
  </div>
  <BuyAmountSelect value={buyAmount} onchange={onbuyamount} />

  {#each team as member (member.id)}
    <div class="member">
      <MonsterSprite speciesId={member.id} scale={2} />
      <div class="info">
        <div class="name">{member.name}</div>
        <div class="muted">
          <span class="type" style:color={member.typeColor}>{member.typeName}</span>
          · {t('team.level', { level: member.level })} · {t('team.monsterDps', { dps: member.dps })}
        </div>
        <div class="actions">
          <button type="button" class="primary" disabled={!member.affordable} onclick={() => onlevelup(member.id)}>
            {t('team.levelUp', { levels: member.levels })} · {t('team.cost', { cost: member.cost })}
          </button>
          <button type="button" onclick={() => onremove(member.id)}>{t('team.remove')}</button>
        </div>
      </div>
    </div>
  {/each}
  {#each { length: emptySlots } as _, i (i)}
    <div class="member empty muted">{t('team.emptySlot')}</div>
  {/each}
</section>

<style>
  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    font-variant-numeric: tabular-nums;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }
  .member {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.5rem;
    background: #10132a;
  }
  .member.empty {
    justify-content: center;
    min-height: 4.5rem;
    border: 0.125rem dashed #2a2f4d;
    background: none;
  }
  .info {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
  }
  .name {
    font-weight: 600;
  }
  .type {
    font-weight: 600;
  }
</style>
