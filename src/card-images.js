/* Resolve new catalog images by ID without a build or directory listing. */
globalThis.CardImages = {
 placeholder: 'images/cards/placeholder.svg',
 candidates(card) {
  return card.imageById ? ['jpg','png','jpeg'].map(ext => `images/cards/${encodeURIComponent(card.imageId ?? card.id)}.${ext}`) : [card.image];
 },
 show(image,card,onStatus) {
  let cancelled=false,timer,settle;
  image.loadingReady=new Promise(resolve=>{settle=resolve;});
  image.src=this.placeholder;image.alt='Image not available yet.';onStatus(false);
  const attempt=async()=>{
   for(const path of this.candidates(card)){
    if(cancelled)return;
    // A fresh URL avoids cached 404s when an image is added later.
    const url=new URL(path,document.baseURI);url.searchParams.set('card-image',Date.now());
    const probe=new Image();
    const loaded=await new Promise(resolve=>{probe.onload=()=>resolve(true);probe.onerror=()=>resolve(false);probe.src=url.href;});
    if(cancelled)return;
    if(loaded){image.src=url.href;image.alt=card.imageAlt||'';onStatus(true);settle();return;}
   }
   settle();
   timer=setTimeout(attempt,15000);
  };
  attempt();
  return ()=>{cancelled=true;settle();clearTimeout(timer);};
 }
};
