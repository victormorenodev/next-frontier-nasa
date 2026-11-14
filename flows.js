/* Flows: what the base uses and makes as time passes, and how card answers change that.
   No DOM here, so it also runs in Node for tests.

   Time runs in THIRDS of a sol (see mission.js): third 0 of each sol is day, 1 afternoon, 2 night.
   Every third, each active flow adds its share to the quantities (Indicators.apply clamps 0..max).

   Three kinds of flow:
     base       always on: the crew breathes and eats, solar panels charge the battery…
     ongoing    started by an answer: a change per sol, maybe after a wait, maybe for a while
     later      started by an answer: a one-off change that happens some sols from now */
(function (root) {
  'use strict';

  const node = typeof module !== 'undefined' && module.exports;
  const Indicators = node ? require('./indicators.js') : root.Indicators;

  const THIRDS = 3;
  const CREW = 4;
  const SOL_HOURS = 24.6597;                 // NASA Mars24
  const perSolFromEarthDay = perDay => perDay * SOL_HOURS / 24;

  // Base flows. `kind`: 'reference' = from a published source (see CLAUDE.md §7),
  // 'simulated' = invented for the prototype. `periods` = parts of the sol when it runs
  // (default: all three); its per-sol amount is split evenly over those parts.
  const BASE_FLOWS = [
    {id: 'breathing',     quantity: 'oxygen', perSol: -CREW * perSolFromEarthDay(0.84), kind: 'reference',
      note: '4 astronauts breathe (0.84 kg O₂ per person per Earth day, NASA NTRS 20160005782)'},
    {id: 'oxygen-maker',  quantity: 'oxygen', perSol: 3,    kind: 'simulated', note: 'Machine that makes oxygen'},
    {id: 'eating',        quantity: 'food',   perSol: -CREW * perSolFromEarthDay(0.62), kind: 'reference',
      note: '4 astronauts eat (0.62 kg dry food per person per Earth day, NASA NTRS 20160005782)'},
    {id: 'water-loss',    quantity: 'water',  perSol: -4,   kind: 'simulated', note: 'Recycling does not get every drop back'},
    {id: 'solar-panels',  quantity: 'energy', perSol: 100,  kind: 'simulated', periods: [0, 1], note: 'Only while the Sun is up'},
    {id: 'base-power',    quantity: 'energy', perSol: -60,  kind: 'simulated', note: 'Lights, heaters, computers'}
  ];

  function createFlows() {
    return {ongoing: [], later: []};
  }

  // Records the lasting parts of an answer. `now` = mission time in thirds.
  //   ongoing: [{rates: {food: 1.5}, after: 3, for: 10, note}]  → +1.5 kg/sol, starts in 3 sols, lasts 10
  //   later:   [{after: 2, effects: {food: 6}, note}]            → +6 kg once, 2 sols from now
  // `after` and `for` are in sols; no `for` = forever.
  function addAnswer(flows, answer, now) {
    const ongoing = (answer.ongoing || []).map(o => ({
      rates: o.rates, note: o.note || '',
      start: now + (o.after || 0) * THIRDS,
      end: o.for == null ? Infinity : now + ((o.after || 0) + o.for) * THIRDS
    }));
    const later = (answer.later || []).map(l => ({effects: l.effects, note: l.note || '', at: now + l.after * THIRDS}));
    return {ongoing: [...flows.ongoing, ...ongoing], later: [...flows.later, ...later]};
  }

  // Change of each quantity during one third `t` (the third that starts at time t).
  function ratesForThird(flows, t) {
    const part = t % THIRDS, out = {};
    const add = (q, n) => { out[q] = (out[q] || 0) + n; };
    BASE_FLOWS.forEach(f => {
      const periods = f.periods || [0, 1, 2];
      if (periods.includes(part)) add(f.quantity, f.perSol / periods.length);
    });
    flows.ongoing.forEach(o => {
      if (t >= o.start && t < o.end) Object.entries(o.rates).forEach(([q, n]) => add(q, n / THIRDS));
    });
    return out;
  }

  // Net change per sol right now (a whole sol of base flows + ongoing changes active at `now`).
  // This is the "trend" shown to the player.
  function ratesPerSol(flows, now) {
    const out = {};
    Object.keys(Indicators.QUANTITIES).forEach(q => { out[q] = 0; });
    BASE_FLOWS.forEach(f => { out[f.quantity] += f.perSol; });
    flows.ongoing.forEach(o => {
      if (now >= o.start && now < o.end) Object.entries(o.rates).forEach(([q, n]) => { out[q] += n; });
    });
    return out;
  }

  // Ongoing changes in effect at `now` (not the ones still waiting to start), with time left.
  // `thirdsLeft` is Infinity for changes that last forever.
  function active(flows, now) {
    return flows.ongoing
      .filter(o => now >= o.start && now < o.end)
      .map(o => ({note: o.note, rates: o.rates, thirdsLeft: o.end - now}));
  }

  // Lets `thirds` pass from mission time `from`. Returns the new quantities and flows,
  // plus `happened`: the "later" events that fired. Finished changes are dropped.
  function passTime(state, flows, from, thirds) {
    let s = state, later = flows.later;
    const happened = [];
    for (let t = from; t < from + thirds; t++) {
      s = Indicators.apply(s, ratesForThird(flows, t));
      const due = later.filter(l => l.at <= t + 1);
      due.forEach(l => { s = Indicators.apply(s, l.effects); happened.push(l); });
      later = later.filter(l => l.at > t + 1);
    }
    const end = from + thirds;
    return {state: s, flows: {ongoing: flows.ongoing.filter(o => o.end > end), later}, happened};
  }

  const api = {THIRDS, CREW, SOL_HOURS, BASE_FLOWS, createFlows, addAnswer, ratesForThird, ratesPerSol, active, passTime};
  if (node) module.exports = api;
  else root.Flows = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
