// Development check only; the game itself does not need Node.
// Run: node tests/deck.test.js
const assert = require('node:assert');
const D = require('./load-engine.cjs').Deck;
const CARDS = require('../data/cards.json');
const I = require('./load-engine.cjs').Indicators;

// Small seeded random so results are repeatable.
const seeded = seed => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

// Every card is valid; ids are unique; there are 10 mock cards.
CARDS.forEach(c => assert.deepEqual(D.validateCard(c), [], c.id));
assert.equal(CARDS.length, 10);
assert.equal(new Set(CARDS.map(c => c.id)).size, CARDS.length);
assert.ok(CARDS.every(c => c.mock));

// Validation catches bad data.
const bad = {...CARDS[0], difficulty: 'super', left: {label: 'x', effects: {gold: 1}}};
assert.equal(D.validateCard(bad).length, 2);
assert.throws(() => D.createDeck([bad]));
const badFlows = {...CARDS[0], right: {label: 'x', effects: {},
  ongoing: [{rates: {gold: 1}, for: 0}], later: [{after: 0, effects: {}}]}};
assert.equal(D.validateCard(badFlows).length, 4);   // unknown quantity, for 0, after 0, empty effects
assert.throws(() => D.createDeck([CARDS[0]]));

// Default deck: 40 cards, never the same one twice in a row, balanced use — checked over many shuffles.
const orders = new Set();
for (let seed = 1; seed <= 500; seed++) {
  const deck = D.createDeck(CARDS, D.DECK_SIZE, seeded(seed));
  assert.equal(deck.length, D.DECK_SIZE);
  for (let i = 1; i < deck.length; i++) assert.notEqual(deck[i].id, deck[i - 1].id, `seed ${seed} pos ${i}`);
  const counts = {};
  deck.forEach(c => { counts[c.id] = (counts[c.id] || 0) + 1; });
  Object.values(counts).forEach(n => assert.ok(n === 4));
  orders.add(deck.map(c => c.id).join());
}
assert.ok(orders.size > 450); // each game gets a different order

// Shuffle keeps all items and does not change the original.
const list = [1, 2, 3, 4, 5];
assert.deepEqual(D.shuffle(list, seeded(3)).sort(), [1, 2, 3, 4, 5]);
assert.deepEqual(list, [1, 2, 3, 4, 5]);

// Answer effects change the indicators, and water ↔ shield keeps the mass (100 L = 0.5 g/cm²).
const storm = CARDS.find(c => c.id === 'mock-solar-storm');
const s0 = I.createState(), s1 = I.apply(s0, storm.right.effects);
assert.equal(s1.water, s0.water - 100);
assert.equal(s1.shield, s0.shield + 0.5);
const kg = s => s.water + s.shield * 10 * 20; // L of water + (g/cm² → kg/m²) × 20 m²
assert.equal(kg(s1), kg(s0));

// Taking water back from the shield must fit in the tank at the start of a game (no mass lost).
const thirsty = CARDS.find(c => c.id === 'mock-thirsty-crew');
const s2 = I.apply(s0, thirsty.left.effects);
assert.equal(kg(s2), kg(s0));

// Mission schedules can request no cards or as many as 80.
assert.deepEqual(D.createDeck(CARDS, 0), []);
assert.equal(D.createDeck(CARDS, 80).length, 80);
console.log('deck: ok');
