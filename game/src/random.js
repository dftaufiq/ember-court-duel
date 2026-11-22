// Ember Court — deterministic random numbers.
// A tiny mulberry32 generator so a seeded game (and every staged screenshot)
// plays out the same way every time it is opened with the same seed.

export function mulberry32(seed) {
  let value = seed >>> 0;
  return function next() {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle driven by `random`, returning a new array.
export function shuffle(deck, random) {
  const shuffled = deck.slice();
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    const held = shuffled[index];
    shuffled[index] = shuffled[other];
    shuffled[other] = held;
  }
  return shuffled;
}

// A seed from the page's ?seed= query, defaulting to a fixed one so the
// plain game always opens the same way for a first-time player.
export function seedFromQuery(search) {
  const params = new URLSearchParams(search);
  const raw = Number.parseInt(params.get('seed') ?? '', 10);
  return Number.isInteger(raw) ? raw : 20261123;
}
