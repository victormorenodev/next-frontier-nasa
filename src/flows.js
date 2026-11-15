/* Flows: what the base uses and makes as time passes, and how card answers change that.
   No DOM here, so it also runs in Node for tests.

   Time runs in THIRDS of a sol (see mission.js): these are internal integration steps, without visible day periods.
   Every third, each active flow adds its share to the quantities (Indicators.apply clamps 0..max).

   Three kinds of flow:
     base       always on: the crew breathes and eats, solar panels charge the battery…
     ongoing    started by an answer: a change per sol, maybe after a wait, maybe for a while
     later      started by an answer: a one-off change that happens some sols from now */
(function (root) {
  'use strict';

  const Indicators = root.Indicators;

  const THIRDS = 3;
  const CREW = GameData.mission.crew;
  const SOL_HOURS = GameData.mission.solHours;                 // NASA Mars24
  const perSolFromEarthDay = perDay => perDay * SOL_HOURS / 24;

  // Base flows. `kind`: 'reference' = from a published source (see docs/RESEARCH.md, studies and proposed applications),
  // 'simulated' = invented for the prototype. Daily budgets are split over three internal steps.
  const BASE_FLOWS = GameData.flows.map(f => ({...f, perSol: f.amount * (f.amount < 0 ? (GameData.mission.dailyCostMultiplier ?? 1) : 1) * (f.basis === 'perCrewEarthDay' ? CREW * SOL_HOURS / 24 : 1)}));

  function createFlows(dailyCostResource) {
    return {ongoing: [], later: [], ...(dailyCostResource === undefined ? {} : {dailyCostResource})};
  }

  function baseRate(flow, flows) {
    // Missing selection identifies old saves, which retain their original global multiplier.
    if (!Object.hasOwn(flows, 'dailyCostResource')) return flow.perSol;
    const base = flow.amount * (flow.basis === 'perCrewEarthDay' ? CREW * SOL_HOURS / 24 : 1);
    return base * (flow.amount < 0 && flows.dailyCostResource === flow.quantity ? (GameData.mission.dailyCostMultiplier ?? 1) : 1);
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
    // Keep a persistent display queue across both kinds of effect. Evicted icons
    // stay hidden even if newer effects expire; simulation still applies all flows.
    const previous = [...flows.ongoing, ...flows.later];
    let order = Math.max(0, ...previous.map(o => o.panelOrder || 0));
    [...ongoing, ...later].forEach(o => { o.panelOrder = ++order; });
    const next = {ongoing: [...flows.ongoing, ...ongoing], later: [...flows.later, ...later]};
    const visible = [...next.ongoing, ...next.later]
      .filter(o => !o.panelHidden)
      .sort((a, b) => (a.panelOrder || 0) - (b.panelOrder || 0));
    const evicted = new Set(visible.slice(0, Math.max(0, visible.length - 3)));
    return {
      ...flows,
      ongoing: next.ongoing.map(o => evicted.has(o) ? {...o, panelHidden: true} : o),
      later: next.later.map(o => evicted.has(o) ? {...o, panelHidden: true} : o)
    };
  }

  // Change of each quantity during one third `t` (the third that starts at time t).
  function ratesForThird(flows, t) {
    const out = {};
    const add = (q, n) => { out[q] = (out[q] || 0) + n; };
    BASE_FLOWS.forEach(f => {
      add(f.quantity, baseRate(f, flows) / THIRDS);
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
    BASE_FLOWS.forEach(f => { out[f.quantity] += baseRate(f, flows); });
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
  function passTime(state, flows, from, thirds, {stopOnEmpty = false} = {}) {
    let s = state, later = flows.later, end = from;
    const happened = [];
    let failedResource = null;
    for (let t = from; t < from + thirds; t++) {
      s = Indicators.apply(s, ratesForThird(flows, t));
      end = t + 1;
      failedResource = stopOnEmpty ? Indicators.depleted(s) : null;
      if (failedResource) break;
      const due = later.filter(l => l.at <= t + 1);
      for (const l of due) {
        s = Indicators.apply(s, l.effects); happened.push(l);
        later = later.filter(item => item !== l);
        failedResource = stopOnEmpty ? Indicators.depleted(s) : null;
        if (failedResource) break;
      }
      if (failedResource) break;
    }
    return {state: s, flows: {...flows, ongoing: flows.ongoing.filter(o => o.end > end), later},
      happened, failedResource, thirdsPassed: end - from};
  }

  const api = {THIRDS, CREW, SOL_HOURS, BASE_FLOWS, createFlows, addAnswer, ratesForThird, ratesPerSol, active, passTime};
   root.Flows = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
