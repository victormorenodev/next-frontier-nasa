// Development check only; the game itself does not need Node.
// Run: node tests/indicators.test.js
const assert = require('node:assert');
const I = require('./load-engine.cjs').Indicators;

const s = I.createState();
assert.deepEqual(Object.keys(s), ['oxygen', 'water', 'shield', 'energy', 'food']);

// Every quantity has a unit, written short and in words.
assert.deepEqual(
  Object.fromEntries(Object.entries(I.QUANTITIES).map(([k, q]) => [k, q.unit])),
  {oxygen: 'kg', water: 'L', shield: 'g/cm²', energy: 'kWh', food: 'kg'});
Object.values(I.QUANTITIES).forEach(q => assert.ok(q.unitName && q.start <= q.max));

// Changes stay between 0 and max and never mutate the old state.
assert.equal(I.change(s, 'energy', 500).energy, 300);
assert.equal(I.change(s, 'energy', -500).energy, 0);
assert.equal(s.energy, 240);
assert.throws(() => I.change(s, 'gold', 1));

// Five indicators, in screen order, one per quantity, with their player-facing names.
const view = I.read(s);
assert.deepEqual(view.map(i => [i.id, i.name]), [
  ['oxygen', 'Oxygen Level'],
  ['water', 'Water Stock'],
  ['shield', 'Radiation Shield'],
  ['energy', 'Energy Supply'],
  ['food', 'Food Stock']
]);
view.forEach(i => { assert.equal(i.parts.length, 1); assert.equal(i.parts[0].id, i.id); });
const energy = view.find(i => i.id === 'energy');
assert.equal(energy.parts[0].unit, 'kWh');
assert.equal(energy.level, .8);

// Oxygen and water are separate indicators now: low oxygen shows on Oxygen Level only.
const lowO2 = I.read(I.change(s, 'oxygen', -54));
assert.ok(Math.abs(lowO2.find(i => i.id === 'oxygen').level - .1) < 1e-9);
assert.equal(lowO2.find(i => i.id === 'water').level, 600 / 700);

console.log('indicators: ok');
