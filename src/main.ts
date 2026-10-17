import { mount } from 'svelte';
import App from './ui/App.svelte';
import './ui/global.css';
import { saveGame, startGame } from './core/game';

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

startGame(browserStorage());

// Beim Schließen und beim Verlassen des Tabs speichern
window.addEventListener('beforeunload', () => saveGame());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveGame();
});

const target = document.getElementById('app');
if (!target) throw new Error('#app fehlt');

export default mount(App, { target });
