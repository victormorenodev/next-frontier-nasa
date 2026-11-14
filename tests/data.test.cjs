const assert=require('node:assert/strict');
(async()=>{
const fs=require('node:fs');const code=fs.readFileSync('src/validation.js','utf8');const {validateData,validateSave}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const data=Object.fromEntries(['mission','resources','flows','cards','interface'].map(k=>[k,require('../data/'+k+'.json')]));
validateData(data);
for(const mutate of [d=>d.mission.totalSols=0,d=>d.mission.eventChances.two=.5,d=>d.resources.quantities.food.start=Infinity,d=>d.cards[0].left.effects={gold:1},d=>d.cards[1].id=d.cards[0].id,d=>d.cards[0].left.later=[{after:0,effects:{food:1}}]]){const d=structuredClone(data);mutate(d);assert.throws(()=>validateData(d))}
const d=structuredClone(data);d.mission.totalSols=3;d.mission.crew=2;d.mission.eventChances={one:0,two:1};validateData(d);
assert.throws(()=>validateSave({version:99}));console.log('data: ok');
})().catch(e=>{console.error(e);process.exitCode=1});
