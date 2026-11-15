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


// Two independent rolls per draw, with replacement, including consecutive repeats.
const categories = require('../data/categories.json');
const deck = D.createDeck(CARDS, 100000, seeded(42));
const counts = {};
for (const c of deck) counts[c.category] = (counts[c.category] || 0) + 1;
for (const category of categories) {
  assert.ok(Math.abs(counts[category.id] / deck.length - category.probability) < 0.006, category.id);
  const members=CARDS.filter(c=>c.category===category.id);
  for(const card of members){
    const actual=deck.filter(c=>c.id===card.id).length/counts[category.id];
    assert.ok(Math.abs(actual-card.probability)<0.025,card.id);
  }
}
const repeats=D.createDeck(CARDS,4,()=>0);
assert.ok(repeats.every(c=>c.id===repeats[0].id));
const only={...CARDS[0],category:'solo',probability:1};
assert.equal(D.createDeck([only],5,()=>0,[{id:'solo',name:'Solo',probability:1}]).length,5);
let rolls=[0.35,0];
assert.equal(D.createDeck(CARDS,1,()=>rolls.shift())[0].category,'maintenance');
rolls=[0,0.5];
assert.equal(D.createDeck(CARDS,1,()=>rolls.shift())[0].id,CARDS.find(c=>c.category==='routine'&&c.id!==repeats[0].id).id);
assert.throws(()=>D.createDeck(CARDS,1,()=>1));
assert.throws(()=>D.createDeck(CARDS,-1));
const disabled=[{...only,probability:0},{...only,id:'enabled',probability:1}];
assert.equal(D.createDeck(disabled,1,()=>0,[{id:'solo',name:'Solo',probability:1}])[0].id,'enabled');

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
