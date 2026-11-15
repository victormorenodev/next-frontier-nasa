/* Card on screen: front (question), back (result), flip animation and drag to answer.
   Knows nothing about the game rules: ui.js tells it what to show and gets the answers back. */
(function (root) {
  'use strict';

  const DRAG_START_PX = 8;       // smaller moves count as a tap, not a drag
  const ANSWER_SHARE = 0.28;     // drag past 28% of the card width to answer
  // While the card is held, each new movement plays the swipe sound again: turning back by
  // STROKE_PX, or moving STROKE_PX after resting for PAUSE_MS. Small finger wobble stays quiet.
  const STROKE_PX = 24;
  const PAUSE_MS = 250;

  // Updates the drag's movement tracking for a new pointer position; true = a new stroke began.
  function newStroke(drag, x, time) {
    if (x === drag.lastX) return false;
    let stroke = false;
    if (time - drag.movedAt > PAUSE_MS) drag.restX = drag.lastX;           // moving again after a rest
    if (drag.restX !== null && Math.abs(x - drag.restX) > STROKE_PX) {
      stroke = true; drag.restX = null; drag.dir = Math.sign(x - drag.lastX); drag.far = x;
    } else if ((x - drag.far) * drag.dir >= 0) drag.far = x;                // still going the same way
    else if ((drag.far - x) * drag.dir > STROKE_PX) {                       // turned around
      stroke = drag.restX === null; drag.dir = -drag.dir; drag.far = x;
    }
    drag.lastX = x; drag.movedAt = time;
    return stroke;
  }
  const fmt = n => n.toLocaleString('en-US', {maximumFractionDigits: Math.abs(n) < 1 ? 2 : Math.abs(n) < 100 ? 1 : 0});

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
    let cancelImage = () => {};
    let phase = 'none';          // 'front' | 'back' | 'message' | 'none'
    let drag = null;
    let demoFrame = 0, demonstrating = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // ── Build the card once; contents change per card ──
    const card3d = el('div', 'card3d');
    const inner = el('div', 'card-inner');
    const front = el('div', 'face front');
    const back = el('div', 'face back');
    inner.append(front, back);
    card3d.append(inner);

    // Front parts

    const figure = el('figure', 'card-figure');
    const image = el('img', 'card-image');
    const caption = el('figcaption', 'card-caption');
    const imagePanel = el('div', 'card-image-panel');
    const imageLoading = el('div', 'card-image-loading');
    imageLoading.setAttribute('role', 'status');
    const spinner = el('span', 'loading-orbit');
    spinner.setAttribute('aria-hidden', 'true');
    imageLoading.append(spinner, el('span', null, Copy('cardImageLoading')));
    imagePanel.append(image, imageLoading);
    figure.append(imagePanel, caption);
    const text = el('p', 'card-text');
    const answers = el('div', 'answers');
    const leftBtn = el('button', 'answer left');
    const rightBtn = el('button', 'answer right');
    leftBtn.type = rightBtn.type = 'button';
    answers.append(leftBtn, rightBtn);
    front.append(figure, text, answers);

    // Back parts
    const chosenLabel = el('p', 'chosen-label', Copy("youChose"));
    const chosen = el('h2', 'chosen');
    const choiceDescription = el('p', 'choice-description');
    choiceDescription.hidden = true;
    const effects = el('ul', 'effects');
    const source = el('p', 'source');
    const mockNote = el('p', 'mock-note', Copy("mockNote"));
    const nextBtn = el('button', 'next');
    nextBtn.type = 'button';
    back.append(chosenLabel, chosen, choiceDescription, effects, source, mockNote, nextBtn);

    // ── Answering ──
    // Button choices play here; a swipe already played when the card began to tilt.
    function answer(side, how = 'button') {
      if (phase !== 'front' || handlers.canAnswer?.() === false) return;
      if (how === 'button') globalThis.GameAudio?.play('button');
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
    nextBtn.addEventListener('click', () => {
      if (phase !== 'back') return;
      globalThis.GameAudio?.play('button');
      handlers.onNext();
    });

    // Keyboard: arrows answer like the buttons.
    document.addEventListener('keydown', e => {
      if (phase !== 'front' || document.querySelector('dialog[open]')) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        answer(e.key === 'ArrowLeft' ? 'left' : 'right');
      }
    });

    // ── Drag to answer (mouse, finger or pen) ──
    card3d.addEventListener('pointerdown', e => {
      if (e.target.closest('.glossary-term, a') || phase !== 'front' || handlers.canAnswer?.() === false || e.button > 0) return;
      drag = {id: e.pointerId, x: e.clientX, dx: 0, moving: false};
    });
    card3d.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      drag.dx = e.clientX - drag.x;
      if (!drag.moving && Math.abs(drag.dx) > DRAG_START_PX) {
        drag.moving = true;
        Object.assign(drag, {dir: Math.sign(drag.dx), far: e.clientX, lastX: e.clientX, movedAt: e.timeStamp, restX: null});
        globalThis.GameAudio?.play('swipe');
        try { card3d.setPointerCapture(e.pointerId); } catch (_) { /* pointer already gone */ } // follow outside the card
        card3d.classList.add('dragging');
      } else if (drag.moving && newStroke(drag, e.clientX, e.timeStamp)) globalThis.GameAudio?.play('swipe');
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
      if (Math.abs(dx) > card3d.offsetWidth * ANSWER_SHARE) answer(dx < 0 ? 'left' : 'right', 'swipe');
      else { card3d.style.transform = ''; highlight(null); }
    };
    card3d.addEventListener('pointerup', endDrag);
    card3d.addEventListener('pointercancel', () => {
      drag = null;
      card3d.classList.remove('dragging');
      card3d.style.transform = '';
      highlight(null);
    });

    // Only the visible face can be reached with Tab or a screen reader.
    function setFace(isBack) {
      front.inert = isBack;
      back.inert = !isBack;
    }

    // ── What ui.js calls ──
    function showFront(card, number, total) {
      Glossary.close();
      drag = null;
      card3d.style.transform = '';
      card3d.classList.remove('dragging');
      slot.classList.remove('ended', 'quiet-sol', 'illustrated-ending');
      image.hidden = false;
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

      cancelImage();
      const currentCard=CurrentGameData.cards.find(c=>c.id===card.id&&c.image===card.image);
      const renderCaption = (available, loading = false) => {
        imageLoading.hidden = !loading;
        imagePanel.setAttribute('aria-busy', String(loading));
        caption.textContent=available ? (currentCard?.imageCaption ?? card.imageCaption ?? '').trim() : Copy(loading ? 'cardImageLoading' : 'cardImageMissing');
        caption.append(` ${Copy('imageSourceLabel')}`);
        const imageSource=currentCard?.imageSource ?? card.imageSource ?? (card.source?.kind==='image' ? card.source.url : '');
        if(imageSource){
          const link=el('a',null,new URL(imageSource).hostname.replace(/^www\./,''));
          link.href=imageSource;link.target='_blank';link.rel='noopener noreferrer';caption.append(link);
        }
        caption.hidden=false;Glossary.decorate(caption);
      };
      cancelImage=CardImages.show(image,{...card,imageAlt:currentCard?.imageAlt ?? card.imageAlt},renderCaption);
      text.textContent = card.description;
      leftBtn.textContent = `← ${card.left.label}`;
      rightBtn.textContent = `${card.right.label} →`;
      [caption,text].forEach(node => Glossary.decorate(node));
      highlight(null);
      setFace(false);
      phase = 'front';
      if (hadFocus) leftBtn.focus();
    }

    // One line of the back: coloured dot + name (+ small hint) on the left, amount on the right.
    function effectRow(key, amount, unitSuffix, hint, cls, before) {
      const q = Indicators.QUANTITIES[key];
      const li = el('li', `${cls || ''} ${amount < 0 ? 'down' : 'up'}`.trim());
      li.style.setProperty('--c', COLOR_OF[key]);
      const indicator=ResourceDisplay.indicators().find(ind=>ind.parts.includes(key));
      const isLife = indicator?.id === 'life-support';
      const name = el('span', 'name');
      const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
      icon.classList.add('effect-resource-icon');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');
      icon.innerHTML=ResourceIcons[indicator?.icon || key] || '';
      if (isLife) li.style.setProperty('--c', 'var(--life-support)');
      name.append(icon,el('span','effect-resource-name',isLife ? indicator.name : q.name));
      if (isLife) hint = [Copy(key === 'water' ? 'lifeWaterEffect' : 'lifeOxygenEffect'), hint].filter(Boolean).join(' · ');
      if (hint) name.append(el('small', null, hint));
      const display=ResourceDisplay.effect(key,amount,before);
      li.append(name, el('b', 'amount', `${display.value === 0 ? '' : display.value < 0 ? '−' : '+'}${fmt(Math.abs(display.value))}${display.unit === '%' ? '%' : display.unit ? ' ' + display.unit : ''}${unitSuffix}`));
      return li;
    }

    const solsText = n => `${n} ${n === 1 ? 'sol' : 'sols'}`;
    function ongoingHint(o) {
      const when = o.after ? `in ${solsText(o.after)}, ` : '';
      const howLong = o.for == null ? 'from now on' : `for ${solsText(o.for)}`;
      return `${when}${howLong}${o.note ? ` · ${o.note}` : ''}`;
    }

    function showBack(card, side, isLast, happened, beforeState) {
      Glossary.close();
      cancelImage();
      const picked = card[side];
      chosen.textContent = picked.label;
      const explanation = typeof picked.description === 'string' ? picked.description.trim() : '';
      choiceDescription.textContent = explanation;
      choiceDescription.hidden = !explanation;
      effects.replaceChildren();
      // Now: immediate changes.
      const now = Object.entries(picked.effects || {});
      now.forEach(([key, amount]) => effects.append(effectRow(key, amount, '', undefined, undefined, beforeState?.[key])));   // no hint: it is right now
      // Every sol: changes to what the base uses or makes.
      (picked.ongoing || []).forEach(o => Object.entries(o.rates).forEach(([key, rate]) =>
        effects.append(effectRow(key, rate, '/sol', ongoingHint(o), 'ongoing'))));
      // Later: one-off changes some sols from now.
      (picked.later || []).forEach(l => Object.entries(l.effects).forEach(([key, amount]) =>
        effects.append(effectRow(key, amount, '', `in ${solsText(l.after)}${l.note ? ` · ${l.note}` : ''}`, 'later'))));
      if (!now.length && !(picked.ongoing || []).length && !(picked.later || []).length) {
        effects.append(el('li', 'none', Copy("noChange")));
      }
      // Things planned earlier that happened while this card's time passed.
      (happened || []).forEach(h => Object.entries(h.effects).forEach(([key, amount]) =>
        effects.append(effectRow(key, amount, '', `just happened${h.note ? ` · ${h.note}` : ''}`, 'happened'))));

      // References belong on the back; image attribution belongs in the caption.
      source.replaceChildren();
      source.hidden=!card.source || card.source.kind==='image';
      if(!source.hidden){
        source.append(Copy('source'));
        (card.source.references || [card.source]).forEach((reference,index)=>{
          if(index)source.append(' · ');
          const link=el('a',null,reference.institution);
          link.href=reference.url;link.target='_blank';link.rel='noopener noreferrer';source.append(link);
        });
      }

      mockNote.hidden = !card.mock;
      nextBtn.textContent = isLast ? Copy("endSol") : Copy("nextEvent");
      [chosen,choiceDescription,effects].forEach(node => Glossary.decorate(node));
      setFace(true);
      inner.classList.add('flipped');
      phase = 'back';
      nextBtn.focus({preventScroll: true});
    }

    function showMessage(title, body, buttonLabel, onClick, ending = 'quit', imagePath = null) {
      Glossary.close();
      cancelImage();
      phase = 'message';
      slot.classList.remove('has-card');
      slot.classList.add('ended');
      const h = el('h2', null, title), p = el('p', null, body), b = el('button', 'new-mission', buttonLabel);
      b.type = 'button';
      b.addEventListener('click', onClick);
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.classList.add('ending-icon'); icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = EndingIcons[ending] || EndingIcons.quit;
      slot.dataset.ending = ending;
      slot.classList.toggle('illustrated-ending', Boolean(imagePath));
      if (imagePath) {
        const art = el('img', 'ending-art'); art.alt = '';
        art.addEventListener('error', () => {
          slot.classList.remove('illustrated-ending');
          h.classList.remove('ending-accessible-copy'); p.classList.remove('ending-accessible-copy');
          art.replaceWith(icon);
        }, {once:true});
        h.classList.add('ending-accessible-copy'); p.classList.add('ending-accessible-copy');
        art.src = imagePath;
        slot.replaceChildren(art, h, p, b);
      } else slot.replaceChildren(icon, h, p, b);
      b.focus();
    }

    function updateDemoHighlight() {
      cancelAnimationFrame(demoFrame);
      highlight(null);
      if (!demonstrating || reducedMotion.matches) return;
      const tick = () => {
        if (!demonstrating || reducedMotion.matches) return;
        // Follow the actual CSS animation clock, including repeated cycles.
        const animation = card3d.getAnimations().find(item => item.animationName === 'tutorial-card-swipe');
        const progress = animation?.effect?.getComputedTiming().progress;
        highlight(progress >= .08 && progress <= .40 ? 'left' : progress >= .58 && progress <= .94 ? 'right' : null);
        demoFrame = requestAnimationFrame(tick);
      };
      tick();
    }
    reducedMotion.addEventListener('change', updateDemoHighlight);
    function demonstrate(enabled) {
      demonstrating = enabled;
      card3d.classList.remove('deal');
      card3d.classList.toggle('tutorial-demo', enabled);
      if (!enabled) card3d.style.transform = '';
      updateDemoHighlight();
    }
    return {showFront, showBack, showMessage, demonstrate};
  }

  root.CardUI = {create};
})(globalThis);
