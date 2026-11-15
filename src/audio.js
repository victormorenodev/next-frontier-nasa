/* Game audio: short sound effects for actions, plus two looping backgrounds
   (music and a quiet spacecraft hum layered under it).

   Browsers only allow sound after the player interacts, so the loops start on the first
   pointer press or key press anywhere, with a short fade-in. The player can turn all sound
   off; that choice is remembered in this browser (separate from the mission save). */
(function (root) {
  'use strict';

  const DIR = 'sfx/';                       // relative to index.html
  const PREF_KEY = 'next-frontier-sound';   // 'off' = muted; anything else = on

  // Short effects. Volumes are relative (0–1), balanced by ear against the music.
  const EFFECTS = {
    button: {file: 'button_clicking.mp3', volume: 0.55},   // indicator taps, card buttons
    swipe:  {file: 'card_swipe_v2.mp3',  volume: 0.7},     // answering by dragging the card
    sol:    {file: 'day_change_v2.mp3',  volume: 0.7}      // the sol number goes up
  };
  // Backgrounds that loop. The spacecraft hum stays well under the music.
  const LOOPS = {
    music: {file: 'main_track.mp3',    volume: 0.4},
    ship:  {file: 'spacecraft_bg.mp3', volume: 0.12}
  };
  const FADE_MS = 1500;

  const readPref = () => { try { return localStorage.getItem(PREF_KEY) !== 'off'; } catch (_) { return true; } };
  const writePref = on => { try { localStorage.setItem(PREF_KEY, on ? 'on' : 'off'); } catch (_) { /* not saved */ } };

  let enabled = readPref();
  let unlocked = false;          // true after the first interaction (browser allows sound)
  const starting = new Set();
  const playingEffects = new Set();
  const listeners = new Set();   // UI parts that show the on/off state

  const make = ({file}, loop) => {
    const audio = new Audio(DIR + file);
    audio.preload = 'auto';
    audio.loop = loop;
    return audio;
  };
  const effects = Object.fromEntries(Object.entries(EFFECTS).map(([k, v]) => [k, make(v, false)]));
  const loops = Object.fromEntries(Object.entries(LOOPS).map(([k, v]) => [k, make(v, true)]));

  // Gently raise a loop to its target volume.
  function fadeIn(audio, target) {
    clearInterval(audio.fadeTimer);
    audio.volume = 0;
    const step = target / (FADE_MS / 50);
    audio.fadeTimer = setInterval(() => {
      audio.volume = Math.min(target, audio.volume + step);
      if (audio.volume >= target) clearInterval(audio.fadeTimer);
    }, 50);
  }

  function startLoops() {
    if (!enabled || !unlocked || document.hidden) return;
    Object.entries(loops).forEach(([k, audio]) => {
      if (!audio.paused || starting.has(audio)) return;
      starting.add(audio);
      audio.volume = 0;                 // start silent; fadeIn raises it (no loud first instant)
      audio.play()
        .then(() => {
          if (!enabled || document.hidden) { audio.pause(); return; }
          fadeIn(audio, LOOPS[k].volume);
        })
        .catch(() => { /* Retry on the next real interaction, including after interruptions. */ })
        .finally(() => starting.delete(audio));
    });
  }

  function stopLoops() {
    Object.values(loops).forEach(audio => { clearInterval(audio.fadeTimer); audio.pause(); });
  }

  // Plays a short effect. A copy is used so quick repeats can overlap instead of cutting off.
  function play(name) {
    if (!enabled || !effects[name]) return;
    const sound = effects[name].cloneNode();
    sound.volume = EFFECTS[name].volume;
    playingEffects.add(sound);
    const release = () => playingEffects.delete(sound);
    sound.addEventListener('ended', release, {once:true});
    sound.addEventListener('error', release, {once:true});
    sound.play().catch(release);
  }

  function setEnabled(on) {
    enabled = on;
    writePref(on);
    if (on) startLoops(); else {
      stopLoops();
      playingEffects.forEach(sound => sound.pause());
      playingEffects.clear();
    }
    listeners.forEach(fn => fn(on));
  }

  // Lets a button show and change the sound state.
  function bindToggle(button, render) {
    const update = on => render(button, on);
    listeners.add(update);
    update(enabled);
    button.addEventListener('click', () => setEnabled(!enabled));
  }

  // Keep real interaction listeners: browsers can interrupt or block a loop again after
  // the first successful play. Each loop retries independently, without restarting playing audio.
  const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
  const unlock = () => { unlocked = true; startLoops(); };
  UNLOCK_EVENTS.forEach(type => document.addEventListener(type, unlock, true));

  // No background sound while the game is in another tab or the phone screen is off.
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopLoops(); else startLoops(); });
  window.addEventListener('pagehide', stopLoops);
  window.addEventListener('pageshow', startLoops);

  root.GameAudio = {play, setEnabled, bindToggle, isEnabled: () => enabled, EFFECTS, LOOPS,
    // Current loop volumes (for checks in the browser console).
    loopVolumes: () => Object.fromEntries(Object.entries(loops).map(([k, a]) => [k, a.paused ? 0 : +a.volume.toFixed(2)]))};
})(globalThis);
