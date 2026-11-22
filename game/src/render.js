// Ember Court — the renderer: every pixel the judge sees.
// The table is plain DOM and CSS (no canvas, no images): cards are HTML,
// so their values stay crisp at thumbnail size. render(game) rebuilds the
// dynamic regions from state; animations are CSS classes, and floating
// damage numbers and confetti are small DOM helpers.

import { SUITS } from './config.js';
import { PHASE_OVER, PHASE_PLAY, PHASE_RIVAL, PHASE_TITLE, resonanceBonus } from './state.js';
import { playCardSound, playDraw, playHit, playLose, playShield, playTurn, playWin } from './audio.js';

const $ = (id) => document.getElementById(id);

function glyphFor(suit) {
  return `<svg class="card-glyph" viewBox="0 0 64 64" aria-hidden="true"><use href="#glyph-${SUITS[suit].glyph}"></use></svg>`;
}

function effectLine(card) {
  const parts = [];
  if (card.atk) parts.push(`⚔ ${card.atk}`);
  if (card.shield) parts.push(`🛡 ${card.shield}`);
  if (card.heal) parts.push(`♥ +${card.heal}`);
  if (card.draw) parts.push(`Draw ${card.draw}`);
  if (card.mana) parts.push(`+${card.mana} mana`);
  if (card.weaken) parts.push(`Weaken ${card.weaken}`);
  if (card.burn) parts.push(`Burn ${card.burn}`);
  return parts.join(' · ');
}

// One full-size card. `index` is its hand position (for the keyboard hint);
// `mini` renders the smaller field version.
export function cardElement(card, { index = null, mini = false, resonance = false } = {}) {
  const element = document.createElement('div');
  element.className = `card suit-${card.suit}${mini ? ' card-mini' : ''}${resonance ? ' card-resonance' : ''}`;
  element.dataset.cardId = card.id;
  const cost = `<div class="card-cost" title="Mana cost">${card.cost}</div>`;
  const art = `<div class="card-art">${glyphFor(card.suit)}<div class="card-suit-name">${SUITS[card.suit].name.toUpperCase()}</div></div>`;
  const name = `<div class="card-name">${card.name}</div>`;
  const text = `<div class="card-text">${card.text}</div>`;
  const stats = `<div class="card-stats"><span class="card-atk">${card.atk ? `⚔ ${card.atk}` : ''}</span><span class="card-shield">${card.shield ? `🛡 ${card.shield}` : ''}</span></div>`;
  const effects = `<div class="card-effects">${effectLine(card)}</div>`;
  const key = index !== null && !mini ? `<div class="card-key">${index + 1}</div>` : '';
  const badge = resonance ? '<div class="card-badge">RESONANCE +2</div>' : '';
  element.innerHTML = `${cost}${art}${name}${text}${stats}${effects}${key}${badge}`;
  return element;
}

export function cardBackElement() {
  const element = document.createElement('div');
  element.className = 'card card-back';
  element.innerHTML = '<div class="card-back-glyph">♛</div><div class="card-back-name">EMBER COURT</div>';
  return element;
}

function manaCrystals(side) {
  let crystals = '';
  for (let index = 0; index < 10; index += 1) {
    const filled = index < side.mana ? ' mana-full' : index < side.maxMana ? ' mana-empty' : ' mana-locked';
    crystals += `<span class="mana-crystal${filled}">◆</span>`;
  }
  return crystals;
}

function lifeBlock(side, label) {
  return `<div class="life-block">
    <div class="life-name">${label}</div>
    <div class="life-row"><span class="life-heart">🔥</span><span class="life-number">${side.life}</span><span class="life-label">EMBER</span></div>
    ${side.shield > 0 ? `<div class="shield-row">🛡 Shield ${side.shield}</div>` : '<div class="shield-row shield-none">No shield</div>'}
    <div class="mana-row">${manaCrystals(side)}<span class="mana-number">${side.mana}/${side.maxMana} mana</span></div>
  </div>`;
}

export function render(game) {
  const player = game.player;
  const rival = game.rival;

  $('rival-life').innerHTML = lifeBlock(rival, 'SABLE · THE ASH HERALD');
  $('player-life').innerHTML = lifeBlock(player, 'YOU · EMBERLORD');

  const rivalHand = $('rival-hand');
  rivalHand.replaceChildren();
  for (let index = 0; index < rival.hand.length; index += 1) rivalHand.appendChild(cardBackElement());

  const field = $('field-cards');
  field.replaceChildren();
  for (const entry of game.field) {
    field.appendChild(cardElement(entry.card, { mini: true, resonance: entry.resonance }));
  }
  if (game.field.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'field-empty';
    empty.textContent = 'No cards played yet — the table waits.';
    field.appendChild(empty);
  }

  const hand = $('player-hand');
  hand.replaceChildren();
  player.hand.forEach((card, index) => {
    const affordable = game.phase === PHASE_PLAY && player.mana >= card.cost;
    const resonates = game.phase === PHASE_PLAY && resonanceBonus(game, card) > 0;
    const element = cardElement(card, { index, resonance: resonates });
    if (affordable) element.classList.add('card-playable');
    else element.classList.add('card-unplayable');
    element.addEventListener('click', () => window.__emberPlayCard?.(index));
    hand.appendChild(element);
  });

  const log = $('log-list');
  log.replaceChildren();
  for (const line of game.log) {
    const item = document.createElement('li');
    item.textContent = line;
    log.appendChild(item);
  }

  const banner = $('turn-banner');
  if (game.phase === PHASE_TITLE) banner.textContent = 'Welcome to the Ember Court';
  else if (game.phase === PHASE_PLAY) banner.textContent = `Turn ${game.turn} — Your move`;
  else if (game.phase === PHASE_RIVAL) banner.textContent = 'Sable is thinking…';
  else banner.textContent = game.winner === 'player' ? 'Victory!' : game.winner === 'rival' ? 'Defeat' : 'A draw';

  $('end-turn').disabled = game.phase !== PHASE_PLAY;
  $('status').textContent = banner.textContent;

  if (game.phase === PHASE_OVER) showEnd(game);
}

// A floating number over an anchor element: damage, healing, shield.
export function floatText(text, kind, anchor) {
  const layer = $('float-layer');
  const box = anchor.getBoundingClientRect();
  const app = $('app').getBoundingClientRect();
  const element = document.createElement('div');
  element.className = `float-text float-${kind}`;
  element.textContent = text;
  element.style.left = `${box.left - app.left + box.width / 2}px`;
  element.style.top = `${box.top - app.top}px`;
  layer.appendChild(element);
  window.setTimeout(() => element.remove(), 1400);
}

export function confettiBurst() {
  const layer = $('confetti-layer');
  const colors = ['#e2483a', '#2f8fd0', '#4da34a', '#e0a92e', '#f5d76e', '#ffffff'];
  for (let index = 0; index < 70; index += 1) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.8}s`;
    piece.style.animationDuration = `${2 + Math.random() * 1.6}s`;
    layer.appendChild(piece);
    window.setTimeout(() => piece.remove(), 4200);
  }
}

export function showTitle() {
  $('title-overlay').classList.remove('hidden');
  $('end-overlay').classList.add('hidden');
}

export function hideTitle() {
  $('title-overlay').classList.add('hidden');
}

export function showEnd(game) {
  const overlay = $('end-overlay');
  const title = $('end-title');
  const detail = $('end-detail');
  const stats = $('end-stats');
  if (game.winner === 'player') {
    title.textContent = '👑 VICTORY';
    title.className = 'end-title end-win';
    detail.textContent = 'The Ember Court is yours. Sable bows, and the table is quiet at last.';
    confettiBurst();
    playWin();
  } else if (game.winner === 'rival') {
    title.textContent = 'DEFEAT';
    title.className = 'end-title end-lose';
    detail.textContent = 'Sable takes the court. The embers dim — but the deck remembers.';
    playLose();
  } else {
    title.textContent = 'A DRAW';
    title.className = 'end-title end-draw';
    detail.textContent = 'Neither flame wins. The court falls silent.';
  }
  stats.textContent = `Turns ${game.stats.turnsPlayed} · Cards played ${game.stats.cardsPlayed} · Damage dealt ${game.stats.damageDealt}`;
  overlay.classList.remove('hidden');
}

export function hideEnd() {
  $('end-overlay').classList.add('hidden');
}

// Sound + float feedback for one played card, called by main.js after playCard.
export function feedbackForPlay(game, side, card, beforeLife) {
  const anchor = side.isRival ? $('rival-life') : $('player-life');
  const other = side.isRival ? game.player : game.rival;
  const otherAnchor = side.isRival ? $('player-life') : $('rival-life');
  playCardSound();
  if (card.atk) {
    playHit();
    floatText(`-${card.atk}`, 'damage', otherAnchor);
  } else if (card.shield || card.heal) {
    playShield();
    floatText(card.shield ? `+${card.shield} 🛡` : `+${card.heal} ♥`, 'shield', anchor);
  } else if (card.draw || card.mana) {
    playDraw();
  }
  void beforeLife;
}

export function feedbackForTurn() {
  playTurn();
}
