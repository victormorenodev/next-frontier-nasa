export function validateData(d, {legacy = false, allowLegacyShield = false} = {}) {
  const need=(ok,path)=>{if(!ok)throw Error(`Invalid data: ${path}`)};
  const finite=Number.isFinite;
  need(d?.mission?.version===1,'mission.version');
  need(Number.isInteger(d.mission.totalSols)&&d.mission.totalSols>0,'mission.totalSols');
  need(Number.isInteger(d.mission.crew)&&d.mission.crew>0,'mission.crew');
  need(finite(d.mission.solHours)&&d.mission.solHours>0,'mission.solHours');
  need(d.mission.dailyCostMultiplier === undefined || finite(d.mission.dailyCostMultiplier) && d.mission.dailyCostMultiplier > 0, 'mission.dailyCostMultiplier');
  const p=d.mission.eventChances;
  need(p&&[p.one,p.two].every(n=>finite(n)&&n>=0&&n<=1)&&Math.abs(p.one+p.two-1)<1e-9,'mission.eventChances');

  if(d.mission.difficulties!==undefined){
    for(const id of ['easy','hard']){
      const mode=d.mission.difficulties[id];
      need(mode&&Array.isArray(mode.allowedCardDifficulties)&&mode.allowedCardDifficulties.length>0&&mode.allowedCardDifficulties.every(v=>['easy','medium','hard'].includes(v)),'mission.difficulties.'+id);
      need(mode.display===(id==='easy'?'percentage':'physical'),'mission.difficulties.'+id+'.display');
      need(id!=='easy'||!mode.allowedCardDifficulties.includes('hard'),'easy mode cannot include hard cards');
    }
  }
  const q=d.resources?.quantities; need(q&&Object.keys(q).length,'resources.quantities');
  for(const [id,r] of Object.entries(q)) {
    need(/^[a-z][a-z0-9-]*$/.test(id),`resource ID ${id}`);
    need(r.name&&r.unit&&r.unitName&&finite(r.start)&&finite(r.max)&&r.max>0&&r.start>=0&&r.start<=r.max,`resource ${id}`);
  }
  need(q.shield && (q.shield.unit==='%' && q.shield.max===100 || allowLegacyShield && q.shield.unit==='g/cm²'), 'resources.shield.scale');
  const unique=(list,label)=>{need(Array.isArray(list)&&list.length>0,label);const ids=new Set();for(const item of list){need(item&&typeof item.id==='string'&&!ids.has(item.id),label+'.id');ids.add(item.id)}};
  unique(d.resources.indicators,'indicators');
  for(const i of d.resources.indicators)need(i.name&&/^#[0-9a-f]{6}$/i.test(i.color)&&['oxygen','water','shield','energy','food'].includes(i.icon)&&Array.isArray(i.parts)&&i.parts.length&&i.parts.every(k=>k in q),'indicator '+i.id);
  if (d.resources.easyLifeSupport !== undefined) {
    const i = d.resources.easyLifeSupport;
    need(i && i.id === 'life-support' && typeof i.name === 'string' && i.name.trim() &&
      i.icon === 'health' && /^#[0-9a-f]{6}$/i.test(i.color) && typeof i.description === 'string' && i.description.trim() &&
      Array.isArray(i.parts) && i.parts.length === 2 && i.parts.includes('oxygen') && i.parts.includes('water') &&
      i.parts.every(k => k in q), 'resources.easyLifeSupport');
  }
  const effects=(e,path)=>{need(e&&typeof e==='object'&&!Array.isArray(e),path);for(const [k,v]of Object.entries(e))need(k in q&&finite(v),path+'.'+k)};
  unique(d.flows,'flows');
  for(const f of d.flows)need(f.quantity in q&&finite(f.amount)&&['perSol','perCrewEarthDay'].includes(f.basis)&&['reference','simulated'].includes(f.kind),'flow '+f.id);
  unique(d.cards,'cards');
  if (!legacy) {
    unique(d.categories,'categories');
    const chance = n => finite(n) && n >= 0 && n <= 1;
    const sum = list => Math.abs(list.reduce((n,x)=>n+x.probability,0)-1)<1e-9;
    need(d.categories.every(c=>typeof c.name==='string'&&c.name.trim()&&chance(c.probability))&&sum(d.categories),'categories.probability');
    const ids=new Set(d.categories.map(c=>c.id));
    need(d.cards.every(c=>ids.has(c.category)&&chance(c.probability)),'cards.category/probability');
    for(const c of d.categories){const group=d.cards.filter(card=>card.category===c.id);need(group.length>0&&sum(group),'category '+c.id+'.cards.probability')}
  }
  for(const c of d.cards){
    need(c.sourceDescription===undefined||typeof c.sourceDescription==='string','card '+c.id+'.sourceDescription');
    need(c.imageSource===undefined||typeof c.imageSource==='string'&&/^https?:\/\//.test(c.imageSource),'card '+c.id+'.imageSource');
    need(c.imageCaption===undefined||typeof c.imageCaption==='string','card '+c.id+'.imageCaption');
    need(c.description&&c.image&&['easy','medium','hard'].includes(c.difficulty)&&c.source?.institution&&/^https?:\/\//.test(c.source.url),'card '+c.id);
    need(c.source.kind===undefined||['reference','image'].includes(c.source.kind),'card '+c.id+'.source.kind');
    for(const side of ['left','right']){
      const a=c[side];need(a&&typeof a.label==='string','card '+c.id+'.'+side);need(a.description===undefined||typeof a.description==='string',c.id+'.'+side+'.description');need(a.sourceResponse===undefined||typeof a.sourceResponse==='string',c.id+'.'+side+'.sourceResponse');effects(a.effects||{},c.id+'.effects');
      if(a.effectPercentages!==undefined){
        effects(a.effectPercentages,c.id+'.'+side+'.effectPercentages');
        for(const key of Object.keys(q))need(Math.abs((a.effects?.[key]||0)-(a.effectPercentages[key]||0)*q[key].max/100)<1e-9,c.id+'.'+side+'.effectPercentages conversion');
      }
      for(const o of a.ongoing||[]){effects(o.rates,c.id+'.ongoing');need(Object.keys(o.rates).length&& (o.after==null||Number.isInteger(o.after)&&o.after>=0)&&(o.for==null||Number.isInteger(o.for)&&o.for>0),c.id+'.ongoing.duration')}
      for(const l of a.later||[]){effects(l.effects,c.id+'.later');need(Object.keys(l.effects).length&&Number.isInteger(l.after)&&l.after>0,c.id+'.later.after')}
    }
  }
  need(d.interface&&Object.values(d.interface).every(v=>typeof v==='string'),'interface');
  return d;
}
export function validateSave(s){
 if(s?.version!==1)throw Error('Unsupported save version');validateData(s.data, {legacy: !Object.hasOwn(s.data || {}, 'categories'), allowLegacyShield:true});
 const need=(ok)=>{if(!ok)throw Error('Invalid saved mission')};
 need(s.mission&&Number.isInteger(s.mission.sol)&&s.mission.sol>=1&&s.mission.sol<=s.data.mission.totalSols&&Number.isInteger(s.mission.elapsed)&&s.mission.elapsed>=0&&typeof s.mission.ended==='boolean');
 need(Array.isArray(s.schedule)&&s.schedule.length===s.data.mission.totalSols&&s.schedule.every(n=>n===1||n===2));
 need(Array.isArray(s.deck)&&s.deck.length===s.schedule.reduce((a,b)=>a+b,0));
 need(Number.isInteger(s.index)&&s.index>=0&&s.index<=s.deck.length&&Number.isInteger(s.eventIndex)&&s.eventIndex>=0&&s.eventIndex<2);
 need(s.mission.ended||s.index<s.deck.length&&s.eventIndex<s.schedule[s.mission.sol-1]);
 need(s.savedSide===null||['left','right'].includes(s.savedSide));
 if(s.mission.reason==='failed')need(s.mission.ended&&Object.hasOwn(s.data.resources.quantities,s.mission.failedResource)&&s.state?.[s.mission.failedResource]===0);
 need(s.mission.difficulty===undefined||['easy','hard'].includes(s.mission.difficulty));
 if(s.mission.difficulty==='easy')need(s.deck.every(c=>c.difficulty==='easy'||c.difficulty==='medium'));
 for(const [k,r] of Object.entries(s.data.resources.quantities))need(Number.isFinite(s.state?.[k])&&s.state[k]>=0&&s.state[k]<=r.max);
 need(s.flows&&Array.isArray(s.flows.ongoing)&&Array.isArray(s.flows.later));
 need(s.flows.dailyCostResource === undefined || s.flows.dailyCostResource === null || typeof s.flows.dailyCostResource === 'string' && Object.hasOwn(s.data.resources.quantities,s.flows.dailyCostResource));
 for(const o of s.flows.ongoing)need(Number.isFinite(o.start)&&(Number.isFinite(o.end)||o.end===Infinity)&&o.end>o.start&&Object.entries(o.rates).every(([k,n])=>k in s.state&&Number.isFinite(n)));
 for(const l of s.flows.later)need(Number.isFinite(l.at)&&Object.entries(l.effects).every(([k,n])=>k in s.state&&Number.isFinite(n)));
 const ids=new Set(s.data.cards.map(c=>c.id));need(s.deck.every(c=>ids.has(c.id)));
 return s;
}

// Convert a validated old save by its former capacity, preserving all relative
// effects and timing. Every transformation is immutable, even for shared cards.
export function migrateShieldSave(save, currentShield) {
 const old = save.data.resources.quantities.shield;
 if (old.unit === '%' && old.max === 100) return save;
 const factor = 100 / old.max;
 const scale = effects => effects && Object.hasOwn(effects,'shield') ? {...effects,shield:effects.shield*factor} : effects;
 const ongoing = list => list.map(o=>({...o,rates:scale(o.rates)}));
 const later = list => list.map(o=>({...o,effects:scale(o.effects)}));
 const answer = a => ({...a,...(a.effects?{effects:scale(a.effects)}:{}),...(a.ongoing?{ongoing:ongoing(a.ongoing)}:{}),...(a.later?{later:later(a.later)}:{})});
 const card = c => ({...c,left:answer(c.left),right:answer(c.right)});
 const clamp = value => Math.max(0,Math.min(100,value*factor));
 const converted = {
  ...save,
  data:{...save.data,
   resources:{...save.data.resources,quantities:{...save.data.resources.quantities,shield:{...old,...currentShield,start:clamp(old.start),max:100}}},
   cards:save.data.cards.map(card),
   flows:save.data.flows.map(f=>f.quantity==='shield'?{...f,amount:f.amount*factor}:f)
  },
  state:{...save.state,shield:clamp(save.state.shield)},
  deck:save.deck.map(card),
  flows:{...save.flows,ongoing:ongoing(save.flows.ongoing),later:later(save.flows.later)},
  ...(save.cardChanges?{cardChanges:scale(save.cardChanges)}:{})
 };
 return validateSave(converted);
}
