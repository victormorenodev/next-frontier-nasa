const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const document=new EventTarget(),window=new EventTarget();document.hidden=false;
 const media=[];const intervals=new Map();let timer=0;
 class Audio extends EventTarget{
  constructor(src){super();this.src=src;this.paused=true;this.volume=1;this.calls=0;media.push(this);}
  play(){this.calls++;if(this.blocked)return Promise.reject(Error('NotAllowedError'));if(this.pending)return this.pending.then(()=>{this.paused=false});this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
  cloneNode(){return new Audio(this.src);}
 }
 const storage=new Map();
 const context=vm.createContext({Audio,document,window,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},setInterval:fn=>{intervals.set(++timer,fn);return timer},clearInterval:id=>intervals.delete(id)});
 vm.runInContext(fs.readFileSync('src/audio.js','utf8'),context);
 const api=context.GameAudio,music=media.find(a=>a.src.includes('main_track')),ship=media.find(a=>a.src.includes('spacecraft_bg'));
 assert.equal(music.loop,true);assert.equal(ship.loop,true);
 const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
 const gesture=()=>document.dispatchEvent(new Event('click'));
 ship.blocked=true;gesture();await flush();assert.equal(music.paused,false);assert.equal(ship.paused,true);
 ship.blocked=false;gesture();await flush();assert.equal(ship.paused,false);assert.equal(music.calls,1);
 // All backgrounds interrupted after successful playback recover on the next interaction.
 music.pause();ship.pause();gesture();await flush();assert.equal(music.paused,false);assert.equal(ship.paused,false);
 document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));assert.ok(music.paused&&ship.paused);
 document.hidden=false;music.blocked=ship.blocked=true;document.dispatchEvent(new Event('visibilitychange'));await flush();
 music.blocked=ship.blocked=false;gesture();await flush();assert.ok(!music.paused&&!ship.paused);
 api.play('button');await flush();const effect=media.at(-1);assert.equal(effect.paused,false);
 api.setEnabled(false);assert.ok(effect.paused&&music.paused&&ship.paused);gesture();await flush();assert.ok(music.paused&&ship.paused);assert.equal(storage.get('next-frontier-sound'),'off');
 api.setEnabled(true);await flush();
 // Repeated gesture events must not start duplicate pending plays.
 music.pause();let finish;music.pending=new Promise(resolve=>finish=resolve);const before=music.calls;
 gesture();gesture();gesture();assert.equal(music.calls,before+1);
 api.setEnabled(false);finish();await flush();assert.equal(music.paused,true);assert.equal(api.isEnabled(),false);
 console.log('audio recovery: ok');
})().catch(error=>{console.error(error);process.exitCode=1});
