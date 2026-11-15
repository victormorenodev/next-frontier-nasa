const assert=require('node:assert/strict');
(async()=>{
const fs=require('node:fs');const code=fs.readFileSync('src/validation.js','utf8');const {validateData,validateSave,migrateShieldSave}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const data=Object.fromEntries(['categories','mission','resources','flows','cards','interface'].map(k=>[k,require('../data/'+k+'.json')]));
validateData(data);
for(const card of data.cards)for(const side of ['left','right']){
 const answer=card[side];assert.ok(answer.label&&answer.description);
 for(const key of Object.keys(data.resources.quantities))assert.ok(Math.abs((answer.effects[key]||0)-(answer.effectPercentages[key]||0)*data.resources.quantities[key].max/100)<1e-9,card.id+': '+side+' '+key);
}
assert.equal(data.cards.find(c=>c.id==='1').left.effects.oxygen,9);
assert.equal(data.cards.find(c=>c.id==='1').right.effects.oxygen,-9);
assert.equal(data.cards.find(c=>c.id==='1').left.effects.shield,-5);
assert.equal(data.cards.find(c=>c.id==='12').left.effects.water,-105);
assert.equal(data.cards.find(c=>c.id==='13').right.effects.water,-175);
assert.ok(data.cards.slice(2,8).every(c=>!Object.keys(c.left.effects).length&&!Object.keys(c.right.effects).length));
const badConversion=structuredClone(data);badConversion.cards[0].left.effects.oxygen=15;assert.throws(()=>validateData(badConversion));
const badSource=structuredClone(data);badSource.cards[0].source.kind='invented';assert.throws(()=>validateData(badSource));
for(const description of ['', '   ', 'Your crew repairs the filter.']){const fixture=structuredClone(data);fixture.cards[0].left.description=description;validateData(fixture)}
const old=structuredClone(data);delete old.cards[0].left.description;validateData(old);
const invalid=structuredClone(data);invalid.cards[0].right.description=42;assert.throws(()=>validateData(invalid));
for(const mutate of [d=>d.categories[0].probability=-1,d=>d.categories[0].probability=NaN,d=>d.categories[0].probability=.9,d=>d.categories[1].id=d.categories[0].id,d=>d.cards[0].category='unknown',d=>d.cards[0].probability=.9,d=>d.cards=d.cards.filter(c=>c.category!=='science'),d=>d.mission.totalSols=0,d=>d.mission.dailyCostMultiplier=0,d=>d.mission.dailyCostMultiplier=-3,d=>d.mission.dailyCostMultiplier=Infinity,d=>d.mission.eventChances.two=.5,d=>d.resources.quantities.food.start=Infinity,d=>d.cards[0].left.effects={gold:1},d=>d.cards[1].id=d.cards[0].id,d=>d.cards[0].left.later=[{after:0,effects:{food:1}}]]){const d=structuredClone(data);mutate(d);assert.throws(()=>validateData(d))}
const d=structuredClone(data);d.mission.totalSols=3;d.mission.crew=2;d.mission.eventChances={one:0,two:1};validateData(d);
// Migrate every Shield-bearing payload, preserving fractional progress and aliases.
const {Engine}=require('./load-engine.cjs');
for(const oldMax of [10,32]){
 const legacySave={version:1,data:structuredClone(data),...structuredClone(Engine.start(()=>0,'hard'))};
 legacySave.state.shield=71.25;
 legacySave.cardChanges={shield:-5.5,water:-4};
 const shared=legacySave.data.cards[0];
 shared.left.ongoing=[{rates:{shield:.5},for:2,note:'Shield work'}];
 shared.left.later=[{after:2,effects:{shield:3}}];
 legacySave.deck[0]=shared;legacySave.deck[1]=shared;
 legacySave.flows.ongoing=[{rates:{shield:-.5},start:0,end:Infinity,note:'Ongoing'}];
 legacySave.flows.later=[{effects:{shield:3},at:6,note:'Scheduled'}];
 legacySave.data.flows.push({id:'shield-fixture',quantity:'shield',kind:'simulated',basis:'perSol',amount:.5});
 const factor=oldMax/100,seen=new WeakSet();
 function oldUnits(obj){
  if(!obj||typeof obj!=='object'||seen.has(obj))return;seen.add(obj);
  for(const [key,value]of Object.entries(obj)){
   if(key==='effectPercentages')continue;
   if(key==='shield'&&typeof value==='number')obj[key]=value*factor;
   else oldUnits(value);
  }
 }
 oldUnits(legacySave);
 Object.assign(legacySave.data.resources.quantities.shield,{unit:'g/cm²',unitName:'grams per square centimeter',max:oldMax,start:80*factor,description:'Old density description'});
 legacySave.data.flows.find(f=>f.id==='shield-fixture').amount*=factor;
 validateSave(legacySave);
 const unchanged=structuredClone(legacySave);
 const migrated=migrateShieldSave(legacySave,data.resources.quantities.shield);
 const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,a+' != '+b);
 close(migrated.state.shield,71.25);close(migrated.cardChanges.shield,-5.5);
 close(migrated.data.resources.quantities.shield.start,80);
 assert.equal(migrated.data.resources.quantities.shield.max,100);
 assert.equal(migrated.data.resources.quantities.shield.unit,'%');
 assert.equal(migrated.data.resources.quantities.shield.description,data.resources.quantities.shield.description);
 for(const c of [migrated.data.cards[0],migrated.deck[0],migrated.deck[1]]){
  close(c.left.effects.shield,-5);close(c.left.ongoing[0].rates.shield,.5);close(c.left.later[0].effects.shield,3);
  assert.equal(c.left.effectPercentages.shield,-5);
 }
 close(migrated.flows.ongoing[0].rates.shield,-.5);
 close(migrated.flows.later[0].effects.shield,3);
 close(migrated.data.flows.find(f=>f.id==='shield-fixture').amount,.5);
 assert.equal(migrated.flows.ongoing[0].end,Infinity);
 assert.deepEqual(migrated.mission,legacySave.mission);
 assert.deepEqual(migrated.deck.map(c=>c.id),legacySave.deck.map(c=>c.id));
 assert.equal(migrated.state.water,legacySave.state.water);
 assert.deepEqual(legacySave,unchanged);
 assert.equal(migrateShieldSave(migrated,data.resources.quantities.shield),migrated);
 const ended=structuredClone(legacySave);ended.state.shield=0;ended.mission={...ended.mission,ended:true,reason:'failed',failedResource:'shield'};
 const endedMigrated=migrateShieldSave(ended,data.resources.quantities.shield);
 assert.equal(endedMigrated.state.shield,0);assert.equal(endedMigrated.mission.reason,'failed');
}
const badScale=structuredClone(data);badScale.resources.quantities.shield.max=99;assert.throws(()=>validateData(badScale));
assert.throws(()=>validateSave({version:99}));console.log('data: ok');
})().catch(e=>{console.error(e);process.exitCode=1});
