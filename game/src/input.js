// Mouse and keyboard: clicks on cards, minions, heroes and buttons become
// intents the main loop acts on. Clicking is delegated from the stage root,
// so re-renders never lose a listener.
import { SIDE_PLAYER } from './world.js';

export const ACTION_START = 1;
export const ACTION_END_TURN = 2;
export const ACTION_CANCEL = 4;

/**
 * Wire the stage. `hooks` carries what the game does with each intent:
 * playCard(handIndex), selectAttacker(uid), attackTarget(target),
 * endTurn(), startGame(), playAgain().
 */
export function createInput(root, hooks) {
  function onClick(event) {
    const target = event.target;
    const startBtn = target.closest('#start-btn');
    if (startBtn) {
      hooks.startGame();
      return;
    }
    const againBtn = target.closest('#again-btn');
    if (againBtn) {
      hooks.playAgain();
      return;
    }
    const endBtn = target.closest('#end-turn');
    if (endBtn) {
      hooks.endTurn();
      return;
    }
    // A hero portrait is the hero target.
    const heroPanel = target.closest('.hero-panel.rival');
    if (heroPanel) {
      hooks.attackTarget({ kind: 'hero' });
      return;
    }
    // A minion on either table.
    const minion = target.closest('.minion');
    if (minion) {
      const uid = Number(minion.dataset.uid);
      if (minion.classList.contains('rival-minion')) hooks.attackTarget({ kind: 'minion', uid });
      else hooks.selectAttacker(uid);
      return;
    }
    // A card in the player's hand.
    const handCard = target.closest('#player-hand .card');
    if (handCard) {
      hooks.playCard(Number(handCard.dataset.handIndex));
      return;
    }
    // Clicking empty table space cancels a selection.
    hooks.cancelSelection();
  }

  function onKey(event) {
    if (event.key === 'Escape') hooks.cancelSelection();
    else if (event.key === 'Enter' || event.key === ' ') {
      const startBtn = root.querySelector('#start-btn');
      const againBtn = root.querySelector('#again-btn');
      if (!root.querySelector('#title-screen').classList.contains('hidden')) hooks.startGame();
      else if (!root.querySelector('#end-screen').classList.contains('hidden')) hooks.playAgain();
      event.preventDefault();
    } else if (event.key === 'e' || event.key === 'E') {
      hooks.endTurn();
    }
  }

  root.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);

  return {
    destroy() {
      root.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKey);
    },
  };
}
