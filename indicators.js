/* Indicator system.
   Holds the base's quantities and derives the five indicators from them.
   No DOM here, so it also runs in Node for tests.
   Every quantity has a physical unit; values stay between 0 and their max. */
(function (root) {
  'use strict';

  // Each quantity the base keeps track of, with its unit (`unit` short, `unitName` in words).
  // Start/max values come from the earlier prototype (see CLAUDE.md §5): prototype choices,
  // not measured equipment. `max` is the storage capacity used to draw how full it is.
  const QUANTITIES = {
    // Oxygen is stored as a mass: consumption references are in kg per person per day.
    oxygen: {name: 'Oxygen', unit: 'kg',     unitName: 'kilograms',             start: 60,  max: 60},
    // Tank holds more than the start amount, so water moved back from the shield fits (mass kept).
    water:  {name: 'Water',  unit: 'L',      unitName: 'liters',                start: 600, max: 700},
    // Shield = water spread around the shelter, as mass per area (1 g/cm² = 10 kg/m²).
    // It is not a dose: it does not say how much radiation is blocked.
    shield: {name: 'Shield', unit: 'g/cm²',  unitName: 'grams per square centimeter', start: 8, max: 10},
    // Energy stored in the battery (kWh), not power (kW).
    energy: {name: 'Energy', unit: 'kWh',    unitName: 'kilowatt-hours',        start: 240, max: 300},
    // Dry food mass.
    food:   {name: 'Food',   unit: 'kg',     unitName: 'kilograms of dry food', start: 100, max: 100}
  };

  // The five indicators shown to the player, one per quantity, in screen order.
  // (The code still allows an indicator with several parts; none uses it now.)
  const INDICATORS = [
    {id: 'oxygen', name: 'Oxygen Level',     parts: ['oxygen']},
    {id: 'water',  name: 'Water Stock',      parts: ['water']},
    {id: 'shield', name: 'Radiation Shield', parts: ['shield']},
    {id: 'energy', name: 'Energy Supply',    parts: ['energy']},
    {id: 'food',   name: 'Food Stock',       parts: ['food']}
  ];

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
  function read(state) {
    return INDICATORS.map(ind => {
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

  const api = {QUANTITIES, INDICATORS, createState, change, apply, level, read};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Indicators = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
