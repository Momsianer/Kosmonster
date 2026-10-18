<script lang="ts">
  import { actions, game } from '../core/game';
  import { BALANCING } from '../data/balancing';
  import { t } from '../i18n';
  import { NUMBER_FORMATS, type NumberFormat } from '../util/format';
  import { playSound } from './sound';

  let { onchange }: { onchange: () => void } = $props();

  let numberFormat = $state<NumberFormat>(game.state.settings.numberFormat);
  let sound = $state(game.state.settings.sound);
  let volume = $state(Math.round(game.state.settings.volume * 100));

  function changeSound() {
    actions.setSound(sound);
    if (sound) playSound('unlock', volume / 100);
  }

  function changeVolume() {
    actions.setVolume(volume / 100);
  }

  function testSound() {
    playSound('catch', volume / 100);
  }
  let saveMessage = $state('');
  let exportCode = $state('');
  let copyMessage = $state('');
  let importCode = $state('');
  let importMessage = $state('');
  let importOk = $state(false);
  let confirmReset = $state(false);

  function changeFormat() {
    actions.setNumberFormat(numberFormat);
    onchange();
  }

  function saveNow() {
    saveMessage = actions.save() ? t('save.saved') : t('save.saveFailed');
  }

  function exportSave() {
    exportCode = actions.exportSave();
    copyMessage = '';
  }

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exportCode);
      copyMessage = t('save.copied');
    } catch {
      copyMessage = '';
    }
  }

  function importSave() {
    importOk = actions.importSave(importCode);
    importMessage = importOk ? t('save.importSuccess') : t('save.importError');
    if (importOk) {
      importCode = '';
      numberFormat = game.state.settings.numberFormat;
      sound = game.state.settings.sound;
      volume = Math.round(game.state.settings.volume * 100);
      onchange();
    }
  }

  function hardReset() {
    actions.hardReset();
    confirmReset = false;
    exportCode = '';
    onchange();
  }
</script>

<section class="settings">
  <h2>{t('settings.title')}</h2>

  <label class="row">
    <span>{t('settings.numberFormat')}</span>
    <select bind:value={numberFormat} onchange={changeFormat}>
      {#each NUMBER_FORMATS as format (format)}
        <option value={format}>{t(`settings.format.${format}`)}</option>
      {/each}
    </select>
  </label>

  <label class="row">
    <input type="checkbox" bind:checked={sound} onchange={changeSound} />
    <span>{t('settings.sound')}</span>
  </label>
  <div class="row">
    <label class="row">
      <span>{t('settings.volume')}</span>
      <input type="range" min="0" max="100" step="5" bind:value={volume} oninput={changeVolume} disabled={!sound} />
      <span class="muted">{volume} %</span>
    </label>
    <button type="button" onclick={testSound} disabled={!sound}>{t('settings.test')}</button>
  </div>

  <h3>{t('save.title')}</h3>
  <p class="muted">{t('save.autosave', { seconds: BALANCING.save.autosaveSeconds })}</p>
  <div class="row">
    <button type="button" onclick={saveNow}>{t('save.saveNow')}</button>
    {#if saveMessage}<span class="muted">{saveMessage}</span>{/if}
  </div>

  <div class="block">
    <button type="button" onclick={exportSave}>{t('save.export')}</button>
    {#if exportCode}
      <p class="muted">{t('save.exportHint')}</p>
      <textarea readonly rows="3" value={exportCode} onfocus={(e) => e.currentTarget.select()}></textarea>
      <div class="row">
        <button type="button" onclick={copyExport}>{t('save.copy')}</button>
        {#if copyMessage}<span class="muted">{copyMessage}</span>{/if}
      </div>
    {/if}
  </div>

  <div class="block">
    <textarea rows="3" placeholder={t('save.importPlaceholder')} bind:value={importCode}></textarea>
    <div class="row">
      <button type="button" onclick={importSave} disabled={!importCode.trim()}>{t('save.import')}</button>
      {#if importMessage}<span class:error={!importOk} class="muted">{importMessage}</span>{/if}
    </div>
  </div>

  <div class="block danger">
    {#if !confirmReset}
      <button type="button" class="warn" onclick={() => (confirmReset = true)}>{t('save.hardReset')}</button>
    {:else}
      <p>{t('save.hardResetWarning')}</p>
      <div class="row">
        <button type="button" class="warn" onclick={hardReset}>{t('save.hardResetConfirm')}</button>
        <button type="button" onclick={() => (confirmReset = false)}>{t('save.cancel')}</button>
      </div>
    {/if}
  </div>
</section>

<style>
  .settings {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    padding: 1.5rem;
    background: var(--panel);
  }
  h2,
  h3 {
    margin: 0;
  }
  h3 {
    margin-top: 0.5rem;
    font-size: 1rem;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }
  .block {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .muted {
    margin: 0;
    color: var(--muted);
    font-size: 0.9rem;
  }
  .error {
    color: var(--hp);
  }
  .danger p {
    margin: 0;
    color: var(--hp);
  }
  textarea {
    width: 100%;
    font-family: monospace;
    font-size: 0.8rem;
    background: #0b0d1a;
    color: var(--text);
    border: 0.125rem solid #2a2f4d;
    resize: vertical;
    word-break: break-all;
  }
  select,
  button {
    padding: 0.4rem 0.8rem;
    font: inherit;
    background: #2a2f4d;
    color: var(--text);
    border: 0.125rem solid #000;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  button.warn {
    background: #5e2a2a;
  }
</style>
