// The twelve cards of Ember Throne, two copies of each in a 24-card deck.
// Every card is an original name, suit and effect; nothing here copies a
// commercial game. Keywords:
//   battlecry — happens when the card is played from hand.
//   taunt     — enemies must attack this minion before any other target.
//   venom     — destroys any minion this one damages.
//   swift     — can attack on the turn it is played.
//   aegis     — prevents the first damage this takes each turn.
//   growth    — gains +1 attack and +1 health at the start of your turn.

/** @typedef {'ember'|'tide'|'thorn'|'star'} Suit */
/** @typedef {{ id: string, name: string, suit: Suit, cost: number, attack: number, health: number, text: string, keyword?: string }} CardDef */

export const CARD_DEFS = [
  { id: 'ember-imp', name: 'Ember Imp', suit: 'ember', cost: 1, attack: 2, health: 1, text: 'A quick spark, gone in a flash.' },
  { id: 'cinder-drake', name: 'Cinder Drake', suit: 'ember', cost: 4, attack: 4, health: 4, text: 'Battlecry: deal 2 damage to the enemy hero.', keyword: 'battlecry' },
  { id: 'flame-herald', name: 'Flame Herald', suit: 'ember', cost: 3, attack: 3, health: 2, text: 'Battlecry: deal 1 damage to all enemy minions.', keyword: 'battlecry' },
  { id: 'tide-oracle', name: 'Tide Oracle', suit: 'tide', cost: 2, attack: 1, health: 3, text: 'Battlecry: draw a card.', keyword: 'battlecry' },
  { id: 'spring-mender', name: 'Spring Mender', suit: 'tide', cost: 3, attack: 2, health: 4, text: 'Battlecry: restore 5 life to your hero.', keyword: 'battlecry' },
  { id: 'deep-leviathan', name: 'Deep Leviathan', suit: 'tide', cost: 5, attack: 5, health: 6, text: 'The tide answers no master.' },
  { id: 'thorn-sprout', name: 'Thorn Sprout', suit: 'thorn', cost: 1, attack: 1, health: 2, text: 'Growth: +1/+1 at the start of your turn.', keyword: 'growth' },
  { id: 'thorn-viper', name: 'Thorn Viper', suit: 'thorn', cost: 2, attack: 3, health: 2, text: 'Venom: destroys any minion it damages.', keyword: 'venom' },
  { id: 'bramble-guard', name: 'Bramble Guard', suit: 'thorn', cost: 2, attack: 2, health: 4, text: 'Taunt: enemies must attack this first.', keyword: 'taunt' },
  { id: 'star-warden', name: 'Star Warden', suit: 'star', cost: 3, attack: 2, health: 5, text: 'Aegis: prevents the first damage it takes each turn.', keyword: 'aegis' },
  { id: 'dawn-squire', name: 'Dawn Squire', suit: 'star', cost: 1, attack: 2, health: 2, text: 'Swift: can attack the turn it is played.', keyword: 'swift' },
  { id: 'comet-phoenix', name: 'Comet Phoenix', suit: 'star', cost: 6, attack: 6, health: 6, text: 'Battlecry: deal 3 damage to the enemy hero.', keyword: 'battlecry' },
];

/** Look a card definition up by id. */
export function cardDef(id) {
  return CARD_DEFS.find((def) => def.id === id) ?? null;
}

/** A fresh 24-card deck: two copies of each of the twelve cards, shuffled by the caller. */
export function buildDeck() {
  const deck = [];
  for (const def of CARD_DEFS) {
    deck.push(def.id, def.id);
  }
  return deck;
}

/** A minion on the table: a card id plus its live attack, health and state. */
export function makeMinion(defId, owner) {
  const def = cardDef(defId);
  return {
    uid: 0, // filled in by the world when the minion is created
    defId,
    owner,
    attack: def.attack,
    health: def.health,
    maxHealth: def.health,
    canAttack: def.keyword === 'swift',
    aegisUsed: false,
    justPlayed: true,
  };
}
