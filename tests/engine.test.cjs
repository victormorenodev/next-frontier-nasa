const assert=require('node:assert/strict');
const {Engine}=require('./load-engine.cjs');
(async()=>{
const fs=require('node:fs');const {validateSave}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('src/validation.js')).toString('base64'));
const data=Object.fromEntries(['categories','mission','resources','flows','cards','interface'].map(k=>[k,require('../data/'+k+'.json')]));
let snapshot=Engine.start(()=>.99);assert.ok(snapshot.schedule.every(n=>n===2));
const initial=snapshot;snapshot=Engine.answer(snapshot,'left');assert.equal(snapshot.mission.elapsed,0);assert.equal(Engine.answer(snapshot,'right'),snapshot);
const roundtrip=JSON.parse(JSON.stringify({version:1,data,...snapshot},(k,v)=>v===Infinity?'__infinity':v),(k,v)=>v==='__infinity'?Infinity:v);
validateSave(roundtrip);
const legacy=structuredClone(roundtrip);delete legacy.data.categories;legacy.data.mission.avoidConsecutive=true;for(const card of legacy.data.cards){delete card.category;delete card.probability}validateSave(legacy);
assert.deepEqual(legacy.deck,roundtrip.deck);assert.deepEqual(roundtrip.state,JSON.parse(JSON.stringify(snapshot.state)));
assert.throws(()=>validateSave({...roundtrip,index:999}));
let result=Engine.next(snapshot);snapshot=result.snapshot;assert.equal(result.newSol,false);assert.equal(snapshot.mission.elapsed,0);
snapshot=Engine.answer(snapshot,'right');snapshot=Engine.next(snapshot).snapshot;assert.equal(snapshot.mission.sol,2);assert.equal(snapshot.mission.elapsed,3);
while(!snapshot.mission.ended){snapshot=Engine.answer(snapshot,'right');snapshot=Engine.next(snapshot).snapshot}
assert.equal(snapshot.mission.elapsed,120);assert.equal(snapshot.index,80);assert.equal(snapshot.mission.reason,'complete');assert.equal(initial.mission.elapsed,0);
validateSave(JSON.parse(JSON.stringify({version:1,data,...snapshot})));
console.log('engine and save: ok');
})().catch(e=>{console.error(e);process.exitCode=1});
