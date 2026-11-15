// Keep all modules on the same release as the HTML entry point.
const assetVersion = new URL(import.meta.url).searchParams.get('v');
const moduleURL = file => {
 const url = new URL(file, import.meta.url);
 if (assetVersion) url.searchParams.set('v', assetVersion);
 return url.href;
};
const names=['categories','mission','resources','flows','cards','interface','glossary'];
try {
 const {validateData, validateSave, migrateShieldSave} = await import(moduleURL('./validation.js'));
 const data=validateData(Object.fromEntries(await Promise.all(names.map(async name=>{
  const response=await fetch(new URL(`../data/${name}.json`,import.meta.url), {cache:'no-store'});
  if(!response.ok)throw Error(`${name}.json: HTTP ${response.status}`);
  try{return [name,await response.json()]}catch(error){throw Error(`${name}.json: ${error.message}`)}
 }))));
 globalThis.CurrentGameData=data;
 try {
  const raw=localStorage.getItem('next-frontier-save');
  if(raw){
   window.invalidSavedMission=true;
   const stored=validateSave(JSON.parse(raw,(k,v)=>v==='__infinity'?Infinity:v));
   if(stored.mission.ended){
    localStorage.removeItem('next-frontier-save');
   }else{
    window.savedMission=migrateShieldSave(stored,data.resources.quantities.shield);
   }
   window.invalidSavedMission=false;
   if(window.savedMission && window.savedMission!==stored){
    try{localStorage.setItem('next-frontier-save',JSON.stringify(window.savedMission,(k,v)=>v===Infinity?'__infinity':v))}
    catch(error){console.warn('Converted Shield save could not be written',error)}
   }
  }
 }
 catch(error){console.warn('Saved mission unavailable',error)}
 globalThis.GameData=window.savedMission?.data||data;
 globalThis.Copy=(key,values={})=>(CurrentGameData.interface[key]||GameData.interface[key]||key).replace(/\{(\w+)\}/g,(_,k)=>String({...GameData.mission,...values}[k]??`{${k}}`));
 document.title=Copy('pageTitle');
 const image=document.querySelector('.briefing-image');image.src=Copy('briefingImage');image.alt=Copy('briefingImageAlt');
 for(const el of document.querySelectorAll('[data-copy]'))el.textContent=Copy(el.dataset.copy);
 if(window.invalidSavedMission){const p=document.createElement('p');p.textContent=Copy('invalidSave');document.getElementById('start-mission').before(p)}
 globalThis.CardData={CARDS:GameData.cards};
 for(const file of ['indicators','mission','flows','deck','engine','icons','display','glossary','audio','card-images','card-ui','tutorial','ui'])await import(moduleURL(`./${file}.js`));
}catch(error){
 console.error(error);
 document.getElementById('main-menu').hidden=true;
 document.getElementById('mission-intro').hidden=false;
 const p=document.createElement('p');p.textContent='The mission could not load.';
 const retry=document.createElement('button');retry.className='start-mission';retry.textContent='Try again';retry.onclick=()=>location.reload();
 document.getElementById('briefing').replaceChildren(p,retry);
}
