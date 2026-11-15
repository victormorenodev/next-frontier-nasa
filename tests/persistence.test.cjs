// Exercise the UI storage boundary for each terminal outcome and an active mission.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('src/ui.js', 'utf8');
const save = source.slice(source.indexOf('  function save() {'), source.indexOf('  const stored = window.savedMission;'));
const slot = new Map();
const controls = {'menu-continue': {disabled: false}, 'menu-save-note': {hidden: true}};
const context = vm.createContext({
 localStorage: {setItem: (k,v) => slot.set(k,v), removeItem: k => slot.delete(k)},
 document: {getElementById: id => controls[id]},
 GameData: {}, state: {oxygen: 60}, mission: {ended: false}, flows: {ongoing: [{end: Infinity}]},
 deck: [], index: 0, schedule: [], eventIndex: 0, savedSide: 'left', cardChanges: {},
 solNotice: {}, Copy: key => key
});
vm.runInContext(save, context);
for (const reason of ['complete', 'failed', 'quit']) {
 context.mission = {ended: false};
 vm.runInContext('save()', context);
 assert.equal(slot.size, 1);
 const active = JSON.parse(slot.get('next-frontier-save'));
 assert.equal(active.savedSide, 'left');
 assert.equal(active.flows.ongoing[0].end, '__infinity');
 context.mission = {ended: true, reason};
 vm.runInContext('save()', context);
 assert.equal(slot.size, 0, reason);
 assert.equal(controls['menu-continue'].disabled, true);
 assert.equal(controls['menu-save-note'].hidden, false);
}
console.log('persistence: ok');
