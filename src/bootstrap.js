import {validateData, validateSave} from './validation.js';
const names=['categories','mission','resources','flows','cards','interface'];
try {
 const data=validateData(Object.fromEntries(await Promise.all(names.map(async name=>{
  const response=await fetch(new URL(`../data/${name}.json`,import.meta.url));
  if(!response.ok)throw Error(`${name}.json: HTTP ${response.status}`);
  try{return [name,await response.json()]}catch(error){throw Error(`${name}.json: ${error.message}`)}
 }))));
 globalThis.CurrentGameData=data;
 try{const raw=localStorage.getItem('next-frontier-save');if(raw){window.invalidSavedMission=true;window.savedMission=validateSave(JSON.parse(raw,(k,v)=>v==='__infinity'?Infinity:v));window.invalidSavedMission=false}}
 catch(error){console.warn('Saved mission unavailable',error)}
 globalThis.GameData=window.savedMission?.data||data;
 globalThis.Copy=(key,values={})=>(CurrentGameData.interface[key]||GameData.interface[key]||key).replace(/\{(\w+)\}/g,(_,k)=>String({...GameData.mission,...values}[k]??`{${k}}`));
 document.title=Copy('pageTitle');
 const image=document.querySelector('.briefing-image');image.src=Copy('briefingImage');image.alt=Copy('briefingImageAlt');
 for(const el of document.querySelectorAll('[data-copy]'))el.textContent=Copy(el.dataset.copy);
 if(window.invalidSavedMission){const p=document.createElement('p');p.textContent=Copy('invalidSave');document.getElementById('start-mission').before(p)}
 globalThis.CardData={CARDS:GameData.cards};
 for(const file of ['indicators','mission','flows','deck','engine','icons','display','card-ui','ui'])await import(`./${file}.js`);
}catch(error){
 console.error(error);
 const p=document.createElement('p');p.textContent='The mission could not load.';
 const retry=document.createElement('button');retry.className='start-mission';retry.textContent='Try again';retry.onclick=()=>location.reload();
 document.getElementById('briefing').replaceChildren(p,retry);
}
