const assert=require('node:assert/strict');
const {Engine}=require('./load-engine.cjs');
(async()=>{
const fs=require('node:fs');const {validateSave}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('src/validation.js')).toString('base64'));
const data=Object.fromEntries(['categories','mission','resources','flows','cards','interface'].map(k=>[k,require('../data/'+k+'.json')]));
let snapshot=Engine.start(()=>.99);assert.ok(snapshot.schedule.every(n=>n===2));
assert.equal(snapshot.mission.difficulty,'hard');
for(const [mode,fraction] of [['easy',.75],['hard',.5]]){
 const started=Engine.start(()=>0,mode);
 const duration=mode==='easy'?25:30;
 assert.equal(started.mission.totalSols,duration);
 assert.equal(started.schedule.length,duration);
 assert.equal(started.deck.length,duration);
 for(const [key,q] of Object.entries(data.resources.quantities))assert.equal(started.state[key],q.max*fraction,mode+' '+key);
 const saved=JSON.parse(JSON.stringify({version:1,data,...started}));
 saved.state.food-=.125;
 assert.equal(validateSave(saved).state.food,started.state.food-.125);
}

for(let seed=0;seed<10;seed++){
 const easy=Engine.start(()=>seed/10,'easy');
 validateSave(JSON.parse(JSON.stringify({version:1,data,...easy})));
 assert.equal(easy.mission.difficulty,'easy');assert.ok(easy.deck.every(c=>c.difficulty==='easy'||c.difficulty==='medium'));
}
assert.throws(()=>Engine.start(Math.random,'unknown'));
assert.throws(()=>Engine.start(()=>0,'hard','unknown'));
assert.throws(()=>Engine.start(()=>0,'hard',['food']));
assert.equal(Engine.start(()=>0,'hard').flows.dailyCostResource,null);
for(const selected of Object.keys(data.resources.quantities)){
 const chosen = Engine.start(()=>0,'easy',selected);
 const restored=validateSave(JSON.parse(JSON.stringify({version:1,data,...chosen})));
 assert.equal(restored.flows.dailyCostResource,selected);
}
const initial=snapshot;snapshot=Engine.answer(snapshot,'left');assert.equal(snapshot.mission.elapsed,0);assert.equal(Engine.answer(snapshot,'right'),snapshot);
const roundtrip=JSON.parse(JSON.stringify({version:1,data,...snapshot},(k,v)=>v===Infinity?'__infinity':v),(k,v)=>v==='__infinity'?Infinity:v);
validateSave(roundtrip);
assert.throws(()=>validateSave({...roundtrip,flows:{...roundtrip.flows,dailyCostResource:['food']}}));
const legacy=structuredClone(roundtrip);delete legacy.data.categories;legacy.data.mission.avoidConsecutive=true;for(const card of legacy.data.cards){delete card.category;delete card.probability}validateSave(legacy);
assert.deepEqual(legacy.deck,roundtrip.deck);assert.deepEqual(roundtrip.state,JSON.parse(JSON.stringify(snapshot.state)));
assert.throws(()=>validateSave({...roundtrip,index:999}));
let result=Engine.next(snapshot);snapshot=result.snapshot;assert.equal(result.newSol,false);assert.equal(snapshot.mission.elapsed,0);
snapshot=Engine.answer(snapshot,'right');snapshot=Engine.next(snapshot).snapshot;assert.equal(snapshot.mission.sol,2);assert.equal(snapshot.mission.elapsed,3);
while(!snapshot.mission.ended){snapshot=Engine.answer(snapshot,'right');snapshot=Engine.next(snapshot).snapshot}
assert.equal(snapshot.mission.reason,'failed');assert.equal(snapshot.state[snapshot.mission.failedResource],0);assert.equal(initial.mission.elapsed,0);
validateSave(JSON.parse(JSON.stringify({version:1,data,...snapshot})));
// Every physical stock has a failure, in both difficulty modes.
for (const mode of ['easy','hard']) for (const resource of Object.keys(initial.state)) {
  const fresh=Engine.start(()=>0, mode);
  const deck=fresh.deck.map(c=>({...c,left:{label:'Drain',effects:{[resource]:-10000}}}));
  const failed=Engine.answer({...fresh,deck},'left');
  assert.equal(failed.mission.reason,'failed');
  assert.equal(failed.mission.failedResource,resource);
  assert.equal(Engine.answer(failed,'right'),failed);
  assert.equal(Engine.next(failed).snapshot,failed);
  validateSave(JSON.parse(JSON.stringify({version:1,data,...failed})));
}
const fractional=Engine.start(()=>0,'easy');
assert.equal(Engine.checkFailure({...fractional,state:{...fractional.state,oxygen:0.01}}).mission.ended,false);
const simultaneous=Engine.checkFailure({...fractional,state:{...fractional.state,water:0,oxygen:0}});
assert.equal(simultaneous.mission.failedResource,'oxygen');
// Supply enough production to test the successful difficulty-specific ending independently of balance.
const F=require('./load-engine.cjs').Flows;
let success=Engine.start(()=>0);
success={...success,deck:success.deck.map(c=>({...c,left:{label:'Wait',effects:{}}})),
 flows:{ongoing:[{rates:Object.fromEntries(Object.entries(F.ratesPerSol(F.createFlows(),0)).map(([q,n])=>[q,-n])) ,start:0,end:Infinity}],later:[]}};
while(!success.mission.ended)success=Engine.next(Engine.answer(success,'left')).snapshot;
assert.equal(success.mission.reason,'complete');assert.equal(success.mission.elapsed,90);
// Easy ends at 25 sols; old snapshots retain their own duration.
let easySuccess=Engine.start(()=>0,'easy');
easySuccess={...easySuccess,deck:easySuccess.deck.map(c=>({...c,left:{label:'Wait',effects:{}}})),flows:success.flows};
while(!easySuccess.mission.ended)easySuccess=Engine.next(Engine.answer(easySuccess,'left')).snapshot;
assert.equal(easySuccess.mission.reason,'complete');assert.equal(easySuccess.mission.elapsed,75);assert.equal(easySuccess.mission.sol,25);
const oldSave=structuredClone(roundtrip);delete oldSave.mission.totalSols;
oldSave.data.mission.totalSols=35;oldSave.schedule=Array(35).fill(2);oldSave.deck=Array(70).fill(oldSave.deck[0]);validateSave(oldSave);
const {Mission}=require('./load-engine.cjs');
const vm=require('node:vm');const oldContext=vm.createContext({GameData:oldSave.data});
vm.runInContext(fs.readFileSync('src/mission.js','utf8'),oldContext);
assert.equal(oldContext.Mission.advance({...oldSave.mission,sol:30,elapsed:87}).ended,false);
assert.equal(oldContext.Mission.advance({...oldSave.mission,sol:35,elapsed:102}).reason,'complete');
assert.equal(Mission.advance({...Mission.createMission(),totalSols:35,sol:30,elapsed:87}).ended,false);
assert.equal(Mission.advance({...Mission.createMission(),totalSols:35,sol:35,elapsed:102}).reason,'complete');
// Failure on the final sol takes precedence over success.
let last=Engine.start(()=>0);
last={...last,mission:{...last.mission,sol:30,elapsed:87},state:{...last.state,food:0.01},savedSide:'left'};
assert.equal(Engine.next(last).snapshot.mission.reason,'failed');
assert.throws(()=>validateSave({...roundtrip,mission:{...roundtrip.mission,ended:true,reason:'failed',failedResource:'unknown'}}));
const legacyHidden=Engine.start(()=>0,'hard');
legacyHidden.flows={...legacyHidden.flows,ongoing:[{rates:{water:-10},note:'Removed',start:0,end:30,panelHidden:true,panelOrder:1}]};
const restoredQueue=Engine.checkFailure(legacyHidden);
assert.equal(restoredQueue.flows.ongoing.length,0);
assert.deepEqual(restoredQueue.state,legacyHidden.state);
assert.equal(restoredQueue.mission,legacyHidden.mission);
validateSave(JSON.parse(JSON.stringify({version:1,data,...restoredQueue})));
// Imported percentage effects are immediate physical changes, in either display mode.
const I=require('./load-engine.cjs').Indicators;
for(const mode of ['easy','hard'])for(const card of data.cards.filter(c=>mode==='hard'||c.difficulty!=='hard'))for(const side of ['left','right']){
 let fresh=Engine.start(()=>0,mode);
 const mid=Object.fromEntries(Object.entries(I.QUANTITIES).map(([q,r])=>[q,r.max/2]));
 fresh={...fresh,state:mid,deck:fresh.deck.map(()=>card)};
 const answered=Engine.answer(fresh,side);
 assert.deepEqual(answered.state,I.apply(mid,card[side].effects),card.id+' '+side+' '+mode);
 assert.equal(answered.mission.elapsed,0);
 assert.equal(answered.flows.ongoing.length,0);assert.equal(answered.flows.later.length,0);
}
console.log('engine and save: ok');
})().catch(e=>{console.error(e);process.exitCode=1});
