// Boot and the one loop: the game is event-driven — every click or keypress
// changes the world, the renderer paints what is there, and the rival takes
// her turn in paced steps so the player can follow it.
//
// ?seed=N fixes the shuffle. ?shot=start|play|win|loss (with &seed=N) stages
// that scene instead of running the game, paints it and sets
// window.__shotReady for a screenshot.
import { BEST_KEY } from './config.js';
import { createRandom } from './random.js';
import { cardDef } from './cards.js';
import {
  SIDE_PLAYER,
  SIDE_RIVAL,
  canAttackAnything,
  createWorld,
  endTurn,
  legalTargets,
  playCard,
  attack,
  resetWorld,
  rivalAttack,
  rivalPlayCards,
} from './world.js';
import { createRenderer, SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, cardFace } from './render.js';
import { createInput } from './input.js';
import { stageShot } from './shots.js';
import { sound } from './sound.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const root = document.getElementById('stage').parentElement;
const status = document.getElementById('status');
const renderer = createRenderer(root);
const world = createWorld(createRandom(seed));

let screen = SCREEN_TITLE;
let wins = readWins();
let rivalBusy = false;

/** UI state the renderer reads: selection, legal targets, banner, last play. */
const ui = {
  selectedHand: null,
  attackerUid: null,
  legalTargetUids: new Set(),
  heroTargetable: false,
  showBanner: false,
  lastPlayedUid: null,
};

function readWins() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveWins(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): wins then last this visit only.
  }
}

function announce(message) {
  status.textContent = message;
}

function draw() {
  renderer.draw(world, screen, ui);
  const bestLine = document.getElementById('best-line');
  if (bestLine) bestLine.textContent = wins > 0 ? `Thrones claimed so far: ${wins}` : 'No throne claimed yet — the Hollow Queen awaits.';
}

function clearSelection() {
  ui.attackerUid = null;
  ui.legalTargetUids = new Set();
  ui.heroTargetable = false;
  ui.selectedHand = null;
}

function checkOver() {
  if (!world.over) return;
  if (world.winner === SIDE_PLAYER) {
    screen = SCREEN_WIN;
    wins += 1;
    saveWins(wins);
    sound.win();
    announce('Victory! The Ember Throne is yours.');
  } else {
    screen = SCREEN_LOSS;
    sound.lose();
    announce('Defeat. The Hollow Queen keeps the throne.');
  }
}

function startGame() {
  sound.unlock();
  resetWorld(world);
  screen = SCREEN_PLAY;
  rivalBusy = false;
  clearSelection();
  ui.showBanner = true;
  draw();
  sound.turn();
  window.setTimeout(() => {
    ui.showBanner = false;
    draw();
  }, 1200);
  announce('Playing. Your turn — play a card or attack.');
}

/** The rival's turn, paced so each step is visible: think, play, attack, pass. */
function runRivalTurn() {
  rivalBusy = true;
  draw();
  window.setTimeout(() => {
    const before = world.player.hero.life;
    rivalPlayCards(world);
    draw();
    sound.playCard();
    window.setTimeout(() => {
      rivalAttack(world);
      if (world.player.hero.life < before) sound.damage();
      else sound.attack();
      draw();
      checkOver();
      window.setTimeout(() => {
        if (!world.over) {
          endTurn(world);
          ui.showBanner = true;
          sound.turn();
          draw();
          window.setTimeout(() => {
            ui.showBanner = false;
            draw();
          }, 1200);
        }
        rivalBusy = false;
        draw();
      }, 650);
    }, 750);
  }, 800);
}

function doEndTurn() {
  if (screen !== SCREEN_PLAY || world.over || world.active !== SIDE_PLAYER || rivalBusy) return;
  clearSelection();
  endTurn(world);
  draw();
  runRivalTurn();
}

const hooks = {
  startGame,
  playAgain: startGame,
  cancelSelection() {
    clearSelection();
    draw();
  },
  endTurn: doEndTurn,
  playCard(handIndex) {
    if (screen !== SCREEN_PLAY || world.over || world.active !== SIDE_PLAYER || rivalBusy) return;
    sound.unlock();
    const defId = world.player.hand[handIndex];
    if (defId === undefined) return;
    const def = cardDef(defId);
    const before = world.player.table.length;
    const events = playCard(world, SIDE_PLAYER, handIndex);
    if (world.player.table.length > before) {
      ui.lastPlayedUid = world.player.table[world.player.table.length - 1].uid;
      sound.playCard();
      if (def.id === 'spring-mender') sound.heal();
      clearSelection();
      draw();
      checkOver();
      window.setTimeout(() => {
        ui.lastPlayedUid = null;
        draw();
      }, 400);
    } else {
      announce(`Cannot play ${def.name} — not enough mana, or the table is full.`);
    }
  },
  selectAttacker(uid) {
    if (screen !== SCREEN_PLAY || world.over || world.active !== SIDE_PLAYER || rivalBusy) return;
    if (!canAttackAnything(world, SIDE_PLAYER, uid)) {
      announce('That minion cannot attack yet — it rests the turn it is played.');
      return;
    }
    if (ui.attackerUid === uid) {
      clearSelection();
    } else {
      ui.attackerUid = uid;
      const legal = legalTargets(world, SIDE_PLAYER);
      ui.legalTargetUids = new Set(legal.filter((t) => t.kind === 'minion').map((t) => t.uid));
      ui.heroTargetable = legal.some((t) => t.kind === 'hero');
      sound.turn();
    }
    draw();
  },
  attackTarget(target) {
    if (screen !== SCREEN_PLAY || world.over || world.active !== SIDE_PLAYER || rivalBusy) return;
    if (ui.attackerUid === null) return;
    const attackerUid = ui.attackerUid;
    const before = world.rival.hero.life;
    attack(world, SIDE_PLAYER, attackerUid, target);
    sound.attack();
    if (world.rival.hero.life < before) sound.damage();
    clearSelection();
    draw();
    checkOver();
  },
};

createInput(root, hooks);

// The title screen shows three real cards fanned out behind the blurb.
const titleCards = document.getElementById('title-cards');
if (titleCards) {
  for (const defId of ['cinder-drake', 'tide-oracle', 'comet-phoenix']) {
    titleCards.appendChild(cardFace(cardDef(defId), {}));
  }
}

function runShot(name) {
  document.body.classList.add('shot');
  const scene = stageShot(name, world);
  screen = scene.screen;
  Object.assign(ui, scene.ui);
  draw();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__shotReady = true;
    });
  });
}

if (shot) runShot(shot);
else {
  draw();
  announce('Ember Throne. Press Enter or click Begin the Duel to start.');
}
