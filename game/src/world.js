// The rules of Ember Throne: state, turns, combat and the rival's mind.
// Nothing here touches the screen; render.js paints whatever this holds.
//
// A turn: mana grows by 1 (to 10) and refills, you draw a card, your minions
// wake up (growth ticks, aegis resets, summoning sickness lifts), then you play
// cards and attack. End your turn and the rival does the same, and the turn
// passes back. A hero at 0 life loses.
import { RULES } from './config.js';
import { buildDeck, cardDef, makeMinion } from './cards.js';
import { shuffle } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_DAMAGE = 1;
export const EVENT_DEATH = 2;
export const EVENT_OVER = 4;
export const EVENT_DRAW = 8;

export const SIDE_PLAYER = 'player';
export const SIDE_RIVAL = 'rival';

let nextUid = 1;

function newHero(name, title) {
  return { name, title, life: RULES.startingLife, maxLife: RULES.startingLife, mana: 0, maxMana: 0, fatigue: 0 };
}

function newSide(hero, deck) {
  return { hero, deck, hand: [], table: [], discard: [] };
}

/** A fresh game: two shuffled decks, opening hands, player to move first. */
export function createWorld(random) {
  const world = {
    random,
    turn: 1,
    active: SIDE_PLAYER,
    over: false,
    winner: null,
    log: [],
    player: newSide(newHero('You', 'Champion of the Four Courts'), shuffle(buildDeck(), random)),
    rival: newSide(newHero('The Hollow Queen', 'Rival of the Ember Throne'), shuffle(buildDeck(), random)),
  };
  drawCards(world, world.player, RULES.startingHand);
  drawCards(world, world.rival, RULES.startingHand);
  startTurn(world, world.player);
  return world;
}

export function sideOf(world, side) {
  return side === SIDE_PLAYER ? world.player : world.rival;
}

export function otherSide(world, side) {
  return side === SIDE_PLAYER ? world.rival : world.player;
}

/** The rival's hand is hidden; the count is all the player ever sees of it. */
export function rivalHandCount(world) {
  return world.rival.hand.length;
}

function say(world, message) {
  world.log.unshift(message);
  if (world.log.length > 5) world.log.length = 5;
}

function drawCards(world, side, count) {
  let events = EVENT_NONE;
  for (let i = 0; i < count; i += 1) {
    if (side.deck.length === 0) {
      side.hero.fatigue += 1;
      side.hero.life -= side.hero.fatigue;
      say(world, `${side.hero.name} ${side.hero.fatigue === 1 ? 'has' : 'have'} no cards left — fatigue deals ${side.hero.fatigue} damage!`);
      events |= EVENT_DAMAGE;
      if (side.hero.life <= 0) {
        side.hero.life = 0;
        world.over = true;
        world.winner = side === world.player ? SIDE_RIVAL : SIDE_PLAYER;
        events |= EVENT_OVER;
      }
      continue;
    }
    const defId = side.deck.pop();
    if (side.hand.length >= RULES.maxHand) {
      side.discard.push(defId);
      say(world, `${side.hero.name}'s hand is full — ${cardDef(defId).name} is burned.`);
    } else {
      side.hand.push(defId);
    }
    events |= EVENT_DRAW;
  }
  return events;
}

/** Begin a side's turn: mana grows and refills, a card is drawn, minions wake. */
export function startTurn(world, side) {
  const hero = side.hero;
  hero.maxMana = Math.min(RULES.maxMana, hero.maxMana + 1);
  hero.mana = hero.maxMana;
  for (const minion of side.table) {
    const def = cardDef(minion.defId);
    minion.canAttack = true;
    minion.justPlayed = false;
    minion.aegisUsed = false;
    if (def.keyword === 'growth') {
      minion.attack += 1;
      minion.health += 1;
      minion.maxHealth += 1;
      say(world, `${def.name} grows to ${minion.attack}/${minion.health}.`);
    }
  }
  return drawCards(world, side, RULES.turnDraw);
}

/** End the active side's turn and start the other's. */
export function endTurn(world) {
  if (world.over) return EVENT_NONE;
  const next = world.active === SIDE_PLAYER ? SIDE_RIVAL : SIDE_PLAYER;
  world.active = next;
  if (next === SIDE_PLAYER) world.turn += 1;
  return startTurn(world, sideOf(world, next));
}

function removeDead(world, side) {
  let events = EVENT_NONE;
  for (let i = side.table.length - 1; i >= 0; i -= 1) {
    if (side.table[i].health <= 0) {
      const dead = side.table.splice(i, 1)[0];
      side.discard.push(dead.defId);
      say(world, `${cardDef(dead.defId).name} falls.`);
      events |= EVENT_DEATH;
    }
  }
  return events;
}

function damageHero(world, side, amount) {
  side.hero.life = Math.max(0, side.hero.life - amount);
  if (side.hero.life === 0) {
    world.over = true;
    world.winner = side === world.player ? SIDE_RIVAL : SIDE_PLAYER;
    return EVENT_DAMAGE | EVENT_OVER;
  }
  return EVENT_DAMAGE;
}

function damageMinion(world, ownerSide, minion, amount) {
  const def = cardDef(minion.defId);
  if (def.keyword === 'aegis' && !minion.aegisUsed && amount > 0) {
    minion.aegisUsed = true;
    say(world, `${def.name}'s aegis turns the blow aside.`);
    return EVENT_NONE;
  }
  minion.health -= amount;
  return EVENT_DAMAGE;
}

/** Run a card's battlecry when it is played from hand. */
function battlecry(world, side, def) {
  const foe = otherSide(world, side === world.player ? SIDE_PLAYER : SIDE_RIVAL);
  let events = EVENT_NONE;
  if (def.id === 'cinder-drake') {
    say(world, `Cinder Drake breathes fire — ${foe.hero.name} takes 2 damage!`);
    events |= damageHero(world, foe, 2);
  } else if (def.id === 'flame-herald') {
    say(world, 'Flame Herald scorches every enemy minion for 1!');
    for (const minion of foe.table.slice()) events |= damageMinion(world, foe, minion, 1);
    events |= removeDead(world, foe);
  } else if (def.id === 'tide-oracle') {
    say(world, 'Tide Oracle peers ahead — draw a card.');
    events |= drawCards(world, side, 1);
  } else if (def.id === 'spring-mender') {
    side.hero.life = Math.min(side.hero.maxLife, side.hero.life + 5);
    say(world, `Spring Mender restores 5 life to ${side.hero.name}.`);
  } else if (def.id === 'comet-phoenix') {
    say(world, `Comet Phoenix crashes down — ${foe.hero.name} takes 3 damage!`);
    events |= damageHero(world, foe, 3);
  }
  return events;
}

/** Play a card from hand onto the table. Returns events, or 0 when it cannot be played. */
export function playCard(world, sideName, handIndex) {
  const side = sideOf(world, sideName);
  if (world.over || world.active !== sideName) return EVENT_NONE;
  const defId = side.hand[handIndex];
  if (defId === undefined) return EVENT_NONE;
  const def = cardDef(defId);
  if (side.hero.mana < def.cost) return EVENT_NONE;
  if (side.table.length >= RULES.maxTable) return EVENT_NONE;
  side.hand.splice(handIndex, 1);
  side.hero.mana -= def.cost;
  const minion = makeMinion(defId, sideName);
  minion.uid = nextUid;
  nextUid += 1;
  side.table.push(minion);
  say(world, `${side.hero.name} plays ${def.name} (${def.cost} mana).`);
  let events = EVENT_NONE;
  if (def.keyword === 'battlecry') events |= battlecry(world, side, def);
  if (world.over) events |= EVENT_OVER;
  return events;
}

/** Minions an attacker is allowed to hit: a taunt minion, if any, or anything. */
export function legalTargets(world, attackerSide) {
  const foe = otherSide(world, attackerSide);
  const taunts = foe.table.filter((m) => cardDef(m.defId).keyword === 'taunt');
  if (taunts.length > 0) return taunts.map((m) => ({ kind: 'minion', uid: m.uid }));
  const targets = foe.table.map((m) => ({ kind: 'minion', uid: m.uid }));
  targets.push({ kind: 'hero' });
  return targets;
}

function findMinion(world, sideName, uid) {
  return sideOf(world, sideName).table.find((m) => m.uid === uid) ?? null;
}

/**
 * One minion attacks. Against a minion both strike back; venom destroys whatever
 * it damages. Against a hero only the hero is hurt. Returns events.
 */
export function attack(world, attackerSide, attackerUid, target) {
  const side = sideOf(world, attackerSide);
  const foe = otherSide(world, attackerSide);
  if (world.over || world.active !== attackerSide) return EVENT_NONE;
  const attacker = findMinion(world, attackerSide, attackerUid);
  if (!attacker || !attacker.canAttack) return EVENT_NONE;
  const legal = legalTargets(world, attackerSide);
  const allowed =
    target.kind === 'hero'
      ? legal.some((t) => t.kind === 'hero')
      : legal.some((t) => t.kind === 'minion' && t.uid === target.uid);
  if (!allowed) return EVENT_NONE;
  attacker.canAttack = false;
  let events = EVENT_NONE;
  const def = cardDef(attacker.defId);
  if (target.kind === 'hero') {
    say(world, `${def.name} strikes ${foe.hero.name} for ${attacker.attack}!`);
    events |= damageHero(world, foe, attacker.attack);
    return events;
  }
  const victim = findMinion(world, attackerSide === SIDE_PLAYER ? SIDE_RIVAL : SIDE_PLAYER, target.uid);
  if (!victim) return EVENT_NONE;
  const victimDef = cardDef(victim.defId);
  say(world, `${def.name} attacks ${victimDef.name}!`);
  events |= damageMinion(world, foe, victim, attacker.attack);
  if (def.keyword === 'venom' && victim.health > 0) {
    victim.health = 0;
    say(world, `${victimDef.name} is poisoned — it falls!`);
  }
  if (victim.health > 0) {
    events |= damageMinion(world, side, attacker, victim.attack);
    if (victimDef.keyword === 'venom') {
      attacker.health = 0;
      say(world, `${def.name} is poisoned — it falls!`);
    }
  }
  events |= removeDead(world, foe);
  events |= removeDead(world, side);
  if (world.over) events |= EVENT_OVER;
  return events;
}

/** Can this minion attack anything right now? */
export function canAttackAnything(world, sideName, uid) {
  const minion = findMinion(world, sideName, uid);
  return Boolean(minion && minion.canAttack && !world.over && world.active === sideName);
}

/** --- The rival's mind -------------------------------------------------- */
/** The rival plays its cards: dearest first, while mana and table room allow. */
export function rivalPlayCards(world) {
  const side = world.rival;
  const order = side.hand
    .map((defId, index) => ({ defId, index }))
    .sort((a, b) => cardDef(b.defId).cost - cardDef(a.defId).cost);
  for (const entry of order) {
    if (world.over) break;
    const current = side.hand.indexOf(entry.defId);
    if (current === -1) continue;
    playCard(world, SIDE_RIVAL, current);
  }
}

/** The rival attacks: taunts first, a minion it can kill outright next, else the hero. */
export function rivalAttack(world) {
  for (const minion of world.rival.table.slice()) {
    if (world.over) break;
    if (!minion.canAttack) continue;
    const foe = world.player;
    const taunts = foe.table.filter((m) => cardDef(m.defId).keyword === 'taunt');
    let target = null;
    if (taunts.length > 0) {
      target = { kind: 'minion', uid: taunts[0].uid };
    } else {
      const killable = foe.table.find((m) => m.health <= minion.attack);
      if (killable) target = { kind: 'minion', uid: killable.uid };
      else target = { kind: 'hero' };
    }
    attack(world, SIDE_RIVAL, minion.uid, target);
  }
}

/** A greedy but readable rival: play the dearest cards it can afford, then attack. */
export function rivalMove(world) {
  rivalPlayCards(world);
  rivalAttack(world);
  return EVENT_NONE;
}

/** Reset the world to a fresh game with the same generator. */
export function resetWorld(world) {
  nextUid = 1;
  const fresh = createWorld(world.random);
  for (const key of Object.keys(fresh)) world[key] = fresh[key];
}
