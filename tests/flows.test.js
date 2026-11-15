// Development check only; the game itself does not need Node.
// Run: node tests/flows.test.js
const assert = require('node:assert');
const F = require('./load-engine.cjs').Flows;
const I = require('./load-engine.cjs').Indicators;
const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg || ''} ${a} ≠ ${b}`);

const empty = F.createFlows();
const s0 = I.createState();

// Base trend per sol: O₂ 3 − 3.45, water −4, energy +40, food −2.55 (4 crew, sol = 24.6597 h).
const base = F.ratesPerSol(empty, 0);
close(base.oxygen, 3 - 4 * 0.84 * 24.6597 / 24, 'oxygen');
close(base.water, -4, 'water');
close(base.energy, 40, 'energy');
close(base.food, -4 * 0.62 * 24.6597 / 24, 'food');
close(base.shield, 0, 'shield');            // radiation does not use up the shield

// Daily budgets have no day/afternoon/night dependency.
[0, 1, 2].forEach(t => close(F.ratesForThird(empty, t).energy, 40 / 3));

// One whole sol of base flows = the per-sol trend (energy starts below max so nothing clamps).
const oneSol = F.passTime(s0, empty, 0, 3).state;
['oxygen', 'water', 'food', 'energy'].forEach(q => close(oneSol[q] - s0[q], base[q], q));

// Ongoing change: dust → −30 kWh/sol for 3 sols, then back to normal.
let flows = F.addAnswer(empty, {ongoing: [{rates: {energy: -30}, for: 3}]}, 0);
close(F.ratesPerSol(flows, 0).energy, 10);
close(F.ratesPerSol(flows, 9).energy, 40);
let r = F.passTime(s0, flows, 0, 9);
close(r.state.energy, s0.energy + 3 * 10, 'three dusty sols');
assert.equal(r.flows.ongoing.length, 0);    // finished changes are dropped

// Delayed start: plants give food only after 3 sols, for 2 sols.
flows = F.addAnswer(empty, {ongoing: [{rates: {food: 1.5}, after: 3, for: 2}]}, 0);
close(F.ratesPerSol(flows, 0).food, base.food);
close(F.ratesPerSol(flows, 9).food, base.food + 1.5);
r = F.passTime({...s0, food: 50}, flows, 0, 15);
close(r.state.food, 50 + 5 * base.food + 2 * 1.5, 'harvest over 2 sols');

// "Later": a one-off change 2 sols after the answer (answered at third 4).
flows = F.addAnswer(empty, {later: [{after: 2, effects: {food: 6}}]}, 4);
const hungry = {...s0, food: 50};            // room in the store, so nothing is clamped
r = F.passTime(hungry, flows, 4, 5);        // up to third 9: not yet (due at 10)
assert.equal(r.happened.length, 0);
assert.equal(r.flows.later.length, 1);
const r2 = F.passTime(r.state, r.flows, 9, 1);
assert.equal(r2.happened.length, 1);
assert.equal(r2.flows.later.length, 0);
close(r2.state.food - r.state.food, 6 + base.food / 3, 'later fired once');

// Flows never mutate their input.
assert.deepEqual(empty, {ongoing: [], later: []});

// Stores never go above their capacity or below zero.
const full = F.passTime(s0, F.addAnswer(empty, {later: [{after: 0, effects: {food: 50}}]}, 0), 0, 1).state;
assert.equal(full.food, 100);
const drained = F.passTime(s0, F.addAnswer(empty, {ongoing: [{rates: {oxygen: -1000}}]}, 0), 0, 3).state;
assert.equal(drained.oxygen, 0);

// Active effects: only the ones running now, with the time left (in thirds).
flows = F.addAnswer(empty, {ongoing: [
  {rates: {energy: -30}, for: 3, note: 'Dusty panels'},
  {rates: {food: 1.5}, after: 3, for: 10, note: 'New plants'},
  {rates: {water: 1}, note: 'Forever'}
]}, 0);
assert.deepEqual(F.active(flows, 0).map(a => [a.note, a.thirdsLeft]), [['Dusty panels', 9], ['Forever', Infinity]]);
assert.deepEqual(F.active(flows, 4).map(a => a.thirdsLeft), [5, Infinity]);
assert.deepEqual(F.active(flows, 9).map(a => a.note), ['New plants', 'Forever']);   // dust over, plants started

// Display FIFO spans ongoing and scheduled effects without cancelling simulation.
let queue = F.createFlows();
queue = F.addAnswer(queue, {ongoing: [{rates: {water: -1}, note: 'First', for: 10}]}, 0);
queue = F.addAnswer(queue, {later: [{effects: {food: 2}, note: 'Second', after: 5}]}, 0);
queue = F.addAnswer(queue, {ongoing: [{rates: {oxygen: -1}, note: 'Third', for: 1}]}, 0);
queue = F.addAnswer(queue, {ongoing: [{rates: {energy: -1}, note: 'Fourth', for: 2}]}, 0);
const visibleQueue = f => [...f.ongoing, ...f.later].filter(o => !o.panelHidden)
  .sort((a, b) => a.panelOrder - b.panelOrder).map(o => o.note);
assert.deepEqual(visibleQueue(queue), ['Second', 'Third', 'Fourth']);
assert.equal(queue.ongoing.find(o => o.note === 'First').panelHidden, true);
close(F.ratesPerSol(queue, 0).water, base.water - 1);
const expiredQueue = F.passTime(s0, queue, 0, 3).flows;
assert.deepEqual(visibleQueue(expiredQueue), ['Second', 'Fourth']);
assert.deepEqual(visibleQueue(JSON.parse(JSON.stringify(expiredQueue))), ['Second', 'Fourth']);

console.log('flows: ok');
