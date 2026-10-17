import { mount } from 'svelte';
import App from './ui/App.svelte';
import './ui/global.css';
import { startGame } from './core/game';

startGame();

const target = document.getElementById('app');
if (!target) throw new Error('#app fehlt');

export default mount(App, { target });
