/* Game audio: short sound effects for actions, plus two looping backgrounds
   (music and a quiet spacecraft hum layered under it).

   Everything plays through the Web Audio API from sounds decoded once at load:
   - effects start at once (no new <audio> element to load per tap) and skip the silence
     at the start of their file, so a click is heard when the finger lands;
   - loops repeat the decoded sound sample by sample, with no gap between end and start.

   Browsers only allow sound after the player interacts, so the audio context is resumed on
   the first pointer press or key press anywhere, and the loops start with a short fade-in.
   The player can turn all sound off; that choice is remembered in this browser
   (separate from the mission save). */
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
  const FADE_S = 1.5;
  const SILENCE_SHARE = 0.02;   // effect samples under 2% of the peak count as silence
  const PRE_ROLL_S = 0.005;     // keep 5 ms before the first sound so its attack is not cut
  const PAD_LEVEL = 1e-4;       // loops: only trim near-digital silence (encoder padding)
  const MAX_PAD_S = 0.1;

  const readPref = () => { try { return localStorage.getItem(PREF_KEY) !== 'off'; } catch (_) { return true; } };
  const writePref = on => { try { localStorage.setItem(PREF_KEY, on ? 'on' : 'off'); } catch (_) { /* not saved */ } };

  let enabled = readPref();
  let unlocked = false;          // true after the first interaction (browser allows sound)
  const listeners = new Set();   // UI parts that show the on/off state
  const playingEffects = new Set();

  // Seconds from the start of a sound to its first audible sample (minus a short pre-roll).
  function soundStart(buffer, share = SILENCE_SHARE, preRoll = PRE_ROLL_S) {
    const data = buffer.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
    const limit = peak * share;
    let first = 0;
    while (first < data.length && Math.abs(data[first]) <= limit) first++;
    if (first >= data.length) return 0;
    return Math.max(0, first / buffer.sampleRate - preRoll);
  }

  // Loop region without encoder padding: digital silence at either end, at most MAX_PAD_S.
  function loopRegion(buffer) {
    const data = buffer.getChannelData(0), rate = buffer.sampleRate, max = Math.round(MAX_PAD_S * rate);
    let a = 0, b = data.length;
    while (a < max && a < data.length && Math.abs(data[a]) < PAD_LEVEL) a++;
    while (data.length - b < max && b > a && Math.abs(data[b - 1]) < PAD_LEVEL) b--;
    return {start: a / rate, end: b / rate};
  }

  const AudioCtx = root.AudioContext || root.webkitAudioContext;
  const ctx = AudioCtx ? new AudioCtx({latencyHint: 'interactive'}) : null;
  const master = ctx ? ctx.createGain() : null;
  if (master) master.connect(ctx.destination);

  const sounds = {};   // name → {buffer, offset | region}, filled as files finish decoding
  const loops = Object.fromEntries(Object.keys(LOOPS).map(k => [k, {source: null, gain: null}]));

  const decode = data => new Promise((ok, fail) => ctx.decodeAudioData(data, ok, fail));
  function load(name, {file}, isLoop) {
    return fetch(DIR + file)
      .then(r => { if (!r.ok) throw Error(file + ': ' + r.status); return r.arrayBuffer(); })
      .then(decode)
      .then(buffer => {
        sounds[name] = isLoop ? {buffer, region: loopRegion(buffer)} : {buffer, offset: soundStart(buffer)};
        if (isLoop) startLoops();
      })
      .catch(() => { /* this sound stays silent; the game works without it */ });
  }
  const ready = ctx ? Promise.all([
    ...Object.entries(EFFECTS).map(([k, v]) => load(k, v, false)),
    ...Object.entries(LOOPS).map(([k, v]) => load(k, v, true))
  ]) : Promise.resolve();

  const running = () => ctx && ctx.state === 'running';
  const resume = () => { if (ctx && ctx.state !== 'running' && ctx.state !== 'closed') ctx.resume().then(startLoops, () => {}); };

  function startLoops() {
    if (!enabled || !unlocked || !running() || document.hidden) return;
    Object.entries(loops).forEach(([k, loop]) => {
      const sound = sounds[k];
      if (loop.source || !sound) return;
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);                              // start silent, then fade in
      gain.gain.linearRampToValueAtTime(LOOPS[k].volume, now + FADE_S);
      gain.connect(master);
      const source = ctx.createBufferSource();
      source.buffer = sound.buffer;
      source.loop = true;                                            // sample-accurate, gapless
      source.loopStart = sound.region.start;
      source.loopEnd = sound.region.end;
      source.connect(gain);
      source.start(now, sound.region.start);
      loop.source = source; loop.gain = gain;
    });
  }

  function stopLoops() {
    Object.values(loops).forEach(loop => {
      if (!loop.source) return;
      try { loop.source.stop(); } catch (_) { /* already stopped */ }
      loop.source.disconnect(); loop.gain.disconnect();
      loop.source = loop.gain = null;
    });
  }

  // Plays a short effect right away. Each play is its own source, so quick repeats overlap.
  function play(name) {
    if (!enabled || !ctx || !sounds[name]) return;
    if (!running()) resume();          // called from a tap or key press, so this is allowed
    const {buffer, offset} = sounds[name];
    const gain = ctx.createGain();
    gain.gain.value = EFFECTS[name].volume;
    gain.connect(master);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    playingEffects.add(source);
    source.onended = () => { playingEffects.delete(source); source.disconnect(); gain.disconnect(); };
    source.start(0, offset);
  }

  function setEnabled(on) {
    enabled = on;
    writePref(on);
    if (on) { resume(); startLoops(); } else {
      stopLoops();
      playingEffects.forEach(source => { try { source.stop(); } catch (_) { /* already stopped */ } });
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

  // Keep real interaction listeners: browsers (iOS especially) can suspend or interrupt the
  // audio context again later; the next interaction resumes it and restarts missing loops.
  const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
  const unlock = () => { unlocked = true; if (running()) startLoops(); else resume(); };
  UNLOCK_EVENTS.forEach(type => document.addEventListener(type, unlock, true));

  // No sound while the game is in another tab or the phone screen is off. Suspending keeps
  // the loops where they were, so the music continues instead of restarting.
  const hide = () => { if (running()) ctx.suspend().catch(() => {}); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); else if (unlocked) resume(); });
  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', () => { if (unlocked && !document.hidden) resume(); });

  root.GameAudio = {play, setEnabled, bindToggle, isEnabled: () => enabled, EFFECTS, LOOPS, ready, soundStart, loopRegion,
    // Current loop volumes (for checks in the browser console).
    loopVolumes: () => Object.fromEntries(Object.entries(loops).map(([k, l]) =>
      [k, l.source && running() ? +l.gain.gain.value.toFixed(2) : 0])),
    // Seconds of silence skipped at the start of each effect (for checks in the console).
    effectOffsets: () => Object.fromEntries(Object.keys(EFFECTS).map(k => [k, sounds[k] ? +sounds[k].offset.toFixed(3) : null]))};
})(globalThis);
