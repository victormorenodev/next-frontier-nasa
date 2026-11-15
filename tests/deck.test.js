// Development check only; the game itself does not need Node.
// Run: node tests/deck.test.js
const assert = require('node:assert');
const D = require('./load-engine.cjs').Deck;
const CARDS = require('../data/cards.json');
const I = require('./load-engine.cjs').Indicators;

// Small seeded random so results are repeatable.
const seeded = seed => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

// The authored catalog contains 17 unique IDs with runtime image lookup.
CARDS.forEach(c => assert.deepEqual(D.validateCard(c), [], c.id));
assert.equal(CARDS.length, 17);
assert.equal(new Set(CARDS.map(c => c.id)).size, CARDS.length);
assert.ok(CARDS.every(c => !c.mock));
assert.deepEqual(CARDS.map(c=>c.id),['5','9','11','14','15','16','17','18','19','20','21','22','23','24','26','27','29']);
for(const c of CARDS)assert.equal(c.imageById,true);

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
rolls=[.96,.5];
assert.equal(D.createDeck(CARDS,1,()=>rolls.shift())[0].id,CARDS.filter(c=>c.category==='emergency')[2].id);
assert.throws(()=>D.createDeck(CARDS,1,()=>1));
assert.throws(()=>D.createDeck(CARDS,-1));
const disabled=[{...only,probability:0},{...only,id:'enabled',probability:1}];
assert.equal(D.createDeck(disabled,1,()=>0,[{id:'solo',name:'Solo',probability:1}])[0].id,'enabled');

// Filtering removes ineligible categories and renormalizes remaining probabilities.
const fixtureCards=[{...CARDS[0],id:'safe',category:'safe',probability:1,difficulty:'easy'}, {...CARDS[0],id:'risk',category:'risk',probability:1,difficulty:'hard'}];
const fixtureCategories=[{id:'safe',name:'Safe',probability:.2},{id:'risk',name:'Risk',probability:.8}];
const easyDeck=D.createDeck(fixtureCards,20,()=>.99,fixtureCategories,['easy','medium']);
assert.ok(easyDeck.every(c=>c.id==='safe'));
assert.throws(()=>D.createDeck(fixtureCards,1,()=>0,fixtureCategories,['medium']));
assert.equal(fixtureCards[0].probability,1);
const easyCatalog=D.createDeck(CARDS,1000,seeded(8),categories,['easy','medium']);
assert.ok(easyCatalog.every(c=>!['9','26'].includes(c.id)));
assert.ok(new Set(D.createDeck(CARDS,20000,seeded(9),categories).map(c=>c.id)).size===17);

// Shield is a 0–100 score; sheet p values are additive points.
const s0=I.createState();
assert.equal(I.apply(s0,CARDS.find(c=>c.id==='11').left.effects).shield,78);
assert.equal(I.apply(s0,CARDS.find(c=>c.id==='11').right.effects).shield,68);
assert.equal(I.apply(s0,{shield:50}).shield,100);
assert.equal(I.apply(s0,{shield:-100}).shield,0);
assert.equal(I.apply(s0,{shield:5}).water,s0.water);

// Mission schedules can request no cards or as many as 80.
assert.deepEqual(D.createDeck(CARDS, 0), []);
assert.equal(D.createDeck(CARDS, 80).length, 80);
console.log('deck: ok');
