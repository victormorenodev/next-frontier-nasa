// Development check only; the game itself does not need Node.
// Run: node tests/flows.test.js
const assert = require('node:assert');
const F = require('./load-engine.cjs').Flows;
const I = require('./load-engine.cjs').Indicators;
const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg || ''} ${a} ≠ ${b}`);

const multiplier = require('../data/mission.json').dailyCostMultiplier ?? 1;
const empty = F.createFlows();
const s0 = I.createState();

// Base trend per sol: O₂ 3 − 3.45, water −4, energy +40, food −2.55 (4 crew, sol = 24.6597 h).
const base = F.ratesPerSol(empty, 0);
close(base.oxygen, 3 - multiplier * 4 * 0.84 * 24.6597 / 24, 'oxygen');
close(base.water, -4 * multiplier, 'water');
close(base.energy, 100 - 60 * multiplier, 'energy');
close(base.food, -multiplier * 4 * 0.62 * 24.6597 / 24, 'food');
close(base.shield, 0, 'shield');            // radiation does not use up the shield

// Daily budgets have no day/afternoon/night dependency.
[0, 1, 2].forEach(t => close(F.ratesForThird(empty, t).energy, base.energy / 3));

// One whole sol of base flows = the per-sol trend (energy starts below max so nothing clamps).
const oneSol = F.passTime(s0, empty, 0, 3).state;
['oxygen', 'water', 'food', 'energy'].forEach(q => close(oneSol[q] - s0[q], base[q], q));

// Ongoing change: dust → −30 kWh/sol for 3 sols, then back to normal.
let flows = F.addAnswer(empty, {ongoing: [{rates: {energy: -30}, for: 3}]}, 0);
close(F.ratesPerSol(flows, 0).energy, base.energy - 30);
close(F.ratesPerSol(flows, 9).energy, base.energy);
let r = F.passTime(s0, flows, 0, 9);
close(r.state.energy, Math.max(0, Math.min(300, s0.energy + 3 * (base.energy - 30))), 'three dusty sols');
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

// The real FIFO spans ongoing and scheduled effects and cancels the oldest.
let queue = F.createFlows();
queue = F.addAnswer(queue, {ongoing: [{rates: {water: -1}, note: 'First', for: 10}]}, 0);
queue = F.addAnswer(queue, {later: [{effects: {food: 2}, note: 'Second', after: 5}]}, 0);
queue = F.addAnswer(queue, {ongoing: [{rates: {oxygen: -1}, note: 'Third', for: 1}]}, 0);
queue = F.addAnswer(queue, {ongoing: [{rates: {energy: -1}, note: 'Fourth', for: 2}]}, 0);
const visibleQueue = f => [...f.ongoing, ...f.later].filter(o => !o.panelHidden)
  .sort((a, b) => a.panelOrder - b.panelOrder).map(o => o.note);
assert.deepEqual(visibleQueue(queue), ['Second', 'Third', 'Fourth']);
assert.equal(queue.ongoing.find(o => o.note === 'First'), undefined);
close(F.ratesPerSol(queue, 0).water, base.water);
const expiredQueue = F.passTime(s0, queue, 0, 3).flows;
assert.deepEqual(visibleQueue(expiredQueue), ['Second', 'Fourth']);
assert.deepEqual(visibleQueue(JSON.parse(JSON.stringify(expiredQueue))), ['Second', 'Fourth']);

// Depletion cannot be rescued later in the same sol when resolving a mission.
const rescue = {ongoing: [], later: [{at: 1, effects: {food: 100}, note: 'Too late'}]};
const stopped = F.passTime({...s0, food: 0.01}, rescue, 0, 3, {stopOnEmpty:true});
assert.equal(stopped.failedResource, 'food');
assert.equal(stopped.thirdsPassed, 1);
assert.equal(stopped.state.food, 0);
assert.equal(stopped.happened.length, 0);
assert.equal(stopped.flows.later.length, 1);
const delayedFailure = F.passTime(s0, {ongoing: [], later: [{at:1,effects:{shield:-10}}]}, 0, 3, {stopOnEmpty:true});
assert.equal(delayedFailure.failedResource, 'shield');
assert.equal(delayedFailure.happened.length, 1);

// New missions accelerate only their selected physical resource.
const normal = F.ratesPerSol(F.createFlows(null), 0);
for (const selected of ['oxygen','water','shield','energy','food']) {
  const chosen = F.createFlows(selected);
  const rates = F.ratesPerSol(chosen, 0);
  for (const key of Object.keys(normal)) {
    const extra = F.BASE_FLOWS.filter(f => f.quantity === key && f.amount < 0)
      .reduce((sum, f) => sum + f.amount * (f.basis === 'perCrewEarthDay' ? F.CREW * F.SOL_HOURS / 24 : 1) * (multiplier-1), 0);
    close(rates[key], normal[key] + (key === selected ? extra : 0));
  }
  assert.equal(F.addAnswer(chosen, {}, 0).dailyCostResource, selected);
  const advanced = F.passTime(s0, chosen, 0, 3);
  assert.equal(advanced.flows.dailyCostResource, selected);
  close(advanced.state.water, s0.water + rates.water);
}
close(normal.energy, 40);
close(normal.water, -4);

// A discarded scheduled event never fires, and discarded rates never reappear.
let planned = F.createFlows();
for (let i=0;i<4;i++) planned=F.addAnswer(planned,{later:[{after:1,effects:i===0?{shield:-8}:{food:1},note:`Event ${i}`}]},0);
assert.equal(planned.later.length,3);
const deliveries=F.passTime(s0,planned,0,3);
assert.deepEqual(deliveries.happened.map(o=>o.note),['Event 1','Event 2','Event 3']);
assert.equal(deliveries.state.shield,s0.shield);
// Legacy hidden flows are cancelled on reads, integration, and restore normalization.
const legacyQueue={ongoing:[{rates:{water:-1000},start:0,end:30,panelHidden:true,panelOrder:1}],later:[{effects:{shield:-8},at:1,panelHidden:true,panelOrder:2}]};
close(F.ratesPerSol(legacyQueue,0).water,base.water);
assert.equal(F.active(legacyQueue,0).length,0);
const migrated=F.limitEffects(legacyQueue,0);
assert.deepEqual(migrated.ongoing,[]);assert.deepEqual(migrated.later,[]);
const restored=F.passTime(s0,legacyQueue,0,3);
close(restored.state.water,s0.water+base.water);assert.equal(restored.state.shield,s0.shield);
// One answer can create more than three effects: only the newest three survive.
const batch=F.addAnswer(F.createFlows(),{ongoing:Array.from({length:5},(_,i)=>({rates:{water:-i},for:5,note:`Rate ${i}`}))},0);
assert.deepEqual(visibleQueue(batch),['Rate 2','Rate 3','Rate 4']);
close(F.ratesPerSol(batch,0).water,base.water-9);

console.log('flows: ok');
