/* Card on screen: front (question), back (result), flip animation and drag to answer.
   Knows nothing about the game rules: ui.js tells it what to show and gets the answers back. */
(function (root) {
  'use strict';

  const DRAG_START_PX = 8;       // smaller moves count as a tap, not a drag
  const ANSWER_SHARE = 0.28;     // drag past 28% of the card width to answer
  const CLOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  const fmt = n => n.toLocaleString('en-US', {maximumFractionDigits: Math.abs(n) < 100 ? 1 : 0});

  // Which indicator colour each quantity uses (one indicator per quantity).
  const COLOR_OF = {};
  Indicators.INDICATORS.forEach(ind => ind.parts.forEach(q => { COLOR_OF[q] = `var(--${ind.id})`; }));

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  function create(slot, handlers) {
    let phase = 'none';          // 'front' | 'back' | 'message' | 'none'
    let drag = null;

    // ── Build the card once; contents change per card ──
    const card3d = el('div', 'card3d');
    const inner = el('div', 'card-inner');
    const front = el('div', 'face front');
    const back = el('div', 'face back');
    inner.append(front, back);
    card3d.append(inner);

    // Front parts
    const top = el('div', 'card-top');
    const difficulty = el('span', 'difficulty');
    const time = el('span', 'card-time');           // how long this card takes
    const count = el('span', 'count');
    top.append(difficulty, time, count);
    const image = el('img', 'card-image');
    const text = el('p', 'card-text');
    const answers = el('div', 'answers');
    const leftBtn = el('button', 'answer left');
    const rightBtn = el('button', 'answer right');
    leftBtn.type = rightBtn.type = 'button';
    answers.append(leftBtn, rightBtn);
    front.append(top, image, text, answers);

    // Back parts
    const chosenLabel = el('p', 'chosen-label', 'You chose');
    const chosen = el('h2', 'chosen');
    const effects = el('ul', 'effects');
    const source = el('p', 'source');
    const mockNote = el('p', 'mock-note', 'Test card: these numbers are not real.');
    const nextBtn = el('button', 'next');
    nextBtn.type = 'button';
    back.append(chosenLabel, chosen, effects, source, mockNote, nextBtn);

    // ── Answering ──
    function answer(side) {
      if (phase !== 'front') return;
      phase = 'answering';
      card3d.style.transform = '';                 // glide back to the centre, then flip
      highlight(null);
      handlers.onAnswer(side);
    }

    function highlight(side) {
      leftBtn.classList.toggle('lean', side === 'left');
      rightBtn.classList.toggle('lean', side === 'right');
    }

    leftBtn.addEventListener('click', () => answer('left'));
    rightBtn.addEventListener('click', () => answer('right'));
    nextBtn.addEventListener('click', () => { if (phase === 'back') handlers.onNext(); });

    // Keyboard: arrows answer like the buttons.
    document.addEventListener('keydown', e => {
      if (phase !== 'front' || document.querySelector('dialog[open]')) return;
      if (e.key === 'ArrowLeft') answer('left');
      if (e.key === 'ArrowRight') answer('right');
    });

    // ── Drag to answer (mouse, finger or pen) ──
    card3d.addEventListener('pointerdown', e => {
      if (phase !== 'front' || e.button > 0) return;
      drag = {id: e.pointerId, x: e.clientX, dx: 0, moving: false};
    });
    card3d.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      drag.dx = e.clientX - drag.x;
      if (!drag.moving && Math.abs(drag.dx) > DRAG_START_PX) {
        drag.moving = true;
        try { card3d.setPointerCapture(e.pointerId); } catch (_) { /* pointer already gone */ } // follow outside the card
        card3d.classList.add('dragging');
      }
      if (!drag.moving) return;
      card3d.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 18}deg)`;
      const past = Math.abs(drag.dx) > card3d.offsetWidth * ANSWER_SHARE;
      highlight(past ? (drag.dx < 0 ? 'left' : 'right') : null);
    });
    const endDrag = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const {dx, moving} = drag;
      drag = null;
      card3d.classList.remove('dragging');
      if (!moving) return;                          // it was a tap: the button click handles it
      if (Math.abs(dx) > card3d.offsetWidth * ANSWER_SHARE) answer(dx < 0 ? 'left' : 'right');
      else { card3d.style.transform = ''; highlight(null); }
    };
    card3d.addEventListener('pointerup', endDrag);
    card3d.addEventListener('pointercancel', endDrag);

    // Only the visible face can be reached with Tab or a screen reader.
    function setFace(isBack) {
      front.inert = isBack;
      back.inert = !isBack;
    }

    // ── What ui.js calls ──
    function showFront(card, number, total) {
      slot.classList.remove('ended');
      slot.classList.add('has-card');
      if (!card3d.isConnected) slot.replaceChildren(card3d);
      const hadFocus = slot.contains(document.activeElement);

      // Back to the front instantly (no reverse spin), then "deal" the new card in.
      inner.classList.add('no-anim');
      inner.classList.remove('flipped');
      void inner.offsetWidth;
      inner.classList.remove('no-anim');
      card3d.classList.remove('deal');
      void card3d.offsetWidth;
      card3d.classList.add('deal');

      difficulty.textContent = Deck.DIFFICULTIES[card.difficulty];
      difficulty.dataset.level = card.difficulty;
      time.innerHTML = `${CLOCK}<span>${Deck.TIMES[card.time].label}</span>`;
      time.title = 'Time this card takes';
      count.textContent = `${number} / ${total}`;
      image.src = card.image;
      image.alt = card.imageAlt || '';
      text.textContent = card.description;
      leftBtn.textContent = `← ${card.left.label}`;
      rightBtn.textContent = `${card.right.label} →`;
      highlight(null);
      setFace(false);
      phase = 'front';
      if (hadFocus) leftBtn.focus();
    }

    // One line of the back: coloured dot + name (+ small hint) on the left, amount on the right.
    function effectRow(key, amount, unitSuffix, hint, cls) {
      const q = Indicators.QUANTITIES[key];
      const li = el('li', `${cls || ''} ${amount < 0 ? 'down' : 'up'}`.trim());
      li.style.setProperty('--c', COLOR_OF[key]);
      const name = el('span', 'name', q.name);
      if (hint) name.append(el('small', null, hint));
      li.append(name, el('b', 'amount', `${amount < 0 ? '−' : '+'}${fmt(Math.abs(amount))} ${q.unit}${unitSuffix}`));
      return li;
    }

    const solsText = n => `${n} ${n === 1 ? 'sol' : 'sols'}`;
    function ongoingHint(o) {
      const when = o.after ? `in ${solsText(o.after)}, ` : '';
      const howLong = o.for == null ? 'from now on' : `for ${solsText(o.for)}`;
      return `${when}${howLong}${o.note ? ` · ${o.note}` : ''}`;
    }

    function showBack(card, side, isLast, happened) {
      const picked = card[side];
      chosen.textContent = picked.label;
      effects.replaceChildren();
      // Time comes first: every answer uses some of the sol.
      const timeRow = el('li', 'time');
      timeRow.append(el('span', 'name', 'Time'), el('b', 'amount', Deck.TIMES[card.time].label));
      effects.append(timeRow);
      // Now: immediate changes.
      const now = Object.entries(picked.effects || {});
      now.forEach(([key, amount]) => effects.append(effectRow(key, amount, '')));   // no hint: it is right now
      // Every sol: changes to what the base uses or makes.
      (picked.ongoing || []).forEach(o => Object.entries(o.rates).forEach(([key, rate]) =>
        effects.append(effectRow(key, rate, '/sol', ongoingHint(o), 'ongoing'))));
      // Later: one-off changes some sols from now.
      (picked.later || []).forEach(l => Object.entries(l.effects).forEach(([key, amount]) =>
        effects.append(effectRow(key, amount, '', `in ${solsText(l.after)}${l.note ? ` · ${l.note}` : ''}`, 'later'))));
      if (!now.length && !(picked.ongoing || []).length && !(picked.later || []).length) {
        effects.append(el('li', 'none', 'No change to the base.'));
      }
      // Things planned earlier that happened while this card's time passed.
      (happened || []).forEach(h => Object.entries(h.effects).forEach(([key, amount]) =>
        effects.append(effectRow(key, amount, '', `just happened${h.note ? ` · ${h.note}` : ''}`, 'happened'))));

      // Institution only; it links to the full reference.
      source.replaceChildren('Source: ');
      const link = el('a', null, card.source.institution);
      link.href = card.source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      source.append(link);

      mockNote.hidden = !card.mock;
      nextBtn.textContent = isLast ? 'Finish' : 'Next card';
      setFace(true);
      inner.classList.add('flipped');
      phase = 'back';
      nextBtn.focus({preventScroll: true});
    }

    function showMessage(title, body, buttonLabel, onClick) {
      phase = 'message';
      slot.classList.remove('has-card');
      slot.classList.add('ended');
      const h = el('h2', null, title), p = el('p', null, body), b = el('button', 'new-mission', buttonLabel);
      b.type = 'button';
      b.addEventListener('click', onClick);
      slot.replaceChildren(h, p, b);
      b.focus();
    }

    return {showFront, showBack, showMessage};
  }

  root.CardUI = {create};
})(this);
