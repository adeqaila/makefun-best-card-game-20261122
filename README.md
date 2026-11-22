# Ember Throne — Make the best card game

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/adeqaila/makefun-best-card-game-20261122/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/adeqaila/makefun-best-card-game-20261122/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

An original turn-based card battler for the make.fun bounty
`best-card-game-20261122-1826`. You are the Champion of the Four Courts,
duelling the Hollow Queen for the Ember Throne. Spend mana, play cards from
the four courts — Ember, Tide, Thorn and Star — and bring her life to zero
before she brings yours to zero.

## How it plays

- Both heroes start at 30 life. Mana grows by 1 each turn (to 10) and refills.
- Draw a card each turn; hands hold at most 7.
- Click a card in your hand to play it (it costs mana). Minions wait a turn
  before they can attack, unless they are **Swift**.
- Click one of your ready minions, then an enemy minion or the Hollow
  Queen's portrait to attack. Attacking a minion strikes back.
- **Taunt** minions must be attacked first. **Venom** destroys whatever it
  wounds. **Aegis** ignores the first damage each turn. **Growth** minions
  grow +1/+1 every turn. **Battlecry** triggers when the card is played.
- Press **E** to end your turn, **Esc** to cancel a selection.

## The twelve cards

| Court | Card | Cost | Atk/Hp | Text |
| --- | --- | --- | --- | --- |
| Ember | Ember Imp | 1 | 2/1 | A quick spark, gone in a flash. |
| Ember | Cinder Drake | 4 | 4/4 | Battlecry: deal 2 damage to the enemy hero. |
| Ember | Flame Herald | 3 | 3/2 | Battlecry: deal 1 damage to all enemy minions. |
| Tide | Tide Oracle | 2 | 1/3 | Battlecry: draw a card. |
| Tide | Spring Mender | 3 | 2/4 | Battlecry: restore 5 life to your hero. |
| Tide | Deep Leviathan | 5 | 5/6 | The tide answers no master. |
| Thorn | Thorn Sprout | 1 | 1/2 | Growth: +1/+1 at the start of your turn. |
| Thorn | Thorn Viper | 2 | 3/2 | Venom: destroys any minion it damages. |
| Thorn | Bramble Guard | 2 | 2/4 | Taunt: enemies must attack this first. |
| Star | Star Warden | 3 | 2/5 | Aegis: prevents the first damage it takes each turn. |
| Star | Dawn Squire | 1 | 2/2 | Swift: can attack the turn it is played. |
| Star | Comet Phoenix | 6 | 6/6 | Battlecry: deal 3 damage to the enemy hero. |

Two copies of each make the 24-card deck.

## Files

- `main.ts` — the entry program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the kit library.
- `game/` — the game, plain static files, no network: `index.html`,
  `styles.css`, and `src/` split by job (`config`, `random`, `cards`,
  `world`, `render`, `input`, `sound`, `shots`, `main`).
- `screenshots/` — four real renders of the game's own code:
  `1-play.jpg` (the cover: a mid-game table), `2-title.jpg`,
  `3-win.jpg`, `4-loss.jpg`. Retake them with `python3 take_shots.py`.
- `vendor/makefun-game.ts` — the kit's library, unchanged.
- `LICENSE` — MIT.

## Play it

Serve `game/` with any static server and open it in desktop Chrome:

```sh
cd game && python3 -m http.server 8000
```

Screenshot scenes are staged deterministically with `?shot=start|play|win|loss&seed=7`;
`window.__shotReady` is set once the scene is painted.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`out/` then holds `game/`, `screenshots/` and `dossier.json`.
