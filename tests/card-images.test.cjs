const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('src/card-images.js', 'utf8');
function harness(works) {
 const requested = [], timers = new Map();
 let timerId = 0;
 const context = {URL, Date, document: {baseURI: 'https://example.com/game/'},
  setTimeout(fn) {timers.set(++timerId, fn); return timerId;},
  clearTimeout(id) {timers.delete(id);},
  Image: class {
   set src(url) {requested.push(url); queueMicrotask(() => works(url) ? this.onload() : this.onerror());}
  }
 };
 vm.runInNewContext(source, context);
 return {api: context.CardImages, requested, timers};
}
const image = () => ({decode: async () => {}});
const flush = async () => {for (let i=0;i<30;i++) await Promise.resolve();};
(async () => {
 const card = {id: '6', imageId: '6', imageById: true, image: 'images/cards/6.jpg', imageAlt: 'Solar panels'};
 const cached = harness(() => true);
 for(let i=0;i<2;i++) {
  const target=image();
  cached.api.show(target,card,()=>{});
  await target.loadingReady;
  assert.equal(target.src,'https://example.com/game/images/cards/6.webp');
  assert.equal(target.alt,card.imageAlt);
 }
 assert.deepEqual(cached.requested,Array(2).fill('https://example.com/game/images/cards/6.webp'));
 const fallback=harness(url=>url.endsWith('.jpg'));
 const target=image();fallback.api.show(target,card,()=>{});await target.loadingReady;
 assert.equal(fallback.requested.length,2);
 assert.ok(target.src.endsWith('.jpg'));
 let present=false;
 const missing=harness(()=>present);
 const delayed=image();const cancel=missing.api.show(delayed,card,()=>{});
 await delayed.loadingReady;
 assert.equal(delayed.src,'images/cards/placeholder.svg');
 assert.equal(missing.timers.size,1);
 present=true;[...missing.timers.values()][0]();await flush();
 assert.ok(delayed.src.includes('6.webp?card-image-retry='));
 cancel();assert.equal(missing.timers.size,0);
 const cancelled=harness(()=>true);
 const old=image();const stop=cancelled.api.show(old,card,()=>{});stop();await flush();
 assert.equal(old.src,'images/cards/placeholder.svg');
 const legacy=harness(()=>true);const custom=image();
 legacy.api.show(custom,{image:'images/custom.png'},()=>{});await custom.loadingReady;
 assert.equal(custom.src,'https://example.com/game/images/custom.png');
 console.log('card images: ok');
})().catch(error=>{console.error(error);process.exitCode=1;});
