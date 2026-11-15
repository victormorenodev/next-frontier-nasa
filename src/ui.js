/* Interface: mission bar (sol + End mission), the indicators and the game flow.
   The card itself is drawn by card-ui.js.
   Press and hold an indicator (mouse, finger or pen) to see its detail; let go to close it.
   Keyboard focus shows it too. */
(function () {
  'use strict';

  // Simple line icons, one per indicator.
  const ICONS = ResourceIcons;

  // Whole numbers for big stocks, decimals for small physical stocks (0.45 kg/sol).
  const fmt = n => n.toLocaleString('en-US', {maximumFractionDigits: Math.abs(n) < 1 ? 2 : Math.abs(n) < 100 ? 1 : 0});
  // Trend of a quantity per sol: arrow + amount. Tiny changes count as steady.
  const STEADY = 0.005;
  const trendOf = n => (n > STEADY ? 'up' : n < -STEADY ? 'down' : 'flat');
  const ARROWS = {up: '▲', down: '▼', flat: '■'};
  const TREND_WORDS = Object.fromEntries(['up','down','flat'].map(k=>[k,Copy(k)]));

  const row = document.getElementById('indicators');
  const detail = document.getElementById('detail');
  const activeList = document.getElementById('active-effects');
  const tablet = document.getElementById('effects-tablet');
  let effectsPage = 0;
  const MAX_EFFECTS = Flows.MAX_EFFECTS;      // the effects box shows at most this many
  let missionTutorial = null;
  let state;
  let mission;
  let flows;          // what the base uses and makes every sol, and answers still in effect
  let active = null;
  let pressing = null;   // pointer currently held on the indicator row

  let tilesKey = '';
  function buildTiles() {
    const definitions = ResourceDisplay.indicators();
    tilesKey = definitions.map(ind => ind.id).join(',');
    row.replaceChildren();
    row.style.setProperty('--indicator-count', definitions.length);
    definitions.forEach(ind => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'tile';
      tile.dataset.id = ind.id;
      document.documentElement.style.setProperty('--' + ind.id, ind.color);
      tile.style.setProperty('--c', ind.color);
      tile.setAttribute('aria-controls', 'detail');
      tile.innerHTML = `<span class="fill"></span><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[ind.icon]}</svg>`;
      const slot=document.createElement('div');slot.className='indicator-slot';
      const change=document.createElement('span');change.className='resource-delta';
      change.setAttribute('role','status');change.setAttribute('aria-live','polite');
      slot.append(change,tile);row.append(slot);
    });
  }

  function render() {
    if (tilesKey !== ResourceDisplay.indicators().map(ind => ind.id).join(',')) {
      active = null;
      buildTiles();
    }
    const view = Indicators.read(state, ResourceDisplay.indicators());
    const rates = Flows.ratesPerSol(flows, mission.elapsed);   // change per sol right now
    view.forEach(ind => {
      ind.parts.forEach(p => { p.rate = rates[p.id]; });
      const tile = row.querySelector(`[data-id="${ind.id}"]`);
      tile.style.setProperty('--level', ind.level);
      tile.classList.toggle('active', ind.id === active);
      // The arrow follows the indicator's lowest part (each indicator has one part now).
      const trend = trendOf(rates[ind.lowest]);
      tile.dataset.trend = trend;
      tile.setAttribute('aria-label', ind.id === 'life-support' ? `${ind.name}: ${ResourceDisplay.round(ind.level * 100)} of 100` : `${ind.name}: ${ind.parts.map(p =>
        `${p.name} ${fmt(ResourceDisplay.read(p.id,p.value).value)} of ${ResourceDisplay.read(p.id,p.value).max} ${ResourceDisplay.read(p.id,p.value).unitName}, ${TREND_WORDS[trendOf(p.rate)]}`).join('; ')}`);
    });
    renderDetail(view.find(ind => ind.id === active));
    renderActive();
  }

  function renderActive() {
    const items = Flows.active(flows, mission.elapsed).reverse();
    const pages = Math.max(1, Math.ceil(items.length / MAX_EFFECTS));
    effectsPage = Math.min(effectsPage, pages - 1);
    document.getElementById('tablet-count').textContent = items.length;
    document.getElementById('tablet-summary').textContent = Copy('tabletSummary');
    activeList.replaceChildren();
    if (!items.length) {
      const li = document.createElement('li'); li.className = 'tablet-empty';
      li.textContent = Copy('tabletEmpty'); activeList.append(li);
    }
    items.slice(effectsPage * MAX_EFFECTS, (effectsPage + 1) * MAX_EFFECTS).forEach(a => {
      const li = document.createElement('li'); li.className = 'tablet-effect';
      const heading = document.createElement('div'); heading.className = 'tablet-effect-heading';
      const name = document.createElement('strong'); name.textContent = a.note || Object.keys(a.rates).map(q=>Indicators.QUANTITIES[q].name).join(' + ');
      const duration = document.createElement('span'); duration.textContent = a.thirdsLeft === Infinity ? Copy('always') : Copy('tabletRemaining',{sols:solsText(a.thirdsLeft)});
      heading.append(name,duration); li.append(heading);
      const report=document.createElement('p');report.className='tablet-effect-report';
      report.textContent=Object.entries(a.rates).map(([key,amount])=>Copy(amount>STEADY?'tabletEffectUp':amount < -STEADY?'tabletEffectDown':'tabletEffectFlat',{resource:Indicators.QUANTITIES[key].name})).join(' ');
      li.append(report);
      activeList.append(li);
    });
    document.getElementById('tablet-page').textContent=Copy('tabletPage',{page:effectsPage+1,pages});
    document.getElementById('tablet-prev').disabled=effectsPage===0;
    document.getElementById('tablet-next').disabled=effectsPage===pages-1;
    document.querySelector('.tablet-pages').hidden=pages===1;
  }
  const tabletToggle=document.getElementById('open-tablet');
  let tabletCloseTimer;
  function stowTablet() {
    if (!tablet.open || tablet.classList.contains('is-closing')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { tablet.close(); return; }
    tablet.classList.add('is-closing');
    tabletCloseTimer=setTimeout(()=>tablet.close(), 280);
  }
  tabletToggle.addEventListener('click',()=>{
    hide();effectsPage=0;renderActive();tablet.classList.remove('is-closing');
    tablet.showModal();tabletToggle.setAttribute('aria-expanded','true');
    document.getElementById('close-tablet').focus();
  });
  document.getElementById('close-tablet').addEventListener('click',stowTablet);
  tablet.addEventListener('cancel',e=>{e.preventDefault();stowTablet();});
  tablet.addEventListener('click',e=>{if(e.target===tablet)stowTablet();});
  tablet.addEventListener('animationend',e=>{if(e.target===tablet&&e.animationName==='tablet-lower')tablet.close();});
  tablet.addEventListener('close',()=>{
    clearTimeout(tabletCloseTimer);tablet.classList.remove('is-closing');
    tabletToggle.setAttribute('aria-expanded','false');tabletToggle.focus();
  });
  document.getElementById('tablet-prev').addEventListener('click',()=>{effectsPage--;renderActive();});
  document.getElementById('tablet-next').addEventListener('click',()=>{effectsPage++;renderActive();});

  // The detail covers the effects box while an indicator is held. When it closes, its content
  // is kept so it can fade out smoothly instead of vanishing.
  function renderDetail(ind) {
    detail.classList.toggle('empty', !ind);
    if (!ind) return;
    detail.replaceChildren();
    detail.classList.toggle('life-support-detail', ind.id === 'life-support');

    detail.style.setProperty('--c', `var(--${ind.id})`);
    const title = document.createElement('h2');
    title.textContent = ind.name;
    const parts = document.createElement('div');parts.className = 'parts';
    parts.style.setProperty('--n', ind.parts.length);
    const forecast=Flows.passTime(state,flows,mission.elapsed,Mission.THIRDS_PER_SOL,{stopOnEmpty:true}).state;
    if (ind.id === 'life-support') {
      const definition = ResourceDisplay.indicators()[0];
      const description = document.createElement('p'); description.className = 'resource-description';
      description.textContent = definition.description;
      const delta = ResourceDisplay.indicatorChange(definition, state, forecast);
      const change = document.createElement('p'); change.className = 'resource-change';
      change.dataset.trend = trendOf(delta);
      change.textContent = Copy(delta === 0 ? 'resourceSteady' : delta < 0 ? 'resourceLoseEasy' : 'resourceGainEasy', {amount: fmt(Math.abs(delta))});
      const value = document.createElement('div'); value.className = 'value';
      const amount = document.createElement('strong'); amount.className = 'amount';
      amount.textContent = fmt(ResourceDisplay.round(ResourceDisplay.level(definition, state) * 100));
      value.append(amount);
      detail.append(title, description, value, change);
      return;
    }
    ind.parts.forEach(p=>{
      const part=document.createElement('div');
      const description=document.createElement('p');description.className='resource-description';
      description.textContent=CurrentGameData.resources.quantities[p.id]?.description || GameData.resources.quantities[p.id].description || '';
      const value=document.createElement('div');value.className='value';
      const amount=document.createElement('strong');amount.className='amount';const display=ResourceDisplay.read(p.id,p.value);amount.textContent=`${fmt(display.value)}${display.unit==='%'?'%':display.unit?' '+display.unit:''}`;
      const capacity=document.createElement('span');capacity.className='of';capacity.textContent=Copy('resourceCapacity',{max:fmt(display.max),unit:display.unit==='%'?'':display.unit});
      value.append(amount,capacity);
      const delta=ResourceDisplay.change(p.id,p.value,forecast[p.id]).value;
      const change=document.createElement('p');change.className='resource-change';change.dataset.trend=trendOf(delta);
      change.textContent=Copy(Math.abs(delta)<STEADY?'resourceSteady':delta<0?(ResourceDisplay.mode==='easy'||p.id==='shield'?'resourceLoseEasy':'resourceLose'):(ResourceDisplay.mode==='easy'||p.id==='shield'?'resourceGainEasy':'resourceGain'),{amount:fmt(Math.abs(delta)),unit:display.unit});
      part.append(description,value,change);parts.append(part);
    });
    detail.append(title, parts);
  }

  function show(id) {
    if (active === id) return;
    active = id;
    render();
  }

  function hide() {
    if (active === null) return;
    active = null;
    render();
  }

  const tileAt = (x, y) => document.elementFromPoint(x, y)?.closest('.tile');

  row.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const tile=e.target.closest('.tile');if(tile)show(tile.dataset.id);
  });
  row.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')hide();});

  // Press and hold: the detail shows while the button/finger is down. Sliding to another
  // indicator while still pressing switches to it. Letting go (anywhere) closes it.
  row.addEventListener('pointerdown', e => {
    const tile = tileAt(e.clientX, e.clientY);
    if (!tile || e.button > 0) return;
    globalThis.GameAudio?.play('button');            // tap/click on an indicator (hover stays silent)
    pressing = e.pointerId;
    try { row.setPointerCapture(e.pointerId); } catch (_) { /* pointer already gone */ }
    show(tile.dataset.id);
  });
  row.addEventListener('pointermove', e => {
    if (pressing !== e.pointerId) return;
    const tile = tileAt(e.clientX, e.clientY);
    if (tile) show(tile.dataset.id);
  });
  const release = e => {
    if (pressing !== e.pointerId) return;
    pressing = null;
    if (e.pointerType !== 'mouse') hide();
  };
  row.addEventListener('pointerup', release);
  row.addEventListener('pointercancel', release);
  // A long press must not open the phone's context menu.
  row.addEventListener('contextmenu', e => e.preventDefault());

  // Keyboard: focusing an indicator with Tab shows it; leaving the row or Escape hides it.
  // (A mouse/finger press also focuses the button; :focus-visible tells the two apart.)
  row.addEventListener('focusin', e => {
    const tile = e.target.closest('.tile');
    if (tile && tile.matches(':focus-visible')) show(tile.dataset.id);
  });
  row.addEventListener('focusout', e => { if (!row.contains(e.relatedTarget)) hide(); });
  row.addEventListener('keydown', e => {
    if (e.key === 'Escape') hide();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.tile') && !e.repeat) globalThis.GameAudio?.play('button');
  });

  // ── Mission flow: deck, answers, end ────────────────────
  const mainMenu = document.getElementById('main-menu');
  const intro = document.getElementById('mission-intro');
  document.getElementById('menu-start').addEventListener('click', () => {
    mainMenu.hidden = true;
    intro.hidden = false;
    document.getElementById('start-mission').focus({preventScroll:true});
  });
  const creditsDialog = document.getElementById('credits-dialog');
  document.getElementById('menu-credits').addEventListener('click', () => creditsDialog.showModal());
  // Sound on/off: same setting for the menu button and the mission bar button.
  const renderSound = (button, on) => {
    button.setAttribute('aria-pressed', String(on));
    button.classList.toggle('muted', !on);
    const state = Copy(on ? 'soundOn' : 'soundOff');
    const text = button.querySelector('.sound-text');
    if (text) text.textContent = `${Copy('soundLabel')}: ${state}`;
    else { button.setAttribute('aria-label', Copy('soundLabel')); button.title = `${Copy('soundLabel')}: ${state}`; }
  };
  ['menu-sound', 'game-sound'].forEach(id => GameAudio.bindToggle(document.getElementById(id), renderSound));
  document.getElementById('credits-close').addEventListener('click', () => creditsDialog.close());
  creditsDialog.addEventListener('click', event => { if (event.target === creditsDialog) creditsDialog.close(); });
  const briefing = document.getElementById('briefing');
  const game = document.getElementById('game');
  let introDrag = null;

  const endButton = document.getElementById('end-mission');
  const dialog = document.getElementById('end-dialog');
  const cardUI = CardUI.create(document.getElementById('card'), {onAnswer, onNext, canAnswer: () => !missionTutorial?.active});
  let solTransition = false;
  let solTimer;
  let cardChanges = {};
  let savedSide = null;
  let deck = [];
  let index = 0;
  let schedule = [];
  let eventIndex = 0;
  const background = document.getElementById('sol-transition');
  const solNotice = document.getElementById('sol-notice');

  function startMission(difficulty = 'hard', dailyCostResource = null) {
    clearTimeout(solTimer); solTransition=false;
    clearResourceHighlights(); cardChanges={};
    if (window.savedMission) {
      localStorage.removeItem('next-frontier-save');
      sessionStorage.setItem('next-frontier-start', JSON.stringify({difficulty, dailyCostResource}));
      location.reload();
      return;
    }
    mainMenu.hidden = true;
    intro.hidden = true;
    document.getElementById('difficulty-screen').hidden=true;
    game.hidden = false;
    background.hidden = true;
    solNotice.textContent = Copy("missionProgress");
    adopt(Engine.start(Math.random,difficulty,dailyCostResource));
    render();
    renderMission();
    showSol();
    startTutorial();
  }

  function showSol() {
    const total = schedule[mission.sol - 1];
    savedSide = null;
    cardUI.showFront(deck[index], eventIndex + 1, total);
    save();
  }

  function onAnswer(side) {
    if (mission.ended || solTransition || missionTutorial?.active) return;
    const card = deck[index], answer = card[side];
    const before = state;
    adopt(Engine.answer(snapshot(), side));
    cardChanges=Object.fromEntries(Object.keys(state).filter(q=>state[q]!==before[q]).map(q=>[q,state[q]-before[q]]));
    bumpChanged(before, state, true);
    render();
    if (mission.ended) { save(); renderMission(); return; }
    const last = eventIndex + 1 === schedule[mission.sol - 1];
    cardUI.showBack(card, side, last, [], before);
    savedSide = side; save();
  }

  function snapshot() { return {state,mission,flows,deck,index,schedule,eventIndex,savedSide}; }
  function adopt(value) { ({state,mission,flows,deck,index,schedule,eventIndex,savedSide}=value); ResourceDisplay.mode=mission.difficulty || 'hard'; }
  function onNext() {
    if(solTransition || missionTutorial?.active) return;
    const before=state;
    const result=Engine.next(snapshot());
    if (result.snapshot.mission===mission && result.snapshot.index===index) return;
    clearResourceHighlights(); cardChanges={};
    adopt(result.snapshot);
    if (!result.newSol) { showSol(); return; }
    const passed=result;
    bumpChanged(before,state);
    render();
    // Only the sky changes: the game stays visible throughout the turnover.
    const arrivals = passed.happened.map(h => h.note || Copy("suppliesUpdated"));
    solNotice.textContent = arrivals.join(' · ') || Copy("missionProgress");
    // Save the completed sol atomically before the brief visual sequence.
    save();
    solTransition=true;
    document.getElementById('card').inert=true;
    document.getElementById('open-tablet').disabled=true;
    endButton.disabled=true;
    const finish=()=>{
      solTransition=false;
      document.getElementById('card').inert=false;
      document.getElementById('open-tablet').disabled=false;
      if(!mission.ended)globalThis.GameAudio?.play('sol');   // the sol number goes up now
      renderMission();
      if(!mission.ended)showSol();
      background.hidden=true;
      if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){void background.offsetWidth;background.hidden=false;}
    };
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)finish();
    else solTimer=setTimeout(finish,1400);
  }

  background.addEventListener('animationend', () => { background.hidden = true; });

  // Briefly pulses the indicators an answer changed, so kids see where the effect went.
  function clearResourceHighlights() {
    row.querySelectorAll('.tile').forEach(tile=>{clearTimeout(tile.changeTimer);tile.classList.remove('bump');delete tile.dataset.change;tile.parentElement.classList.remove('change-visible');tile.parentElement.querySelector('.resource-delta').replaceChildren();});
  }
  function restoreResourceHighlights() {
    for(const ind of ResourceDisplay.indicators()){
      const before = Object.fromEntries(Object.entries(state).map(([q,n]) => [q,n-(cardChanges[q]||0)]));
      const delta=ResourceDisplay.indicatorChange(ind,before,state);
      if(delta)row.querySelector(`[data-id="${ind.id}"]`).dataset.change=delta>0?'up':'down';
    }
  }
  function bumpChanged(before, after, persistent = false) {
    ResourceDisplay.indicators().forEach(ind => {
      if (!ind.parts.some(q => before[q] !== after[q])) return;
      const tile = row.querySelector(`[data-id="${ind.id}"]`);
      tile.classList.remove('bump');
      const delta=ResourceDisplay.indicatorChange(ind,before,after);
      if ((ResourceDisplay.mode === 'easy' || ind.id === 'shield') && delta === 0) return;
      tile.dataset.change=delta>0?'up':'down';
      const slot=tile.parentElement;
      const label=slot.querySelector('.resource-delta');label.replaceChildren();
      if (ResourceDisplay.mode === 'easy') {
        const number=document.createElement('strong');number.textContent=`${delta>0?'+':'−'}${fmt(Math.abs(delta))}`;
        label.append(number);
      } else ind.parts.filter(q=>after[q]!==before[q]).forEach(q=>{
        const display=ResourceDisplay.change(q,before[q],after[q]);
        const number=document.createElement('strong');number.textContent=`${display.value>0?'+':'−'}${fmt(Math.abs(display.value))}`;
        const unit=document.createElement('small');unit.textContent=display.unit;
        label.append(number,unit);
      });
      label.dataset.change=tile.dataset.change;
      slot.classList.remove('change-visible');
      void tile.offsetWidth;
      slot.classList.add('change-visible');
      tile.classList.add('bump');
      clearTimeout(tile.changeTimer);
      tile.changeTimer=setTimeout(()=>{tile.classList.remove('bump');slot.classList.remove('change-visible');label.replaceChildren();if(!persistent)delete tile.dataset.change;},1400);
    });
  }

  // Time in words, from thirds of a sol: 82 → "27⅓ sols", 3 → "1 sol".
  function solsText(thirds) {
    const whole = Math.floor(thirds / 3), part = ['', '⅓', '⅔'][thirds % 3];
    return `${whole || !part ? whole : ''}${part} ${thirds === 3 ? 'sol' : 'sols'}`;
  }

  function renderMission() {
    document.getElementById('sol').textContent = Copy("solCount", {sol:mission.sol,total:Mission.TOTAL_SOLS});
    endButton.disabled = mission.ended;
    if (!mission.ended) return;
    const done = mission.reason === 'complete';
    const failed = mission.reason === 'failed';
    const resource = mission.difficulty === 'easy' && ['oxygen','water'].includes(mission.failedResource)
      ? 'life-support' : mission.failedResource;
    cardUI.showMessage(
      failed ? Copy("failedTitle") : done ? Copy("completeTitle") : Copy("endedTitle"),
      failed ? Copy(`failedBody-${resource}`) : done ? Copy("completeBody", {totalSols: Mission.TOTAL_SOLS, events: index})
           : Copy("endedBody", {sol: mission.sol}),
      Copy("newMission"),
      showDifficultyScreen, failed ? resource : done ? 'complete' : 'quit',
      failed ? Copy(`endingImage-${resource}`) : null);
  }

  endButton.addEventListener('click', () => dialog.showModal());
  document.getElementById('end-cancel').addEventListener('click', () => dialog.close());
  document.getElementById('end-confirm').addEventListener('click', () => {
    dialog.close();
    adopt(Engine.end(snapshot()));
    save();
    renderMission();
  });
  // Tapping outside the box closes it, like "Keep playing".
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

  function beginFromIntro() {
    if (intro.hidden) return;
    introDrag = null;
    briefing.style.transform = '';
    showDifficultyScreen();
    document.querySelector('#card .answer')?.focus({preventScroll: true});
  }

  function showDifficultyScreen() {
    intro.hidden=true;game.hidden=true;
    document.getElementById('difficulty-screen').hidden=false;
    document.querySelector('[data-mode="easy"]').focus({preventScroll:true});
  }
  const difficultyScreen = document.getElementById('difficulty-screen');
  const difficultyPanel = difficultyScreen.querySelector('.difficulty-panel');
  let difficultyDrag = null, suppressDifficultyClick = false;
  const resetDifficultyDrag = () => {
    difficultyDrag = null;
    difficultyPanel.style.transform = '';
    difficultyPanel.classList.remove('dragging');
    difficultyScreen.querySelectorAll('[data-mode]').forEach(button => button.classList.remove('lean'));
  };
  difficultyPanel.addEventListener('pointerdown', e => {
    if (e.button > 0 || e.target.closest('#difficulty-back')) return;
    suppressDifficultyClick = false;
    difficultyDrag = {id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,moving:false};
  });
  difficultyPanel.addEventListener('pointermove', e => {
    if (!difficultyDrag || e.pointerId !== difficultyDrag.id) return;
    const dx=e.clientX-difficultyDrag.x, dy=e.clientY-difficultyDrag.y;
    if (!difficultyDrag.moving) {
      if (Math.abs(dy)>8 && Math.abs(dy)>Math.abs(dx)) { resetDifficultyDrag(); return; }
      if (Math.abs(dx)<8) return;
      difficultyDrag.moving=true;
      difficultyPanel.setPointerCapture(e.pointerId);
      difficultyPanel.classList.add('dragging');
    }
    difficultyDrag.dx=dx;
    difficultyPanel.style.transform=`translateX(${dx*.35}px) rotate(${dx/60}deg)`;
    const past=Math.abs(dx)>Math.min(80,difficultyPanel.offsetWidth*.28);
    difficultyScreen.querySelectorAll('[data-mode]').forEach(button=>button.classList.toggle('lean',past && button.dataset.mode===(dx<0?'easy':'hard')));
  });
  difficultyPanel.addEventListener('pointerup', e => {
    if (!difficultyDrag || e.pointerId!==difficultyDrag.id) return;
    const {dx,moving}=difficultyDrag;
    const choose=moving && Math.abs(dx)>Math.min(80,difficultyPanel.offsetWidth*.28);
    suppressDifficultyClick=moving;
    resetDifficultyDrag();
    if (choose) startMission(dx<0?'easy':'hard');
  });
  difficultyPanel.addEventListener('pointercancel',resetDifficultyDrag);
  difficultyPanel.addEventListener('lostpointercapture',e=>{if(e.target===difficultyPanel)resetDifficultyDrag();});
  difficultyPanel.addEventListener('click',e=>{
    if (suppressDifficultyClick) { e.preventDefault();e.stopImmediatePropagation();suppressDifficultyClick=false; }
  },true);
  difficultyScreen.addEventListener('keydown',e=>{
    if (!['ArrowLeft','ArrowRight'].includes(e.key)) return;
    e.preventDefault();startMission(e.key==='ArrowLeft'?'easy':'hard');
  });
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
    startMission(button.dataset.mode);
    document.querySelector('#card .answer')?.focus({preventScroll:true});
  }));
  document.getElementById('difficulty-back').addEventListener('click',()=>{
    document.getElementById('difficulty-screen').hidden=true;intro.hidden=false;
    document.getElementById('start-mission').focus();
  });
  document.getElementById('start-mission').addEventListener('click', beginFromIntro);
  briefing.addEventListener('pointerdown', e => {
    if (e.button > 0 || e.target.closest('button, a')) return;
    introDrag = {id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, horizontal: false};
  });
  briefing.addEventListener('pointermove', e => {
    if (!introDrag || introDrag.id !== e.pointerId) return;
    const dx = e.clientX - introDrag.x, dy = e.clientY - introDrag.y;
    if (!introDrag.horizontal) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { introDrag = null; return; }
      if (Math.abs(dx) < 10) return;
      introDrag.horizontal = true;
      try { briefing.setPointerCapture(e.pointerId); } catch (_) { /* pointer released */ }
      briefing.classList.add('dragging');
    }
    introDrag.dx = dx;
    briefing.style.transform = `translateX(${dx * 0.35}px) rotate(${dx / 60}deg)`;
  });
  briefing.addEventListener('pointerup', e => {
    if (!introDrag || introDrag.id !== e.pointerId) return;
    const begin = introDrag.horizontal && Math.abs(introDrag.dx) >= Math.min(80, briefing.offsetWidth * 0.22);
    introDrag = null;
    briefing.classList.remove('dragging');
    briefing.style.transform = '';
    if (begin) beginFromIntro();
  });
  briefing.addEventListener('pointercancel', () => {
    introDrag = null;
    briefing.classList.remove('dragging');
    briefing.style.transform = '';
  });
  intro.addEventListener('keydown', e => {
    if (intro.hidden || e.target.closest('a')) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      beginFromIntro();
    }
  });

  function save() {
    try {
      if (mission.ended) {
        localStorage.removeItem('next-frontier-save');
        document.getElementById('menu-continue').disabled = true;
        document.getElementById('menu-save-note').hidden = false;
      } else {
        localStorage.setItem('next-frontier-save', JSON.stringify({version:1,data:GameData,state,mission,flows,deck,index,schedule,eventIndex,savedSide,cardChanges}, (k,v)=>v===Infinity?'__infinity':v));
      }
    }
    catch (_) { solNotice.textContent = Copy("storageUnavailable"); }
  }
  const stored = window.savedMission;
  const continueButton = document.getElementById('menu-continue');
  continueButton.disabled = !stored;
  document.getElementById('menu-save-note').hidden = Boolean(stored);
  if (stored) {
    continueButton.addEventListener('click', () => {
      adopt(Engine.checkFailure(stored));
      if (mission.ended || flows !== stored.flows) save();
      mainMenu.hidden = true; intro.hidden = true; game.hidden = false;
      render(); renderMission();
      if (!mission.ended) {
        const side = savedSide;
        cardUI.showFront(deck[index], eventIndex + 1, schedule[mission.sol - 1]);
        if (side) {
          cardChanges = stored.cardChanges || {};
          const before = Object.fromEntries(Object.entries(state).map(([q,n]) => [q,n-(cardChanges[q]||0)]));
          cardUI.showBack(deck[index], side, eventIndex + 1 === schedule[mission.sol - 1], [], before);
          restoreResourceHighlights();
        }
      }
    });
  }
  window.addEventListener('storage', e=>{if(e.key==='next-frontier-save'){ continueButton.disabled=true; game.inert=true; if(confirm(Copy("changedTab"))) location.reload(); }});
  missionTutorial = MissionTutorial.create({
    demonstrate: enabled => {
      game.classList.toggle('tutorial-card-step', enabled);
      if (!enabled) game.querySelector('.card-area').style.removeProperty('--tutorial-card-offset');
      cardUI.demonstrate(enabled);
    },
    onFinish: () => document.querySelector('#card .answer')?.focus({preventScroll:true})
  });
  function startTutorial() {
    const steps = ResourceDisplay.indicators().map(ind => ({
      target: row.querySelector(`[data-id="${ind.id}"]`),
      title: ind.name,
      content: () => {
        renderDetail(Indicators.read(state, ResourceDisplay.indicators()).find(item => item.id === ind.id));
        const content = document.createElement('div'); content.className = 'tutorial-resource-detail';
        detail.querySelectorAll('.resource-description, .resource-change').forEach(item => content.append(item.cloneNode(true)));
        renderDetail(null);
        return content;
      }
    }));
    steps.push({
      target: document.getElementById('card'), title: Copy('tutorialCardTitle'), demo: true,
      content: () => { const p = document.createElement('p'); p.textContent = Copy('tutorialCardBody'); return p; }
    });
    missionTutorial.start(steps);
  }
  buildTiles();
  try {
    const pendingDifficulty=sessionStorage.getItem('next-frontier-start');
    if (pendingDifficulty) {
      sessionStorage.removeItem('next-frontier-start');
      const pending = pendingDifficulty.startsWith('{') ? JSON.parse(pendingDifficulty) : {difficulty:pendingDifficulty, dailyCostResource:null};
      startMission(pending.difficulty==='easy'?'easy':'hard');
    }
  } catch (_) { /* The game remains playable when browser storage is disabled. */ }
})();
