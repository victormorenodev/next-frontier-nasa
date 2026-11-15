const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const context = vm.createContext({CardData:{CARDS:require('../data/cards.json')},GameData:{categories:require('../data/categories.json'),mission:require('../data/mission.json'),resources:require('../data/resources.json'),flows:require('../data/flows.json')}});
for(const file of ['indicators','mission','flows','deck','engine']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file+'.js'),'utf8'),context);
module.exports = Object.fromEntries(['Indicators','Mission','Flows','Deck','Engine'].map(key=>[key,context[key]]));
