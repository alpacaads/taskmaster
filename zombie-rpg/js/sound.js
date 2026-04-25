// Procedural sound engine for Dead Light.
// Uses Web Audio API — no external assets, works offline.
// Must be "unlocked" by a user gesture; first Sound.play() call does that.
window.Sound = (function () {

  const MUTE_KEY = "dead_light_muted_v1";
  let ctx = null;
  let master = null;
  let muted = localStorage.getItem(MUTE_KEY) === "1";
  let ambientNodes = [];
  let ambientScene = null;

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(ctx.destination);
  }

  function now() { return ctx ? ctx.currentTime : 0; }

  function ensure() {
    if (!ctx) init();
    if (ctx && ctx.state === "suspended") {
      // Fire and don't await — the unlock listener and the resume on
      // first user gesture do the heavy lifting. Sounds queued before
      // resume completes are flushed by flushPending() once running.
      try { ctx.resume(); } catch (e) {}
    }
    return !!ctx;
  }

  // Sounds requested while the context is still resuming get queued
  // here and flushed once it's actually running, so the very first
  // 'select' / opening 'door' isn't dropped on cold-start.
  const pending = [];
  function flushPending() {
    while (pending.length) {
      const name = pending.shift();
      const fn = FX[name];
      if (fn) { try { fn(); } catch (e) { console.warn("sound", name, e); } }
    }
  }

  // --- building blocks ---

  function tone({ freq = 440, type = "sine", dur = 0.2, vol = 0.3, slideTo = null, slideCurve = "linear", attack = 0.005, delay = 0 }) {
    if (!ensure() || muted) return;
    const t0 = now() + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo != null) {
      if (slideCurve === "exp") {
        o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
      } else {
        o.frequency.linearRampToValueAtTime(slideTo, t0 + dur);
      }
    }
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  function noise({ dur = 0.15, cutoff = 1000, q = 1, vol = 0.4, type = "lowpass", delay = 0, decay = null }) {
    if (!ensure() || muted) return;
    const t0 = now() + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = cutoff;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + (decay || dur));
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
    return src;
  }

  // --- SFX ---

  const FX = {
    // Softer UI feedback — sine waves only, no square buzz.
    click:   () => tone({ freq: 480, type: "sine", dur: 0.04, vol: 0.07 }),
    select:  () => { tone({ freq: 540, type: "sine", dur: 0.06, vol: 0.10 });
                     tone({ freq: 760, type: "sine", dur: 0.08, vol: 0.07, delay: 0.05 }); },
    back:    () => { tone({ freq: 380, type: "sine", dur: 0.07, vol: 0.10, slideTo: 240 }); },

    pickup:  () => {
      tone({ freq: 523, type: "triangle", dur: 0.08, vol: 0.2 });
      tone({ freq: 659, type: "triangle", dur: 0.09, vol: 0.2, delay: 0.07 });
      tone({ freq: 880, type: "triangle", dur: 0.12, vol: 0.18, delay: 0.16 });
    },
    heal:    () => {
      tone({ freq: 392, type: "sine", dur: 0.12, vol: 0.2 });
      tone({ freq: 523, type: "sine", dur: 0.14, vol: 0.18, delay: 0.1 });
      tone({ freq: 659, type: "sine", dur: 0.18, vol: 0.16, delay: 0.22 });
    },

    groan:   () => {
      // Low triangle moan, soft lowpass — no sawtooth buzz.
      if (!ensure() || muted) return;
      const t0 = now();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = "triangle";
      o.frequency.setValueAtTime(88, t0);
      o.frequency.linearRampToValueAtTime(62, t0 + 0.4);
      o.frequency.linearRampToValueAtTime(78, t0 + 0.85);
      f.type = "lowpass"; f.frequency.value = 380; f.Q.value = 1.2;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.22, t0 + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 1.0);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 1.05);
    },

    runnerScream: () => {
      // Triangle base, lower top end so it's not piercing.
      if (!ensure() || muted) return;
      const t0 = now();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(190, t0);
      o.frequency.exponentialRampToValueAtTime(420, t0 + 0.30);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.18, t0 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.42);
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 0.45);
      noise({ dur: 0.30, cutoff: 1100, q: 0.8, vol: 0.08 });
    },

    // Bloater — wet, low-frequency gurgle with a bubbling tail.
    // Sounds bloated and infected, like something speaking through fluid.
    bloaterGurgle: () => {
      // Triangle base, low Q lowpass — wet body without ringing.
      if (!ensure() || muted) return;
      const t0 = now();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = "triangle";
      o.frequency.setValueAtTime(72, t0);
      o.frequency.linearRampToValueAtTime(56, t0 + 0.55);
      o.frequency.linearRampToValueAtTime(64, t0 + 0.95);
      f.type = "lowpass"; f.frequency.value = 280; f.Q.value = 1.0;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.24, t0 + 0.10);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 1.10);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 1.15);
      // Bubbling tail — softer lowpass, no ring.
      noise({ dur: 0.45, cutoff: 200, q: 1.2, vol: 0.10, delay: 0.32 });
    },

    // Hunter — sharper, faster, predatory snarl. Mid-range, rises and
    // bites quickly. Reads as the smart-zombie that remembers how to hunt.
    hunterSnarl: () => {
      // Triangle on a soft lowpass — predator without the bandpass ring.
      if (!ensure() || muted) return;
      const t0 = now();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = "triangle";
      o.frequency.setValueAtTime(120, t0);
      o.frequency.exponentialRampToValueAtTime(180, t0 + 0.18);
      o.frequency.exponentialRampToValueAtTime(95, t0 + 0.50);
      f.type = "lowpass"; f.frequency.value = 700; f.Q.value = 0.9;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.22, t0 + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.6);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 0.65);
      // Breath rasp — gentler, lower cutoff so it's air, not hiss.
      noise({ dur: 0.25, cutoff: 1200, q: 0.7, vol: 0.07, delay: 0.05 });
    },

    // Abomination — deep, monstrous, multi-layered roar. Two oscillators
    // detuned + a wet noise bottom for body. Long sustain so the freezer
    // mini-boss feels physically larger than everything else.
    abominationRoar: () => {
      // Triangle sub + sine harmonic — body without the square buzz.
      if (!ensure() || muted) return;
      const t0 = now();
      // Sub layer.
      const o1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      o1.type = "triangle";
      o1.frequency.setValueAtTime(46, t0);
      o1.frequency.linearRampToValueAtTime(38, t0 + 1.2);
      o1.frequency.linearRampToValueAtTime(52, t0 + 1.65);
      g1.gain.setValueAtTime(0, t0);
      g1.gain.linearRampToValueAtTime(0.34, t0 + 0.22);
      g1.gain.exponentialRampToValueAtTime(0.0008, t0 + 1.85);
      o1.connect(g1); g1.connect(master);
      o1.start(t0); o1.stop(t0 + 1.9);
      // Mid harmonic — sine, not square.
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.type = "sine";
      o2.frequency.setValueAtTime(96, t0);
      o2.frequency.linearRampToValueAtTime(78, t0 + 1.3);
      g2.gain.setValueAtTime(0, t0);
      g2.gain.linearRampToValueAtTime(0.13, t0 + 0.30);
      g2.gain.exponentialRampToValueAtTime(0.0008, t0 + 1.6);
      o2.connect(g2); g2.connect(master);
      o2.start(t0); o2.stop(t0 + 1.65);
      // Wet body — gentler.
      noise({ dur: 1.10, cutoff: 180, q: 0.8, vol: 0.16, delay: 0.10 });
    },

    // Calder (traitor) — half-human gasp followed by a zombie groan
    // tail. The bite has already won, but his voice is still in there.
    calderGasp: () => {
      // Sine on a gentle lowpass — human warmth, no bandpass ring.
      if (!ensure() || muted) return;
      const t0 = now();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = "sine";
      o.frequency.setValueAtTime(220, t0);
      o.frequency.exponentialRampToValueAtTime(280, t0 + 0.16);
      o.frequency.exponentialRampToValueAtTime(170, t0 + 0.65);
      f.type = "lowpass"; f.frequency.value = 600; f.Q.value = 0.9;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.18, t0 + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.75);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 0.80);
      // Zombie groan tail underneath, layered late.
      setTimeout(() => FX.groan && FX.groan(), 380);
    },

    hordeRoar: () => {
      noise({ dur: 1.6, cutoff: 380, q: 0.7, vol: 0.35 });
      for (let i = 0; i < 4; i++) setTimeout(() => FX.groan(), i * 320 + Math.random() * 200);
    },

    // Gunshot — softened: less treble in the noise crack, deeper body.
    gunshot: () => {
      noise({ dur: 0.06, cutoff: 1600, q: 0.4, vol: 0.45, decay: 0.10 });
      tone({ freq: 75, type: "sine", dur: 0.20, vol: 0.45, slideTo: 35, slideCurve: "exp" });
      noise({ dur: 0.30, cutoff: 500, q: 0.4, vol: 0.10, delay: 0.06, decay: 0.30 });
    },

    // ---- Per-firearm shots ----
    // Real-world layered construction: HF crack (supersonic gas snap)
    // → mid snap → low body boom → tail. Autoloaders also play a
    // mechanical slide/bolt cycle a beat after the shot. Pick via
    // Sound.fire(weaponName) so the trigger wires to the equipped gun.

    // Cho's .38 Special — short-barrel revolver. Sharp crack, healthy
    // low thump, no slide cycle. Slightly longer reverb tail than a
    // pistol because the cylinder gap leaks.
    shotRevolver: () => {
      if (!ensure() || muted) return;
      noise({ dur: 0.012, cutoff: 3400, q: 0.6, vol: 0.55, type: "highpass", decay: 0.05 });
      tone({ freq: 280, type: "sine", dur: 0.07,  vol: 0.42, slideTo: 90, slideCurve: "exp", attack: 0.001 });
      tone({ freq: 70,  type: "sine", dur: 0.22,  vol: 0.50, slideTo: 28, slideCurve: "exp", attack: 0.001 });
      noise({ dur: 0.34, cutoff: 460, q: 0.4, vol: 0.13, decay: 0.34, delay: 0.04 });
    },

    // Vega's Ranger Rifle — bolt-action .308-class. Heavier crack,
    // deeper boom, long reverberant tail, distinct bolt-cycle clack
    // ~700ms after the shot.
    shotRifle: () => {
      if (!ensure() || muted) return;
      noise({ dur: 0.022, cutoff: 2700, q: 0.5, vol: 0.65, type: "highpass", decay: 0.06 });
      tone({ freq: 200, type: "sine", dur: 0.10, vol: 0.50, slideTo: 60, slideCurve: "exp", attack: 0.001 });
      tone({ freq: 50,  type: "sine", dur: 0.36, vol: 0.55, slideTo: 22, slideCurve: "exp", attack: 0.001 });
      noise({ dur: 0.58, cutoff: 340, q: 0.3, vol: 0.16, decay: 0.58, delay: 0.06 });
      // Bolt lift + pull (clack)
      setTimeout(() => {
        if (!ensure() || muted) return;
        noise({ dur: 0.024, cutoff: 4000, q: 0.8, vol: 0.18, type: "highpass" });
        tone({ freq: 820, type: "triangle", dur: 0.04, vol: 0.10 });
      }, 700);
      // Bolt forward + lock (chack)
      setTimeout(() => {
        if (!ensure() || muted) return;
        noise({ dur: 0.030, cutoff: 3500, q: 0.7, vol: 0.16, type: "highpass" });
        tone({ freq: 620, type: "triangle", dur: 0.05, vol: 0.09 });
      }, 880);
    },

    // Generic semi-auto pistol — sharper than the revolver due to
    // higher chamber pressure, slightly less low body, quick slide
    // cycle ~60ms after the shot.
    shotPistol: () => {
      if (!ensure() || muted) return;
      noise({ dur: 0.010, cutoff: 4100, q: 0.7, vol: 0.50, type: "highpass", decay: 0.04 });
      tone({ freq: 240, type: "sine", dur: 0.06, vol: 0.40, slideTo: 90, slideCurve: "exp", attack: 0.001 });
      tone({ freq: 80,  type: "sine", dur: 0.16, vol: 0.42, slideTo: 32, slideCurve: "exp", attack: 0.001 });
      noise({ dur: 0.20, cutoff: 700, q: 0.4, vol: 0.10, decay: 0.20, delay: 0.03 });
      setTimeout(() => {
        if (!ensure() || muted) return;
        noise({ dur: 0.015, cutoff: 5000, q: 1.0, vol: 0.10, type: "highpass" });
        tone({ freq: 1200, type: "triangle", dur: 0.025, vol: 0.06 });
      }, 60);
    },

    drySnap: () => { // failed shot / dud — soft tick, no square buzz
      noise({ dur: 0.03, cutoff: 1800, q: 0.6, vol: 0.16 });
      tone({ freq: 200, type: "triangle", dur: 0.04, vol: 0.05 });
    },

    // Melee — wood-thump rather than buzzy slide.
    melee:   () => {
      tone({ freq: 220, type: "triangle", dur: 0.07, vol: 0.13, slideTo: 110 });
      noise({ dur: 0.12, cutoff: 500, q: 0.7, vol: 0.22, delay: 0.04 });
    },
    // Hit — low body thump, sine slide, no square ping.
    hit:     () => {
      noise({ dur: 0.08, cutoff: 380, q: 0.5, vol: 0.26 });
      tone({ freq: 90, type: "sine", dur: 0.14, vol: 0.20, slideTo: 50, slideCurve: "exp" });
    },
    // Crit — solid hit + warm triangle accent (no high square).
    crit:    () => {
      noise({ dur: 0.08, cutoff: 380, q: 0.5, vol: 0.30 });
      tone({ freq: 80, type: "sine", dur: 0.18, vol: 0.24, slideTo: 45, slideCurve: "exp" });
      tone({ freq: 660, type: "triangle", dur: 0.12, vol: 0.12, delay: 0.06 });
    },

    // Player took damage — sine slide, gentler noise tail.
    damage:  () => {
      tone({ freq: 160, type: "sine", dur: 0.18, vol: 0.26, slideTo: 70, slideCurve: "exp" });
      noise({ dur: 0.10, cutoff: 600, q: 0.6, vol: 0.10 });
    },
    // Dodge — soft air-whoosh, less hiss.
    dodge:   () => {
      noise({ dur: 0.10, cutoff: 1900, q: 0.4, vol: 0.10 });
    },
    // Brace — wood-thump pair, no square buzz.
    brace:   () => {
      tone({ freq: 220, type: "triangle", dur: 0.06, vol: 0.13 });
      tone({ freq: 165, type: "triangle", dur: 0.08, vol: 0.10, delay: 0.05 });
    },
    flee:    () => {
      for (let i = 0; i < 4; i++) {
        noise({ dur: 0.05, cutoff: 140, q: 0.6, vol: 0.13, delay: i * 0.11 });
      }
    },
    footstep:() => noise({ dur: 0.04, cutoff: 130, q: 0.6, vol: 0.10 }),

    // Death — soft fading sub. No sawtooth.
    death:   () => {
      tone({ freq: 200, type: "sine", dur: 0.55, vol: 0.30, slideTo: 50, slideCurve: "exp" });
      setTimeout(() => noise({ dur: 0.85, cutoff: 200, q: 0.6, vol: 0.22 }), 250);
    },
    victory: () => {
      const notes = [523, 659, 784, 1046];
      notes.forEach((f, i) => setTimeout(() => tone({
        freq: f, type: "triangle", dur: 0.22, vol: 0.18,
      }), i * 140));
    },
    // Tense / wind-up — low warble on sine, not sawtooth.
    tense:   () => {
      tone({ freq: 160, type: "sine", dur: 0.50, vol: 0.16, slideTo: 90 });
    },
    door:    () => {
      tone({ freq: 160, type: "sine", dur: 0.32, vol: 0.13, slideTo: 80 });
      noise({ dur: 0.18, cutoff: 380, q: 1.0, vol: 0.07, delay: 0.05 });
    },
    radio:   () => {
      noise({ dur: 0.30, cutoff: 1600, q: 0.8, vol: 0.10 });
      tone({ freq: 720, type: "triangle", dur: 0.07, vol: 0.06, delay: 0.10 });
    },
  };

  // ---- Audio override playback ----
  // window.__AUDIO_OVERRIDES is populated by AudioOverrides.loadAll()
  // (overrides.js) — { slot: blobURL }. If a slot has an uploaded
  // file, play that instead of the procedural cue. Music overrides
  // loop; SFX overrides play once.
  //
  // Server fallback: when no IDB blob is present, fall back to the
  // committed file at audio/<slot>.mp3. We probe each slot once with
  // a HEAD request and remember the result so future plays don't
  // re-fetch. This is what makes committed audio work on a fresh
  // browser that's never visited admin.
  const audioPlayers = {}; // slot → reusable HTMLAudioElement
  const audioServerUrl = {}; // slot → URL string when present, false when probed-missing
  const audioServerProbed = {}; // slot → true once a probe has been kicked off
  function probeServerAudio(slot) {
    if (audioServerProbed[slot]) return;
    audioServerProbed[slot] = true;
    const url = "audio/" + slot + ".mp3";
    fetch(url, { method: "HEAD", cache: "no-store" })
      .then(r => {
        audioServerUrl[slot] = r.ok ? url : false;
        // Race fix — if this slot is for the music track currently
        // playing procedurally (because the probe wasn't resolved
        // when playMusic() ran), swap to the now-confirmed override.
        if (r.ok && musicTrack && slot === "music_" + musicTrack) {
          // Kill procedural timers without touching musicTrack so
          // playOverride can pick up where the procedural left off.
          musicTimers.forEach(t => clearInterval(t));
          musicTimers = [];
          playOverride(slot, { loop: true, volume: 0.55 });
        }
      })
      .catch(() => { audioServerUrl[slot] = false; });
  }
  function resolveOverrideUrl(slot) {
    const map = window.__AUDIO_OVERRIDES;
    if (map && map[slot]) return map[slot];           // local IDB blob — fastest
    if (audioServerUrl[slot]) return audioServerUrl[slot]; // committed file
    if (audioServerUrl[slot] === undefined) probeServerAudio(slot);
    return null;
  }
  function playOverride(slot, opts) {
    const o = opts || {};
    const loop = !!o.loop;
    const volume = typeof o.volume === "number" ? o.volume : 1;
    if (!ensure() || muted) return false;
    const url = resolveOverrideUrl(slot);
    if (!url) return false;
    let a = audioPlayers[slot];
    if (!a || a.src !== url) {
      if (a) { try { a.pause(); } catch (e) {} }
      a = new Audio(url);
      a.preload = "auto";
      audioPlayers[slot] = a;
    }
    a.loop = loop;
    a.volume = volume;
    if (!loop) a.currentTime = 0;
    try { a.play().catch(() => {}); } catch (e) {}
    return true;
  }
  function stopOverride(slot) {
    const a = audioPlayers[slot];
    if (!a) return;
    try { a.pause(); a.currentTime = 0; } catch (e) {}
  }
  function stopAllMusicOverrides() {
    Object.keys(audioPlayers).forEach(s => {
      if (s.startsWith("music_")) stopOverride(s);
    });
  }

  function play(name) {
    if (!ensure() || muted) return;
    // Context may still be resuming after a tab-switch or first
    // gesture — queue the sound and let flushPending() pick it up.
    if (ctx.state !== "running") {
      pending.push(name);
      return;
    }
    // Audio override file beats the procedural cue.
    if (playOverride(name)) return;
    const fn = FX[name];
    if (!fn) return;
    try { fn(); } catch (e) { console.warn("sound", name, e); }
  }

  // --- Music engine ---
  // Procedural looped tracks built from the same tone()/noise()
  // primitives as SFX. Patterns are scheduled via setInterval; each
  // tick fires the appropriate notes. armed() guards every tick so a
  // track switch doesn't bleed notes from the prior pattern.
  let musicTimers = [];
  let musicTrack = null;

  function stopMusic() {
    musicTimers.forEach(t => clearInterval(t));
    musicTimers = [];
    stopAllMusicOverrides();
    musicTrack = null;
  }

  function playMusic(track) {
    if (!ensure()) return;
    if (track === musicTrack) return;
    stopMusic();
    if (muted || !track) return;
    musicTrack = track;
    // Audio override file beats the procedural pattern.
    if (playOverride("music_" + track, { loop: true, volume: 0.55 })) return;
    if      (track === "combat")   startCombatTrack();
    else if (track === "romance")  startRomanceTrack();
    else if (track === "dialogue") startDialogueTrack();
    else if (track === "tense")    startTenseTrack();
    else if (track === "title")    startTitleTrack();
  }

  // --- Combat: slow, dark, suspenseful. ~75 BPM. Horror-score
  // construction — dual heartbeat sub, dissonant tritone pad, sparse
  // chromatic high tones, occasional low filtered breath. No kick on
  // every beat, no hi-hat. Drives dread, not adrenaline. ---
  function startCombatTrack() {
    const beat = 800; // ~75 BPM
    const armed = () => musicTrack === "combat" && !muted;
    // Heartbeat — two sub thumps close together, then long silence.
    // thump-thump.................thump-thump..............
    const heartbeat = () => {
      if (!armed()) return;
      tone({ freq: 48, type: "sine", dur: 0.20, vol: 0.28, slideTo: 26, slideCurve: "exp", attack: 0.001 });
      setTimeout(() => {
        if (!armed()) return;
        tone({ freq: 42, type: "sine", dur: 0.22, vol: 0.22, slideTo: 22, slideCurve: "exp", attack: 0.001 });
      }, 200);
    };
    heartbeat();
    musicTimers.push(setInterval(heartbeat, beat * 4));
    // Dissonant low pad — minor + tritone (G1, Bb1, C#2). Slow
    // retrigger so the dread sits.
    const pad = () => {
      if (!armed()) return;
      const dur = beat * 8 / 1000;
      tone({ freq: 49,   type: "triangle", dur, vol: 0.06 }); // G1
      tone({ freq: 58.3, type: "triangle", dur, vol: 0.04 }); // Bb1 (minor 3rd)
      tone({ freq: 69.3, type: "sine",     dur, vol: 0.028 }); // C#2 (tritone)
    };
    pad();
    musicTimers.push(setInterval(pad, beat * 8));
    // Sparse chromatic high tones — chromatic dread, slithers between
    // adjacent semitones rather than landing on a satisfying interval.
    const chimePitches = [880, 932.3, 783.99, 830.6]; // A5, Bb5, G5, Ab5
    let chimeIdx = 0;
    const chime = () => {
      if (!armed()) return;
      const f = chimePitches[chimeIdx % chimePitches.length];
      chimeIdx++;
      tone({ freq: f, type: "sine", dur: 1.4, vol: 0.038, attack: 0.06 });
    };
    setTimeout(chime, beat * 4);
    musicTimers.push(setInterval(chime, beat * 8));
    // Occasional low breath — filtered noise puff that sounds like
    // something exhaling in the dark every 16 beats.
    const breath = () => {
      if (!armed()) return;
      noise({ dur: 0.45, cutoff: 200, q: 1.0, vol: 0.07, decay: 0.45 });
    };
    setTimeout(breath, beat * 8);
    musicTimers.push(setInterval(breath, beat * 16));
  }

  // --- Romance: 60 BPM Cmaj7 pad + slow descent motif ---
  function startRomanceTrack() {
    const beat = 1000;
    const armed = () => musicTrack === "romance" && !muted;
    const pad = () => {
      if (!armed()) return;
      const dur = beat * 4 / 1000;
      tone({ freq: 130.8, type: "sine", dur, vol: 0.05 });   // C3
      tone({ freq: 164.8, type: "sine", dur, vol: 0.04 });   // E3
      tone({ freq: 196.0, type: "sine", dur, vol: 0.04 });   // G3
      tone({ freq: 246.9, type: "sine", dur, vol: 0.025 });  // B3
    };
    pad();
    musicTimers.push(setInterval(pad, beat * 4));
    // Sub bass every 4 bars
    const bass = () => {
      if (!armed()) return;
      tone({ freq: 65.4, type: "triangle", dur: beat * 4 / 1000, vol: 0.10 }); // C2
    };
    bass();
    musicTimers.push(setInterval(bass, beat * 4));
    // Soft descending arpeggio every 8 beats
    const arp = () => {
      if (!armed()) return;
      [523, 440, 392, 349].forEach((f, i) => {
        setTimeout(() => {
          if (!armed()) return;
          tone({ freq: f, type: "sine", dur: 0.5, vol: 0.04 });
        }, i * beat / 2);
      });
    };
    setTimeout(arp, beat * 4);
    musicTimers.push(setInterval(arp, beat * 8));
  }

  // --- Dialogue: 80 BPM minor pad with a sparse low note ---
  function startDialogueTrack() {
    const beat = 750;
    const armed = () => musicTrack === "dialogue" && !muted;
    const pad = () => {
      if (!armed()) return;
      const dur = beat * 8 / 1000;
      tone({ freq: 110,   type: "sine", dur, vol: 0.05 });  // A2
      tone({ freq: 130.8, type: "sine", dur, vol: 0.04 });  // C3
      tone({ freq: 164.8, type: "sine", dur, vol: 0.03 });  // E3
    };
    pad();
    musicTimers.push(setInterval(pad, beat * 8));
    const sub = () => {
      if (!armed()) return;
      tone({ freq: 55, type: "triangle", dur: beat * 4 / 1000, vol: 0.06 });
    };
    sub();
    musicTimers.push(setInterval(sub, beat * 8));
  }

  // --- Tense: dread sub pulse + dissonant low pad ---
  function startTenseTrack() {
    const beat = 700;
    const armed = () => musicTrack === "tense" && !muted;
    const pad = () => {
      if (!armed()) return;
      const dur = beat * 8 / 1000;
      tone({ freq: 49,   type: "triangle", dur, vol: 0.06 }); // G1
      tone({ freq: 58.3, type: "triangle", dur, vol: 0.04 }); // Bb1
      tone({ freq: 69.3, type: "sine",     dur, vol: 0.03 }); // C#2 — tritone
    };
    pad();
    musicTimers.push(setInterval(pad, beat * 8));
    const pulse = () => {
      if (!armed()) return;
      tone({ freq: 42, type: "sine", dur: 0.25, vol: 0.18, slideTo: 28, slideCurve: "exp", attack: 0.001 });
    };
    pulse();
    musicTimers.push(setInterval(pulse, beat * 2));
  }

  // --- Title: brooding minor cycle Am - F - G - Am ---
  function startTitleTrack() {
    const beat = 850;
    const armed = () => musicTrack === "title" && !muted;
    let bar = 0;
    const chords = [
      [110, 130.8, 164.8],  // Am
      [87.3, 130.8, 174.6], // F
      [98,  123.5, 146.8],  // G
      [110, 130.8, 164.8],  // Am
    ];
    const pad = () => {
      if (!armed()) return;
      const dur = beat * 4 / 1000;
      const c = chords[bar % chords.length];
      c.forEach((f, i) => tone({ freq: f, type: "sine", dur, vol: i === 0 ? 0.06 : 0.04 }));
      bar++;
    };
    pad();
    musicTimers.push(setInterval(pad, beat * 4));
  }

  // --- Ambient drone (legacy, kept for back-compat callsites) ---

  function stopAmbient() {
    ambientNodes.forEach(n => { try { n.stop(); } catch (_) {} });
    ambientNodes = [];
    ambientScene = null;
  }

  // ---- Scene-fit ambient pads ----
  // Each scene gets a small chord of detuned sines (warm pad), and an
  // optional "air" element appropriate to the setting:
  //   forest → very low band-passed wind, soft & moving
  //   night  → distant low rumble + a very faint cricket pulse
  //   city   → distant traffic rumble (low-passed brown-ish noise)
  //   indoor → barely-audible sine room hum (no square buzz)
  //   blood  → dissonant low pad + sub pulse
  // Volumes are intentionally low (≤ 0.05) so combat SFX cut through.
  const SCENE_CHORDS = {
    // Pitches in Hz. Stack of three keeps the harmony soft.
    night:  [55,   82.4, 110],     // A1 + E2 + A2 — minor, restful
    forest: [65.4, 98,   146.8],   // C2 + G2 + D3 — open, natural
    city:   [61.7, 92.5, 138.6],   // B1 + F#2 + C#3 — slight tension
    indoor: [98],                  // G2 — single soft hum
    blood:  [49,   58.3, 73.4],    // G1 + Bb1 + D2 — dread, dissonant
  };

  // setAmbience now routes a story-side scene tag (sceneClass or an
  // explicit `music` field) into a music track. Combat is exclusive —
  // once the combat track is on, scene-class changes are ignored until
  // playMusic("combat") is replaced. Combat.start / end manage that.
  function setAmbience(scene) {
    if (!ensure()) return;
    ambientScene = scene;
    // Stop the legacy drone if any was running.
    stopAmbient();
    if (musicTrack === "combat" && scene !== "combat") return; // hold during combat
    let track = null;
    if (!scene) track = null;
    else if (scene === "combat" || scene === "romance" || scene === "tense"
          || scene === "dialogue" || scene === "title") track = scene;
    else if (scene === "blood") track = "tense";
    else track = "dialogue"; // indoor / forest / night / city default
    playMusic(track);
  }

  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (_) {}
    if (master) master.gain.value = muted ? 0 : 0.55;
    if (muted) {
      stopAmbient();
      stopMusic();
    } else if (ambientScene) {
      // Re-trigger whatever was playing.
      const s = ambientScene; ambientScene = null; setAmbience(s);
    }
    return muted;
  }

  function isMuted() { return muted; }

  // Document-level audio unlock — every tap / click / keypress
   // resumes the context if the browser suspended it. Modern Chrome
   // and iOS Safari require a user gesture before audio plays; without
   // this, sounds went hit-or-miss after tab-switches or scene
   // transitions that weren't directly inside a click handler.
  // Slot ids that the game routinely tries to play. We pre-probe
  // each one's server URL on first user gesture so committed audio
  // can play instantly without missing the first attempt.
  const PRE_PROBE_SLOTS = [
    "music_combat", "music_romance", "music_dialogue",
    "music_tense",  "music_title",
    "shotPistol", "shotRevolver", "shotRifle",
    "groan", "runnerScream", "bloaterGurgle",
    "hunterSnarl", "abominationRoar", "calderGasp",
    "argh", "humanDeath",
    "meet_maya_card", "meet_ren_card", "meet_vega_card",
    "meet_vega_card_hero", "meet_nora_card",
  ];
  let preProbeFired = false;

  function unlock() {
    if (!ctx) init();
    if (ctx && ctx.state === "suspended") {
      const p = ctx.resume();
      if (p && typeof p.then === "function") p.then(flushPending, () => {});
      else flushPending();
    } else if (ctx && ctx.state === "running") {
      flushPending();
    }
    // Background-probe every known slot's server URL exactly once.
    // This is what makes a committed audio file play on the FIRST
    // attempt, even when no IDB blob exists in this browser.
    if (!preProbeFired) {
      preProbeFired = true;
      PRE_PROBE_SLOTS.forEach(probeServerAudio);
    }
    // Refresh local IDB-blob URLs in case the admin saved a new file
    // in another tab. Uses the existing AudioOverrides API. Cheap.
    if (window.AudioOverrides) {
      try { window.AudioOverrides.loadAll(); } catch (e) {}
    }
    // First-gesture title music: if nothing's playing and the title
    // screen is visible, fade in the brooding pad. Browsers won't let
    // us autoplay before a gesture, so this is the earliest chance.
    if (!musicTrack && !muted && typeof document !== "undefined") {
      const ts = document.getElementById("title-screen");
      if (ts && !ts.classList.contains("hidden")) playMusic("title");
    }
  }
  if (typeof document !== "undefined") {
    const opts = { passive: true };
    document.addEventListener("pointerdown", unlock, opts);
    document.addEventListener("touchstart",  unlock, opts);
    document.addEventListener("keydown",     unlock, opts);
    // Some browsers also re-suspend when the tab becomes hidden —
    // resume on visibility return.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") unlock();
    });
    // Probe server audio URLs at DOMContentLoaded — HEAD requests
    // don't need a user gesture, so by the time the player taps the
    // title screen every override URL is already resolved. Without
    // this, the very first playMusic("title") fires before its probe
    // returns and falls through to the procedural pad.
    const earlyProbe = () => {
      preProbeFired = true;
      PRE_PROBE_SLOTS.forEach(probeServerAudio);
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", earlyProbe, { once: true });
    } else {
      earlyProbe();
    }
  }

  // Pick the right firearm sound for the equipped weapon. Falls back
  // to the generic semi-auto pistol crack for anything unrecognized.
  function fire(weaponName) {
    const n = String(weaponName || "").toLowerCase();
    if (n.includes("rifle")    || n.includes("ranger"))   return play("shotRifle");
    if (n.includes(".38")      || n.includes("revolver")) return play("shotRevolver");
    return play("shotPistol");
  }

  return {
    init, play, fire,
    setAmbience, stopAmbient,
    playMusic, stopMusic,
    toggleMute, isMuted,
  };
})();
