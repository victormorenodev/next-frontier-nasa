// Development check only; the game itself does not need Node.
// Run: node tests/mission.test.js
const assert = require('node:assert/strict');
const M = require('../mission.js');

const m = M.createMission();
assert.deepEqual(m, {ended: false, reason: null, elapsed: 0, sol: 1, period: 'day'});

// 1/3 sol: same sol, afternoon. 2/3: night. A full sol: next sol, day again.
const a = M.advance(m, 1);
assert.deepEqual([a.sol, a.period], [1, 'afternoon']);
const b = M.advance(a, 1);
assert.deepEqual([b.sol, b.period], [1, 'night']);
const c = M.advance(b, 1);
assert.deepEqual([c.sol, c.period], [2, 'day']);
assert.deepEqual([M.advance(m, 2).sol, M.advance(m, 2).period], [1, 'night']);
assert.deepEqual([M.advance(m, 3).sol, M.advance(m, 3).period], [2, 'day']);
assert.deepEqual([M.advance(b, 3).sol, M.advance(b, 3).period], [2, 'night']); // night + 1 sol = next night
assert.equal(m.elapsed, 0);                    // old state untouched
assert.throws(() => M.advance(m, 0.5));        // only whole thirds

// Ending.
const ended = M.endMission(a);
assert.equal(ended.ended, true);
assert.equal(ended.reason, 'quit');
assert.equal(M.endMission(m, 'complete').reason, 'complete');
assert.equal(ended.sol, 1);
assert.equal(m.ended, false);
assert.equal(M.endMission(ended), ended);      // ending twice changes nothing
assert.equal(M.advance(ended, 3), ended);      // time stops after the end

console.log('mission: ok');
