/* Modal tour of the real UI. Gestures advance the guide, never the simulation. */
(function (root) {
  'use strict';

  function create({demonstrate, onFinish}) {
    const dialog = document.getElementById('easy-tutorial');
    const spotlight = dialog.querySelector('.tutorial-spotlight');
    const panel = dialog.querySelector('.tutorial-panel');
    const title = document.getElementById('tutorial-title');
    const body = document.getElementById('tutorial-body');
    const next = document.getElementById('tutorial-next');
    let steps = [], index = 0, gesture = null, frame;

    function position() {
      if (!dialog.open) return;
      const rect = steps[index].target.getBoundingClientRect();
      const margin = 16, padding = steps[index].demo ? 20 : 7;
      const gap = padding + 10;
      const width = document.documentElement.clientWidth, height = window.innerHeight;
      const left = Math.max(4, rect.left - padding), top = Math.max(4, rect.top - padding);
      spotlight.style.cssText = `left:${left}px;top:${top}px;width:${Math.min(width - left - 4, rect.width + 2 * padding)}px;height:${Math.min(height - top - 4, rect.height + 2 * padding)}px;`;
      const pw = panel.offsetWidth, ph = panel.offsetHeight;
      const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
      const cx = clamp(rect.left + rect.width / 2 - pw / 2, margin, width - pw - margin);
      const cy = clamp(rect.top + rect.height / 2 - ph / 2, margin, height - ph - margin);
      const below = {left:cx, top:rect.bottom + gap};
      const above = {left:cx, top:rect.top - ph - gap};
      const beside = [{left:rect.left - pw - gap, top:cy}, {left:rect.right + gap, top:cy}];
      const candidates = steps[index].demo ? [above, ...beside, below] : [below, above, ...beside];
      const fits = p => p.left >= margin && p.top >= margin && p.left + pw <= width - margin && p.top + ph <= height - margin;
      const place = candidates.find(fits) || {left:cx, top:margin};
      panel.style.left = `${place.left}px`;
      panel.style.top = `${place.top}px`;
    }

    function schedulePosition() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(position);
    }

    function show() {
      const step = steps[index];
      title.textContent = step.title;
      body.replaceChildren(step.content());
      next.textContent = Copy(index === steps.length - 1 ? 'tutorialPlay' : 'tutorialNext');
      demonstrate(Boolean(step.demo));
      position();
      schedulePosition();
    }

    function stop() {
      if (!dialog.open) return;
      dialog.close();
    }

    function advance({finish = false} = {}) {
      if (!dialog.open) return;
      gesture = null;
      if (index === steps.length - 1) { if (finish) stop(); }
      else { index++; show(); }
    }

    next.addEventListener('click', () => advance({finish:true}));
    document.getElementById('tutorial-skip').addEventListener('click', stop);
    dialog.addEventListener('cancel', event => { event.preventDefault(); stop(); });
    dialog.addEventListener('close', () => {
      gesture = null;
      cancelAnimationFrame(frame);
      demonstrate(false);
      onFinish();
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); event.stopPropagation(); advance();
      }
    });
    dialog.addEventListener('pointerdown', event => {
      if (event.button > 0 || event.target.closest('button, a')) return;
      gesture = {id:event.pointerId, x:event.clientX, y:event.clientY};
      try { dialog.setPointerCapture(event.pointerId); } catch (_) { /* Pointer already released. */ }
    });
    dialog.addEventListener('pointerup', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      gesture = null;
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        event.preventDefault(); event.stopPropagation(); advance();
      }
    });
    dialog.addEventListener('pointercancel', () => { gesture = null; });
    window.addEventListener('resize', schedulePosition);
    window.visualViewport?.addEventListener('resize', schedulePosition);

    return {
      get active() { return dialog.open; },
      start(items) {
        steps = items; index = 0;
        dialog.showModal(); show(); next.focus({preventScroll:true});
      },
      stop
    };
  }

  root.EasyTutorial = {create};
})(globalThis);
