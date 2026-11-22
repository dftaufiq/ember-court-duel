// Ember Court — decks: building, shuffling and drawing.
// A deck is 30 cards: one of each design in the catalogue plus six extra
// copies of the cheapest cards, so early turns always have something to play.

import { CARD_POOL, DECK_EXTRA_IDS, DECK_SIZE, cardById } from './config.js';
import { shuffle } from './random.js';

export function buildDeck(random) {
  const ids = CARD_POOL.map((card) => card.id).concat(DECK_EXTRA_IDS);
  const cards = ids.map((id) => cardById(id));
  return shuffle(cards, random);
}

export function deckSizeIsValid(deck) {
  return deck.length === DECK_SIZE;
}

// Draw `count` cards from `pile` into `hand` (hand caps at HAND_SIZE_MAX in
// state.js; drawing past the cap discards the extra). Returns what was drawn.
export function drawCards(pile, hand, count) {
  const drawn = [];
  for (let index = 0; index < count; index += 1) {
    if (pile.length === 0) break;
    drawn.push(pile.pop());
  }
  hand.push(...drawn);
  return drawn;
}
