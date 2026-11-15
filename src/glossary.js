/* Shared glossary content for the menu and safe text-only annotations on cards. */
(function(root){
 'use strict';
 const entries=CurrentGameData.glossary;
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const aliases=entries.flatMap(entry=>entry.aliases.map(alias=>({alias,entry}))).sort((a,b)=>b.alias.length-a.alias.length);
 const pattern=new RegExp('(?<![\\p{L}\\p{N}])('+aliases.map(a=>escape(a.alias)).join('|')+')(?![\\p{L}\\p{N}])','giu');
 const byAlias=new Map(aliases.map(a=>[a.alias.toLowerCase(),a.entry]));
 const popup=document.createElement('div');popup.id='glossary-tooltip';popup.className='glossary-tooltip';popup.popover='auto';popup.setAttribute('role','tooltip');document.body.append(popup);
 let active=null, timer;
 function close(){clearTimeout(timer);if(active)active.removeAttribute('aria-describedby');active=null;popup.hidePopover();}
 function position(){
  if(!active?.isConnected){close();return;}
  const r=active.getBoundingClientRect(),p=popup.getBoundingClientRect();
  popup.style.left=Math.max(8,Math.min(innerWidth-p.width-8,r.left+r.width/2-p.width/2))+'px';
  popup.style.top=Math.max(8,Math.min(innerHeight-p.height-8,r.bottom+8+p.height<innerHeight?r.bottom+8:r.top-p.height-8))+'px';
 }
 function open(term){
  close();active=term;
  const entry=entries.find(e=>e.id===term.dataset.glossary);
  const title=document.createElement('strong');title.textContent=entry.term;
  const description=document.createElement('p');description.textContent=entry.definition;
  popup.replaceChildren(title,description);term.setAttribute('aria-describedby',popup.id);
  popup.showPopover();position();
 }
 function decorate(node){
  const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);const texts=[];
  while(walker.nextNode())if(!walker.currentNode.parentElement.closest('.glossary-term, a'))texts.push(walker.currentNode);
  for(const text of texts){
   const value=text.textContent;pattern.lastIndex=0;const matches=[...value.matchAll(pattern)];if(!matches.length)continue;
   const fragment=document.createDocumentFragment();let offset=0;
   for(const match of matches){
    fragment.append(value.slice(offset,match.index));const term=document.createElement('span');term.className='glossary-term';term.dataset.glossary=byAlias.get(match[0].toLowerCase()).id;term.textContent=match[0];term.tabIndex=0;
    // Keep inline text semantics, including inside answer buttons; key handlers provide access.
    term.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')open(term)});
    term.addEventListener('pointerleave',()=>{timer=setTimeout(close,180)});
    term.addEventListener('focus',()=>open(term));term.addEventListener('blur',close);
    fragment.append(term);offset=match.index+match[0].length;
   }
   fragment.append(value.slice(offset));text.replaceWith(fragment);
  }
 }
 document.addEventListener('click',e=>{
  const term=e.target.closest('.glossary-term');if(!term)return;
  e.preventDefault();e.stopImmediatePropagation();open(term);
 },true);
 document.addEventListener('keydown',e=>{
  if(e.target.closest('.glossary-term')&&['Enter',' ','ArrowLeft','ArrowRight'].includes(e.key)){
   e.preventDefault();e.stopImmediatePropagation();if(e.key==='Enter'||e.key===' ')open(e.target.closest('.glossary-term'));
  }
  if(e.key==='Escape'&&active){e.stopImmediatePropagation();close();}
 },true);
 popup.addEventListener('pointerenter',()=>clearTimeout(timer));popup.addEventListener('pointerleave',close);
 popup.addEventListener('toggle',()=>{if(!popup.matches(':popover-open')&&active){active.removeAttribute('aria-describedby');active=null;}});
 window.addEventListener('resize',close);document.addEventListener('scroll',close,true);
 const dialog=document.getElementById('glossary-dialog'),list=document.getElementById('glossary-list');
 for(const entry of entries){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=entry.term;dd.textContent=entry.definition;list.append(dt,dd);}
 document.getElementById('menu-glossary').addEventListener('click',()=>dialog.showModal());
 document.getElementById('glossary-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
 root.Glossary={decorate,close};
})(globalThis);
