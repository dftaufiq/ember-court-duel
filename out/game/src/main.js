// Ember Court — boot and input: mouse, keyboard, and the rival's paced turn.
// Click a card (or press 1–7) to play it; Space or Enter ends the turn;
// R restarts; M mutes. The rival's turn is paced one card per beat so her
// choices land one by one and can be read — and countered next turn.

import { createGame, playCard, startGame, startNextTurn } from './state.js';
import { PHASE_OVER, PHASE_PLAY, PHASE_RIVAL, PHASE_TITLE } from './state.js';
import { playOneRivalCard } from './ai.js';
import { feedbackForPlay, feedbackForTurn, hideEnd, hideTitle, render, showTitle } from './render.js';
import { isMuted, playClick, setMuted } from './audio.js';
import { stageShot } from './shots.js';
import { seedFromQuery } from './random.js';

const seed = seedFromQuery(window.location.search);
let game = createGame(seed);
let rivalTimer = null;

const $ = (id) => document.getElementById(id);

function stopRivalTimer() {
  if (rivalTimer !== null) {
    window.clearTimeout(rivalTimer);
    rivalTimer = null;
  }
}

function restart() {
  stopRivalTimer();
  game = createGame(seed);
  hideEnd();
  showTitle();
  render(game);
}

// Play one of the player's cards by hand index, with sound and feedback.
function playPlayerCard(index) {
  if (game.phase !== PHASE_PLAY) return;
  const card = game.player.hand[index];
  if (!card) return;
  const beforeLife = game.rival.life;
  if (playCard(game, game.player, index)) {
    feedbackForPlay(game, game.player, card, beforeLife);
    render(game);
  }
}

window.__emberPlayCard = playPlayerCard;

// The rival's turn, paced: one card per beat, then the next round opens.
function runRivalTurn() {
  game.phase = PHASE_RIVAL;
  game.stats.turnsPlayed += 1;
  render(game);
  const step = () => {
    if (game.phase === PHASE_OVER) {
      render(game);
      return;
    }
    const beforeLife = game.player.life;
    const card = playOneRivalCard(game);
    if (card) {
      feedbackForPlay(game, game.rival, card, beforeLife);
      render(game);
      rivalTimer = window.setTimeout(step, 750);
      return;
    }
    startNextTurn(game);
    feedbackForTurn();
    render(game);
  };
  rivalTimer = window.setTimeout(step, 650);
}

function endTurn() {
  if (game.phase !== PHASE_PLAY) return;
  playClick();
  runRivalTurn();
}

function begin() {
  playClick();
  hideTitle();
  startGame(game);
  feedbackForTurn();
  render(game);
}

function wireButtons() {
  $('play-button').addEventListener('click', begin);
  $('how-button').addEventListener('click', () => {
    $('how-panel').classList.toggle('hidden');
  });
  $('end-turn').addEventListener('click', endTurn);
  $('restart-button').addEventListener('click', restart);
  $('again-button').addEventListener('click', restart);
  $('mute-button').addEventListener('click', () => {
    setMuted(!isMuted());
    $('mute-button').textContent = isMuted() ? '🔇 Muted' : '🔊 Sound';
  });
  window.addEventListener('keydown', (event) => {
    if (game.phase === PHASE_TITLE && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      begin();
      return;
    }
    if (game.phase === PHASE_OVER && (event.key === 'Enter' || event.key.toLowerCase() === 'r')) {
      restart();
      return;
    }
    if (event.key >= '1' && event.key <= '7') {
      playPlayerCard(Number(event.key) - 1);
      return;
    }
    if ((event.key === ' ' || event.key === 'Enter') && game.phase === PHASE_PLAY) {
      event.preventDefault();
      endTurn();
      return;
    }
    if (event.key.toLowerCase() === 'r') restart();
    if (event.key.toLowerCase() === 'm') $('mute-button').click();
  });
}

function boot() {
  wireButtons();
  const staged = stageShot(game, window.location.search);
  if (staged) {
    // A staged screenshot: render the scene, then tell the screenshot
    // script the frame is painted and settled.
    if (staged === 'title') showTitle();
    else hideTitle();
    render(game);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.__shotReady = true;
      });
    });
    return;
  }
  showTitle();
  render(game);
}

boot();
