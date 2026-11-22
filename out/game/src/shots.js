// Ember Court — staged screenshot scenes behind ?shot=.
// Each scene builds a real, reachable game state (the same objects a live
// game holds) and hands it to the renderer, so every screenshot is a true
// render of the game's own code — never edited or composited. The same seed
// always gives the same frame.
//
//   ?shot=table — the cover: a full mid-game table, turn 6.
//   ?shot=title — the title screen.
//   ?shot=win   — the victory screen.
//   ?shot=loss  — the defeat screen.

import { cardById } from './config.js';
import { PHASE_OVER, PHASE_PLAY, PHASE_TITLE } from './state.js';

function setHand(side, ids) {
  side.hand = ids.map((id) => cardById(id));
}

function setLog(game, lines) {
  game.log = lines.slice();
}

export function stageShot(game, search) {
  const params = new URLSearchParams(search);
  const shot = params.get('shot');
  if (!shot) return null;

  if (shot === 'title') {
    game.phase = PHASE_TITLE;
    setLog(game, [
      'The court is open — your move, Emberlord.',
      'Sable shuffles her deck of ash and ember.',
    ]);
    return 'title';
  }

  if (shot === 'table') {
    game.phase = PHASE_PLAY;
    game.turn = 6;
    game.player.life = 14;
    game.player.shield = 3;
    game.player.mana = 6;
    game.player.maxMana = 6;
    game.rival.life = 9;
    game.rival.shield = 0;
    game.rival.mana = 4;
    game.rival.maxMana = 5;
    setHand(game.player, ['pyre-drake', 'wildfire', 'spore-bloom', 'moonwell', 'frostveil']);
    setHand(game.rival, ['cinder-fang', 'tide-wall', 'thorn-whip', 'star-chart', 'ember-spark']);
    game.field = [
      { card: cardById('cinder-fang'), side: 'player', resonance: true },
      { card: cardById('tide-wall'), side: 'rival', resonance: false },
    ];
    game.resonanceSuit = 'flame';
    setLog(game, [
      'You play Cinder Fang — 5 damage, RESONANCE +2!',
      'Sable plays Tide Wall — +4 shield.',
      'Sable plays Ember Spark — 3 damage (3 blocked).',
      'You play Thorn Whip — 2 damage, draw 1.',
      '— Turn 6: your move. —',
    ]);
    game.stats.cardsPlayed = 11;
    game.stats.damageDealt = 23;
    game.stats.turnsPlayed = 5;
    return 'table';
  }

  if (shot === 'win') {
    game.phase = PHASE_OVER;
    game.winner = 'player';
    game.turn = 9;
    game.player.life = 6;
    game.player.shield = 2;
    game.player.mana = 3;
    game.player.maxMana = 9;
    game.rival.life = 0;
    game.rival.shield = 0;
    game.rival.mana = 0;
    game.rival.maxMana = 8;
    setHand(game.player, ['nova-burst', 'star-chart', 'still-pool']);
    setHand(game.rival, ['ember-spark', 'tide-wall']);
    game.field = [{ card: cardById('nova-burst'), side: 'player', resonance: false }];
    setLog(game, [
      'You play Nova Burst — 11 damage!',
      'Victory! The Ember Court is yours.',
    ]);
    game.stats.cardsPlayed = 19;
    game.stats.damageDealt = 41;
    game.stats.turnsPlayed = 8;
    return 'win';
  }

  if (shot === 'loss') {
    game.phase = PHASE_OVER;
    game.winner = 'rival';
    game.turn = 8;
    game.player.life = 0;
    game.player.shield = 0;
    game.player.mana = 1;
    game.player.maxMana = 7;
    game.rival.life = 11;
    game.rival.shield = 4;
    game.rival.mana = 2;
    game.rival.maxMana = 8;
    setHand(game.player, ['ember-spark', 'mistral']);
    setHand(game.rival, ['pyre-drake', 'wildfire', 'coral-guard']);
    game.field = [{ card: cardById('pyre-drake'), side: 'rival', resonance: false }];
    setLog(game, [
      'Sable plays Pyre Drake — 10 damage!',
      'Defeat. Sable takes the court.',
    ]);
    game.stats.cardsPlayed = 15;
    game.stats.damageDealt = 27;
    game.stats.turnsPlayed = 7;
    return 'loss';
  }

  return null;
}
