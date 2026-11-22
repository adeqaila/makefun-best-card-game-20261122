// Paints the world into the page: heroes, hands, tables, log and overlays.
// The game is DOM, not canvas, so every card is real text — readable at
// thumbnail size — and suits are told apart by colour and shape.
import { SUITS, PALETTE } from './config.js';
import { cardDef } from './cards.js';
import { SIDE_PLAYER, SIDE_RIVAL } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

/** A suit pip: a CSS shape, one per suit — triangle, droplet, diamond, star. */
function pipEl(suit, sizeClass) {
  const suitDef = SUITS[suit];
  const pip = el('span', `pip pip-${suitDef.shape} ${sizeClass || ''}`);
  pip.style.setProperty('--suit', suitDef.color);
  pip.style.setProperty('--suit-dark', suitDef.dark);
  return pip;
}

function manaPips(filled, total) {
  const wrap = el('span', 'mana-pips');
  for (let i = 0; i < total; i += 1) {
    wrap.appendChild(el('span', `mana-pip${i < filled ? ' on' : ''}`));
  }
  return wrap;
}

/** A hero panel: portrait, name, life total and mana crystals. */
function heroPanel(hero, isRival) {
  const panel = el('div', `hero-panel${isRival ? ' rival' : ''}`);
  const portrait = el('div', 'portrait', isRival ? 'Q' : 'Y');
  panel.appendChild(portrait);
  const info = el('div', 'hero-info');
  info.appendChild(el('div', 'hero-name', hero.name));
  info.appendChild(el('div', 'hero-title', hero.title));
  panel.appendChild(info);
  const life = el('div', 'hero-life');
  life.appendChild(el('span', 'heart', '♥'));
  life.appendChild(el('span', 'life-num', String(hero.life)));
  life.appendChild(el('span', 'life-max', `/${hero.maxLife}`));
  panel.appendChild(life);
  const mana = el('div', 'hero-mana');
  mana.appendChild(el('span', 'mana-label', 'MANA'));
  mana.appendChild(manaPips(hero.mana, Math.max(hero.maxMana, 1)));
  mana.appendChild(el('span', 'mana-num', `${hero.mana}/${hero.maxMana}`));
  panel.appendChild(mana);
  return panel;
}

/** One card face: cost gem, suit pip, name, art, rules text, attack/health. */
export function cardFace(def, opts) {
  const options = opts || {};
  const card = el('div', `card suit-${def.suit}${options.small ? ' small' : ''}${options.playable ? ' playable' : ''}${options.selected ? ' selected' : ''}`);
  card.dataset.defId = def.id;
  if (options.uid !== undefined) card.dataset.uid = String(options.uid);
  if (options.handIndex !== undefined) card.dataset.handIndex = String(options.handIndex);
  card.appendChild(el('div', 'cost', String(def.cost)));
  const head = el('div', 'card-head');
  head.appendChild(pipEl(def.suit, 'pip-head'));
  head.appendChild(el('div', 'card-name', def.name));
  card.appendChild(head);
  const art = el('div', 'card-art');
  art.style.setProperty('--suit', SUITS[def.suit].color);
  art.style.setProperty('--suit-dark', SUITS[def.suit].dark);
  art.appendChild(pipEl(def.suit, 'pip-art'));
  art.appendChild(el('div', 'art-suit', SUITS[def.suit].name.toUpperCase()));
  card.appendChild(art);
  card.appendChild(el('div', 'card-text', def.text));
  const stats = el('div', 'card-stats');
  stats.appendChild(el('div', 'stat atk', String(def.attack)));
  stats.appendChild(el('div', 'stat hp', String(def.health)));
  card.appendChild(stats);
  if (options.badge) card.appendChild(el('div', 'card-badge', options.badge));
  return card;
}

/** A minion on the table: a card face plus its live attack/health and state. */
function minionEl(minion, ui, isRival) {
  const def = cardDef(minion.defId);
  const live = { ...def, attack: minion.attack, health: minion.health };
  const selected = ui.attackerUid === minion.uid;
  const targetable = ui.attackerUid !== null && isRival && ui.legalTargetUids.has(minion.uid);
  const badge = def.keyword === 'taunt' ? 'TAUNT' : def.keyword === 'venom' ? 'VENOM' : def.keyword === 'aegis' && !minion.aegisUsed ? 'AEGIS' : null;
  const card = cardFace(live, {
    small: true,
    uid: minion.uid,
    selected,
    badge,
  });
  card.classList.add('minion');
  if (isRival) card.classList.add('rival-minion');
  if (minion.canAttack && !isRival) card.classList.add('ready');
  if (!minion.canAttack) card.classList.add('sleeping');
  if (targetable) card.classList.add('targetable');
  if (minion.health < def.health) card.querySelector('.hp').classList.add('hurt');
  if (ui.lastPlayedUid === minion.uid) card.classList.add('just-played');
  return card;
}

/** The rival's hand: face-down card backs, count only. */
function rivalHandEl(count) {
  const wrap = el('div', 'rival-hand');
  const shown = Math.min(count, 7);
  for (let i = 0; i < shown; i += 1) {
    const back = el('div', 'card-back');
    back.appendChild(pipEl('star', 'pip-back'));
    wrap.appendChild(back);
  }
  wrap.appendChild(el('div', 'hand-count', `${count} card${count === 1 ? '' : 's'}`));
  return wrap;
}

export function createRenderer(root) {
  const stage = root.querySelector('#stage');
  const rivalBar = root.querySelector('#rival-bar');
  const rivalHand = root.querySelector('#rival-hand');
  const rivalTable = root.querySelector('#rival-table');
  const playerTable = root.querySelector('#player-table');
  const playerHand = root.querySelector('#player-hand');
  const playerBar = root.querySelector('#player-bar');
  const midBar = root.querySelector('#mid-bar');
  const logEl = root.querySelector('#log');
  const endTurnBtn = root.querySelector('#end-turn');
  const turnLabel = root.querySelector('#turn-label');
  const titleScreen = root.querySelector('#title-screen');
  const endScreen = root.querySelector('#end-screen');
  const endTitle = root.querySelector('#end-title');
  const endText = root.querySelector('#end-text');
  const endStats = root.querySelector('#end-stats');
  const banner = root.querySelector('#banner');

  function fitStage() {
    const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 800);
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }
  window.addEventListener('resize', fitStage);
  fitStage();

  function draw(world, screen, ui) {
    // Heroes.
    rivalBar.replaceChildren(heroPanel(world.rival.hero, true));
    rivalBar.querySelector('.hero-panel')?.classList.toggle('targetable', Boolean(ui.heroTargetable));
    const rivalDeck = el('div', 'deck-count', `Deck ${world.rival.deck.length}`);
    rivalBar.appendChild(rivalDeck);
    playerBar.replaceChildren(heroPanel(world.player.hero, false));
    const playerDeck = el('div', 'deck-count', `Deck ${world.player.deck.length}`);
    playerBar.appendChild(playerDeck);

    // Hands.
    rivalHand.replaceChildren(rivalHandEl(world.rival.hand.length));
    playerHand.replaceChildren();
    world.player.hand.forEach((defId, index) => {
      const def = cardDef(defId);
      const playable = !world.over && world.active === SIDE_PLAYER && world.player.hero.mana >= def.cost && world.player.table.length < 5;
      const card = cardFace(def, {
        handIndex: index,
        playable,
        selected: ui.selectedHand === index,
      });
      playerHand.appendChild(card);
    });
    if (world.player.hand.length === 0) {
      playerHand.appendChild(el('div', 'empty-hand', 'Your hand is empty — draw awaits.'));
    }

    // Tables.
    rivalTable.replaceChildren();
    if (world.rival.table.length === 0) rivalTable.appendChild(el('div', 'empty-table', 'The Hollow Queen has no minions yet.'));
    for (const minion of world.rival.table) rivalTable.appendChild(minionEl(minion, ui, true));
    playerTable.replaceChildren();
    if (world.player.table.length === 0) playerTable.appendChild(el('div', 'empty-table', 'Your side of the table is empty — play a card.'));
    for (const minion of world.player.table) playerTable.appendChild(minionEl(minion, ui, false));

    // Middle bar: log, turn, end-turn.
    logEl.replaceChildren();
    for (const line of world.log) logEl.appendChild(el('div', 'log-line', line));
    const yourTurn = world.active === SIDE_PLAYER && !world.over;
    turnLabel.textContent = world.over
      ? world.winner === SIDE_PLAYER ? 'The throne is yours!' : 'The throne is lost.'
      : yourTurn ? `Your turn — turn ${world.turn}` : 'The Hollow Queen is thinking…';
    endTurnBtn.disabled = !yourTurn;
    endTurnBtn.classList.toggle('ready', yourTurn);
    banner.textContent = yourTurn ? 'YOUR TURN' : '';
    banner.classList.toggle('show', yourTurn && ui.showBanner);

    // Overlays.
    titleScreen.classList.toggle('hidden', screen !== SCREEN_TITLE);
    endScreen.classList.toggle('hidden', screen !== SCREEN_WIN && screen !== SCREEN_LOSS);
    if (screen === SCREEN_WIN || screen === SCREEN_LOSS) {
      const won = screen === SCREEN_WIN;
      endTitle.textContent = won ? 'VICTORY' : 'DEFEAT';
      endTitle.className = won ? 'end-title win' : 'end-title loss';
      endText.textContent = won
        ? 'The Hollow Queen bows. The Ember Throne is yours — the four courts sing your name.'
        : 'The Hollow Queen keeps the throne… this time. Shuffle the deck and challenge her again.';
      endStats.textContent = `Turns played: ${world.turn}  ·  Your life: ${world.player.hero.life}  ·  Her life: ${world.rival.hero.life}`;
    }
  }

  return { draw, fitStage };
}
