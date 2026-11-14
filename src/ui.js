/* Interface: mission bar (sol + End mission), the indicators and the game flow.
   The card itself is drawn by card-ui.js.
   Press and hold an indicator (mouse, finger or pen) to see its detail; let go to close it.
   Keyboard focus shows it too. */
(function () {
  'use strict';

  // Simple line icons, one per indicator.
  const ICONS = {
    oxygen: '<path d="M12 3v8"/><path d="M12 11c-1.5 0-3-1-4-3-2 1-4 4-4 8 0 3 1 5 3 5s3-2 3-4v-6"/><path d="M12 11c1.5 0 3-1 4-3 2 1 4 4 4 8 0 3-1 5-3 5s-3-2-3-4v-6"/>',
    water: '<path d="M12 3c3.5 4.5 6 8 6 11a6 6 0 0 1-12 0c0-3 2.5-6.5 6-11z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    energy: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    food: '<path d="M12 7c-2-2-7-1.5-7 4 0 5 3 9 5 9 1 0 1.5-.5 2-.5s1 .5 2 .5c2 0 5-4 5-9 0-5.5-5-6-7-4z"/><path d="M12 7c0-2 1-4 3-4"/>'
  };

  // Whole numbers for big stocks, decimals for small ones (8.5 g/cm², 0.45 kg/sol).
  const fmt = n => n.toLocaleString('en-US', {maximumFractionDigits: Math.abs(n) < 1 ? 2 : Math.abs(n) < 100 ? 1 : 0});
  // Trend of a quantity per sol: arrow + amount. Tiny changes count as steady.
  const STEADY = 0.005;
  const trendOf = n => (n > STEADY ? 'up' : n < -STEADY ? 'down' : 'flat');
  const ARROWS = {up: '▲', down: '▼', flat: '■'};
  const TREND_WORDS = Object.fromEntries(['up','down','flat'].map(k=>[k,Copy(k)]));

  const row = document.getElementById('indicators');
  const detail = document.getElementById('detail');
  const activeList = document.getElementById('active-effects');
  const activeMore = document.getElementById('active-more');
  const MAX_EFFECTS = 3;      // the effects box shows at most this many
  let state;
  let mission;
  let flows;          // what the base uses and makes every sol, and answers still in effect
  let active = null;
  let pressing = null;   // pointer currently held on the indicator row

  function buildTiles() {
    Indicators.INDICATORS.forEach(ind => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'tile';
      tile.dataset.id = ind.id;
      document.documentElement.style.setProperty('--' + ind.id, ind.color);
      tile.style.setProperty('--c', ind.color);
      tile.setAttribute('aria-controls', 'detail');
      tile.innerHTML = `<span class="fill"></span><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[ind.icon]}</svg>` +
        '<span class="trend" aria-hidden="true"></span>';
      row.append(tile);
    });
  }

  function render() {
    const view = Indicators.read(state);
    const rates = Flows.ratesPerSol(flows, mission.elapsed);   // change per sol right now
    view.forEach(ind => {
      ind.parts.forEach(p => { p.rate = rates[p.id]; });
      const tile = row.querySelector(`[data-id="${ind.id}"]`);
      tile.style.setProperty('--level', ind.level);
      tile.classList.toggle('active', ind.id === active);
      // The arrow follows the indicator's lowest part (each indicator has one part now).
      const trend = trendOf(rates[ind.lowest]);
      tile.dataset.trend = trend;
      tile.querySelector('.trend').textContent = trend === 'flat' ? '' : ARROWS[trend];
      tile.setAttribute('aria-label', `${ind.name}: ${ind.parts.map(p =>
        `${p.name} ${fmt(p.value)} of ${fmt(p.max)} ${p.unitName}, ${TREND_WORDS[trendOf(p.rate)]}`).join('; ')}`);
    });
    renderDetail(view.find(ind => ind.id === active));
    renderActive();
  }

  // Effects box: up to 3 effects running now, newest first — name, a coloured dot + arrow
  // per resource, sols left. More than 3: "+N more" in the title line.
  let activeShown = null;   // what the box shows now; redraw (and fade lines in) only when it changes
  function renderActive() {
    const items = Flows.active(flows, mission.elapsed).reverse();   // newest first
    const key = JSON.stringify(items);
    if (key === activeShown) return;
    activeShown = key;
    activeList.replaceChildren();
    activeMore.textContent = items.length > MAX_EFFECTS ? `+${items.length - MAX_EFFECTS} more` : '';
    if (!items.length) {
      const none = document.createElement('li');
      none.className = 'none';
      none.textContent = Copy("noEffects");
      activeList.append(none);
      return;
    }
    items.slice(0, MAX_EFFECTS).forEach(a => {
      const li = document.createElement('li');
      const rates = Object.entries(a.rates);
      const left = a.thirdsLeft === Infinity ? Copy("always") : `${solsText(a.thirdsLeft)} left`;
      const name = a.note || rates.map(([q]) => Indicators.QUANTITIES[q].name).join(' + ');
      li.innerHTML = '<span class="ae-name"></span>' +
        '<span class="ae-marks">' + rates.map(([q, n]) => `<span class="ae-dot" style="--c: var(--${q})"></span>` +
          `<span class="ae-arrow" data-trend="${trendOf(n)}">${ARROWS[trendOf(n)]}</span>`).join('') + '</span>' +
        `<span class="ae-left">${left}</span>`;
      li.querySelector('.ae-name').textContent = name;
      const words = rates.map(([q, n]) => {
        const u = Indicators.QUANTITIES[q];
        return `${u.name} ${n < 0 ? 'minus' : 'plus'} ${fmt(Math.abs(n))} ${u.unit} per sol`;
      }).join(', ');
      li.setAttribute('aria-label', `${name}: ${words}, ${left}`);
      li.title = `${name}: ${rates.map(([q, n]) => `${Indicators.QUANTITIES[q].name} ${n < 0 ? '−' : '+'}${fmt(Math.abs(n))} ${Indicators.QUANTITIES[q].unit}/sol`).join(', ')} · ${left}`;
      activeList.append(li);
    });
  }

  // The detail covers the effects box while an indicator is held. When it closes, its content
  // is kept so it can fade out smoothly instead of vanishing.
  function renderDetail(ind) {
    detail.classList.toggle('empty', !ind);
    if (!ind) return;
    detail.replaceChildren();

    detail.style.setProperty('--c', `var(--${ind.id})`);
    const single = ind.parts.length === 1;
    const title = document.createElement('h2');
    title.textContent = ind.name;

    // Parts would sit side by side if an indicator had several, keeping every detail the same height.
    const parts = document.createElement('div');
    parts.className = 'parts';
    parts.style.setProperty('--n', ind.parts.length);
    ind.parts.forEach(p => {
      const part = document.createElement('div');
      // Unit in words always; the part's own name only if an indicator ever has several parts.
      // Right side of the label line: how much it changes per sol now.
      const t = trendOf(p.rate);
      const perSol = t === 'flat' ? 'steady' : `${ARROWS[t]} ${fmt(Math.abs(p.rate))}/sol`;
      const label = `<div class="label"><span class="label-name">${single ? '' : `<b>${p.name}</b> `}${p.unitName}</span>` +
        `<span class="per-sol" data-trend="${t}">${perSol}</span></div>`;
      part.innerHTML = label +
        `<div class="value"><span><span class="amount">${fmt(p.value)}</span><span class="unit">${p.unit}</span></span>` +
        `<span class="of">of ${fmt(p.max)}</span></div>` +
        `<div class="bar"><span style="--level:${p.level}"></span></div>`;
      parts.append(part);
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

  // Press and hold: the detail shows while the button/finger is down. Sliding to another
  // indicator while still pressing switches to it. Letting go (anywhere) closes it.
  row.addEventListener('pointerdown', e => {
    const tile = tileAt(e.clientX, e.clientY);
    if (!tile || e.button > 0) return;
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
    hide();
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
  row.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });

  // ── Mission flow: deck, answers, end ────────────────────
  const intro = document.getElementById('mission-intro');
  const briefing = document.getElementById('briefing');
  const game = document.getElementById('game');
  let introDrag = null;

  const endButton = document.getElementById('end-mission');
  const dialog = document.getElementById('end-dialog');
  const cardUI = CardUI.create(document.getElementById('card'), {onAnswer, onNext});
  let savedSide = null;
  let deck = [];
  let index = 0;
  let schedule = [];
  let eventIndex = 0;
  const background = document.getElementById('sol-transition');
  const solNotice = document.getElementById('sol-notice');

  function startMission() {
    if (window.savedMission) {
      localStorage.removeItem('next-frontier-save');
      sessionStorage.setItem('next-frontier-start', 'yes');
      location.reload();
      return;
    }
    intro.hidden = true;
    game.hidden = false;
    background.hidden = true;
    solNotice.textContent = Copy("missionProgress");
    adopt(Engine.start());
    render();
    renderMission();
    showSol();
  }

  function showSol() {
    const total = schedule[mission.sol - 1];
    savedSide = null;
    cardUI.showFront(deck[index], eventIndex + 1, total);
    save();
  }

  function onAnswer(side) {
    if (mission.ended) return;
    const card = deck[index], answer = card[side];
    const before = state;
    adopt(Engine.answer(snapshot(), side));
    bumpChanged(before, state);
    render();
    const last = eventIndex + 1 === schedule[mission.sol - 1];
    cardUI.showBack(card, side, last, []);
    savedSide = side; save();
  }

  function snapshot() { return {state,mission,flows,deck,index,schedule,eventIndex,savedSide}; }
  function adopt(value) { ({state,mission,flows,deck,index,schedule,eventIndex,savedSide}=value); }
  function onNext() {
    const before=state;
    const result=Engine.next(snapshot());
    if (result.snapshot.mission===mission && result.snapshot.index===index) return;
    adopt(result.snapshot);
    if (!result.newSol) { showSol(); return; }
    const passed=result;
    bumpChanged(before,state);
    render();
    // Only the sky changes: the game stays visible throughout the turnover.
    const arrivals = passed.happened.map(h => h.note || Copy("suppliesUpdated"));
    solNotice.textContent = arrivals.join(' · ') || Copy("missionProgress");
    renderMission();
    if (!mission.ended) showSol();
    else save();

    // Decorative only: the next sol is already playable while the light fades.
    background.hidden = true;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      void background.offsetWidth; // restart even when sols advance quickly
      background.hidden = false;
    }
  }

  background.addEventListener('animationend', () => { background.hidden = true; });

  // Briefly pulses the indicators an answer changed, so kids see where the effect went.
  function bumpChanged(before, after) {
    Indicators.INDICATORS.forEach(ind => {
      if (!ind.parts.some(q => before[q] !== after[q])) return;
      const tile = row.querySelector(`[data-id="${ind.id}"]`);
      tile.classList.remove('bump');
      void tile.offsetWidth;
      tile.classList.add('bump');
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
    cardUI.showMessage(
      done ? Copy("completeTitle") : Copy("endedTitle"),
      done ? Copy("completeBody", {totalSols: Mission.TOTAL_SOLS, events: index})
           : Copy("endedBody", {sol: mission.sol}),
      Copy("newMission"),
      () => { startMission(); endButton.focus(); });
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
    if ((stored || window.invalidSavedMission) && !confirm(Copy("replaceSave"))) return;
    startMission();
    document.querySelector('#card .answer')?.focus({preventScroll: true});
  }

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
    try { localStorage.setItem('next-frontier-save', JSON.stringify({version:1,data:GameData,state,mission,flows,deck,index,schedule,eventIndex,savedSide}, (k,v)=>v===Infinity?'__infinity':v)); }
    catch (_) { solNotice.textContent = Copy("storageUnavailable"); }
  }
  const stored = window.savedMission;
  if (stored) {
    const button = document.createElement('button'); button.className='start-mission'; button.textContent=Copy("continueMission");
    button.onclick=()=>{ ({state,mission,flows,deck,index,schedule,eventIndex,savedSide}=stored); intro.hidden=true;game.hidden=false;render();renderMission(); if(!mission.ended) {const side=savedSide;cardUI.showFront(deck[index],eventIndex+1,schedule[mission.sol-1]);if(side)cardUI.showBack(deck[index],side,eventIndex+1===schedule[mission.sol-1],[]);} };
    document.getElementById('start-mission').before(button);
  }
  window.addEventListener('storage', e=>{if(e.key==='next-frontier-save'){ game.inert=true; if(confirm(Copy("changedTab"))) location.reload(); }});
  buildTiles();
  try {
    if (sessionStorage.getItem('next-frontier-start') === 'yes') {
      sessionStorage.removeItem('next-frontier-start');
      startMission();
    }
  } catch (_) { /* The game remains playable when browser storage is disabled. */ }
})();
