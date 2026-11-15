// Cover startup and screen changes until the destination has rendered.
const overlay = document.getElementById('loading-screen');
const frame = () => new Promise(resolve => {
  const timer = setTimeout(resolve, 100);
  requestAnimationFrame(() => { clearTimeout(timer); resolve(); });
});
async function bounded(promise) {
  let timer;
  try { await Promise.race([promise, new Promise(resolve => { timer = setTimeout(resolve, 4000); })]); }
  finally { clearTimeout(timer); }
}
let busy = false;
function show() {
  overlay.hidden = false;
  document.body.setAttribute('aria-busy', 'true');
  for (const id of ['main-menu', 'mission-intro', 'difficulty-screen', 'game']) document.getElementById(id).inert = true;
}
function hide() {
  overlay.hidden = true;
  document.body.removeAttribute('aria-busy');
  for (const id of ['main-menu', 'mission-intro', 'difficulty-screen', 'game']) document.getElementById(id).inert = false;
}
async function ready() {
  await bounded(Promise.all([...document.images].filter(img => img.getClientRects().length > 0 && !img.closest('[hidden]')).map(img => {
    if (img.loadingReady) return img.loadingReady;
    if (img.complete) return img.decode?.().catch(() => {});
    return new Promise(resolve => { img.addEventListener('load', resolve, {once:true}); img.addEventListener('error', resolve, {once:true}); });
  })));
  await frame();
}
async function run(action) {
  if (busy) return;
  busy = true;
  const focus = document.activeElement;
  show();
  try {
    await frame(); await frame();
    if (await action() === false) return; // A full reload keeps the cover visible.
    await ready();
    hide();
    const target = document.querySelector('#mission-tutorial[open] button, #difficulty-screen:not([hidden]) button, #mission-intro:not([hidden]) button, #game:not([hidden]) .answer, #main-menu:not([hidden]) button');
    (target || focus)?.focus({preventScroll:true});
  } catch (error) { hide(); throw error; }
  finally { busy = false; }
}
globalThis.Loading = {show, hide, ready, run};

show();
