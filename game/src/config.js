// Ember Court — card catalogue and table constants.
// Every card is an original design for this game: four suits (Flame, Tide,
// Thorn, Star), each told apart by colour AND by shape, never by text alone.
// A card's effects are plain fields so state.js can apply them generically:
// atk (damage to the rival's life, through shield first), shield (blocks
// damage), heal (restores life), draw (cards drawn), mana (extra mana this
// turn), weaken (rival's next attack loses this much), burn (rival loses this
// much mana at the start of their next turn).

export const MAX_LIFE = 20;
export const MAX_MANA = 10;
export const HAND_SIZE_START = 5;
export const HAND_SIZE_MAX = 7;
export const DECK_SIZE = 30;

export const SUITS = {
  flame: { name: 'Flame', color: '#e2483a', dark: '#8f1d14', glyph: 'flame' },
  tide: { name: 'Tide', color: '#2f8fd0', dark: '#144a75', glyph: 'drop' },
  thorn: { name: 'Thorn', color: '#4da34a', dark: '#1f5c22', glyph: 'leaf' },
  star: { name: 'Star', color: '#e0a92e', dark: '#8a6410', glyph: 'star' },
};

// id, name, suit, cost, then the effect fields. `text` is the one line the
// card itself shows, written for a player reading it mid-game.
export const CARD_POOL = [
  { id: 'ember-spark', name: 'Ember Spark', suit: 'flame', cost: 1, atk: 3, text: 'A small flame, thrown fast.' },
  { id: 'cinder-fang', name: 'Cinder Fang', suit: 'flame', cost: 2, atk: 5, text: 'Bites through ash and armour.' },
  { id: 'wildfire', name: 'Wildfire', suit: 'flame', cost: 3, atk: 7, text: 'Spreads faster than fear.' },
  { id: 'pyre-drake', name: 'Pyre Drake', suit: 'flame', cost: 5, atk: 10, text: 'The court bows to the drake.' },
  { id: 'ash-volley', name: 'Ash Volley', suit: 'flame', cost: 2, atk: 4, draw: 1, text: 'Burns the hand, feeds the mind.' },
  { id: 'ignite', name: 'Ignite', suit: 'flame', cost: 1, atk: 2, draw: 1, text: 'One spark lights the next idea.' },
  { id: 'tide-wall', name: 'Tide Wall', suit: 'tide', cost: 1, shield: 4, text: 'Water stands where stone would fall.' },
  { id: 'still-pool', name: 'Still Pool', suit: 'tide', cost: 2, heal: 5, text: 'Quiet water mends the burns.' },
  { id: 'deep-current', name: 'Deep Current', suit: 'tide', cost: 3, shield: 7, draw: 1, text: 'The deep keeps what it holds.' },
  { id: 'frostveil', name: 'Frostveil', suit: 'tide', cost: 2, shield: 5, weaken: 2, text: 'Chills the rival’s next blow by 2.' },
  { id: 'mistral', name: 'Mistral', suit: 'tide', cost: 1, shield: 3, draw: 1, text: 'A cold wind, a fresh card.' },
  { id: 'coral-guard', name: 'Coral Guard', suit: 'tide', cost: 4, shield: 9, text: 'A reef that refuses to break.' },
  { id: 'thorn-whip', name: 'Thorn Whip', suit: 'thorn', cost: 1, atk: 2, draw: 1, text: 'Stings, then shows the way.' },
  { id: 'bramble-snare', name: 'Bramble Snare', suit: 'thorn', cost: 2, atk: 4, shield: 2, text: 'Holds the rival and bites back.' },
  { id: 'spore-bloom', name: 'Spore Bloom', suit: 'thorn', cost: 3, atk: 5, heal: 3, text: 'Bloom where the blow landed.' },
  { id: 'vine-lash', name: 'Vine Lash', suit: 'thorn', cost: 2, atk: 3, burn: 1, text: 'Steals 1 mana from the rival’s next turn.' },
  { id: 'root-grasp', name: 'Root Grasp', suit: 'thorn', cost: 3, atk: 6, shield: 3, text: 'Roots hold; thorns answer.' },
  { id: 'briar-queen', name: 'Briar Queen', suit: 'thorn', cost: 5, atk: 8, heal: 4, text: 'She wears the whole garden.' },
  { id: 'star-chart', name: 'Star Chart', suit: 'star', cost: 1, draw: 2, text: 'The sky tells you what comes next.' },
  { id: 'comet-fall', name: 'Comet Fall', suit: 'star', cost: 3, atk: 6, text: 'A wish, arriving too fast to dodge.' },
  { id: 'nova-burst', name: 'Nova Burst', suit: 'star', cost: 5, atk: 11, text: 'A small sun, briefly yours.' },
  { id: 'moonwell', name: 'Moonwell', suit: 'star', cost: 2, mana: 2, draw: 1, text: 'Drink moonlight: +2 mana, draw 1.' },
  { id: 'lucky-star', name: 'Lucky Star', suit: 'star', cost: 0, draw: 1, mana: 1, text: 'Free: draw 1, gain 1 mana.' },
  { id: 'eclipse', name: 'Eclipse', suit: 'star', cost: 4, atk: 7, shield: 4, text: 'Light and dark, at once.' },
];

// Six extra copies of the cheapest cards fill each 30-card deck.
export const DECK_EXTRA_IDS = ['ember-spark', 'tide-wall', 'thorn-whip', 'star-chart', 'mistral', 'lucky-star'];

export function cardById(id) {
  return CARD_POOL.find((card) => card.id === id);
}
