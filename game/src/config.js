// Every tuning number and colour in one place. The table is a fixed 1280x800 logical
// area; the renderer scales it to the window, so no rule below depends on screen size.

export const FIELD = { width: 1280, height: 800 };

export const RULES = {
  startingLife: 30,
  startingHand: 3,
  maxHand: 7,
  maxMana: 10,
  maxTable: 5,
  deckSize: 24,
  turnDraw: 1,
};

/** The four courts. Each suit is told apart by colour AND shape, never by text alone. */
export const SUITS = {
  ember: { name: 'Ember', color: '#e5484d', dark: '#8f1d22', shape: 'triangle', text: 'Burns bright. Direct damage and aggression.' },
  tide: { name: 'Tide', color: '#3e9bff', dark: '#144a8a', shape: 'droplet', text: 'Draws cards and mends wounds.' },
  thorn: { name: 'Thorn', color: '#46a758', dark: '#1e5c2e', shape: 'diamond', text: 'Grows, guards and poisons.' },
  star: { name: 'Star', color: '#f5b83d', dark: '#8a5f08', shape: 'star', text: 'Shields, swift strikes and finishers.' },
};

export const PALETTE = {
  backdrop: '#14102a',
  table: '#0f3d2e',
  tableEdge: '#c9a227',
  panel: '#1d1836',
  panelEdge: '#3a3160',
  parchment: '#f7f0dd',
  parchmentEdge: '#d8c9a3',
  ink: '#241d16',
  mutedInk: '#6b5d49',
  text: '#f2ead8',
  muted: '#9a8fc0',
  mana: '#4aa8ff',
  life: '#ff5d73',
  gold: '#f5b83d',
  button: '#c9a227',
  buttonText: '#241d16',
  danger: '#e5484d',
  win: '#ffd75e',
};

export const FONT = 'Georgia, "Times New Roman", serif';
export const UI_FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best result (wins) is kept between visits (this browser only). */
export const BEST_KEY = 'ember-throne.wins';
