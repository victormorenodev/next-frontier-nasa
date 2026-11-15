const assert = require('node:assert');
const M = require('./load-engine.cjs').Mission;
const F = require('./load-engine.cjs').Flows;
const I = require('./load-engine.cjs').Indicators;
const m = M.createMission();
assert.deepEqual(m, {ended: false, reason: null, elapsed: 0, sol: 1});
assert.equal(M.eventsForSol(() => 0), 1);
assert.equal(M.eventsForSol(() => 0.799999), 1);
assert.equal(M.eventsForSol(() => 0.80), 2);
assert.equal(M.eventsForSol(() => 0.949999), 2);
assert.equal(M.eventsForSol(() => 0.95), 2);
assert.equal(M.eventsForSol(() => 0.999999), 2);
const counts = [0, 0, 0];
for (let i = 0; i < 10000; i++) counts[M.eventsForSol(() => i / 10000)]++;
assert.deepEqual(counts, [0, 8000, 2000]);

// One or two events still consume exactly one sol of resources.
for (const events of [1, 2]) {
  let mission = M.createMission(), state = I.createState(), flows = F.createFlows();
  for (let sol = 1; sol <= 30; sol++) {
    assert.equal(mission.sol, sol);
    assert.equal(mission.ended, false);
    for (let event = 0; event < events; event++) {
      state = I.apply(state, {});
      flows = F.addAnswer(flows, {}, mission.elapsed);
    }
    const passed = F.passTime(state, flows, mission.elapsed, M.THIRDS_PER_SOL);
    state = passed.state; flows = passed.flows;
    mission = M.advance(mission);
    if (sol === 29) assert.equal(mission.ended, false);
  }
  assert.equal(mission.elapsed, 90);
  assert.equal(mission.sol, 30);
  assert.equal(mission.reason, 'complete');
  assert.equal(M.advance(mission), mission);
  assert.ok(Math.abs(state.water - Math.max(0, 600 - 30 * 10 * (require('../data/mission.json').dailyCostMultiplier ?? 1))) < 1e-8);
}
assert.equal(m.elapsed, 0);
const ended = M.endMission(m);
assert.equal(ended.reason, 'quit');
assert.equal(M.advance(ended), ended);
assert.equal(M.endMission(ended), ended);
console.log('mission: ok');
