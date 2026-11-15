/* Indicator system.
   Holds the base's quantities and derives the five indicators from them.
   No DOM here, so it also runs in Node for tests.
   Shield is a percentage score; other quantities use physical units; values stay between 0 and their max. */
(function (root) {
  'use strict';

  // Each quantity the base keeps track of, with its unit (`unit` short, `unitName` in words).
  // Start/max values come from the earlier prototype (see docs/RESEARCH.md, historical prototype parameters): prototype choices,
  // not measured equipment. `max` is the storage capacity used to draw how full it is.
  const QUANTITIES = GameData.resources.quantities;
  const INDICATORS = GameData.resources.indicators;

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  function createState() {
    const state = {};
    Object.keys(QUANTITIES).forEach(key => { state[key] = QUANTITIES[key].start; });
    return state;
  }

  // Returns a new state with `amount` added to one quantity, kept between 0 and its max.
  function change(state, key, amount) {
    if (!(key in QUANTITIES)) throw new Error(`Unknown quantity: ${key}`);
    return {...state, [key]: clamp(state[key] + amount, 0, QUANTITIES[key].max)};
  }

  // Applies several changes at once, e.g. a card answer: {energy: -8, oxygen: -2}.
  function apply(state, effects) {
    return Object.entries(effects || {}).reduce((s, [key, amount]) => change(s, key, amount), state);
  }

  // How full a quantity is, from 0 (empty) to 1 (full).
  function level(state, key) {
    return state[key] / QUANTITIES[key].max;
  }

  // What the interface needs for each indicator.
  // An indicator's level is its lowest part: plenty of water must not hide low oxygen.
  function read(state, definitions = INDICATORS) {
    return definitions.map(ind => {
      const parts = ind.parts.map(key => ({
        id: key,
        name: QUANTITIES[key].name,
        unit: QUANTITIES[key].unit,
        unitName: QUANTITIES[key].unitName,
        value: state[key],
        max: QUANTITIES[key].max,
        level: level(state, key)
      }));
      const lowest = parts.reduce((a, b) => (b.level < a.level ? b : a));
      return {id: ind.id, name: ind.name, level: lowest.level, lowest: lowest.id, parts};
    });
  }

  // Actual depletion only: a rounded display of zero is not failure.
  const depleted = state => Object.keys(QUANTITIES).find(q => state[q] <= 0) || null;

  const api = {depleted, QUANTITIES, INDICATORS, createState, change, apply, level, read};
   root.Indicators = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
