// Ember Court — the game state machine: turns, mana, combat, resonance.
// One side is `player`, the other is `rival` (the AI). A turn is: draw one,
// refill mana (max mana grows by 1 each of your turns, to 10), play as many
// cards as you can afford, then end the turn. Damage hits shield first.
// Resonance: the second card of one suit played in the same turn gains +2
// attack (if it attacks) and +2 shield (if it shields) — the combo that
// makes each hand a decision about order, not just about cost.

import { HAND_SIZE_MAX, HAND_SIZE_START, MAX_LIFE, MAX_MANA, SUITS } from './config.js';
import { buildDeck, drawCards } from './deck.js';
import { mulberry32 } from './random.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_RIVAL = 'rival';
export const PHASE_OVER = 'over';

function makeSide(random, isRival) {
  return {
    isRival,
    life: MAX_LIFE,
    shield: 0,
    mana: 1,
    maxMana: 1,
    deck: buildDeck(random),
    hand: [],
    discard: [],
    weakened: 0,
    burn: 0,
  };
}

export function createGame(seed) {
  const random = mulberry32(seed);
  const game = {
    seed,
    random,
    turn: 1,
    phase: PHASE_TITLE,
    player: makeSide(random, false),
    rival: makeSide(random, true),
    field: [],
    log: [],
    resonanceSuit: null,
    resonanceUsed: false,
    winner: null,
    stats: { cardsPlayed: 0, damageDealt: 0, damageTaken: 0, turnsPlayed: 0 },
  };
  drawCards(game.player.deck, game.player.hand, HAND_SIZE_START);
  drawCards(game.rival.deck, game.rival.hand, HAND_SIZE_START);
  return game;
}

export function startGame(game) {
  game.phase = PHASE_PLAY;
  beginTurn(game, game.player);
  addLog(game, 'The court is open — your move, Emberlord.');
  return game;
}

function addLog(game, text) {
  game.log.unshift(text);
  if (game.log.length > 7) game.log.length = 7;
}

// Open a side's turn: mana grows, burn applies, one card is drawn.
export function beginTurn(game, side) {
  side.maxMana = Math.min(MAX_MANA, side.maxMana + (side === game.player && game.turn > 1 ? 1 : side === game.rival ? 1 : 0));
  if (side.burn > 0) {
    side.maxMana = Math.max(1, side.maxMana - side.burn);
    addLog(game, `${side.isRival ? 'Sable' : 'You'} lose ${side.burn} mana to Vine Lash.`);
    side.burn = 0;
  }
  side.mana = side.maxMana;
  const hadCards = side.deck.length > 0;
  const drawn = drawCards(side.deck, side.hand, 1);
  while (side.hand.length > HAND_SIZE_MAX) side.hand.pop();
  if (drawn.length > 0 && side === game.player) addLog(game, `You draw ${drawn[0].name}.`);
  // Fatigue: an empty deck burns 1 Ember per turn, so a stalled game always
  // ends instead of passing forever.
  if (!hadCards) {
    side.life = Math.max(0, side.life - 1);
    addLog(game, `${side.isRival ? 'Sable' : 'You'} take${side.isRival ? 's' : ''} 1 fatigue — the deck is empty.`);
    checkEnd(game);
  }
  game.resonanceSuit = null;
  game.resonanceUsed = false;
}

// The resonance bonus for a card played after another of its suit this turn.
export function resonanceBonus(game, card) {
  if (game.resonanceSuit === card.suit && !game.resonanceUsed) return 2;
  return 0;
}

export function canPlay(game, side, card) {
  if (game.phase !== PHASE_PLAY && side === game.player) return false;
  if (game.phase !== PHASE_RIVAL && side === game.rival) return false;
  return side.mana >= card.cost;
}

function dealDamage(game, attacker, target, amount) {
  let left = amount;
  // Frostveil: the attacker's next blow is chilled by their weakened value.
  if (attacker.weakened > 0) {
    const cut = Math.min(attacker.weakened, left);
    left -= cut;
    attacker.weakened = 0;
    addLog(game, `Frostveil chills the blow by ${cut}.`);
  }
  const blocked = Math.min(target.shield, left);
  target.shield -= blocked;
  left -= blocked;
  target.life = Math.max(0, target.life - left);
  return { blocked, dealt: left };
}

// Play `card` (at handIndex) from `side`'s hand. Returns false when illegal.
export function playCard(game, side, handIndex) {
  const card = side.hand[handIndex];
  if (!card || !canPlay(game, side, card)) return false;
  const other = side === game.player ? game.rival : game.player;
  const who = side.isRival ? 'Sable' : 'You';
  side.mana -= card.cost;
  side.hand.splice(handIndex, 1);

  const bonus = resonanceBonus(game, card);
  const atk = (card.atk ?? 0) + (card.atk ? bonus : 0);
  const shield = (card.shield ?? 0) + (card.shield ? bonus : 0);
  const isResonance = bonus > 0;
  if (isResonance) game.resonanceUsed = true;
  else if (!game.resonanceSuit) game.resonanceSuit = card.suit;

  game.field.unshift({ card, side: side.isRival ? 'rival' : 'player', resonance: isResonance });
  if (game.field.length > 4) game.field.length = 4;
  side.discard.push(card);
  game.stats.cardsPlayed += 1;

  let summary = `${who} play${side.isRival ? 's' : ''} ${card.name}`;
  if (atk > 0) {
    const hit = dealDamage(game, side, other, atk);
    if (side === game.player) game.stats.damageDealt += hit.dealt + hit.blocked;
    else game.stats.damageTaken += hit.dealt + hit.blocked;
    summary += ` — ${atk} damage${hit.blocked > 0 ? ` (${hit.blocked} blocked)` : ''}`;
  }
  if (shield > 0) {
    side.shield += shield;
    summary += ` — +${shield} shield`;
  }
  if (card.heal) {
    side.life = Math.min(MAX_LIFE, side.life + card.heal);
    summary += ` — heal ${card.heal}`;
  }
  if (card.draw) {
    const drawn = drawCards(side.deck, side.hand, card.draw);
    while (side.hand.length > HAND_SIZE_MAX) side.hand.pop();
    summary += ` — draw ${drawn.length}`;
  }
  if (card.mana) {
    side.mana = Math.min(MAX_MANA, side.mana + card.mana);
    summary += ` — +${card.mana} mana`;
  }
  if (card.weaken) {
    other.weakened += card.weaken;
    summary += ` — rival weakened`;
  }
  if (card.burn) {
    other.burn += card.burn;
    summary += ` — rival mana burned`;
  }
  if (isResonance) summary += ' — RESONANCE +2!';
  addLog(game, `${summary}.`);
  checkEnd(game);
  return true;
}

export function checkEnd(game) {
  if (game.player.life <= 0 && game.rival.life <= 0) {
    game.winner = 'draw';
    game.phase = PHASE_OVER;
  } else if (game.rival.life <= 0) {
    game.winner = 'player';
    game.phase = PHASE_OVER;
  } else if (game.player.life <= 0) {
    game.winner = 'rival';
    game.phase = PHASE_OVER;
  }
  if (game.phase === PHASE_OVER) {
    addLog(game, game.winner === 'player' ? 'Victory! The Ember Court is yours.' : game.winner === 'rival' ? 'Defeat. Sable takes the court.' : 'A draw — the court falls silent.');
  }
}

// Open the next round: the turn counter grows and both sides draw and refill.
export function startNextTurn(game) {
  if (game.phase === PHASE_OVER) return;
  game.turn += 1;
  game.phase = PHASE_PLAY;
  beginTurn(game, game.player);
  beginTurn(game, game.rival);
  addLog(game, `— Turn ${game.turn}: your move. —`);
}

// End the player's turn: the rival plays, then a new turn opens.
export function endPlayerTurn(game, rivalPlays) {
  if (game.phase !== PHASE_PLAY) return false;
  game.phase = PHASE_RIVAL;
  game.stats.turnsPlayed += 1;
  rivalPlays(game);
  if (game.phase === PHASE_OVER) return true;
  startNextTurn(game);
  return true;
}

export function suitOf(card) {
  return SUITS[card.suit];
}
