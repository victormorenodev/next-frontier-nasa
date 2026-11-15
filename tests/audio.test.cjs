// Development check only: runs src/audio.js against a small fake Web Audio API.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const RATE=1000;
 // Fake decoded sounds: the click starts with 250 ms of silence, like the real file.
 const shapes={button_clicking:{lead:250,len:480},card_swipe_v2:{lead:10,len:700},day_change_v2:{lead:20,len:530},main_track:{lead:0,len:2800},spacecraft_bg:{lead:0,len:500}};
 const buffer=name=>{const {lead,len}=shapes[name];const data=new Float32Array(len);for(let i=lead;i<len;i++)data[i]=i%2?.3:-.3;
  return {name,sampleRate:RATE,length:len,duration:len/RATE,getChannelData:()=>data};};
 const document=new EventTarget(),window=new EventTarget();document.hidden=false;
 const sources=[];let context;
 class Param{constructor(v){this.value=v;this.ramps=[]}setValueAtTime(v){this.value=v}linearRampToValueAtTime(v,t){this.ramps.push([v,t]);this.value=v}}
 class Node{connect(n){this.out=n}disconnect(){this.out=null}}
 class AudioContext{
  constructor(opts){context=this;this.opts=opts;this.state='suspended';this.currentTime=0;this.destination=new Node();this.resumes=0;this.blocked=false}
  resume(){this.resumes++;if(this.blocked)return Promise.reject(Error('NotAllowedError'));this.state='running';return Promise.resolve()}
  suspend(){this.state='suspended';return Promise.resolve()}
  createGain(){const g=new Node();g.gain=new Param(1);return g}
  createBufferSource(){const s=new Node();s.loop=false;s.loopStart=0;s.loopEnd=0;s.stopped=false;
   s.start=(when,offset)=>{s.started=[when,offset]};s.stop=()=>{s.stopped=true;s.onended?.()};sources.push(s);return s}
  decodeAudioData(data,ok){setTimeout(()=>ok(buffer(data.name)),0)}
 }
 const fetch=async url=>({ok:true,arrayBuffer:async()=>({name:url.replace(/^sfx\/|\.mp3$/g,'')})});
 const storage=new Map();
 const ctx=vm.createContext({AudioContext,fetch,document,window,setTimeout,Promise,Error,Float32Array,Math,Object,
  localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}});
 vm.runInContext(fs.readFileSync('src/audio.js','utf8'),ctx);
 const api=ctx.GameAudio;await api.ready;
 const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
 const gesture=async()=>{document.dispatchEvent(new Event('click'));await flush()};
 const live=()=>sources.filter(s=>s.loop&&!s.stopped);
 assert.equal(context.opts.latencyHint,'interactive');

 // Effects skip the silence at the start of their file (5 ms pre-roll kept).
 assert.deepEqual({...api.effectOffsets()},{button:.245,swipe:.005,sol:.015});

 // Nothing plays before the first interaction; then both loops start once, faded in.
 assert.equal(live().length,0);
 await gesture();
 assert.equal(context.state,'running');
 assert.equal(live().length,2);
 for(const s of live()){assert.equal(s.loop,true);assert.equal(s.loopStart,0);assert.equal(s.loopEnd,s.buffer.duration);assert.deepEqual(s.started,[0,0]);}
 const music=live().find(s=>s.buffer.name==='main_track'),ship=live().find(s=>s.buffer.name==='spacecraft_bg');
 assert.deepEqual(music.out.gain.ramps,[[.4,1.5]]);assert.deepEqual(ship.out.gain.ramps,[[.12,1.5]]);
 await gesture();await gesture();assert.equal(live().length,2);   // repeated gestures never duplicate loops

 // An effect starts now, at its first audible sample, at its own volume.
 api.play('button');const click=sources.at(-1);
 assert.equal(click.buffer.name,'button_clicking');assert.deepEqual(click.started,[0,.245]);assert.equal(click.out.gain.value,.55);

 // Hidden page: the context is suspended (loops keep their place) and resumes when visible.
 document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));await flush();
 assert.equal(context.state,'suspended');assert.equal(live().length,2);
 document.hidden=false;context.blocked=true;document.dispatchEvent(new Event('visibilitychange'));await flush();
 assert.equal(context.state,'suspended');
 context.blocked=false;await gesture();assert.equal(context.state,'running');assert.deepEqual(live(),[music,ship]);

 // Muting stops loops and effects and is remembered; unmuting fades the loops back in.
 api.play('swipe');const swipe=sources.at(-1);
 api.setEnabled(false);assert.equal(live().length,0);assert.equal(swipe.stopped,true);
 assert.equal(storage.get('next-frontier-sound'),'off');assert.equal(api.isEnabled(),false);
 const count=sources.length;api.play('button');await gesture();assert.equal(sources.length,count);
 api.setEnabled(true);await flush();assert.equal(live().length,2);assert.equal(storage.get('next-frontier-sound'),'on');

 // Loop trimming only removes near-digital silence at the ends (encoder padding), up to 100 ms.
 const padded=new Float32Array(1000).fill(.2);padded.fill(0,0,30);padded.fill(0,950);
 assert.deepEqual({...api.loopRegion({sampleRate:RATE,getChannelData:()=>padded})},{start:.03,end:.95});
 const silentStart=new Float32Array(1000).fill(.2);silentStart.fill(0,0,400);
 assert.equal(api.loopRegion({sampleRate:RATE,getChannelData:()=>silentStart}).start,.1);
 console.log('audio: ok');
})().catch(error=>{console.error(error);process.exitCode=1});
