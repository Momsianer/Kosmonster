import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/core/state';
import { BALANCING } from '../src/data/balancing';
import { decodeSave, encodeSave } from '../src/save/save';
import { SOUND_IDS, SOUNDS } from '../src/ui/sound';
import { detectSound, soundSnapshot } from '../src/ui/soundEvents';
import { addCatch } from '../src/systems/catching';
import { enterZone, failBoss } from '../src/systems/combat';

describe('Soundeffekte', () => {
  it('jeder Effekt hat gültige Noten', () => {
    for (const id of SOUND_IDS) {
      expect(SOUNDS[id].length).toBeGreaterThan(0);
      for (const note of SOUNDS[id]) {
        expect(note.freq).toBeGreaterThan(0);
        expect(note.dur).toBeGreaterThan(0);
        expect(note.at).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('Fang, Polarstern und Prestige werden erkannt', () => {
    const state = createInitialState(0);
    let prev = soundSnapshot(state);
    expect(detectSound(prev, soundSnapshot(state))).toBeNull();
    state.playTime = 5;
    addCatch(state, 'art_001');
    expect(detectSound(prev, soundSnapshot(state))).toBe('catch');
    prev = soundSnapshot(state);
    state.playTime = 6;
    addCatch(state, 'art_002', true);
    expect(detectSound(prev, soundSnapshot(state))).toBe('shiny');
    prev = soundSnapshot(state);
    state.supernovas += 1;
    expect(detectSound(prev, soundSnapshot(state))).toBe('prestige');
  });

  it('Boss geschafft und Boss gescheitert', () => {
    const state = createInitialState(0);
    enterZone(state, 5);
    let prev = soundSnapshot(state);
    state.highestZone = 6;
    enterZone(state, 6);
    expect(detectSound(prev, soundSnapshot(state))).toBe('bossWin');

    enterZone(state, 10);
    state.bossTimeLeft = 0;
    prev = soundSnapshot(state);
    failBoss(state);
    expect(detectSound(prev, soundSnapshot(state))).toBe('bossFail');
  });

  it('ein neuer Hinweis klingt nach Freischaltung', () => {
    const state = createInitialState(0);
    const prev = soundSnapshot(state);
    state.playTime = BALANCING.station.unlockSeconds;
    expect(detectSound(prev, soundSnapshot(state))).toBe('unlock');
  });

  it('Soundeinstellungen überstehen Speichern und Laden', () => {
    const state = createInitialState(0);
    state.settings.sound = false;
    state.settings.volume = 0.25;
    const loaded = decodeSave(encodeSave(state))!;
    expect(loaded.settings.sound).toBe(false);
    expect(loaded.settings.volume).toBe(0.25);
  });
});
