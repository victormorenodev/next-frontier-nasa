const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const {Indicators}=require('./load-engine.cjs');
const context=vm.createContext({Indicators,Copy:k=>k==='percentUnit'?'percent':k});
vm.runInContext(fs.readFileSync('src/display.js','utf8'),context);
const display=context.ResourceDisplay;
assert.equal(display.read('water',600).value,600);
display.mode='easy';
assert.equal(display.read('water',700).value,100);
assert.equal(display.read('water',0).value,0);
assert.equal(display.read('water',350).value,50);
assert.equal(display.read('energy',-30).value,-10);
assert.equal(display.read('oxygen',3).value,5);
assert.equal(display.read('food',100).unit,'');
assert.equal(display.read('water',600).value,86);
assert.equal(display.change('water',600,596).value,-1);
assert.equal(display.change('water',596,592).value,0);
assert.equal(display.change('water',600,592).value,-1);
assert.equal(display.read('oxygen',-0.3).value,-1);
assert.equal(display.read('oxygen',0.3).value,1);
assert.equal(display.effect('food',6,100).value,0);
assert.equal(display.effect('water',-4,600).value,-1);
let total=0;
for(let water=600;water>400;water-=4)total+=display.change('water',water,water-4).value;
assert.equal(total,display.read('water',400).value-display.read('water',600).value);
console.log('display: ok');

// Easy combines only the display. Physical stocks and capacities stay separate.
context.CurrentGameData = {resources: JSON.parse(fs.readFileSync('data/resources.json','utf8'))};
display.mode = 'easy';
const life = display.indicators()[0];
assert.equal(life.id, 'life-support');
assert.equal(life.icon, 'health');
assert.equal(display.indicators().length, 4);
const initial = {oxygen: 36, water: 560, shield: 8, energy: 240, food: 100};
assert.equal(display.round(display.level(life, initial)*100), 60);
assert.equal(display.indicatorChange(life, initial, {...initial, water: 490}), 0);
assert.equal(display.indicatorChange(life, initial, {...initial, oxygen: 30}), -10);
// Water becomes the limiting stock; compare the combined endpoints, not summed deltas.
assert.equal(display.indicatorChange(life, initial, {...initial, oxygen: 42, water: 350}), -10);
assert.equal(display.round(display.level(life, {...initial, oxygen: 0})*100), 0);
assert.equal(display.round(display.level(life, {...initial, water: 0})*100), 0);
assert.equal(display.indicatorChange(life, {...initial, oxygen: 36.1}, {...initial, oxygen: 36.2}), 0);
assert.equal(initial.oxygen, 36);
assert.equal(initial.water, 560);
assert.equal(Indicators.read(initial, display.indicators())[0].lowest, 'oxygen');
display.mode = 'hard';
assert.equal(display.indicators().length, 5);
assert.equal(display.indicators()[0].id, 'oxygen');

// Both modes use the same Shield percentage, with visual rounding only.
for(const mode of ['easy','hard']){
 display.mode=mode;
 assert.equal(display.read('shield',80).value,80);assert.equal(display.read('shield',80).unit,'%');
 assert.equal(display.read('shield',80).max,100);
 assert.equal(display.change('shield',80.1,80.4).value,0);
 assert.equal(display.change('shield',80.4,80.6).value,1);
 assert.equal(display.effect('shield',-5,80).value,-5);
 assert.equal(display.effect('shield',10,95).value,5);
 const ind=display.indicators().find(i=>i.id==='shield');
 assert.equal(display.indicatorChange(ind,{shield:80.1},{shield:80.4}),0);
}
