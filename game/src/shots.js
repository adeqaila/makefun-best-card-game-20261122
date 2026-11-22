// The screenshot scenes behind ?shot=start|play|win|loss. Each one builds a real
// game state from the game's own cards and state (fixed seed, no randomness at
// staging time), so the frame is what a real game looks like and the same seed
// always gives the same frame.
import { makeMinion } from './cards.js';
import { SIDE_PLAYER, SIDE_RIVAL } from './world.js';
import { SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

let shotUid = 1000;

function placeMinion(world, sideName, defId, attack, health, canAttack) {
  const minion = makeMinion(defId, sideName);
  minion.uid = shotUid;
  shotUid += 1;
  if (attack !== undefined) minion.attack = attack;
  if (health !== undefined) {
    minion.health = health;
    minion.maxHealth = Math.max(health, minion.maxHealth);
  }
  minion.canAttack = Boolean(canAttack);
  minion.justPlayed = !canAttack;
  const side = sideName === SIDE_PLAYER ? world.player : world.rival;
  side.table.push(minion);
  return minion;
}

function trimDeck(world, sideName, count) {
  const side = sideName === SIDE_PLAYER ? world.player : world.rival;
  side.deck.length = Math.min(count, side.deck.length);
}

/** A rich mid-game table both sides can share: turn 5, minions out, hands full. */
function buildMidGame(world) {
  shotUid = 1000;
  world.turn = 5;
  world.active = SIDE_PLAYER;
  world.over = false;
  world.winner = null;
  world.player.hero.life = 24;
  world.player.hero.mana = 5;
  world.player.hero.maxMana = 6;
  world.rival.hero.life = 19;
  world.rival.hero.mana = 3;
  world.rival.hero.maxMana = 6;
  world.player.hand = ['cinder-drake', 'tide-oracle', 'bramble-guard', 'ember-imp', 'flame-herald'];
  world.rival.hand = ['deep-leviathan', 'star-warden', 'thorn-viper', 'spring-mender'];
  world.player.table = [];
  world.rival.table = [];
  const squire = placeMinion(world, SIDE_PLAYER, 'dawn-squire', 2, 2, true);
  placeMinion(world, SIDE_PLAYER, 'thorn-sprout', 3, 4, true);
  placeMinion(world, SIDE_PLAYER, 'bramble-guard', 2, 4, false);
  placeMinion(world, SIDE_RIVAL, 'deep-leviathan', 5, 6, false);
  placeMinion(world, SIDE_RIVAL, 'star-warden', 2, 5, false);
  placeMinion(world, SIDE_RIVAL, 'ember-imp', 2, 1, false);
  trimDeck(world, SIDE_PLAYER, 14);
  trimDeck(world, SIDE_RIVAL, 16);
  world.log = [
    'The Hollow Queen plays Deep Leviathan (5 mana).',
    'Your Thorn Sprout grows to 3/4.',
    'You play Bramble Guard (2 mana).',
    'Dawn Squire is ready to attack — choose a target.',
  ];
  return squire;
}

/**
 * Set `world` to the named scene and return the screen to draw and the UI
 * state (selection, highlights) to draw it with.
 */
export function stageShot(name, world) {
  if (name === 'play') {
    const squire = buildMidGame(world);
    const legal = new Set(world.rival.table.map((m) => m.uid));
    return {
      screen: SCREEN_PLAY,
      ui: { selectedHand: null, attackerUid: squire.uid, legalTargetUids: legal, heroTargetable: true, showBanner: false, lastPlayedUid: null },
    };
  }
  if (name === 'win') {
    buildMidGame(world);
    world.rival.hero.life = 0;
    world.over = true;
    world.winner = SIDE_PLAYER;
    world.log = [
      'Comet Phoenix crashes down — The Hollow Queen takes 3 damage!',
      'The Hollow Queen bows. The Ember Throne is yours.',
    ];
    return {
      screen: SCREEN_WIN,
      ui: { selectedHand: null, attackerUid: null, legalTargetUids: new Set(), showBanner: false, lastPlayedUid: null },
    };
  }
  if (name === 'loss') {
    buildMidGame(world);
    world.player.hero.life = 0;
    world.over = true;
    world.winner = SIDE_RIVAL;
    world.log = [
      'Cinder Drake breathes fire — You take 2 damage!',
      'The Hollow Queen keeps the throne… this time.',
    ];
    return {
      screen: SCREEN_LOSS,
      ui: { selectedHand: null, attackerUid: null, legalTargetUids: new Set(), showBanner: false, lastPlayedUid: null },
    };
  }
  // Any other name is the title screen over a fresh table.
  return {
    screen: SCREEN_TITLE,
    ui: { selectedHand: null, attackerUid: null, legalTargetUids: new Set(), showBanner: false, lastPlayedUid: null },
  };
}
